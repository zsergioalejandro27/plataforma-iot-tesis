import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <div className="ml-auto flex items-center gap-4">
      {/* El correo se oculta en pantallas pequeñas por falta de espacio. */}
      <span className="hidden max-w-[16rem] truncate text-sm text-panel-surface/80 sm:inline">
        {user.email}
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button
        asChild
        size="sm"
        variant="outline"
        className="border-panel-surface/30 bg-transparent text-panel-surface hover:bg-panel-surface/10 hover:text-panel-surface"
      >
        <Link href="/auth/login">Iniciar sesión</Link>
      </Button>
      <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
        <Link href="/auth/sign-up">Registrarse</Link>
      </Button>
    </div>
  );
}