import random
import time

# Zonas de referencia por métrica. DEBEN coincidir con ZONES de
# frontend/lib/insights.ts (el asistente Semita las usa para decidir qué es
# normal, atención o alerta); `npm run test:insights` lo comprueba.
#   (mínimo normal, máximo normal, límite de alerta bajo, límite de alerta alto, decimales)
# Un límite de alerta en None significa que ese lado no tiene regla.
ZONES = {
    "temperatura": (18, 30, 10, 35, 1),
    "humedad": (30, 70, 20, 85, 1),
    "presion": (990, 1030, 970, 1050, 1),
    "nivel": (20, 90, 10, 97, 1),
    "ruido": (30, 70, None, 85, 1),
    "co2": (400, 1000, None, 1500, 1),
    "viento": (0, 12, None, 17, 1),
    "bateria": (30, 100, 15, None, 1),
}

# Métricas sin zona de referencia (dependen demasiado del contexto).
FREE_RANGES = {
    "luminosidad": (0, 1000, 1),
    "voltaje": (3, 12, 2),
}

# Métricas que son porcentajes: nunca salen del 0 al 100.
PERCENT_METRICS = {"humedad", "nivel", "bateria"}

# De cada 100 lecturas, cuántas salen de la zona normal para que el asistente
# tenga algo que observar, y de esas cuántas llegan a "alerta" (el resto es
# solo "atención", más leve).
ANOMALY_PROBABILITY = 0.08
ALERT_SHARE = 0.15


def _anomalous_value(metric, lo, hi, alert_low, alert_high, decimals):
    """Un valor fuera de la zona normal, no abismal: casi siempre "atención"."""
    sides = []
    if alert_high is not None:
        sides.append("high")
    if alert_low is not None:
        sides.append("low")
    side = random.choice(sides)
    is_alert = random.random() < ALERT_SHARE

    if side == "high":
        if is_alert:
            start, end = alert_high, alert_high + (alert_high - hi) * 0.4
        else:
            start, end = hi, alert_high
        # se separa un poco del borde para que el redondeo no lo devuelva a "normal"
        start += (end - start) * 0.05
        value = random.uniform(start, end)
    else:
        if is_alert:
            start, end = alert_low, alert_low - (lo - alert_low) * 0.4
        else:
            start, end = lo, alert_low
        start += (end - start) * 0.05
        value = random.uniform(end, start)

    if metric in PERCENT_METRICS:
        value = min(100.0, max(0.0, value))
    return round(value, decimals)


def generate_payload(anomalies=True):
    """Genera un payload aleatorio con las mismas 10 métricas que soporta
    el catálogo del formulario 'Agregar dispositivo' del frontend.

    Casi todas las lecturas caen en la zona normal; con probabilidad
    ANOMALY_PROBABILITY una métrica sale de ella (ver arriba). Con
    anomalies=False todos los valores son normales."""
    payload = {}
    for metric, (lo, hi, alert_low, alert_high, decimals) in ZONES.items():
        if anomalies and random.random() < ANOMALY_PROBABILITY:
            payload[metric] = _anomalous_value(metric, lo, hi, alert_low, alert_high, decimals)
        else:
            payload[metric] = round(random.uniform(lo, hi), decimals)

    for metric, (lo, hi, decimals) in FREE_RANGES.items():
        payload[metric] = round(random.uniform(lo, hi), decimals)

    payload["timestamp"] = time.time()
    return payload
