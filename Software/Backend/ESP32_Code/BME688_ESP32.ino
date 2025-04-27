#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_BME680.h"
#include <WebServer.h>
#include <Preferences.h>
#include <ESPmDNS.h>  // mDNS support

// BME680 sensor pins
#define BME_SDA 21
#define BME_SCL 22

Adafruit_BME680 bme;

// Replace these URLs with your actual backend endpoints:
const char* sensorServer = "http://domus-central.local:5000/bme688-latest";
const char* checkinServer = "http://domus-central.local:5000/device-checkin";  // Use your backend's checkin endpoint

// Web server for AP mode configuration
WebServer server(80);

// Preferences to store Wi-Fi credentials persistently
Preferences preferences;

// Global variables for credentials
String stored_ssid = "";
String stored_password = "";

// Generate HTML dropdown with available Wi-Fi networks
String getNetworkListHTML() {
  String html = "<select name='ssid'>";
  int n = WiFi.scanNetworks();
  if (n == 0) {
    html += "<option>No networks found</option>";
  } else {
    for (int i = 0; i < n; i++) {
      html += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i) +
              " (" + String(WiFi.RSSI(i)) + " dBm)</option>";
    }
  }
  html += "</select>";
  return html;
}

// Root page: configuration form
void handleRoot() {
  String html = "<html><body>";
  html += "<h1>Configure Wi-Fi</h1>";
  html += "<form action='/setup' method='POST'>";
  html += "Select Wi-Fi: " + getNetworkListHTML() + "<br><br>";
  html += "Password: <input type='password' name='password'><br><br>";
  html += "<input type='submit' value='Connect'>";
  html += "</form>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// Handle form submission: store credentials and reboot
void handleSetup() {
  if (server.hasArg("ssid") && server.hasArg("password")) {
    stored_ssid = server.arg("ssid");
    stored_password = server.arg("password");

    preferences.begin("wifi", false);
    preferences.putString("ssid", stored_ssid);
    preferences.putString("pass", stored_password);
    preferences.end();

    String response = "Received credentials for SSID: " + stored_ssid +
                      ". The device will now attempt to connect and reboot.";
    server.send(200, "text/plain", response);
    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "Missing ssid or password");
  }
}

// Start AP mode for configuration
void startAPMode() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Domus-TempSensor");
  Serial.println("Started SoftAP: Domus-TempSensor");

  server.on("/", handleRoot);
  server.on("/setup", HTTP_POST, handleSetup);
  server.begin();
  Serial.println("Web server started in AP mode.");
}

void setup() {
  Serial.begin(115200);
  Wire.begin(BME_SDA, BME_SCL);

  // Initialize the BME680 sensor
  if (!bme.begin()) {
    Serial.println("Could not find BME680 sensor. Check wiring!");
    while (1);
  }
  
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_2X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150);

  // Load stored Wi-Fi credentials
  preferences.begin("wifi", true);
  stored_ssid = preferences.getString("ssid", "");
  stored_password = preferences.getString("pass", "");
  preferences.end();

  if (stored_ssid == "") {
    Serial.println("No Wi-Fi credentials found. Starting AP mode for configuration.");
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(100);
    WiFi.scanNetworks();  // scan networks for the config page dropdown
    startAPMode();
  } else {
    Serial.println("Stored Wi-Fi credentials found. Connecting to Wi-Fi: " + stored_ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(stored_ssid.c_str(), stored_password.c_str());

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
      delay(500);
      Serial.print(".");
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ Connected to Wi-Fi");
      Serial.print("IP Address: ");
      Serial.println(WiFi.localIP());

      // Start mDNS responder with hostname "domus-device"
      if (MDNS.begin("domus-device")) {
        Serial.println("mDNS responder started: http://domus-device.local");
        MDNS.addService("domus", "tcp", 80);
      } else {
        Serial.println("❌ Failed to start mDNS");
      }
    } else {
      Serial.println("\n❌ Failed to connect to Wi-Fi");
      // Optionally, you can fall back to AP mode here.
    }
  }
}

void loop() {
  // In AP mode, handle configuration requests.
  if (stored_ssid == "") {
    server.handleClient();
    return;
  }

  // Send device check-in every 30 seconds
  static unsigned long lastCheckin = 0;
  unsigned long now = millis();
  if (now - lastCheckin >= 30000) {  // 30 seconds
    HTTPClient checkinHttp;
    Serial.print("Sending device checkin to: ");
    Serial.println(checkinServer);
    checkinHttp.begin(checkinServer);
    checkinHttp.addHeader("Content-Type", "application/json");
    // Use a unique identifier for your device.
    String checkinPayload = "{\"device_id\":\"Domus-TempSensor\"}";
    int checkinResponse = checkinHttp.POST(checkinPayload);
    Serial.print("Checkin Response Code: ");
    Serial.println(checkinResponse);
    checkinHttp.end();
    lastCheckin = now;
  }

  // Once connected, read sensor and POST sensor data every 10 seconds.
  if (WiFi.status() == WL_CONNECTED) {
    if (!bme.performReading()) {
      Serial.println("Sensor reading failed!");
      return;
    }

    String payload = "{\"temperature\":" + String(bme.temperature) +
                     ",\"humidity\":" + String(bme.humidity) +
                     ",\"pressure\":" + String(bme.pressure / 100.0) +
                     ",\"gas_resistance\":" + String(bme.gas_resistance / 1000.0) + "}";
    HTTPClient http;
    Serial.print("Sending sensor data POST to: ");
    Serial.println(sensorServer);

    http.begin(sensorServer);
    http.addHeader("Content-Type", "application/json");

    int response = http.POST(payload);
    if (response > 0) {
      Serial.print("✅ Sensor POST Response Code: ");
      Serial.println(response);
    } else {
      Serial.print("❌ Error Posting Sensor Data: ");
      Serial.println(response);
    }
    http.end();
  } else {
    Serial.println("🚫 Not connected to Wi-Fi");
  }

  delay(10000);  // Delay 10 seconds before next sensor reading
}
