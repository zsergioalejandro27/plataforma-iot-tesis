import os
import json
import ssl
import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Credenciales HiveMQ
HIVEMQ_HOST = os.getenv("HIVEMQ_HOST")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT", "8883"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASSWORD = os.getenv("HIVEMQ_PASSWORD")

# Credenciales Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

TOPIC_FILTER = "device/+/telemetry"  # el "+" es un comodín: cualquier dispositivo


def resolve_device(device_key):
    """Busca en la base de datos a qué tenant y dispositivo pertenece este device_key."""
    result = supabase.table("devices").select("id, tenant_id").eq("device_key", device_key).execute()
    if result.data:
        return result.data[0]
    return None


def on_connect(client, userdata, flags, reason_code, properties=None):
    print("Bridge conectado al broker. Código:", reason_code)
    client.subscribe(TOPIC_FILTER)
    print("Escuchando en:", TOPIC_FILTER)


def on_message(client, userdata, msg):
    print(f"\nMensaje recibido en el topic: {msg.topic}")
    try:
        device_key = msg.topic.split("/")[1]
        payload = json.loads(msg.payload.decode())

        device = resolve_device(device_key)
        if not device:
            print(f"⚠️  Dispositivo desconocido ({device_key}) — mensaje descartado")
            return

        supabase.table("telemetry").insert({
            "tenant_id": device["tenant_id"],
            "device_id": device["id"],
            "payload": payload
        }).execute()

        print(f"✅ Guardado — tenant: {device['tenant_id']} | device: {device['id']}")
    except Exception as e:
        print("❌ Error procesando el mensaje:", e)


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="bridge-plataforma-iot")
client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASSWORD)
client.tls_set(tls_version=ssl.PROTOCOL_TLS_CLIENT)
client.on_connect = on_connect
client.on_message = on_message

client.connect(HIVEMQ_HOST, HIVEMQ_PORT)
print("Iniciando bridge... (Ctrl+C para detener)")
client.loop_forever()