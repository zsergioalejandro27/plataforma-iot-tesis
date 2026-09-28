import random
import time


def generate_payload():
    """Genera un payload aleatorio con las mismas 10 métricas que soporta
    el catálogo del formulario 'Agregar dispositivo' del frontend."""
    return {
        "temperatura": round(random.uniform(18, 30), 1),
        "humedad": round(random.uniform(30, 80), 1),
        "presion": round(random.uniform(990, 1030), 1),
        "nivel": round(random.uniform(0, 100), 1),
        "luminosidad": round(random.uniform(0, 1000), 1),
        "ruido": round(random.uniform(30, 90), 1),
        "co2": round(random.uniform(400, 2000), 1),
        "viento": round(random.uniform(0, 20), 1),
        "voltaje": round(random.uniform(3, 12), 2),
        "bateria": round(random.uniform(0, 100), 1),
        "timestamp": time.time(),
    }
