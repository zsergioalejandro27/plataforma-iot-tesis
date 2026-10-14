"use client";

import { useState, type ReactNode } from "react";

type TabId = "lecturas" | "conectar" | "personalizar";

// Pestañas de la pantalla de un dispositivo. Los paneles se pasan ya armados
// desde el servidor (page.tsx); aquí solo se decide cuál se ve. Todos quedan
// montados y los inactivos se ocultan con `hidden`, así el interruptor de
// simulación, el token mostrado, etc. no pierden su estado al cambiar de
// pestaña.
export function DeviceTabs({
  readings,
  connect,
  customize,
  defaultTab = "lecturas",
}: {
  readings: ReactNode;
  connect: ReactNode;
  customize?: ReactNode;
  defaultTab?: TabId;
}) {
  const [active, setActive] = useState<TabId>(defaultTab);

  const tabs: { id: TabId; label: string }[] = [
    { id: "lecturas", label: "Lecturas" },
    { id: "conectar", label: "Conectar" },
    ...(customize ? [{ id: "personalizar" as const, label: "Personalizar" }] : []),
  ];

  return (
    <div>
      <div
        role="tablist"
        className="flex gap-5 border-b border-line px-5"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-brand text-panel-ink"
                : "border-transparent text-muted2 hover:text-panel-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="panel-lecturas"
        role="tabpanel"
        aria-labelledby="tab-lecturas"
        hidden={active !== "lecturas"}
      >
        {readings}
      </div>

      <div
        id="panel-conectar"
        role="tabpanel"
        aria-labelledby="tab-conectar"
        hidden={active !== "conectar"}
      >
        {connect}
      </div>

      {customize && (
        <div
          id="panel-personalizar"
          role="tabpanel"
          aria-labelledby="tab-personalizar"
          hidden={active !== "personalizar"}
        >
          {customize}
        </div>
      )}
    </div>
  );
}
