// Genera el texto de los scripts que el usuario descarga para conectar un
// dispositivo a Sema: un gemelo digital en Python, un sketch para ESP32 y un
// ejemplo con cURL. Los tres envían lecturas a la puerta HTTP /api/ingest
// (app/api/ingest/route.ts), autenticándose con el token del dispositivo.
//
// Se usa String.raw para que las barras invertidas del código generado
// (por ejemplo \" en C++) se conserven tal cual.

export type ScriptParams = {
  deviceName: string;
  deviceKey: string;
  metricKey: string;
  unit: string;
  min: number;
  max: number;
  decimals: number;
  url: string;
  token: string;
  maxPerDay: number | null;
};

// El nombre lo escribe el usuario: se limpia antes de ponerlo en comentarios
// para que unos saltos de línea o un "*/" no rompan el archivo generado.
function safeName(name: string) {
  return name.replace(/[\r\n]+/g, " ").replace(/\*\//g, "* /").replace(/"/g, "'");
}

function limitNote(maxPerDay: number | null, intervalSeconds: number) {
  if (!maxPerDay) return "";
  const perDay = Math.floor(86400 / intervalSeconds);
  return `Tu plan permite ${maxPerDay} lecturas diarias por dispositivo. Con un intervalo de ${intervalSeconds} s se intentan enviar ${perDay} al día: al llegar al tope el servidor responde 429 y el script lo avisa. Sube el intervalo si quieres que dure todo el día.`;
}

export function pythonFileName(deviceKey: string) {
  return `sema_${deviceKey}.py`;
}

export function arduinoFileName(deviceKey: string) {
  return `sema_${deviceKey}.ino`;
}

export function generatePython(p: ScriptParams) {
  const file = pythonFileName(p.deviceKey);
  return String.raw`# Sema · Central de IoT: gemelo digital del dispositivo "${safeName(p.deviceName)}"
# Métrica: ${p.metricKey} (${p.unit}) · device_key: ${p.deviceKey}
#
# Qué hace: imita un sensor y envía una lectura a tu plataforma cada INTERVALO
# segundos. El valor cambia poco a poco, como en un sensor real, dentro de su
# rango típico.
#
# Cómo usarlo:
#   1. Instala Python 3.8 o superior (python.org).
#   2. Instala la librería requests:
#        Windows:        py -m pip install requests
#        Mac / Linux:    python3 -m pip install requests
#   3. Ejecuta este archivo:
#        Windows:        py ${file}
#        Mac / Linux:    python3 ${file}
#   4. Abre el dispositivo en Sema: las lecturas aparecen en vivo.
#   Para detenerlo, presiona Ctrl+C.
#
# IMPORTANTE: este archivo contiene el token secreto de tu dispositivo. No lo
# compartas ni lo subas a GitHub. Si se filtra, regéneralo en Sema y el anterior
# deja de funcionar.
#
# ${limitNote(p.maxPerDay, 60)}

import random
import time

import requests

URL = "${p.url}"
TOKEN = "${p.token}"
METRICA = "${p.metricKey}"
UNIDAD = "${p.unit}"
MINIMO = ${p.min}
MAXIMO = ${p.max}
DECIMALES = ${p.decimals}
INTERVALO = 60  # segundos entre lecturas

valor = (MINIMO + MAXIMO) / 2
paso = (MAXIMO - MINIMO) * 0.05

print(f"Enviando {METRICA} a {URL} cada {INTERVALO} s (Ctrl+C para detener)")

while True:
    # Cambio gradual: sumamos un paso pequeño y no salimos del rango.
    valor += random.uniform(-paso, paso)
    valor = max(MINIMO, min(MAXIMO, valor))
    lectura = round(valor, DECIMALES)

    try:
        respuesta = requests.post(
            URL,
            json={METRICA: lectura},
            headers={"Authorization": f"Bearer {TOKEN}"},
            timeout=10,
        )
        if respuesta.status_code == 201:
            print(f"Enviado: {lectura}{UNIDAD}")
        elif respuesta.status_code == 429:
            print("Límite diario del plan alcanzado:", respuesta.json().get("error"))
        elif respuesta.status_code == 401:
            print("Token inválido. ¿Lo regeneraste? Descarga el script de nuevo.")
            break
        else:
            print("Error", respuesta.status_code, respuesta.text)
    except requests.RequestException as error:
        print("Sin conexión con Sema:", error)

    time.sleep(INTERVALO)
`;
}

export function generateArduino(p: ScriptParams) {
  return String.raw`/*
  Sema · Central de IoT: dispositivo "${safeName(p.deviceName)}"
  Métrica: ${p.metricKey} (${p.unit}) · device_key: ${p.deviceKey}
  Placa: ESP32 (Arduino IDE con el paquete "esp32" de Espressif instalado).

  Qué hace: se conecta a tu WiFi y envía una lectura por HTTPS a Sema cada
  INTERVALO_MS. Por ahora el valor es simulado y cambia poco a poco. Para usar
  un sensor real, cambia la función leerSensor() (hay ejemplos comentados).

  Cómo usarlo:
    1. Cambia WIFI_SSID y WIFI_PASS por los de tu red de 2,4 GHz.
       En el simulador Wokwi (wokwi.com, proyecto ESP32) déjalos como están.
    2. Sube el programa a la placa, o ejecútalo en Wokwi.
    3. Abre el Monitor Serie a 115200 baudios para ver los envíos.
    4. Abre el dispositivo en Sema: las lecturas aparecen en vivo.

  IMPORTANTE: este archivo contiene el token secreto de tu dispositivo. No lo
  compartas ni lo subas a GitHub. Si se filtra, regéneralo en Sema y el anterior
  deja de funcionar.

  ${limitNote(p.maxPerDay, 60)}
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* URL = "${p.url}";
const char* TOKEN = "${p.token}";
const char* METRICA = "${p.metricKey}";
const char* UNIDAD = "${p.unit}";

const float MINIMO = ${p.min};
const float MAXIMO = ${p.max};
const int DECIMALES = ${p.decimals};
const unsigned long INTERVALO_MS = 60000;  // 60 segundos entre lecturas

float valor = (MINIMO + MAXIMO) / 2;

// Aquí se obtiene la lectura. Ahora es una simulación: sumamos un paso pequeño
// y no salimos del rango. Para un sensor real, reemplaza el cuerpo de esta
// función. Ejemplos:
//   return analogRead(34) * (3.3 / 4095.0);   // lectura analógica en voltios
//   return dht.readTemperature();             // sensor DHT22 (librería DHT)
float leerSensor() {
  float paso = (MAXIMO - MINIMO) * 0.05;
  valor += (random(-100, 101) / 100.0) * paso;
  valor = constrain(valor, MINIMO, MAXIMO);
  return valor;
}

void conectarWifi() {
  Serial.print("Conectando a WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" listo");
}

void setup() {
  Serial.begin(115200);
  conectarWifi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    conectarWifi();
  }

  float lectura = leerSensor();
  String cuerpo = String("{\"") + METRICA + "\": " + String(lectura, DECIMALES) + "}";

  // setInsecure() no verifica el certificado del servidor: es lo más simple
  // para aprender. En un producto real se debe fijar el certificado raíz.
  WiFiClientSecure cliente;
  cliente.setInsecure();

  HTTPClient http;
  http.begin(cliente, URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + TOKEN);

  int codigo = http.POST(cuerpo);
  if (codigo == 201) {
    Serial.println("Enviado: " + String(lectura, DECIMALES) + UNIDAD);
  } else if (codigo == 429) {
    Serial.println("Límite diario del plan alcanzado");
  } else if (codigo == 401) {
    Serial.println("Token inválido: ¿lo regeneraste? Descarga el sketch de nuevo");
  } else {
    Serial.println("Error HTTP: " + String(codigo));
  }
  http.end();

  delay(INTERVALO_MS);
}
`;
}

export function generateCurl(p: ScriptParams) {
  const example = Number(((p.min + p.max) / 2).toFixed(p.decimals));
  return String.raw`# Una lectura de prueba. Sirve para comprobar la conexión o para integrar
# cualquier sistema que sepa hacer una petición HTTP.

# Mac / Linux / Git Bash
curl -X POST ${p.url} \
  -H "Authorization: Bearer ${p.token}" \
  -H "Content-Type: application/json" \
  -d '{"${p.metricKey}": ${example}}'

# Windows PowerShell (el JSON se guarda en un archivo porque PowerShell
# rompe las comillas del JSON en la línea de comandos)
Set-Content -Path $env:TEMP\lectura.json -Value '{"${p.metricKey}": ${example}}' -Encoding ascii
curl.exe -X POST ${p.url} -H "Authorization: Bearer ${p.token}" -H "Content-Type: application/json" -d "@$env:TEMP\lectura.json"

# Respuestas: 201 = guardada · 401 = token inválido · 400 = falta el campo
# "${p.metricKey}" · 429 = límite diario del plan alcanzado.
`;
}
