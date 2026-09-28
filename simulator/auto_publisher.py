import os
import ssl
import time
import json
import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from supabase import create_client
from payload_generator import generate_payload

load_dotenv()

HIVEMQ_HOST = os.getenv("HIVEMQ_HOST")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT", "8883"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASSWORD = os.getenv("HIVEMQ_PASSWORD")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Cada cuánto publica una ronda de datos a TODOS los dispositivos
# registrados. Configurable sin tocar código: variable de entorno
# PUBLISH_INTERVAL_SECONDS (por defecto 5 minutos).
INTERVAL_SECONDS = int(os.getenv("PUBLISH_INTERVAL_SECONDS", "300"))

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def on_connect(client, userdata, flags, reason_code, properties=None):
    print("Publicador automático conectado al broker. Código:", reason_code)


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="auto-publisher")
client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASSWORD)
client.tls_set(tls_version=ssl.PROTOCOL_TLS_CLIENT)
client.on_connect = on_connect

client.connect(HIVEMQ_HOST, HIVEMQ_PORT)
client.loop_start()

print(f"Iniciando publicador automático (cada {INTERVAL_SECONDS}s)... (Ctrl+C para detener)")

try:
    while True:
        # Se vuelve a consultar la lista de dispositivos en CADA ronda,
        # para detectar automáticamente cualquier dispositivo creado
        # después de que este script arrancó.
        result = supabase.table("devices").select("device_key").execute()
        devices = result.data or []

        if not devices:
            print("No hay dispositivos registrados todavía.")
        else:
            for device in devices:
                device_key = device["device_key"]
                topic = f"device/{device_key}/telemetry"
                payload = generate_payload()
                client.publish(topic, json.dumps(payload))
                print(f"Publicado a {topic}: {payload}")

        time.sleep(INTERVAL_SECONDS)
except KeyboardInterrupt:
    print("\nDeteniendo publicador automático...")
finally:
    client.loop_stop()
    client.disconnect()
