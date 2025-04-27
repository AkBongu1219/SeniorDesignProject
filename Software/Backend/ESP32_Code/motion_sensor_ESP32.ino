#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ESPmDNS.h>

#define PIR_PIN 27
WebServer server(80);
Preferences preferences;

String stored_ssid = "";
String stored_password = "";

const char* checkinServer = "http://domus-central.local:5000/device-checkin";
const char* motionServer = "http://domus-central.local:5000/motion-data";

// Generate Wi-Fi dropdown HTML
String getNetworkListHTML() {
  String html = "<select name='ssid'>";
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    html += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i) + "</option>";
  }
  html += "</select>";
  return html;
}

void handleRoot() {
  String html = "<html><body><h1>Configure Motion Sensor Wi-Fi</h1>";
  html += "<form action='/setup' method='POST'>";
  html += "Wi-Fi Network: " + getNetworkListHTML() + "<br><br>";
  html += "Password: <input type='password' name='password'><br><br>";
  html += "<input type='submit' value='Connect'>";
  html += "</form></body></html>";
  server.send(200, "text/html", html);
}

void handleSetup() {
  if (server.hasArg("ssid") && server.hasArg("password")) {
    stored_ssid = server.arg("ssid");
    stored_password = server.arg("password");

    preferences.begin("wifi", false);
    preferences.putString("ssid", stored_ssid);
    preferences.putString("pass", stored_password);
    preferences.end();

    server.send(200, "text/plain", "Received credentials. Rebooting...");
    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "Missing ssid or password");
  }
}

void startAPMode() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Domus-MotionSensor");
  Serial.println("Started SoftAP: Domus-MotionSensor");

  server.on("/", handleRoot);
  server.on("/setup", HTTP_POST, handleSetup);
  server.begin();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);

  preferences.begin("wifi", true);
  stored_ssid = preferences.getString("ssid", "");
  stored_password = preferences.getString("pass", "");
  preferences.end();

  if (stored_ssid == "") {
    Serial.println("No Wi-Fi credentials. Starting AP mode.");
    WiFi.disconnect();
    WiFi.scanNetworks();
    startAPMode();
  } else {
    WiFi.mode(WIFI_STA);
    WiFi.begin(stored_ssid.c_str(), stored_password.c_str());
    Serial.println("Connecting to Wi-Fi...");

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
      delay(500);
      Serial.print(".");
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ Connected!");
      Serial.println(WiFi.localIP());

      if (MDNS.begin("domus-motion")) {
        Serial.println("mDNS started at http://domus-motion.local");
        MDNS.addService("http", "tcp", 80);
      }
    } else {
      Serial.println("❌ Failed to connect.");
    }
  }
}

void loop() {
  if (stored_ssid == "") {
    server.handleClient();
    return;
  }

  static unsigned long lastCheckin = 0;
  static int lastMotionState = LOW;

  unsigned long now = millis();

  if (now - lastCheckin > 30000) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(checkinServer);
      http.addHeader("Content-Type", "application/json");
      http.POST("{\"device_id\": \"Domus-MotionSensor\"}");
      http.end();
      Serial.println("✅ Sent device check-in");
    }
    lastCheckin = now;
  }

  int currentMotion = digitalRead(PIR_PIN);
  if (currentMotion != lastMotionState && WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(motionServer);
    http.addHeader("Content-Type", "application/json");

    String payload = currentMotion == HIGH ?
      "{\"motion\": \"detected\"}" : "{\"motion\": \"clear\"}";

    int response = http.POST(payload);
    Serial.print("Motion POST Response: ");
    Serial.println(response);
    http.end();
    lastMotionState = currentMotion;
  }

  delay(200);
}
