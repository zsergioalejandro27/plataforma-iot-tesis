// Motor de reglas de Semita, el asistente de Sema.
//
// No es inteligencia artificial: son reglas fijas y explicables que miran las
// últimas lecturas de cada dispositivo y generan observaciones en español. Las
// mismas lecturas siempre producen el mismo resultado, y por eso se pueden
// probar con una tabla de casos (tests/insights.test.mts).
//
// Este archivo no importa nada a propósito: así se puede ejecutar fuera de
// Next.js (npm run test:insights). Las zonas de ZONES deben coincidir con los
// rangos normales de lib/metric-catalog.ts y de simulator/payload_generator.py;
// el test lo comprueba.

export type Severity = "alerta" | "atencion" | "aviso" | "ok";

export type Insight = {
  id: string;
  // Tipo de regla que lo generó. El cupo diario es informativo: no impide el
  // mensaje de "todo funciona correctamente".
  kind: "cupo" | "sin-lecturas" | "sin-senal" | "rango" | "cambio-brusco" | "tendencia" | "ok";
  severity: Severity;
  deviceId: string | null;
  title: string;
  detail: string;
};

export type InsightReading = { value: number; recordedAt: string };

export type InsightDevice = {
  id: string;
  name: string;
  location: string | null;
  metricKey: string | null;
  unit: string | null;
  // Lecturas de las últimas 24 h, de la más antigua a la más reciente.
  readings: InsightReading[];
  // Fecha de la última lectura que existe, aunque tenga más de 24 h.
  lastReadingAt: string | null;
  // Cuántas lecturas recibió en las últimas 24 h (cuentan para el cupo del plan,
  // incluso si alguna no traía un valor numérico utilizable).
  readingsCount24h: number;
  maxPerDay: number | null;
};

export type AssistantReport = {
  summary: string;
  insights: Insight[];
  stats: {
    total: number;
    online: number;
    alertas: number;
    atenciones: number;
    avisos: number;
  };
};

// ---------------------------------------------------------------------------
// Zonas de referencia por métrica
// ---------------------------------------------------------------------------
// Son valores ORIENTATIVOS y ajustables, no normas de seguridad.
//   normalMin..normalMax  zona normal
//   alertLow / alertHigh  límite a partir del cual pasa de "atención" a "alerta";
//                         null = ese lado no tiene regla (ej. el ruido bajo no
//                         es un problema).
// Luminosidad y voltaje no tienen zona porque dependen demasiado del contexto.

export type Zone = {
  label: string;
  normalMin: number;
  normalMax: number;
  alertLow: number | null;
  alertHigh: number | null;
};

export const ZONES: Record<string, Zone> = {
  temperatura: { label: "Temperatura", normalMin: 18, normalMax: 30, alertLow: 10, alertHigh: 35 },
  humedad: { label: "Humedad", normalMin: 30, normalMax: 70, alertLow: 20, alertHigh: 85 },
  presion: { label: "Presión atmosférica", normalMin: 990, normalMax: 1030, alertLow: 970, alertHigh: 1050 },
  nivel: { label: "Nivel", normalMin: 20, normalMax: 90, alertLow: 10, alertHigh: 97 },
  ruido: { label: "Ruido", normalMin: 30, normalMax: 70, alertLow: null, alertHigh: 85 },
  co2: { label: "Calidad del aire (CO2)", normalMin: 400, normalMax: 1000, alertLow: null, alertHigh: 1500 },
  viento: { label: "Velocidad del viento", normalMin: 0, normalMax: 12, alertLow: null, alertHigh: 17 },
  bateria: { label: "Batería", normalMin: 30, normalMax: 100, alertLow: 15, alertHigh: null },
};

const HINTS: Record<string, { high?: string; low?: string }> = {
  temperatura: {
    high: "Revisa la ventilación o la fuente de calor.",
    low: "Revisa si algo la está enfriando de más.",
  },
  humedad: { high: "Conviene ventilar.", low: "El ambiente está muy seco." },
  nivel: { high: "Revisa que no se desborde.", low: "Puede que haya que rellenar." },
  ruido: { high: "Una exposición larga a este nivel puede ser molesta o dañina." },
  co2: { high: "Conviene ventilar." },
  viento: { high: "Viento fuerte: revisa lo que esté expuesto." },
  bateria: { low: "Cárgala o cámbiala pronto." },
};

export type Level = "normal" | "atencion" | "alerta";

export function classifyValue(
  metricKey: string,
  value: number,
): { level: Level; side: "low" | "high" | null } | null {
  const zone = ZONES[metricKey];
  if (!zone) return null;

  if (zone.alertHigh !== null && value > zone.normalMax) {
    return { level: value > zone.alertHigh ? "alerta" : "atencion", side: "high" };
  }
  if (zone.alertLow !== null && value < zone.normalMin) {
    return { level: value < zone.alertLow ? "alerta" : "atencion", side: "low" };
  }
  return { level: "normal", side: null };
}

// ---------------------------------------------------------------------------
// Tiempos: intervalo habitual y estado "en línea"
// ---------------------------------------------------------------------------

const MIN_ONLINE_WINDOW_MS = 10 * 60 * 1000;

// Mediana del tiempo entre las últimas lecturas (null si hay muy pocas).
export function typicalIntervalMs(times: string[]): number | null {
  const stamps = times.slice(-13).map((t) => Date.parse(t));
  const diffs: number[] = [];
  for (let i = 1; i < stamps.length; i++) {
    const diff = stamps[i] - stamps[i - 1];
    if (diff > 0) diffs.push(diff);
  }
  if (diffs.length < 2) return null;
  diffs.sort((a, b) => a - b);
  const mid = Math.floor(diffs.length / 2);
  return diffs.length % 2 ? diffs[mid] : (diffs[mid - 1] + diffs[mid]) / 2;
}

// Un dispositivo está "en línea" si su última lectura es más reciente que 2,5
// veces su intervalo habitual (y como mínimo 10 minutos). Así uno que publica
// cada hora no figura "sin señal" a los 58 minutos.
export function onlineWindowMs(typicalMs: number | null): number {
  return typicalMs === null
    ? MIN_ONLINE_WINDOW_MS
    : Math.max(typicalMs * 2.5, MIN_ONLINE_WINDOW_MS);
}

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

function withUnit(n: number, unit: string | null): string {
  return unit ? `${fmt(n)} ${unit}` : fmt(n);
}

function elapsed(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} días`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

function deviceTitle(d: InsightDevice): string {
  return d.location?.trim() ? `${d.name} · ${d.location.trim()}` : d.name;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

// ---------------------------------------------------------------------------
// Reglas
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<Severity, number> = { alerta: 0, atencion: 1, aviso: 2, ok: 3 };

export function buildReport(devices: InsightDevice[], now: number = Date.now()): AssistantReport {
  const insights: Insight[] = [];
  let online = 0;
  let regularCandidates = 0;
  let regularCount = 0;
  const quotaFull: { device: InsightDevice; used: number }[] = [];
  const quotaNear: { device: InsightDevice; used: number }[] = [];

  for (const d of devices) {
    const title = deviceTitle(d);
    const lastAt = d.lastReadingAt ?? d.readings.at(-1)?.recordedAt ?? null;

    // Regla: dispositivo que nunca ha enviado nada.
    if (!lastAt) {
      insights.push({
        id: `${d.id}-sin-lecturas`,
        kind: "sin-lecturas",
        severity: "aviso",
        deviceId: d.id,
        title: `${d.name}: aún no ha enviado lecturas`,
        detail: "Cuando envíe la primera aparecerá aquí. En la pestaña Conectar tienes los scripts.",
      });
      continue;
    }

    const typical = typicalIntervalMs(d.readings.map((r) => r.recordedAt));
    const sinceLast = now - Date.parse(lastAt);
    const isOnline = sinceLast < onlineWindowMs(typical);
    if (isOnline) online += 1;

    // Regla: cupo diario (aplica esté o no en línea). Se acumula para mostrarlo
    // agrupado al final: en un plan chico es lo normal, no una falla.
    if (d.maxPerDay) {
      const used = d.readingsCount24h;
      if (used >= d.maxPerDay) quotaFull.push({ device: d, used });
      else if (used >= d.maxPerDay * 0.8) quotaNear.push({ device: d, used });
    }

    // Regla: sin señal. No se evalúan reglas de valor sobre una lectura vieja.
    if (!isOnline) {
      insights.push({
        id: `${d.id}-sin-senal`,
        kind: "sin-senal",
        severity: "aviso",
        deviceId: d.id,
        title: `${title}: sin lecturas hace ${elapsed(sinceLast)}`,
        detail: typical
          ? `Lo habitual es una lectura cada ${elapsed(typical)}. Revisa si el script o el sensor siguen enviando.`
          : "Revisa si el script o el sensor siguen enviando datos.",
      });
      continue;
    }

    // Regularidad de las comunicaciones (para el mensaje de "todo en orden").
    if (d.readings.length >= 5) {
      const stamps = d.readings.slice(-13).map((r) => Date.parse(r.recordedAt));
      const gaps = stamps.slice(1).map((t, i) => t - stamps[i]).filter((g) => g > 0);
      if (gaps.length >= 4) {
        regularCandidates += 1;
        if (stdDev(gaps) / mean(gaps) < 0.5) regularCount += 1;
      }
    }

    const zone = d.metricKey ? ZONES[d.metricKey] : undefined;
    const last = d.readings.at(-1);
    if (!d.metricKey || !zone || !last) continue;

    // Regla: fuera de rango.
    const result = classifyValue(d.metricKey, last.value);
    let flaggedRange = false;
    if (result && result.level !== "normal" && result.side) {
      flaggedRange = true;
      const high = result.side === "high";
      const limit = high ? zone.alertHigh : zone.alertLow;
      const bound = high ? zone.normalMax : zone.normalMin;
      const hint = HINTS[d.metricKey]?.[result.side] ?? "";
      const where = high ? "por encima" : "por debajo";
      const detail =
        result.level === "alerta"
          ? `${zone.label} muy ${where} del límite de referencia (${withUnit(limit as number, d.unit)}). ${hint}`
          : `${zone.label} ${where} del rango normal (${high ? "hasta" : "desde"} ${withUnit(bound, d.unit)}). ${hint}`;
      insights.push({
        id: `${d.id}-rango`,
        kind: "rango",
        severity: result.level,
        deviceId: d.id,
        title: `${title}: ${withUnit(last.value, d.unit)}`,
        detail: detail.trim(),
      });
    }

    const width = zone.normalMax - zone.normalMin;

    // Regla: cambio brusco respecto a las lecturas anteriores.
    if (!flaggedRange && d.readings.length >= 7) {
      const previous = d.readings.slice(-13, -1).map((r) => r.value);
      const avg = mean(previous);
      const spread = stdDev(previous);
      const jump = Math.abs(last.value - avg);
      if (jump > Math.max(3 * spread, 0.25 * width)) {
        insights.push({
          id: `${d.id}-cambio-brusco`,
          kind: "cambio-brusco",
          severity: "aviso",
          deviceId: d.id,
          title: `${title}: cambió de golpe`,
          detail: `Llegó ${withUnit(last.value, d.unit)} cuando lo habitual era cerca de ${withUnit(avg, d.unit)}.`,
        });
        flaggedRange = true;
      }
    }

    // Regla: tendencia sostenida en las últimas 6 lecturas.
    if (!flaggedRange && d.readings.length >= 6) {
      const recent = d.readings.slice(-6).map((r) => r.value);
      const diffs = recent.slice(1).map((v, i) => v - recent[i]);
      const rising = diffs.every((x) => x > 0);
      const falling = diffs.every((x) => x < 0);
      const change = Math.abs(recent[recent.length - 1] - recent[0]);
      if ((rising || falling) && change >= 0.4 * width) {
        insights.push({
          id: `${d.id}-tendencia`,
          kind: "tendencia",
          severity: "aviso",
          deviceId: d.id,
          title: `${title}: ${zone.label.toLowerCase()} ${rising ? "sube" : "baja"} de forma sostenida`,
          detail: `Pasó de ${withUnit(recent[0], d.unit)} a ${withUnit(recent[recent.length - 1], d.unit)} en las últimas 6 lecturas.`,
        });
      }
    }
  }

  // Cupo diario agrupado: una línea por situación, no una por dispositivo.
  const quotaInsight = (
    list: { device: InsightDevice; used: number }[],
    full: boolean,
  ): Insight | null => {
    if (list.length === 0) return null;
    const max = list[0].device.maxPerDay as number;
    if (list.length === 1) {
      const { device, used } = list[0];
      return {
        id: `${device.id}-cupo-${full ? "agotado" : "casi"}`,
        kind: "cupo",
        severity: "aviso",
        deviceId: device.id,
        title: full
          ? `${deviceTitle(device)}: alcanzó su límite diario`
          : `${deviceTitle(device)}: usó ${used} de ${max} lecturas hoy`,
        detail: full
          ? `Recibió ${used} de ${max} lecturas permitidas por tu plan; volverá a recibir cuando pasen 24 h desde las más antiguas.`
          : "Está cerca del límite diario de tu plan.",
      };
    }
    return {
      id: `cupo-${full ? "agotado" : "casi"}`,
      kind: "cupo",
      severity: "aviso",
      deviceId: null,
      title: full
        ? `${list.length} dispositivos alcanzaron su límite diario`
        : `${list.length} dispositivos están cerca de su límite diario`,
      detail: `${list.map((x) => x.device.name).join(", ")}. Tu plan permite ${max} lecturas diarias por dispositivo${
        full ? "; volverán a recibir cuando pasen 24 h desde las más antiguas." : "."
      }`,
    };
  };
  for (const item of [quotaInsight(quotaFull, true), quotaInsight(quotaNear, false)]) {
    if (item) insights.push(item);
  }

  const total = devices.length;
  const alertas = insights.filter((i) => i.severity === "alerta").length;
  const atenciones = insights.filter((i) => i.severity === "atencion").length;
  const avisos = insights.filter((i) => i.severity === "aviso").length;

  // Regla positiva: todo en orden.
  if (total > 0 && online === total && insights.every((i) => i.kind === "cupo")) {
    const regular = regularCandidates > 0 && regularCount === regularCandidates;
    insights.push({
      id: "todo-en-orden",
      kind: "ok",
      severity: "ok",
      deviceId: null,
      title: "Todo funciona correctamente",
      detail: `${online} de ${total} ${total === 1 ? "dispositivo reporta" : "dispositivos reportan"} con normalidad${
        regular ? " y las lecturas llegan con regularidad" : ""
      }. No hay valores fuera de rango.`,
    });
  }

  insights.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.title.localeCompare(b.title, "es"),
  );

  let summary: string;
  if (total === 0) {
    summary = "Aún no tienes dispositivos. Cuando registres el primero, aquí te cuento cómo va.";
  } else {
    const parts: string[] = [];
    if (alertas) parts.push(plural(alertas, "alerta", "alertas"));
    if (atenciones) parts.push(plural(atenciones, "atención", "atenciones"));
    if (avisos) parts.push(plural(avisos, "aviso", "avisos"));
    const base = `${online} de ${total} ${total === 1 ? "dispositivo reporta" : "dispositivos reportan"} con normalidad.`;
    summary = parts.length ? `${base} Tengo ${joinList(parts)} para que revises.` : base;
  }

  return { summary, insights, stats: { total, online, alertas, atenciones, avisos } };
}
