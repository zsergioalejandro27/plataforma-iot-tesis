// Icono de Semita, el asistente de Sema: la mitad inferior de la Σ del logo
// (línea de base y diagonal casi vertical) terminada en un punto, como una
// persona sencilla. Usa currentColor.
export function SemitaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={className}>
      <path
        d="M46 50H20L27 32"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29.5" cy="22" r="6" fill="currentColor" />
    </svg>
  );
}
