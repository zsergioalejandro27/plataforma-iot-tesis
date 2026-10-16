// Pruebas del motor de reglas de Semita. Se ejecutan con:  npm run test:insights
//
// Cada caso da unas lecturas de entrada y comprueba la observación esperada;
// la tabla que imprime sirve como evidencia de pruebas funcionales. También
// comprueba que los rangos coinciden entre el motor (lib/insights.ts), el
// catálogo (lib/metric-catalog.ts) y el simulador de Python, y que los valores
// atípicos del simulador salen en la proporción prevista.

import { execSync } from "node:child_process";
import {
  buildReport,
  classifyValue,
  onlineWindowMs,
  typicalIntervalMs,
  ZONES,
  type InsightDevice,
  type InsightReading,
} from "../lib/insights.ts";
import { METRIC_CATALOG } from "../lib/metric-catalog.ts";

const NOW = Date.parse("2026-10-16T15:00:00Z");
const MIN = 60 * 1000;

// Lecturas separadas por `intervalMin`, la última hace `endAgoMin` minutos.
function series(values: number[], intervalMin = 60, endAgoMin = 5): InsightReading[] {
  return values.map((value, i) => ({
    value,
    recordedAt: new Date(NOW - (endAgoMin + (values.length - 1 - i) * intervalMin) * MIN).toISOString(),
  }));
}

function device(values: number[], over: Partial<InsightDevice> & { intervalMin?: number; endAgoMin?: number } = {}): InsightDevice {
  const { intervalMin, endAgoMin, ...rest } = over;
  const readings = series(values, intervalMin, endAgoMin);
  return {
    id: "d1",
    name: "Sensor X",
    location: null,
    metricKey: "temperatura",
    unit: "°C",
    readings,
    lastReadingAt: readings.at(-1)?.recordedAt ?? null,
    readingsCount24h: readings.length,
    maxPerDay: 50,
    ...rest,
  };
}

const NORMAL_TEMP = [22, 24, 23, 25, 22.5, 24.5, 23.5, 24];
const report = (...devices: InsightDevice[]) => buildReport(devices, NOW);
const first = (r: ReturnType<typeof report>) => r.insights[0];

type Case = { name: string; expected: string; run: () => string | true };
const cases: Case[] = [];
const add = (name: string, expected: string, run: () => string | true) => cases.push({ name, expected, run });
const expectEq = (got: unknown, want: unknown) => (got === want ? true : `obtuvo ${JSON.stringify(got)}`);

// --- Reglas de rango ------------------------------------------------------
add("Temperatura 24 °C", "normal", () => expectEq(classifyValue("temperatura", 24)?.level, "normal"));
add("Temperatura 33 °C", "atención (alto)", () => {
  const c = classifyValue("temperatura", 33);
  return c?.level === "atencion" && c.side === "high" ? true : `obtuvo ${JSON.stringify(c)}`;
});
add("Temperatura 38 °C", "alerta (alto)", () => expectEq(classifyValue("temperatura", 38)?.level, "alerta"));
add("Temperatura 15 °C", "atención (bajo)", () => {
  const c = classifyValue("temperatura", 15);
  return c?.level === "atencion" && c.side === "low" ? true : `obtuvo ${JSON.stringify(c)}`;
});
add("Temperatura 5 °C", "alerta (bajo)", () => expectEq(classifyValue("temperatura", 5)?.level, "alerta"));
add("Ruido 20 dB (lado bajo sin regla)", "normal", () => expectEq(classifyValue("ruido", 20)?.level, "normal"));
add("Ruido 90 dB", "alerta", () => expectEq(classifyValue("ruido", 90)?.level, "alerta"));
add("Batería 100 % (lado alto sin regla)", "normal", () => expectEq(classifyValue("bateria", 100)?.level, "normal"));
add("Luminosidad 99999 (sin zona)", "sin clasificación", () => expectEq(classifyValue("luminosidad", 99999), null));

// --- Observaciones del asistente -----------------------------------------
add("CO2 1350 ppm en un dispositivo", "observación de atención", () => {
  const r = report(device([700, 800, 750, 900, 850, 950, 800, 1350], { metricKey: "co2", unit: "ppm" }));
  return first(r)?.severity === "atencion" ? true : `obtuvo ${first(r)?.severity}`;
});
add("CO2 1800 ppm", "observación de alerta", () => {
  const r = report(device([700, 800, 750, 900, 850, 950, 800, 1800], { metricKey: "co2", unit: "ppm" }));
  return first(r)?.severity === "alerta" ? true : `obtuvo ${first(r)?.severity}`;
});
add("Batería 22 %", "atención con consejo de carga", () => {
  const r = report(device([60, 55, 50, 45, 40, 35, 28, 22], { metricKey: "bateria", unit: "%" }));
  const i = first(r);
  return i?.severity === "atencion" && i.detail.includes("Cárgala") ? true : `obtuvo ${i?.severity} / ${i?.detail}`;
});
add("Valores normales y regulares", "mensaje «Todo funciona correctamente»", () => {
  const r = report(device(NORMAL_TEMP));
  const i = first(r);
  return r.insights.length === 1 && i.severity === "ok" && i.title === "Todo funciona correctamente" && i.detail.includes("con regularidad")
    ? true
    : `obtuvo ${JSON.stringify(r.insights)}`;
});
add("Luminosidad con cualquier valor", "sin observaciones de rango", () => {
  const r = report(device([10, 900, 30, 800, 20, 950, 40, 990], { metricKey: "luminosidad", unit: "lux" }));
  return r.insights.every((i) => i.severity === "ok") ? true : `obtuvo ${JSON.stringify(r.insights)}`;
});

// --- Comunicación ---------------------------------------------------------
add("Llega cada hora y la última fue hace 5 min", "en línea, sin aviso", () => {
  const r = report(device(NORMAL_TEMP));
  return r.stats.online === 1 && r.insights.every((i) => i.severity === "ok") ? true : `obtuvo ${JSON.stringify(r.stats)}`;
});
add("Llega cada hora y la última fue hace 58 min", "sigue en línea (intervalo habitual)", () => {
  const r = report(device(NORMAL_TEMP, { endAgoMin: 58 }));
  return r.stats.online === 1 ? true : `obtuvo online=${r.stats.online}`;
});
add("Llega cada hora y la última fue hace 5 h", "aviso de sin señal", () => {
  const r = report(device(NORMAL_TEMP, { endAgoMin: 300 }));
  const i = first(r);
  return r.stats.online === 0 && i?.severity === "aviso" && i.title.includes("sin lecturas") ? true : `obtuvo ${JSON.stringify(r.stats)} ${i?.title}`;
});
add("Nunca ha enviado lecturas", "aviso con pista de Conectar", () => {
  const r = report(device([], { lastReadingAt: null }));
  const i = first(r);
  return i?.severity === "aviso" && i.detail.includes("Conectar") ? true : `obtuvo ${JSON.stringify(i)}`;
});
add("Intervalo habitual de 60 s", "ventana en línea de 10 min (mínimo)", () => expectEq(onlineWindowMs(60_000), 10 * MIN));
add("Intervalo habitual de 1 h", "ventana en línea de 2,5 h", () => expectEq(onlineWindowMs(60 * MIN), 150 * MIN));
add("Mediana del intervalo con 8 lecturas cada 60 min", "60 min", () =>
  expectEq(typicalIntervalMs(series(NORMAL_TEMP).map((r) => r.recordedAt)), 60 * MIN));
add("Solo 2 lecturas: no hay intervalo habitual", "null", () =>
  expectEq(typicalIntervalMs(series([1, 2]).map((r) => r.recordedAt)), null));

// --- Cupo diario ----------------------------------------------------------
add("8 de 10 lecturas hoy", "aviso de cupo casi agotado", () => {
  const r = report(device(NORMAL_TEMP, { maxPerDay: 10, readingsCount24h: 8 }));
  return r.insights.some((i) => i.severity === "aviso" && i.title.includes("usó 8 de 10")) ? true : `obtuvo ${JSON.stringify(r.insights)}`;
});
add("10 de 10 lecturas hoy", "aviso: alcanzó el límite (no es una falla)", () => {
  const r = report(device(NORMAL_TEMP, { maxPerDay: 10, readingsCount24h: 10 }));
  return r.insights.some((i) => i.kind === "cupo" && i.severity === "aviso" && i.title.includes("límite diario")) ? true : `obtuvo ${JSON.stringify(r.insights)}`;
});
add("Plan Básico: 3 dispositivos con el cupo agotado", "una sola línea agrupada", () => {
  const r = report(
    device(NORMAL_TEMP, { id: "a", name: "A", maxPerDay: 10, readingsCount24h: 10 }),
    device(NORMAL_TEMP, { id: "b", name: "B", maxPerDay: 10, readingsCount24h: 10 }),
    device(NORMAL_TEMP, { id: "c", name: "C", maxPerDay: 10, readingsCount24h: 10 }),
  );
  const cupo = r.insights.filter((i) => i.kind === "cupo");
  return cupo.length === 1 && cupo[0].title === "3 dispositivos alcanzaron su límite diario" && cupo[0].deviceId === null
    ? true
    : `obtuvo ${JSON.stringify(cupo)}`;
});
add("Cupo agotado pero todo lo demás bien", "igual dice «Todo funciona correctamente»", () => {
  const r = report(device(NORMAL_TEMP, { maxPerDay: 10, readingsCount24h: 10 }));
  return r.insights.some((i) => i.kind === "ok") ? true : `obtuvo ${JSON.stringify(r.insights.map((i) => i.kind))}`;
});
add("Cupo agotado y un valor en alerta", "no dice «Todo funciona correctamente»", () => {
  const r = report(device([22, 23, 24, 22, 23, 24, 22, 38], { maxPerDay: 10, readingsCount24h: 10 }));
  return r.insights.every((i) => i.kind !== "ok") && r.insights[0].severity === "alerta" ? true : `obtuvo ${JSON.stringify(r.insights.map((i) => i.kind))}`;
});
add("3 de 10 lecturas hoy", "sin aviso de cupo", () => {
  const r = report(device(NORMAL_TEMP, { maxPerDay: 10, readingsCount24h: 3 }));
  return r.insights.every((i) => !i.id.includes("cupo")) ? true : `obtuvo ${JSON.stringify(r.insights)}`;
});

// --- Tendencia y cambios bruscos -----------------------------------------
add("Temperatura sube 6 lecturas seguidas (20 a 28)", "aviso de tendencia", () => {
  const r = report(device([23, 24, 20, 21.5, 23, 24.5, 26, 28]));
  return r.insights.some((i) => i.title.includes("sube de forma sostenida")) ? true : `obtuvo ${JSON.stringify(r.insights.map((i) => i.title))}`;
});
add("Temperatura oscila sin tendencia", "sin aviso de tendencia", () => {
  const r = report(device([22, 25, 23, 26, 22, 25, 23, 26]));
  return r.insights.every((i) => !i.title.includes("de forma sostenida")) ? true : "apareció una tendencia";
});
add("Salto de 24 a 29,5 °C tras lecturas estables", "aviso de cambio brusco", () => {
  const r = report(device([24, 24.2, 23.8, 24.1, 23.9, 24, 24.2, 23.8, 24.1, 29.5]));
  return r.insights.some((i) => i.title.includes("cambió de golpe")) ? true : `obtuvo ${JSON.stringify(r.insights.map((i) => i.title))}`;
});

// --- Orden y resumen ------------------------------------------------------
add("Una alerta, una atención y un aviso", "resumen con los tres conteos y alerta primero", () => {
  const alerta = device([22, 23, 24, 22, 23, 24, 22, 38], { id: "a", name: "A" });
  const atencion = device([22, 23, 24, 22, 23, 24, 22, 33], { id: "b", name: "B" });
  const aviso = device(NORMAL_TEMP, { id: "c", name: "C", endAgoMin: 400 });
  const r = report(atencion, aviso, alerta);
  return r.summary.includes("1 alerta, 1 atención y 1 aviso") && r.insights[0].severity === "alerta"
    ? true
    : `obtuvo «${r.summary}» / primero: ${r.insights[0]?.severity}`;
});
add("Sin dispositivos", "mensaje de bienvenida", () => {
  const r = report();
  return r.summary.startsWith("Aún no tienes dispositivos") && r.insights.length === 0 ? true : `obtuvo «${r.summary}»`;
});
add("Un solo dispositivo normal", "«1 dispositivo reporta»", () => {
  const r = report(device(NORMAL_TEMP));
  return r.summary.startsWith("1 de 1 dispositivo reporta con normalidad") ? true : `obtuvo «${r.summary}»`;
});

// --- Coherencia de rangos entre archivos ----------------------------------
for (const [key, zone] of Object.entries(ZONES)) {
  add(`Catálogo y motor coinciden en «${key}»`, `rango ${zone.normalMin} a ${zone.normalMax}`, () => {
    const item = METRIC_CATALOG.find((m) => m.key === key);
    return item && item.min === zone.normalMin && item.max === zone.normalMax
      ? true
      : `catálogo ${item?.min} a ${item?.max}`;
  });
}

// --- Simulador de Python --------------------------------------------------
function python(code: string): unknown | null {
  try {
    const out = execSync(`py -c "${code}"`, { cwd: new URL("../../simulator", import.meta.url), encoding: "utf8" });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

const pyZones = python("import json; from payload_generator import ZONES; print(json.dumps(ZONES))") as
  | Record<string, (number | null)[]>
  | null;
const pySample = python(
  "import json; from payload_generator import generate_payload as g; print(json.dumps([g() for _ in range(4000)]))",
) as Record<string, number>[] | null;
const pyNormal = python(
  "import json; from payload_generator import generate_payload as g; print(json.dumps([g(anomalies=False) for _ in range(1500)]))",
) as Record<string, number>[] | null;

if (pyZones && pySample && pyNormal) {
  add("Las zonas del simulador coinciden con las del motor", "iguales en las 8 métricas", () => {
    for (const [key, zone] of Object.entries(ZONES)) {
      const py = pyZones[key];
      const ts = [zone.normalMin, zone.normalMax, zone.alertLow, zone.alertHigh];
      if (!py || ts.some((v, i) => v !== py[i])) return `difiere en ${key}: py=${JSON.stringify(py)} ts=${JSON.stringify(ts)}`;
    }
    return true;
  });
  add("Simulador sin atípicos (1500 lecturas)", "todas las métricas en zona normal", () => {
    for (const payload of pyNormal) {
      for (const key of Object.keys(ZONES)) {
        if (classifyValue(key, payload[key])?.level !== "normal") return `${key}=${payload[key]} fuera de zona`;
      }
    }
    return true;
  });
  add("Simulador con atípicos (4000 lecturas)", "entre 5 % y 11 % fuera de zona por métrica", () => {
    for (const key of Object.keys(ZONES)) {
      const outside = pySample.filter((p) => classifyValue(key, p[key])?.level !== "normal").length / pySample.length;
      if (outside < 0.05 || outside > 0.11) return `${key}: ${(outside * 100).toFixed(1)} %`;
    }
    return true;
  });
  add("Atípicos del simulador: pocas alertas", "menos del 35 % de los atípicos son alerta", () => {
    let atencion = 0;
    let alerta = 0;
    for (const p of pySample) {
      for (const key of Object.keys(ZONES)) {
        const level = classifyValue(key, p[key])?.level;
        if (level === "atencion") atencion += 1;
        if (level === "alerta") alerta += 1;
      }
    }
    const share = alerta / (alerta + atencion);
    return share < 0.35 ? true : `${(share * 100).toFixed(1)} % de alertas`;
  });
} else {
  console.log("AVISO: no se pudo ejecutar Python (comando `py`); se omiten las pruebas del simulador.\n");
}

// --- Resultado ------------------------------------------------------------
let failed = 0;
console.log(`Pruebas del motor de reglas de Semita (${cases.length} casos)\n`);
cases.forEach((c, i) => {
  const result = c.run();
  const ok = result === true;
  if (!ok) failed += 1;
  console.log(`${ok ? "OK    " : "FALLA "} ${String(i + 1).padStart(2)}. ${c.name}  →  esperado: ${c.expected}${ok ? "" : `  |  ${result}`}`);
});
console.log(`\n${cases.length - failed} de ${cases.length} casos correctos.`);
process.exit(failed ? 1 : 0);
