"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PALETTE } from "@/lib/palette";

// Pestaña "Personalizar" de un dispositivo. Escribe directo en `devices`: los
// usuarios solo tienen permiso de UPDATE sobre estas columnas (name, color,
// location, chart_type), no sobre api_token ni device_key.
export function DeviceCustomize({
  deviceId,
  initialName,
  initialLocation,
  initialColor,
}: {
  deviceId: string;
  initialName: string;
  initialLocation: string | null;
  // Color efectivo: el guardado o, si no eligió, el que sale del id.
  initialColor: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation ?? "");
  const [color, setColor] = useState(initialColor);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setMessage({ text: "El nombre no puede estar vacío.", isError: true });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    const supabase = createClient();

    const { error } = await supabase
      .from("devices")
      .update({
        name: cleanName,
        location: location.trim() || null,
        color,
      })
      .eq("id", deviceId);

    if (error) {
      setMessage({ text: error.message, isError: true });
    } else {
      setMessage({ text: "Cambios guardados.", isError: false });
      // Vuelve a pedir los datos al servidor para que el título, la gráfica
      // y el dashboard muestren lo nuevo.
      router.refresh();
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-sm font-semibold text-panel-ink">Personalizar este dispositivo</h2>
        <p className="text-xs text-muted2">
          Ponle el nombre, el color y la ubicación que quieras. Solo se ven en tu
          organización.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="device-name">Nombre</Label>
          <Input
            id="device-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="device-location">Ubicación o etiqueta (opcional)</Label>
          <Input
            id="device-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={40}
            placeholder="Ej. Cocina, Bodega, Invernadero"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Color del dispositivo</Label>
        <div className="flex flex-wrap gap-3">
          {PALETTE.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setColor(option.hex)}
              aria-label={option.label}
              aria-pressed={color.toLowerCase() === option.hex.toLowerCase()}
              title={option.label}
              className={`h-8 w-8 rounded-full border-2 transition-shadow ${
                color.toLowerCase() === option.hex.toLowerCase()
                  ? "border-panel-ink ring-2 ring-offset-2 ring-panel-ink/30"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: option.hex }}
            />
          ))}
        </div>
        <p className="text-xs text-muted2">
          Se usa en la gráfica de este dispositivo y en su punto de color del
          panel. El estado (en línea o sin señal) no cambia de color.
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

      <p className="text-xs text-muted2">
        La gráfica que prefieras (línea, barras o puntos) se recuerda sola cuando la
        eliges en Lecturas.
      </p>
    </form>
  );
}
