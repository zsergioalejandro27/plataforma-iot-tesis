const steps = [
  {
    title: "Dispositivos",
    description: "Sensores o simuladores publican lecturas por MQTT.",
  },
  {
    title: "HiveMQ Cloud",
    description: "Broker MQTT que recibe y distribuye los mensajes.",
  },
  {
    title: "Bridge (Python)",
    description: "Se suscribe al broker y valida a qué organización pertenece cada dato.",
  },
  {
    title: "Supabase",
    description: "Postgres con seguridad a nivel de fila (RLS) y canal de tiempo real.",
  },
  {
    title: "Dashboard",
    description: "Cada organización ve solo sus propios dispositivos, en vivo.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-panel-surface px-5 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-semibold text-panel-ink">
          Cómo funciona
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted2">
          Cada componente es independiente y reemplazable — desde el dispositivo
          hasta el dashboard.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-5 md:gap-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative rounded-lg border border-line bg-white p-4 text-center">
              <p className="font-mono text-xs text-brand">0{index + 1}</p>
              <p className="mt-1 font-medium text-panel-ink">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted2">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-4 z-10 hidden -translate-y-1/2 text-line md:block"
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
