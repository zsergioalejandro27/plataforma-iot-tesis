"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <div>
          <h1 className="text-2xl font-semibold text-panel-ink">
            Revisa tu correo
          </h1>
          <p className="mt-1 text-sm text-muted2">
            Enviamos las instrucciones para restablecer tu contraseña
          </p>
          <p className="mt-6 text-sm text-muted2">
            Si te registraste con correo y contraseña, recibirás un correo
            con el enlace para crear una nueva contraseña.
          </p>
        </div>
      ) : (
        <div>
          <div>
            <h1 className="text-2xl font-semibold text-panel-ink">
              Restablece tu contraseña
            </h1>
            <p className="mt-1 text-sm text-muted2">
              Escribe tu correo y te enviaremos un enlace para restablecerla
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="mt-6">
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-panel-ink">
                  Correo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@empresa.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-line bg-white text-panel-ink placeholder:text-muted2"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-muted2">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-brand underline underline-offset-4"
              >
                Inicia sesión
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}