import os
import json
import time
import ssl
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

HIVEMQ_HOST = os.getenv("HIVEMQ_HOST")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT", "8883"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASSWORD = os.getenv("HIVEMQ_PASSWORD")

TOPIC = "tenant/test/device/test1/telemetry"

def on_connect(client, userdata, flags, reason_code, properties=None):
    print("Conectado al broker. Código de resultado:", reason_code)

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="simulador-test")
client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASSWORD)
client.tls_set(tls_version=ssl.PROTOCOL_TLS_CLIENT)
client.on_connect = on_connect

client.connect(HIVEMQ_HOST, HIVEMQ_PORT)
client.loop_start()

time.sleep(1)

payload = {
    "temperatura": 22.5,
    "humedad": 60,
    "timestamp": time.time()
}

client.publish(TOPIC, json.dumps(payload))
print("Mensaje publicado:", payload)

time.sleep(1)
client.loop_stop()
client.disconnect()