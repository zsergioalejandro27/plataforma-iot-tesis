"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
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
          Crea tu cuenta
        </h1>
        <p className="mt-1 text-sm text-muted2">
          Empieza a monitorear tus dispositivos en minutos
        </p>
      </div>

      <form onSubmit={handleSignUp}>
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
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-panel-ink">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-line bg-white text-panel-ink placeholder:text-muted2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repeat-password" className="text-panel-ink">
              Repite la contraseña
            </Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="border-line bg-white text-panel-ink placeholder:text-muted2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={isLoading}
          >
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
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
  );
}