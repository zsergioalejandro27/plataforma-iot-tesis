import Link from "next/link";
import { SemaLogo } from "@/components/sema-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-panel-surface p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center rounded-lg bg-panel-ink p-5">
          <SemaLogo />
        </div>
        <Card className="border-line bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-panel-ink">
              ¡Gracias por registrarte!
            </CardTitle>
            <CardDescription className="text-muted2">
              Revisa tu correo para confirmar tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted2">
              Tu cuenta se creó. Te enviamos un correo con un enlace de
              confirmación: ábrelo antes de iniciar sesión. Si no lo ves en unos
              minutos, mira también la carpeta de spam.
            </p>
            <Link
              href="/auth/login"
              className="text-sm text-brand underline underline-offset-4"
            >
              Ir a iniciar sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
