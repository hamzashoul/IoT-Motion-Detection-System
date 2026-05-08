import paho.mqtt.client as mqtt
import json
import ssl
import asyncio
import os
from dotenv import load_dotenv
from database import SessionLocal
from models import MotionEvent

load_dotenv()

MQTT_BROKER   = os.getenv("MQTT_BROKER")
MQTT_PORT     = int(os.getenv("MQTT_PORT", 8883))
MQTT_USER     = os.getenv("MQTT_USER")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
MQTT_TOPIC    = os.getenv("MQTT_TOPIC", "home/pir/motion")

loop = None

def set_loop(l):
    global loop
    loop = l

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"Connected to HiveMQ: {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Message reçu: {payload}")

        db = SessionLocal()
        event = MotionEvent(
            motion=payload.get("motion"),
            device=payload.get("device")
        )
        db.add(event)
        db.commit()
        db.close()
        print("Sauvegardé dans SQLite ✅")

        if loop and payload.get("motion"):
            asyncio.run_coroutine_threadsafe(
                userdata["manager"].broadcast(json.dumps(payload)),
                loop
            )

    except Exception as e:
        print(f"Erreur: {e}")

def start_mqtt(manager):
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    client.tls_set(tls_version=ssl.PROTOCOL_TLS)
    client.on_connect = on_connect
    client.on_message = on_message
    client.user_data_set({"manager": manager})
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    return client