#include <WiFi.h>
#include <WiFiClientSecure.h>   
#include <PubSubClient.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <Wire.h>

// ── WiFi (Wokwi simulation) ──────────────────────────
const char* ssid     = "Wokwi-GUEST";
const char* password = "";

// ── HiveMQ Cloud ─────────────────────────────────────
const char* mqtt_server   = "3658434c6d70449dafe8339f9451094f.s1.eu.hivemq.cloud";
const int   mqtt_port     = 8883;          // TLS
const char* mqtt_user     = "hamzashoul";
const char* mqtt_password = "Aqwzsx*123456";
const char* mqtt_topic    = "home/pir/motion";

// ── Pins ──────────────────────────────────────────────
#define PIR_PIN    13
#define LED_PIN    12
#define BUZZER_PIN 14

// ── OLED ─────────────────────────────────────────────
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET   -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ─────────────────────────────────────────────────────
void setupOLED() {
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED not found!");
    while (true);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();
}

void showOLED(const char* line1, const char* line2) {
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(0, 0);
  display.println(line1);
  display.setTextSize(1);
  display.setCursor(0, 36);
  display.println(line2);
  display.display();
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  showOLED("WiFi OK", WiFi.localIP().toString().c_str());
  delay(1000);
}

void connectMQTT() {
  espClient.setInsecure(); // Pour Wokwi (skip cert verification)
  client.setServer(mqtt_server, mqtt_port);
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32_PIR", mqtt_user, mqtt_password)) {
      Serial.println("Connected!");
      showOLED("MQTT OK", mqtt_server);
      delay(1000);
    } else {
      Serial.print("Failed, rc=");
      Serial.println(client.state());
      delay(3000);
    }
  }
}

void publishMotion(bool detected) {
  String payload = detected
    ? "{\"motion\": true, \"device\": \"esp32-pir\"}"
    : "{\"motion\": false, \"device\": \"esp32-pir\"}";

  client.publish(mqtt_topic, payload.c_str());
  Serial.println("Published: " + payload);
}

// ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN,    INPUT);
  pinMode(LED_PIN,    OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  setupOLED();
  connectWiFi();
  connectMQTT();

  showOLED("Ready!", "Waiting...");
}

bool lastState = false;

void loop() {
  if (!client.connected()) connectMQTT();
  client.loop();

  bool motion = digitalRead(PIR_PIN);

  if (motion != lastState) {
    lastState = motion;

    if (motion) {
      digitalWrite(LED_PIN, HIGH);
      tone(BUZZER_PIN, 1000, 300);
      showOLED("MOTION!", "Alert sent");
      publishMotion(true);
    } else {
      digitalWrite(LED_PIN, LOW);
      showOLED("No Motion", "Monitoring...");
      publishMotion(false);
    }
  }

  delay(100);
}