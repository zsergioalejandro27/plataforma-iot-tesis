"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { METRIC_CATALOG } from "@/lib/metric-catalog";
import {
  arduinoFileName,
  generateArduino,
  generateCurl,
  generatePython,
  pythonFileName,
  type ScriptParams,
} from "@/lib/device-scripts";

type Tab = "python" | "arduino" | "curl";

const TABS: { id: Tab; label: string }[] = [
  { id: "python", label: "Python (gemelo digital)" },
  { id: "arduino", label: "Arduino / ESP32" },
  { id: "curl", label: "cURL" },
];

const STEPS: Record<Tab, string[]> = {
  python: [
    "Descarga el archivo. Al inicio trae las instrucciones para instalar Python y la librería requests.",
    "Ejecútalo en tu computador, por ejemplo con py sema_tu-dispositivo.py (en Windows).",
    "Mira las lecturas llegar en el dashboard (se actualiza en vivo) o recarga esta página.",
  ],
  arduino: [
    "Abre el Arduino IDE con el paquete esp32 instalado, o crea un proyecto ESP32 en wokwi.com.",
    "Pega el código. En Wokwi deja WIFI_SSID como está; en una placa real pon los datos de tu WiFi de 2,4 GHz.",
    "Abre el Monitor Serie a 115200 baudios para ver los envíos y mira las lecturas en el dashboard.",
  ],
  curl: [
    "Copia el comando que corresponde a tu sistema y pégalo en una terminal.",
    "Si responde 201, la lectura quedó guardada. Sirve para conectar cualquier otro sistema.",
  ],
};

const MASKED_TOKEN = "••••••••••••••••••••••••";

// Frecuencia del publicador automático de AWS (PUBLISH_INTERVAL_SECONDS en su
// servicio systemd; hoy 3600 s). Si se cambia allá, actualizar este texto.
const CLOUD_SIM_EVERY = "cada hora";

export function DeviceConnect({
  deviceId,
  deviceName,
  deviceKey,
  metricKey,
  unit,
  initialToken,
  initialCloudSimulation,
  maxPerDay,
  justCreated,
}: {
  deviceId: string;
  deviceName: string;
  deviceKey: string;
  metricKey: string | null;
  unit: string | null;
  initialToken: string;
  initialCloudSimulation: boolean;
  maxPerDay: number | null;
  justCreated: boolean;
}) {
  const [open, setOpen] = useState(justCreated);
  const [cloudSimulation, setCloudSimulation] = useState(initialCloudSimulation);
  const [isSavingSimulation, setIsSavingSimulation] = useState(false);
  // Aviso propio del interruptor: va en su sección, que siempre está visible.
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("python");
  const [token, setToken] = useState(initialToken);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // La dirección del sitio se lee en el navegador, así el script apunta a
  // producción cuando se abre desde Vercel (y a localhost en desarrollo).
  // Se hace en un efecto para no desajustar la hidratación.
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const metric = METRIC_CATALOG.find((m) => m.key === metricKey);
  const buildParams = (tokenValue: string): ScriptParams | null =>
    origin === null
      ? null
      : {
          deviceName,
          deviceKey,
          metricKey: metric?.key ?? metricKey ?? "valor",
          unit: metric?.unit ?? unit ?? "",
          min: metric?.min ?? 0,
          max: metric?.max ?? 100,
          decimals: metric?.decimals ?? 1,
          url: `${origin}/api/ingest`,
          token: tokenValue,
          maxPerDay,
        };

  const generate = (params: ScriptParams) =>
    tab === "python"
      ? generatePython(params)
      : tab === "arduino"
        ? generateArduino(params)
        : generateCurl(params);

  // Lo que se muestra oculta el token mientras no se pida verlo; lo que se
  // copia o descarga siempre lleva el token real.
  const realParams = buildParams(token);
  const previewParams = buildParams(showToken ? token : MASKED_TOKEN);
  const realCode = realParams ? generate(realParams) : "";
  const previewCode = previewParams ? generate(previewParams) : "";

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("No se pudo copiar. Selecciona el texto y cópialo manualmente.");
    }
  };

  const download = () => {
    const fileName = tab === "python" ? pythonFileName(deviceKey) : arduinoFileName(deviceKey);
    const blob = new Blob([realCode], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const toggleCloudSimulation = async () => {
    const next = !cloudSimulation;
    setCloudSimulation(next);
    setIsSavingSimulation(true);
    setSimulationError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("set_cloud_simulation", {
      p_device_id: deviceId,
      p_enabled: next,
    });

    if (rpcError) {
      // Si el servidor no lo guardó, el interruptor vuelve a su estado real.
      setCloudSimulation(!next);
      setSimulationError(rpcError.message);
    }
    setIsSavingSimulation(false);
  };

  const regenerate = async () => {
    const confirmed = window.confirm(
      "¿Regenerar el token? El token actual deja de funcionar de inmediato: los scripts que ya descargaste recibirán un error 401 y tendrás que descargarlos de nuevo.",
    );
    if (!confirmed) return;

    setIsRegenerating(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("regenerate_device_token", {
      p_device_id: deviceId,
    });

    if (rpcError || typeof data !== "string") {
      setError(rpcError?.message ?? "No se pudo regenerar el token");
    } else {
      setToken(data);
      setShowToken(true);
    }
    setIsRegenerating(false);
  };

  return (
    <>
      {/* Sección 1: simulación en la nube. Va aparte y arriba para que no
          parta en dos el panel de conexión cuando se despliega. */}
      <div className="border-b border-line p-5">
        <div className="flex flex-col gap-3 rounded-md border border-line p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="text-xs text-muted2">
            <p className="text-sm font-medium text-panel-ink">Simulación en la nube</p>
            <p className="mt-1">
              Sema incluye una simulación propia: {CLOUD_SIM_EVERY} envía a este
              dispositivo una lectura de ejemplo, sin que tengas que hacer nada,
              para que veas la plataforma funcionando. Cada dispositivo tiene un
              cupo diario de lecturas según tu plan
              {maxPerDay ? ` (el tuyo permite ${maxPerDay} al día)` : ""}, y la
              simulación comparte ese cupo con tus propios scripts o sensores.
            </p>
            <p className="mt-1">
              Déjala activada para explorar sin escribir código. Desactívala
              cuando quieras que este dispositivo reciba únicamente tus datos: así
              no se mezclan y conservas todo el cupo. El cambio se aplica en la
              siguiente ronda de la simulación.
            </p>
            {simulationError && (
              <p className="mt-2 text-red-600">{simulationError}</p>
            )}
          </div>
          {/* En celular el interruptor va arriba del texto, en una fila. */}
          <div className="order-first flex shrink-0 flex-row items-center gap-2 sm:order-none sm:flex-col sm:gap-1">
            <button
              type="button"
              role="switch"
              aria-checked={cloudSimulation}
              aria-label="Simulación en la nube"
              onClick={toggleCloudSimulation}
              disabled={isSavingSimulation}
              className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${
                cloudSimulation ? "bg-brand" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  cloudSimulation ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-xs text-muted2">
              {cloudSimulation ? "Activada" : "Desactivada"}
            </span>
          </div>
        </div>
      </div>

      {/* Sección 2: conectar el dispositivo (scripts, token). */}
      <div className="border-b border-line p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-panel-ink">
            Conectar este dispositivo
          </h2>
          <p className="text-xs text-muted2">
            Descarga un script para simularlo desde tu computador o conecta un
            sensor real.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? "Ocultar" : "Conectar / simular"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          {justCreated && (
            <div className="rounded-md bg-brand/10 p-3 text-sm">
              <p className="font-medium text-panel-ink">¡Dispositivo creado!</p>
              <p className="mt-1 text-muted2">
                Para que empiece a enviar lecturas, descarga uno de los scripts
                de abajo y ejecútalo.
              </p>
            </div>
          )}

          <div className="grid gap-3 rounded-md border border-line p-3 text-xs">
            <div>
              <p className="text-muted2">URL de envío</p>
              <p className="mt-1 break-all font-mono text-panel-ink">
                {origin ? `${origin}/api/ingest` : "…"}
              </p>
            </div>
            <div>
              <p className="text-muted2">Token secreto de este dispositivo</p>
              <p className="mt-1 break-all font-mono text-panel-ink">
                {showToken ? token : MASKED_TOKEN}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => setShowToken((value) => !value)}
                >
                  {showToken ? "Ocultar" : "Mostrar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => copy("token", token)}
                >
                  {copied === "token" ? "Copiado" : "Copiar token"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={regenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? "Regenerando..." : "Regenerar token"}
                </Button>
              </div>
              <p className="mt-2 text-muted2">
                No lo compartas: quien lo tenga puede enviar lecturas a este
                dispositivo.
              </p>
            </div>
          </div>

          <div className="flex w-fit flex-wrap gap-1 rounded-md border border-line p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  tab === item.id
                    ? "bg-brand text-brand-foreground"
                    : "text-muted2 hover:text-panel-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted2">
            {STEPS[tab].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <pre className="max-h-72 overflow-auto rounded-md bg-panel-ink p-4 font-mono text-xs leading-relaxed text-panel-surface">
            {previewCode || "Generando..."}
          </pre>

          <div className="flex flex-wrap gap-2">
            {tab !== "curl" && (
              <Button
                size="sm"
                className="bg-brand text-brand-foreground hover:bg-brand/90"
                onClick={download}
                disabled={!realCode}
              >
                Descargar {tab === "python" ? ".py" : ".ino"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => copy("code", realCode)}
              disabled={!realCode}
            >
              {copied === "code" ? "Copiado" : "Copiar código"}
            </Button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
      </div>
    </>
  );
}
