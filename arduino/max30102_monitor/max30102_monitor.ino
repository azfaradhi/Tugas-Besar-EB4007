/*
 * MAX30102 Heart Rate & SpO2 Sensor Monitor for Hospital IoT System
 *
 * Hardware Setup:
 * - MAX30102 VIN  -> Arduino 3.3V or 5V
 * - MAX30102 GND  -> Arduino GND
 * - MAX30102 SDA  -> Arduino A4 (SDA)
 * - MAX30102 SCL  -> Arduino A5 (SCL)
 *
 * Required Libraries:
 * - SparkFun MAX3010x Pulse and Proximity Sensor Library
 *   Install via Arduino Library Manager: Search "MAX3010x" by SparkFun
 *
 * Serial Output: JSON format at 9600 baud
 * Format: {"heart_rate": 72, "spo2": 98}
 */

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 particleSensor;

// Heart rate calculation with improved algorithm
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;

// Moving average buffer for IR (smoothing)
const byte BUFFER_SIZE = 4;
long irBuffer[BUFFER_SIZE];
byte bufferIndex = 0;

// SpO2 calculation with AC/DC components
long irValue = 0;
long redValue = 0;
long irACValue = 0;
long redACValue = 0;
long irDCValue = 0;
long redDCValue = 0;
double spo2 = 0;

// Moving average for SpO2
const byte SPO2_BUFFER_SIZE = 4;
int spo2Buffer[SPO2_BUFFER_SIZE];
byte spo2BufferIndex = 0;

// Beat detection thresholds
long irMin = 999999;
long irMax = 0;
long threshold = 0;
bool beatDetected = false;
unsigned long lastBeatTime = 0;

// Red LED min/max tracking
long redMin = 999999;
long redMax = 0;

// Timing
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 1000; // Send every 1 second

void setup() {
  Serial.begin(9600);
  
  delay(1000);

  // Initialize MAX30102
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("{\"error\":\"MAX30102 not found\"}");
    while (1);
  }
  
  // Configure sensor with optimal settings for Arduino Uno
  byte ledBrightness = 0x3F;  // Medium brightness (0x00-0xFF)
  byte sampleAverage = 4;     // Average 4 samples
  byte ledMode = 2;           // Red and IR LEDs
  int sampleRate = 100;       // 100 samples per second
  int pulseWidth = 411;       // 411us pulse width (higher resolution)
  int adcRange = 4096;        // ADC range 4096 (nA per LSB)
  
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  
  // Additional configuration for better readings
  particleSensor.setPulseAmplitudeRed(0x3F);    // Set Red LED current
  particleSensor.setPulseAmplitudeIR(0x3F);     // Set IR LED current
  particleSensor.setPulseAmplitudeGreen(0);     // Turn off Green LED
  
  // Initialize buffers
  for (byte i = 0; i < BUFFER_SIZE; i++) {
    irBuffer[i] = 0;
  }
  for (byte i = 0; i < SPO2_BUFFER_SIZE; i++) {
    spo2Buffer[i] = 0;
  }
  for (byte i = 0; i < RATE_SIZE; i++) {
    rates[i] = 0;
  }
  
  Serial.println("{\"status\":\"MAX30102 initialized\"}");
}

void loop() {
  // Read raw sensor values
  long irRaw = particleSensor.getIR();
  long redRaw = particleSensor.getRed();
  
  // Check for finger placement (adaptive threshold)
  if (irRaw < 50000) {
    // Reset all values when finger removed
    beatAvg = 0;
    spo2 = 0;
    irMin = 999999;
    irMax = 0;
    redMin = 999999;
    redMax = 0;
    beatDetected = false;
    
    // Clear buffers
    for (byte i = 0; i < BUFFER_SIZE; i++) irBuffer[i] = 0;
    for (byte i = 0; i < SPO2_BUFFER_SIZE; i++) spo2Buffer[i] = 0;
    for (byte i = 0; i < RATE_SIZE; i++) rates[i] = 0;

    if (millis() - lastSendTime > 5000) {
      Serial.println("{\"error\":\"No finger detected\"}");
      lastSendTime = millis();
    }
    return;
  }

  // ===== HEART RATE DETECTION WITH IMPROVED ALGORITHM =====
  
  // Apply moving average filter to reduce noise
  irBuffer[bufferIndex] = irRaw;
  bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
  
  irValue = 0;
  for (byte i = 0; i < BUFFER_SIZE; i++) {
    irValue += irBuffer[i];
  }
  irValue /= BUFFER_SIZE;
  
  // Update min/max for adaptive threshold (over 2 second window)
  if (millis() % 2000 < 100) {
    irMin = 999999;
    irMax = 0;
  }
  if (irValue > irMax) irMax = irValue;
  if (irValue < irMin) irMin = irValue;
  
  // Adaptive threshold: 70% between min and max
  threshold = irMin + ((irMax - irMin) * 70) / 100;
  
  // Beat detection: rising edge crossing threshold
  unsigned long currentTime = millis();
  
  if (!beatDetected && irValue > threshold) {
    beatDetected = true;
    
    // Calculate interval since last beat
    unsigned long interval = currentTime - lastBeatTime;
    
    // Valid heartbeat: 300ms to 2000ms (30-200 BPM)
    if (lastBeatTime > 0 && interval > 300 && interval < 2000) {
      beatsPerMinute = 60000.0 / interval;
      
      // Store valid BPM in circular buffer
      if (beatsPerMinute >= 40 && beatsPerMinute <= 180) {
        rates[rateSpot] = (byte)beatsPerMinute;
        rateSpot = (rateSpot + 1) % RATE_SIZE;
        
        // Calculate average
        int sum = 0;
        int count = 0;
        for (byte i = 0; i < RATE_SIZE; i++) {
          if (rates[i] > 0) {
            sum += rates[i];
            count++;
          }
        }
        if (count > 0) {
          beatAvg = sum / count;
        }
      }
    }
    
    lastBeatTime = currentTime;
  }
  
  // Reset beat detection when signal falls below threshold
  if (beatDetected && irValue < threshold) {
    beatDetected = false;
  }
  
  // ===== SPO2 CALCULATION WITH AC/DC RATIO =====
  
  redValue = redRaw;
  
  // Update red LED min/max
  if (redValue > redMax) redMax = redValue;
  if (redValue < redMin) redMin = redValue;
  if (millis() % 2000 < 100) {
    redMin = 999999;
    redMax = 0;
  }
  
  // Calculate DC component (baseline average)
  irDCValue = irValue;
  redDCValue = redValue;
  
  // Estimate AC component (peak-to-peak amplitude)
  irACValue = irMax - irMin;
  redACValue = redMax - redMin;
  
  // Calculate SpO2 using proper AC/DC ratio
  if (irDCValue > 0 && redDCValue > 0 && irACValue > 0 && redACValue > 0) {
    // R = (AC_red / DC_red) / (AC_ir / DC_ir)
    double ratioRed = (double)redACValue / (double)redDCValue;
    double ratioIR = (double)irACValue / (double)irDCValue;
    
    if (ratioIR > 0) {
      double R = ratioRed / ratioIR;
      
      // Empirical formula (based on MAX30102 application notes)
      // SpO2 = -45.060 * R^2 + 30.354 * R + 94.845
      double spo2Raw = -45.060 * R * R + 30.354 * R + 94.845;
      
      // Alternative simpler formula for backup
      if (spo2Raw < 70 || spo2Raw > 100) {
        spo2Raw = 110.0 - 25.0 * R;
      }
      
      // Clamp to physiological range
      if (spo2Raw > 100.0) spo2Raw = 100.0;
      if (spo2Raw < 70.0) spo2Raw = 70.0;
      
      // Apply moving average to SpO2 for stability
      spo2Buffer[spo2BufferIndex] = (int)spo2Raw;
      spo2BufferIndex = (spo2BufferIndex + 1) % SPO2_BUFFER_SIZE;
      
      int spo2Sum = 0;
      int spo2Count = 0;
      for (byte i = 0; i < SPO2_BUFFER_SIZE; i++) {
        if (spo2Buffer[i] > 0) {
          spo2Sum += spo2Buffer[i];
          spo2Count++;
        }
      }
      if (spo2Count > 0) {
        spo2 = (double)spo2Sum / spo2Count;
      }
    }
  }

  // Send data every SEND_INTERVAL
  if (millis() - lastSendTime > SEND_INTERVAL) {
    // Ensure valid JSON output with both fields
    int outputHr = (beatAvg > 0) ? beatAvg : 0;
    int outputSpo2 = (spo2 >= 70.0) ? (int)spo2 : 0;
    
    Serial.print("{\"heart_rate\":");
    Serial.print(outputHr);
    Serial.print(",\"spo2\":");
    Serial.print(outputSpo2);
    Serial.println("}");
 
    lastSendTime = millis();
  }
}
