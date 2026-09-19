"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeleteDeviceButton({
  deviceId,
  deviceName,
}: {
  deviceId: string;
  deviceName: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${deviceName}"? Esto también borra todo su historial de lecturas y no se puede deshacer.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.from("devices").delete().eq("id", deviceId);

    if (error) {
      setError(error.message);
      setIsDeleting(false);
      return;
    }

    window.location.href = "/protected";
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? "Eliminando..." : "Eliminar dispositivo"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
