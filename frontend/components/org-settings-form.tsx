"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hexToRgbTriplet, PALETTE } from "@/lib/palette";

type TimeFormat = "12h" | "24h";

const TIME_OPTIONS: { value: TimeFormat; label: string; example: string }[] = [
  { value: "12h", label: "12 horas", example: "2:38 pm" },
  { value: "24h", label: "24 horas", example: "14:38" },
];

// Solo los colores cuyo texto claro se lee bien encima pueden ser el acento.
const ACCENT_OPTIONS = PALETTE.filter((color) => color.accent);

export function OrgSettingsForm({
  tenantId,
  initialName,
  initialAccent,
  initialTimeFormat,
}: {
  tenantId: string;
  initialName: string;
  initialAccent: string;
  initialTimeFormat: TimeFormat;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [accent, setAccent] = useState(initialAccent);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(initialTimeFormat);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setMessage({ text: "El nombre de la organización no puede estar vacío.", isError: true });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    const supabase = createClient();

    const { error } = await supabase
      .from("tenants")
      .update({ name: cleanName, accent_color: accent, time_format: timeFormat })
      .eq("id", tenantId);

    if (error) {
      setMessage({ text: error.message, isError: true });
    } else {
      setMessage({ text: "Cambios guardados.", isError: false });
      // Vuelve a pedir los datos al servidor: el layout aplica el nuevo
      // acento y el nombre aparece actualizado en todas las pantallas.
      router.refresh();
    }
    setIsSaving(false);
  };

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-6 rounded-lg border border-line bg-white p-5"
    >
      <div className="grid gap-2">
        <Label htmlFor="org-name">Nombre de la organización</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          className="max-w-md"
        />
        <p className="text-xs text-muted2">
          Es el que aparece en el panel y en la pantalla de cada dispositivo.
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Color de acento</Label>
        <div className="flex flex-wrap gap-3">
          {ACCENT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setAccent(option.hex)}
              aria-label={option.label}
              aria-pressed={accent.toLowerCase() === option.hex.toLowerCase()}
              title={option.label}
              className={`h-8 w-8 rounded-full border-2 transition-shadow ${
                accent.toLowerCase() === option.hex.toLowerCase()
                  ? "border-panel-ink ring-2 ring-offset-2 ring-panel-ink/30"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: option.hex }}
            />
          ))}
        </div>
        <p className="text-xs text-muted2">
          Se usa en botones, pestañas y selecciones. El estado de un dispositivo
          (en línea o sin señal) mantiene siempre su propio color.
        </p>
        {/* Vista previa: aplica el color elegido solo a esta caja. */}
        <div
          className="mt-1 flex w-fit items-center gap-3 rounded-md border border-line p-3"
          style={{ "--brand-rgb": hexToRgbTriplet(accent) } as React.CSSProperties}
        >
          <span className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground">
            Botón de ejemplo
          </span>
          <span className="border-b-2 border-brand pb-1 text-xs font-medium text-panel-ink">
            Pestaña activa
          </span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Formato de hora</Label>
        <div className="flex w-fit gap-1 rounded-md border border-line p-1">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTimeFormat(option.value)}
              aria-pressed={timeFormat === option.value}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                timeFormat === option.value
                  ? "bg-brand text-brand-foreground"
                  : "text-muted2 hover:text-panel-ink"
              }`}
            >
              {option.label} ({option.example})
            </button>
          ))}
        </div>
        <p className="text-xs text-muted2">
          Cómo se muestran las horas en las gráficas y en el historial de lecturas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
        {message && (
          <p className={`text-xs ${message.isError ? "text-red-600" : "text-muted2"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
