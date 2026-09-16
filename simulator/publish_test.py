import os
import sys
import json
import time
import ssl
import random
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

HIVEMQ_HOST = os.getenv("HIVEMQ_HOST")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT", "8883"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASSWORD = os.getenv("HIVEMQ_PASSWORD")

DEVICE_KEY = sys.argv[1] if len(sys.argv) > 1 else "device-001"
TOPIC = f"device/{DEVICE_KEY}/telemetry"

def on_connect(client, userdata, flags, reason_code, properties=None):
    print("Conectado al broker. Código de resultado:", reason_code)

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"simulador-{DEVICE_KEY}")
client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASSWORD)
client.tls_set(tls_version=ssl.PROTOCOL_TLS_CLIENT)
client.on_connect = on_connect

client.connect(HIVEMQ_HOST, HIVEMQ_PORT)
client.loop_start()

time.sleep(1)

payload = {
    "temperatura": round(random.uniform(18, 30), 1),
    "humedad": round(random.uniform(30, 80), 1),
    "nivel": round(random.uniform(0, 100), 1),
    "presion": round(random.uniform(990, 1030), 1),
    "timestamp": time.time()
}

client.publish(TOPIC, json.dumps(payload))
print(f"Mensaje publicado a {TOPIC}:", payload)

time.sleep(1)
client.loop_stop()
client.disconnect()