"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button
      onClick={logout}
      size="sm"
      variant="outline"
      className="border-panel-surface/30 bg-transparent text-panel-surface hover:bg-panel-surface/10 hover:text-panel-surface"
    >
      Cerrar sesión
    </Button>
  );
}