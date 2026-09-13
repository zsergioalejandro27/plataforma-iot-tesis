"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
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
          Inicia sesión
        </h1>
        <p className="mt-1 text-sm text-muted2">
          Accede al panel de tu organización
        </p>
      </div>

      <form onSubmit={handleLogin}>
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
              className="border-line bg-white text-panel-ink placeholder:text-muted2"            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password" className="text-panel-ink">
                Contraseña
              </Label>
              <Link
                href="/auth/forgot-password"
                className="ml-auto text-sm text-brand underline-offset-4 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-line bg-white text-panel-ink placeholder:text-muted2"            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={isLoading}
          >
            {isLoading ? "Ingresando..." : "Entrar"}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm text-muted2">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/auth/sign-up"
            className="text-brand underline underline-offset-4"
          >
            Regístrate
          </Link>
        </div>
      </form>
    </div>
  );
}