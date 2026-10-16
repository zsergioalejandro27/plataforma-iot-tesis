# Frontend de Sema · Central de IoT

Aplicación web en **Next.js 16** (App Router), TypeScript, Tailwind CSS, shadcn/ui y Recharts. Muestra los dashboards en tiempo real de cada organización y expone la puerta HTTP `/api/ingest` para dispositivos.

La descripción completa del proyecto, la arquitectura, el despliegue y cómo correr todo está en el [README principal](../README.md).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y completa los valores de Supabase
npm run dev                  # http://localhost:3000
```

Otros comandos:

```bash
npm run build           # verifica tipos y compilación antes de subir cambios
npm run test:insights   # pruebas del motor de reglas del asistente Semita
```

Variables de entorno (`.env.local`; nunca se suben a GitHub):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Llave pública (anon/publishable) de Supabase |
| `SUPABASE_SERVICE_KEY` | Llave `service_role`, **solo servidor**: la usa `/api/ingest`. Nunca con prefijo `NEXT_PUBLIC_` |
