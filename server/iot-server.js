require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_system',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
});

// Active sessions cache
const activeSessions = new Map();

// Connected WebSocket clients
const clients = new Map();

// Data buffer for aggregation
const dataBuffers = new Map();

// Serial port configuration
let serialPort = null;
let parser = null;
let arduinoConnected = false;
let arduinoPort = null;

// Initialize Arduino Serial Connection
function initArduino(portPath) {
  return new Promise((resolve, reject) => {
    // Timeout after 1 second
    const timeout = setTimeout(() => {
      if (serialPort && !serialPort.isOpen) {
        serialPort.destroy();
        reject(new Error('Connection timeout'));
      }
    }, 1000);

    try {
      serialPort = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: false
      });

      parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

      serialPort.open((err) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
          return;
        }
        arduinoConnected = true;
        arduinoPort = portPath;
        console.log(`✓ Arduino connected on ${portPath}`);

        // Broadcast Arduino connected status to all clients
        broadcastToAll({
          type: 'arduino_status',
          status: 'connected',
          port: portPath
        });

        resolve();
      });

    parser.on('data', async (line) => {
      try {
        const data = JSON.parse(line.trim());

        // Log all incoming data for debugging
        console.log('Arduino data:', line.trim());

        // Handle Arduino status messages
        if (data.status === 'ready') {
          console.log('Arduino MAX30102 sensor ready');
          broadcastToAll({
            type: 'arduino_status',
            status: 'ready',
            message: 'MAX30102 sensor initialized'
          });
          return;
        }

        // Handle error messages from Arduino
        if (data.error) {
          console.log('Arduino error:', data.error);
          broadcastToAll({
            type: 'arduino_error',
            error: data.error
          });
          return;
        }

        // Skip if no valid vitals data (check for undefined/null, not 0)
        if (data.heart_rate === undefined || data.spo2 === undefined) {
          return;
        }

        // Log valid vitals data
        console.log(`Vitals - HR: ${data.heart_rate} bpm, SpO2: ${data.spo2}%`);

        // Broadcast to all active sessions
        for (const [sessionId, session] of activeSessions.entries()) {
          const sessionData = {
            type: 'vitals',
            sessionId: sessionId,
            data: {
              heart_rate: parseFloat(data.heart_rate),
              spo2: parseFloat(data.spo2),
              timestamp: new Date().toISOString()
            }
          };

          // Add status indicators
          sessionData.data.hr_status = getStatus('heart_rate', sessionData.data.heart_rate);
          sessionData.data.spo2_status = getStatus('spo2', sessionData.data.spo2);

          // Broadcast to clients in this session
          broadcastToSession(sessionId, sessionData);

          // Add to buffer for aggregation
          addToBuffer(sessionId, sessionData.data);
        }

      } catch (err) {
        console.error('Error parsing Arduino data:', err.message);
      }
    });

    serialPort.on('error', (err) => {
      console.error('Serial port error:', err.message);
      arduinoConnected = false;
      arduinoPort = null;
      broadcastToAll({
        type: 'arduino_status',
        status: 'error',
        message: err.message
      });
    });

    serialPort.on('close', () => {
      console.log('Arduino disconnected');
      arduinoConnected = false;
      arduinoPort = null;
      broadcastToAll({
        type: 'arduino_status',
        status: 'disconnected'
      });
    });

    } catch (err) {
      reject(err);
    }
  });
}

// Get vital sign status
function getStatus(type, value) {
  if (type === 'heart_rate') {
    if (value < 50 || value > 120) return 'critical';
    if (value < 60 || value > 100) return 'warning';
    return 'normal';
  }
  if (type === 'spo2') {
    if (value < 90) return 'critical';
    if (value < 95) return 'warning';
    return 'normal';
  }
  return 'normal';
}

// Add data to buffer for aggregation
function addToBuffer(sessionId, data) {
  if (!dataBuffers.has(sessionId)) {
    dataBuffers.set(sessionId, {
      data: [],
      lastSaveTime: Date.now()
    });
  }

  const buffer = dataBuffers.get(sessionId);
  buffer.data.push(data);

  // Save every 5 seconds
  if (Date.now() - buffer.lastSaveTime >= 5000) {
    saveAggregatedData(sessionId, buffer.data);
    buffer.data = [];
    buffer.lastSaveTime = Date.now();
  }
}

// Save aggregated data to database every 5 seconds
async function saveAggregatedData(sessionId, dataPoints) {
  if (dataPoints.length === 0) return;

  try {
    const hrValues = dataPoints.map(d => d.heart_rate);
    const spo2Values = dataPoints.map(d => d.spo2);

    const avgHr = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
    const avgSpo2 = spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length;

    const session = activeSessions.get(sessionId);
    if (!session) return;

    // Save heart rate (averaged from 5 second window)
    await db.query(
      `INSERT INTO wearable_data 
       (session_id, patient_id, measurement_type, value, unit, status, measured_at) 
       VALUES (?, ?, 'heart_rate', ?, 'bpm', ?, NOW())`,
      [sessionId, session.patientId, avgHr.toFixed(2), getStatus('heart_rate', avgHr)]
    );

    // Save SpO2 (averaged from 5 second window)
    await db.query(
      `INSERT INTO wearable_data 
       (session_id, patient_id, measurement_type, value, unit, status, measured_at) 
       VALUES (?, ?, 'spo2', ?, '%', ?, NOW())`,
      [sessionId, session.patientId, avgSpo2.toFixed(2), getStatus('spo2', avgSpo2)]
    );

    console.log(`Saved aggregated data for session ${sessionId}: HR=${avgHr.toFixed(2)}, SpO2=${avgSpo2.toFixed(2)}`);

  } catch (err) {
    console.error('Error saving aggregated data:', err);
  }
}

// WebSocket connection handler
wss.on('connection', async (ws, req) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);

      if (msg.type === 'connect') {
        const { userId, role, sessionId } = msg.data;

        // Validate session
        const isValid = await validateSession(sessionId, userId, role);
        
        if (!isValid) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid session or unauthorized access'
          }));
          ws.close();
          return;
        }

        // Register client
        clients.set(ws, { userId, role, sessionId });

        ws.send(JSON.stringify({
          type: 'connected',
          sessionId: sessionId,
          message: 'Successfully connected to monitoring session'
        }));

        // Send current Arduino status to newly connected client
        ws.send(JSON.stringify({
          type: 'arduino_status',
          status: arduinoConnected ? 'connected' : 'disconnected',
          port: arduinoPort
        }));

        console.log(`User ${userId} (${role}) connected to session ${sessionId}`);
      }

      if (msg.type === 'disconnect') {
        const clientInfo = clients.get(ws);
        if (clientInfo) {
          console.log(`User ${clientInfo.userId} disconnected from session ${clientInfo.sessionId}`);
          clients.delete(ws);
        }
      }

      if (msg.type === 'end_session') {
        const clientInfo = clients.get(ws);
        if (clientInfo && clientInfo.role === 'doctor') {
          await endSession(clientInfo.sessionId);
          
          broadcastToSession(clientInfo.sessionId, {
            type: 'session_ended',
            message: 'Monitoring session ended by doctor'
          });

          // Clean up
          activeSessions.delete(clientInfo.sessionId);
          dataBuffers.delete(clientInfo.sessionId);
        }
      }

    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      console.log(`WebSocket closed for user ${clientInfo.userId}`);
      clients.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Validate session
async function validateSession(sessionId, userId, role) {
  try {
    const [sessions] = await db.query(
      `SELECT * FROM monitoring_sessions 
       WHERE session_id = ? AND status = 'active'`,
      [sessionId]
    );

    if (sessions.length === 0) {
      console.log(`Session ${sessionId} not found or not active`);
      return false;
    }

    const session = sessions[0];

    // Validate role-specific authorization
    if (role === 'patient' && session.patient_id !== userId) {
      console.log(`Patient ${userId} not authorized for session ${sessionId}`);
      return false;
    }
    
    if (role === 'doctor' && session.doctor_id !== userId) {
      console.log(`Doctor ${userId} not authorized for session ${sessionId}`);
      return false;
    }

    // Add to active sessions cache
    activeSessions.set(sessionId, {
      patientId: session.patient_id,
      doctorId: session.doctor_id,
      status: 'active'
    });

    return true;
  } catch (err) {
    console.error('Session validation error:', err);
    return false;
  }
}

// End monitoring session
async function endSession(sessionId) {
  try {
    console.log(`\n=== ENDING SESSION ${sessionId} ===`);

    // Save any remaining buffered data
    const buffer = dataBuffers.get(sessionId);
    if (buffer && buffer.data.length > 0) {
      console.log(`Saving ${buffer.data.length} buffered data points...`);
      await saveAggregatedData(sessionId, buffer.data);
    }

    // Get session info first
    const [sessions] = await db.query(
      `SELECT * FROM monitoring_sessions WHERE session_id = ?`,
      [sessionId]
    );

    if (sessions.length === 0) {
      console.error(`Session ${sessionId} not found!`);
      return;
    }

    const session = sessions[0];
    console.log(`Session info:`, {
      patient_id: session.patient_id,
      doctor_id: session.doctor_id,
      appointment_id: session.appointment_id
    });

    // Calculate summary statistics
    const [hrData] = await db.query(
      `SELECT
        AVG(value) as avg_val,
        MIN(value) as min_val,
        MAX(value) as max_val,
        COUNT(*) as count,
        SUM(CASE WHEN status IN ('warning', 'critical') THEN 1 ELSE 0 END) as anomaly_count
       FROM wearable_data
       WHERE session_id = ? AND measurement_type = 'heart_rate'`,
      [sessionId]
    );

    const [spo2Data] = await db.query(
      `SELECT
        AVG(value) as avg_val,
        MIN(value) as min_val,
        MAX(value) as max_val,
        COUNT(*) as count
       FROM wearable_data
       WHERE session_id = ? AND measurement_type = 'spo2'`,
      [sessionId]
    );

    console.log(`Heart Rate Data:`, hrData[0]);
    console.log(`SpO2 Data:`, spo2Data[0]);

    const hasAnomaly = (hrData[0]?.anomaly_count || 0) > 0;
    const avgHr = hrData[0]?.avg_val || null;
    const minHr = hrData[0]?.min_val || null;
    const maxHr = hrData[0]?.max_val || null;
    const avgSpo2 = spo2Data[0]?.avg_val || null;
    const minSpo2 = spo2Data[0]?.min_val || null;
    const maxSpo2 = spo2Data[0]?.max_val || null;

    // Update session with summary
    const [updateResult] = await db.query(
      `UPDATE monitoring_sessions
       SET status = 'completed',
           ended_at = NOW(),
           avg_heart_rate = ?,
           min_heart_rate = ?,
           max_heart_rate = ?,
           avg_spo2 = ?,
           min_spo2 = ?,
           max_spo2 = ?,
           has_anomaly = ?
       WHERE session_id = ?`,
      [avgHr, minHr, maxHr, avgSpo2, minSpo2, maxSpo2, hasAnomaly, sessionId]
    );

    console.log(`Updated monitoring_sessions:`, {
      affectedRows: updateResult.affectedRows,
      avgHr, minHr, maxHr, avgSpo2, minSpo2, maxSpo2, hasAnomaly
    });

    // If appointment_id exists, update Hasil_Pemeriksaan
    if (session.appointment_id) {
      console.log(`Looking for examination result with appointment_id: ${session.appointment_id}`);

      // Check if Hasil_Pemeriksaan exists for this pertemuan
      const [pertemuan] = await db.query(
        `SELECT * FROM Pertemuan WHERE ID_pertemuan = ?`,
        [session.appointment_id]
      );

      if (pertemuan.length > 0) {
        console.log(`Found Pertemuan:`, pertemuan[0]);

        // Check if Hasil_Pemeriksaan already exists
        const [existingResults] = await db.query(
          `SELECT * FROM Hasil_Pemeriksaan WHERE ID_pertemuan = ?`,
          [session.appointment_id]
        );

        if (existingResults.length > 0) {
          // Update existing Hasil_Pemeriksaan
          const hasilId = existingResults[0].ID_hasil;
          console.log(`Updating existing Hasil_Pemeriksaan: ${hasilId}`);

          // Check if notes already contain monitoring data
          const existingNotes = existingResults[0].notes || '';
          let updatedNotes = existingNotes;

          // If monitoring section doesn't exist, append it
          if (!existingNotes.includes('--- Vital Signs Monitoring ---')) {
            updatedNotes = existingNotes +
              '\n\n--- Vital Signs Monitoring ---\n' +
              `Heart Rate: ${avgHr} bpm (${minHr}-${maxHr} bpm)\n` +
              `SpO2: ${avgSpo2}% (${minSpo2}-${maxSpo2}%)\n` +
              `Anomaly Detected: ${hasAnomaly ? 'Yes' : 'No'}`;
          } else {
            // Replace existing monitoring section
            updatedNotes = existingNotes.replace(
              /--- Vital Signs Monitoring ---[\s\S]*?(?=\n\n|$)/,
              `--- Vital Signs Monitoring ---\n` +
              `Heart Rate: ${avgHr} bpm (${minHr}-${maxHr} bpm)\n` +
              `SpO2: ${avgSpo2}% (${minSpo2}-${maxSpo2}%)\n` +
              `Anomaly Detected: ${hasAnomaly ? 'Yes' : 'No'}`
            );
          }

          await db.query(
            `UPDATE Hasil_Pemeriksaan
             SET detak_jantung = ?,
                 kadar_oksigen = ?,
                 notes = ?,
                 updated_at = NOW()
             WHERE ID_hasil = ?`,
            [avgHr, avgSpo2, updatedNotes, hasilId]
          );
          console.log(`Hasil_Pemeriksaan updated successfully`);
        } else {
          // Create new Hasil_Pemeriksaan with unique ID
          let hasilId;
          let idExists = true;
          let attempts = 0;

          // Try to generate unique ID (max 10 attempts)
          while (idExists && attempts < 10) {
            hasilId = `HP${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const [checkId] = await db.query(
              'SELECT ID_hasil FROM Hasil_Pemeriksaan WHERE ID_hasil = ?',
              [hasilId]
            );
            idExists = checkId.length > 0;
            attempts++;
            if (idExists) {
              await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms
            }
          }

          console.log(`Creating new Hasil_Pemeriksaan: ${hasilId}`);

          await db.query(
            `INSERT INTO Hasil_Pemeriksaan
             (ID_hasil, ID_pertemuan, detak_jantung, kadar_oksigen, notes, status)
             VALUES (?, ?, ?, ?, ?, 'completed')`,
            [
              hasilId,
              session.appointment_id,
              avgHr,
              avgSpo2,
              `--- Vital Signs Monitoring ---\n` +
              `Heart Rate: ${avgHr} bpm (${minHr}-${maxHr} bpm)\n` +
              `SpO2: ${avgSpo2}% (${minSpo2}-${maxSpo2}%)\n` +
              `Anomaly Detected: ${hasAnomaly ? 'Yes' : 'No'}`
            ]
          );
          console.log(`Hasil_Pemeriksaan created successfully`);
        }
      } else {
        console.log(`No Pertemuan found with ID: ${session.appointment_id}`);
      }
    } else {
      console.log(`No appointment_id linked to this session`);
    }

    console.log(`=== SESSION ${sessionId} ENDED SUCCESSFULLY ===\n`);
  } catch (err) {
    console.error('Error ending session:', err);
  }
}

// Broadcast message to all clients in a session
function broadcastToSession(sessionId, message) {
  for (const [ws, clientInfo] of clients.entries()) {
    if (clientInfo.sessionId === sessionId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Broadcast message to all connected clients
function broadcastToAll(message) {
  for (const [ws, clientInfo] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: activeSessions.size,
    connectedClients: clients.size,
    serialPortOpen: serialPort?.isOpen || false,
    arduinoConnected: arduinoConnected,
    arduinoPort: arduinoPort
  });
});

// Arduino status endpoint
app.get('/arduino/status', (req, res) => {
  res.json({
    connected: arduinoConnected,
    port: arduinoPort,
    isOpen: serialPort?.isOpen || false
  });
});

// Start server
const PORT = process.env.IOT_PORT || 8080;

server.listen(PORT, () => {
  console.log(`IoT Server running on port ${PORT}`);
  
  // Try to initialize Arduino
  // Only check COM12 as specified
  const possiblePorts = ['COM12'];

  // Try each port
  console.log('Attempting to connect to Arduino...');
  let connected = false;

  (async () => {
    for (const port of possiblePorts) {
      try {
        console.log(`Trying port: ${port}`);
        await initArduino(port);
        connected = true;
        break;
      } catch (err) {
        // Continue to next port
      }
    }

    if (!connected) {
      console.log('⚠ No Arduino found. Server will continue running without serial connection.');
      console.log('To connect Arduino:');
      console.log('1. Connect Arduino via USB');
      console.log('2. Check COM port in Device Manager (Windows) or ls /dev/tty* (Mac/Linux)');
      console.log('3. Restart this server');
    }
  })();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  
  // End all active sessions
  for (const sessionId of activeSessions.keys()) {
    await endSession(sessionId);
  }
  
  // Close serial port
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
