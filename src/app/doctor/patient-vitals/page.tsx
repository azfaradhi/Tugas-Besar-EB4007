'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RealtimeData {
  heart_rate: number;
  spo2: number;
  hr_status: string;
  spo2_status: string;
  timestamp: string;
}

interface Patient {
  ID_pasien: string;
  Nama: string;
}

interface MonitoringSession {
  session_id: string;
  patient_id: string;
  patient_name: string;
  status: string;
  started_at: string;
}

export default function DoctorPatientVitalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Patients and session
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [activeSession, setActiveSession] = useState<MonitoringSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Real-time data
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [chartData, setChartData] = useState<{hr: number[], spo2: number[], labels: string[]}>({
    hr: [],
    spo2: [],
    labels: []
  });
  const [mounted, setMounted] = useState(false);

  // Arduino state
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [arduinoError, setArduinoError] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const maxDataPoints = 30;

  // Helper function to format date consistently on client side
  const formatDateTime = (dateString: string) => {
    if (!mounted) return '';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    setMounted(true);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      
      const data = await res.json();
      if (data.user.role !== 'doctor') {
        router.push('/dashboard');
        return;
      }
      setUser(data.user);

      // Fetch patients
      const patientsRes = await fetch('/api/patients');
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients || []);
      }

      // Check for active session
      const sessionRes = await fetch('/api/monitoring/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.session) {
          setActiveSession(sessionData.session);
          setSelectedPatient(sessionData.session.patient_id);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedPatient) {
      setError('Pilih pasien terlebih dahulu');
      return;
    }

    try {
      const res = await fetch('/api/monitoring/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          notes: ''
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Gagal memulai sesi');
        return;
      }

      const data = await res.json();
      setActiveSession(data.session);
      setError('');
      
      // Auto connect to WebSocket
      setTimeout(() => handleConnect(), 500);

    } catch (error) {
      console.error('Error starting session:', error);
      setError('Gagal memulai sesi monitoring');
    }
  };

  const handleConnect = () => {
    if (!activeSession) return;

    try {
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'connect',
          data: {
            userId: user.profileId,
            role: 'doctor',
            sessionId: activeSession.session_id
          }
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          setIsConnected(true);
          setError('');
        }

        if (msg.type === 'arduino_status') {
          if (msg.status === 'connected' || msg.status === 'ready') {
            setArduinoConnected(true);
            setArduinoError('');
          } else if (msg.status === 'disconnected' || msg.status === 'error') {
            setArduinoConnected(false);
          }
        }

        if (msg.type === 'arduino_error') {
          setArduinoError(msg.error);
        }

        if (msg.type === 'vitals') {
          setRealtimeData(msg.data);
          // Clear errors when receiving valid data
          if (arduinoError === 'No finger detected') {
            setArduinoError('');
          }

          // Update chart
          setChartData(prev => {
            const newHr = [...prev.hr, msg.data.heart_rate];
            const newSpo2 = [...prev.spo2, msg.data.spo2];
            const newLabels = [...prev.labels, formatTime()];

            // Keep only last N data points
            if (newHr.length > maxDataPoints) {
              newHr.shift();
              newSpo2.shift();
              newLabels.shift();
            }

            return { hr: newHr, spo2: newSpo2, labels: newLabels };
          });
        }

        if (msg.type === 'error') {
          setError(msg.message);
        }
      };

      ws.onerror = () => {
        setError('Gagal terhubung ke server monitoring');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

    } catch (err) {
      console.error('Connection error:', err);
      setError('Gagal membuat koneksi');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    if (!confirm('Akhiri sesi monitoring? Data akan disimpan sebagai hasil pemeriksaan.')) {
      return;
    }

    try {
      // Send end session signal via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'end_session' }));
      }

      // Update session status via API
      const res = await fetch('/api/monitoring/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.session_id,
          notes: ''
        })
      });

      if (res.ok) {
        setActiveSession(null);
        setIsConnected(false);
        setRealtimeData(null);
        setChartData({ hr: [], spo2: [], labels: [] });
        setSelectedPatient('');
        
        if (wsRef.current) {
          wsRef.current.close();
        }
      }

    } catch (error) {
      console.error('Error ending session:', error);
      setError('Gagal mengakhiri sesi');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 40,
        max: 140,
        title: {
          display: true,
          text: 'Heart Rate (bpm)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 85,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'SpO2 (%)'
        }
      },
    },
  };

  const chartDataConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Heart Rate',
        data: chartData.hr,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'SpO2',
        data: chartData.spo2,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitor Vital Signs Pasien</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring dengan MAX30102</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!activeSession ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mulai Sesi Monitoring</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Pasien
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Pilih Pasien --</option>
                  {patients.map((patient) => (
                    <option key={patient.ID_pasien} value={patient.ID_pasien}>
                      {patient.Nama} ({patient.ID_pasien})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartSession}
                disabled={!selectedPatient}
                className={`px-6 py-3 rounded-lg font-medium ${
                  selectedPatient
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Mulai Sesi Monitoring
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sesi Monitoring Aktif
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Pasien: {activeSession.patient_name}
                  </p>
                  {mounted && (
                    <p className="text-xs text-gray-500">
                      Dimulai: {formatDateTime(activeSession.started_at)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isConnected 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      isConnected ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {!isConnected && (
                    <button
                      onClick={handleConnect}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Connect
                    </button>
                  )}

                  <button
                    onClick={handleEndSession}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Akhiri Sesi
                  </button>
                </div>
              </div>

              {isConnected && (
                <div className="mt-6 space-y-6">
                  {/* Arduino Error Messages */}
                  {arduinoError && (
                    <div className={`p-4 rounded-lg border-l-4 ${
                      arduinoError === 'MAX30102 not found'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : arduinoError === 'No finger detected'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                        : 'bg-orange-50 border-orange-500 text-orange-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-semibold">
                            {arduinoError === 'MAX30102 not found' && 'Sensor MAX30102 Tidak Terdeteksi'}
                            {arduinoError === 'No finger detected' && 'Jari Pasien Tidak Terdeteksi'}
                            {arduinoError !== 'MAX30102 not found' && arduinoError !== 'No finger detected' && 'Peringatan Arduino'}
                          </p>
                          <p className="text-sm mt-1">
                            {arduinoError === 'MAX30102 not found' && 'Sensor tidak terhubung dengan benar ke Arduino'}
                            {arduinoError === 'No finger detected' && 'Minta pasien untuk meletakkan jari pada sensor'}
                            {arduinoError !== 'MAX30102 not found' && arduinoError !== 'No finger detected' && arduinoError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {realtimeData && (
                  <><div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Heart Rate</p>
                              <p className="text-4xl font-bold text-gray-900 mt-1">
                                {realtimeData.heart_rate}
                                <span className="text-lg text-gray-500 ml-1">bpm</span>
                              </p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(realtimeData.hr_status)}`}></div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">SpO2</p>
                              <p className="text-4xl font-bold text-gray-900 mt-1">
                                {realtimeData.spo2}
                                <span className="text-lg text-gray-500 ml-1">%</span>
                              </p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(realtimeData.spo2_status)}`}></div>
                          </div>
                        </div>
                      </div><div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Grafik Real-time (30 detik terakhir)
                          </h3>
                          <div style={{ height: '300px' }}>
                            <Line options={chartOptions} data={chartDataConfig} />
                          </div>
                        </div></>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
