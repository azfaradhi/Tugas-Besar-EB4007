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

// Heart rate calculation
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// SpO2 calculation
long irValue = 0;
long redValue = 0;
double spo2 = 0;

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
  
  // Configure sensor with optimal settings
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
  
  Serial.println("{\"status\":\"ready\"}");
}

void loop() {
  irValue = particleSensor.getIR();
  redValue = particleSensor.getRed();

  // Check for finger placement (IR threshold)
  if (irValue < 50000) {
    beatAvg = 0;
    spo2 = 0;

    if (millis() - lastSendTime > 5000) {
      Serial.println("{\"error\":\"No finger detected\"}");
      lastSendTime = millis();
    }
    return;
  }

  // Detect heartbeat
  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    // Validate heart rate range
    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) {
        beatAvg += rates[x];
      }
      beatAvg /= RATE_SIZE;
    }
  }

  // Calculate SpO2 (simplified)
  if (redValue > 0 && irValue > 0) {
    double ratio = (double)redValue / (double)irValue;
    spo2 = 110.0 - (25.0 * ratio);

    // Clamp to realistic range
    if (spo2 > 100.0) spo2 = 100.0;
    if (spo2 < 70.0) spo2 = 70.0;
  }

  // Send data every SEND_INTERVAL
  if (millis() - lastSendTime > SEND_INTERVAL && beatAvg > 0) {
    Serial.print("{\"heart_rate\":");
    Serial.print(beatAvg);
    Serial.print(",\"spo2\":");
    Serial.print((int)spo2);
    Serial.println("}");

    lastSendTime = millis();
  }
}


    lastSendTime = millis();
  }

  // Small delay to prevent flooding serial
  delay(100);
}
