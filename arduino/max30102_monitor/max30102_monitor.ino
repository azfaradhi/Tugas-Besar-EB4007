/*
 * MAX30102 Heart Rate & SpO2 Sensor Monitor
 *
 * Hardware Setup:
 * - MAX30102 VIN  -> Arduino 3.3V
 * - MAX30102 GND  -> Arduino GND
 * - MAX30102 SDA  -> Arduino A4
 * - MAX30102 SCL  -> Arduino A5
 *
 * Required Libraries:
 * - SparkFun MAX3010x Pulse and Proximity Sensor Library
 *   (Install via Arduino Library Manager: "MAX3010x" by SparkFun)
 *
 * Output Format: JSON via Serial (9600 baud)
 * Example: {"heart_rate": 75, "spo2": 98}
 */

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 particleSensor;

// Heart rate calculation variables
const byte RATE_SIZE = 4; // Number of readings for averaging
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// SpO2 calculation variables
long irValue = 0;
long redValue = 0;
int spo2Value = 0;

// Timing variables
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 2000; // Send data every 2 seconds

void setup() {
  Serial.begin(9600);

  // Wait a moment for serial to initialize
  delay(1000);

  // Initialize sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("{\"error\": \"MAX30102 sensor not found\"}");
    while (1); // Halt execution if sensor not found
  }

  // Configure sensor with optimal settings
  particleSensor.setup(); // Default settings
  particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate sensor is running
  particleSensor.setPulseAmplitudeGreen(0);  // Turn off Green LED

  Serial.println("{\"message\": \"MAX30102 initialized successfully\"}");
  delay(100);
}

void loop() {
  // Read IR and Red values from sensor
  irValue = particleSensor.getIR();
  redValue = particleSensor.getRed();

  // Check if finger is placed on sensor (IR value threshold)
  if (irValue < 50000) {
    // No finger detected
    beatAvg = 0;
    spo2Value = 0;

    // Send error message every 5 seconds when no finger detected
    if (millis() - lastSendTime > 5000) {
      Serial.println("{\"error\": \"No finger detected\", \"message\": \"Please place finger on sensor\"}");
      lastSendTime = millis();
    }

    return;
  }

  // Heart Rate Detection
  if (checkForBeat(irValue) == true) {
    // A beat was detected
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    // Only accept reasonable heart rate values (20-255 bpm)
    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE; // Wrap around after RATE_SIZE

      // Calculate average heart rate
      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) {
        beatAvg += rates[x];
      }
      beatAvg /= RATE_SIZE;
    }
  }

  // SpO2 Calculation (simplified algorithm)
  if (redValue > 0 && irValue > 0) {
    // Calculate ratio of red to IR
    float ratio = (float)redValue / (float)irValue;

    // Simplified SpO2 calculation (empirical formula)
    // Note: This is a simplified approximation
    spo2Value = (int)(110 - 25 * ratio);

    // Clamp to realistic range (70-100%)
    if (spo2Value > 100) spo2Value = 100;
    if (spo2Value < 70) spo2Value = 70;
  }

  // Send data via Serial every SEND_INTERVAL milliseconds
  if (millis() - lastSendTime > SEND_INTERVAL && beatAvg > 0) {
    // Send JSON formatted data
    Serial.print("{\"heart_rate\": ");
    Serial.print(beatAvg);
    Serial.print(", \"spo2\": ");
    Serial.print(spo2Value);
    Serial.print(", \"ir\": ");
    Serial.print(irValue);
    Serial.println("}");

    lastSendTime = millis();
  }

  // Small delay to prevent flooding serial
  delay(100);
}
