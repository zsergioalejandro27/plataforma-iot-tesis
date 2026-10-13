// Identidad visual de Sema. Todo el logo vive aquí para cambiarlo en un solo
// lugar. Los dibujos usan `currentColor`, así que funcionan sobre cualquier fondo.
//
// - SemaMark: la Σ (sigma de σῆμα, "señal") dibujada como un pulso con nodos.
//   Con `animate`, al cargar la página se traza sola (clases .sema-draw y
//   .sema-fade en globals.css; se desactivan con prefers-reduced-motion).
// - SemaLogo: "compact" para las barras, "full" para la landing y el login.

import type { CSSProperties } from "react";

// Los nodos aparecen cuando el trazo llega a ellos. Los retrasos salen de
// la fracción de recorrido (28 / 52 / 76 de ~104 unidades) por 1 s de trazo.
const NODES = [
  { cx: 18, cy: 14, delay: "0.27s" },
  { cx: 34, cy: 32, delay: "0.5s" },
  { cx: 18, cy: 50, delay: "0.73s" },
];

export function SemaMark({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={className}>
      <path
        d="M46 14H18L34 32L18 50H46"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className={animate ? "sema-draw" : undefined}
        style={animate ? ({ "--sema-draw-duration": "1s" } as CSSProperties) : undefined}
      />
      {NODES.map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r="4.5"
          fill="currentColor"
          className={animate ? "sema-fade" : undefined}
          style={animate ? ({ "--sema-fade-delay": node.delay } as CSSProperties) : undefined}
        />
      ))}
    </svg>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.22em" }}
    >
      SEMA
    </span>
  );
}

export function SemaLogo({
  variant = "full",
  className = "",
}: {
  variant?: "compact" | "full";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-2 text-panel-surface ${className}`}
        aria-label="Sema"
      >
        <SemaMark className="h-6 w-6 text-live" />
        <Wordmark className="text-base font-semibold leading-none" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-4 text-panel-surface ${className}`}
      aria-label="Sema · Central de IoT"
    >
      <SemaMark animate className="h-14 w-14 text-live" />
      <span
        className="sema-fade flex flex-col items-start gap-1.5"
        style={{ "--sema-fade-delay": "0.3s" } as CSSProperties}
      >
        <Wordmark className="text-2xl font-semibold leading-none" />
        <span className="font-mono text-xs text-panel-surface/70">
          Central de IoT
        </span>
      </span>
    </span>
  );
}
