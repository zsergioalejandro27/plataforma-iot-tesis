import Link from "next/link";
import { Suspense } from "react";
import { SemaLogo } from "@/components/sema-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <p className="text-sm text-muted2">
        No pudimos completar la verificación. Puede que el enlace haya vencido o
        ya se haya usado. Intenta iniciar sesión de nuevo o pide un enlace nuevo.
      </p>
      {/* El detalle técnico viene del servicio de autenticación y puede estar
          en inglés; se deja aparte y en pequeño por si hace falta reportarlo. */}
      {params?.error && (
        <p className="mt-3 break-words text-xs text-muted2">
          Detalle técnico: {params.error}
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-panel-surface p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center rounded-lg bg-panel-ink p-5">
          <SemaLogo />
        </div>
        <Card className="border-line bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-panel-ink">Algo salió mal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Suspense>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
            <Link
              href="/auth/login"
              className="text-sm text-brand underline underline-offset-4"
            >
              Volver a iniciar sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
