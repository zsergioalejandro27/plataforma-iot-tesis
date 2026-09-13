export function AuthSidePanel() {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between bg-panel-ink p-10 lg:p-16">
      <div className="font-mono text-sm text-panel-surface/80">
        plataforma-iot
      </div>

      <svg
        viewBox="0 0 400 120"
        className="w-full max-w-md text-live"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="0,60 60,60 80,20 100,100 120,40 140,60 200,60 220,25 240,95 260,45 280,60 400,60" />
      </svg>

      <p className="max-w-sm text-sm leading-relaxed text-panel-surface/90">
        Monitorea dispositivos y datos de tus organizaciones en tiempo real,
        con los datos de cada cliente completamente aislados.
      </p>
    </div>
  );
}