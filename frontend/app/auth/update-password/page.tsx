import { UpdatePasswordForm } from "@/components/update-password-form";
import { AuthSidePanel } from "@/components/auth-side-panel";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full">
      <AuthSidePanel />
      <div className="flex w-full md:w-1/2 lg:w-2/5 items-center justify-center bg-panel-surface p-6 md:p-10">
        <div className="w-full max-w-sm">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}