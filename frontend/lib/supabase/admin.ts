import { createClient } from "@supabase/supabase-js";

// Cliente con la llave de servicio (service_role): se salta RLS, igual que el
// bridge. SOLO debe importarse desde código de servidor (rutas /api, Server
// Components), nunca desde un componente "use client": la llave no tiene el
// prefijo NEXT_PUBLIC_, así que Next nunca la envía al navegador.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
