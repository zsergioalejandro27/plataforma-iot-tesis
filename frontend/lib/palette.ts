// Paleta cerrada de colores para personalizar. Es una lista corta y no un
// selector libre para que todo combine con el "Panel de señales" y para que
// el texto claro se lea sobre los colores que se usan de acento.
//
// En la base de datos el color se guarda como hex (#RRGGBB) y un CHECK
// verifica el formato, así ningún texto raro llega a los estilos.

export type PaletteColor = {
  id: string;
  label: string;
  hex: string;
  // true si el texto claro (#F7F6F2) se lee bien encima: solo esos pueden
  // ser el color de acento de la organización (botones, pestañas).
  accent: boolean;
};

export const PALETTE: PaletteColor[] = [
  { id: "pino", label: "Pino", hex: "#2B6E63", accent: true },
  { id: "azul", label: "Azul", hex: "#2F5F9E", accent: true },
  { id: "violeta", label: "Violeta", hex: "#6B4BA1", accent: true },
  { id: "teja", label: "Teja", hex: "#B04A33", accent: true },
  { id: "pizarra", label: "Pizarra", hex: "#4A565C", accent: true },
  { id: "ambar", label: "Ámbar", hex: "#E2A33D", accent: false },
  { id: "turquesa", label: "Turquesa", hex: "#1F8A9E", accent: false },
];

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

// "#2B6E63" -> "43 110 99": el formato que usa la variable CSS --brand-rgb
// (tailwind.config.ts la combina con la transparencia: bg-brand/90, etc.).
export function hexToRgbTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// Color de un dispositivo que no eligió uno: sale del id, así cada uno tiene
// siempre el mismo color sin guardar nada en la base.
export function colorForDevice(deviceId: string, saved: string | null | undefined): string {
  if (isValidHex(saved)) return saved;
  const sum = [...deviceId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length].hex;
}
