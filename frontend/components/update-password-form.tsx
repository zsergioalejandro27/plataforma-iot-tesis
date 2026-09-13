"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-semibold text-panel-ink">
          Restablece tu contraseña
        </h1>
        <p className="mt-1 text-sm text-muted2">
          Escribe tu nueva contraseña a continuación
        </p>
      </div>

      <form onSubmit={handleForgotPassword}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-panel-ink">
              Nueva contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Nueva contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-line bg-white text-panel-ink placeholder:text-muted2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
          </Button>
        </div>
      </form>
    </div>
  );
}