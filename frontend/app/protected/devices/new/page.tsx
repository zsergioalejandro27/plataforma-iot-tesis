import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewDeviceForm } from "@/components/new-device-form";

export default async function NewDevicePage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="rounded-lg border border-line bg-white p-6">
      <NewDeviceForm />
    </div>
  );
}
