# plataforma-iot-tesis

Proyecto de Grado (Ingeniería de Sistemas, UNAB): plataforma IoT modular y multi-tenant. Autor: Sergio Alejandro Amaya Corzo. Idioma de trabajo y de la interfaz: español.

Nombre de la marca: **Sema · Central de IoT** (de σῆμα, "señal"; la Σ es un pulso de nodos). El título de la tesis sigue siendo "Plataforma IoT modular y multi-tenant". El logo vive en `frontend/components/sema-logo.tsx` (símbolo Σ, greca, palabra SEMA en Cinzel); el favicon es `frontend/app/icon.svg` y la imagen al compartir es `frontend/app/opengraph-image.tsx`. Los identificadores técnicos (repo, URL de Vercel, servicios `plataforma-iot-*` en AWS, proyecto de Supabase) conservan el nombre viejo a propósito.

## Cómo trabajar con el autor

- Es principiante en Git, Supabase, Next.js, MQTT, AWS y Vercel. Explica el "por qué" de cada cambio.
- Antes de crear o modificar archivos: presenta el plan (qué archivos, por qué, qué esperar) y espera aprobación explícita.
- Después de cada cambio, dile exactamente qué probar antes de seguir.
- Los commits los hace él a mano. No ejecutes `git add` ni `git commit`; sugiérele el mensaje.
- Nunca pegues credenciales en el chat ni en archivos versionados (`.env`, llaves de Supabase, contraseñas de HiveMQ, llave `.pem` de AWS).

## Arquitectura

```
Dispositivos/simulador --MQTT--> HiveMQ Cloud --MQTT--> bridge.py --> Supabase (Postgres + Auth + RLS + Realtime) --> Next.js (Vercel)
```

- `bridge/bridge.py`: se suscribe a `device/+/telemetry`, busca el `device_key` en la tabla `devices`, e inserta en `telemetry` con la llave de servicio (se salta RLS, pero los triggers de límites sí aplican).
- `simulator/`: `publish_test.py <device_key>` publica una vez; `auto_publisher.py` publica en bucle a los dispositivos con `cloud_simulation = true` (relee la tabla en cada ronda, intervalo en `PUBLISH_INTERVAL_SECONDS`; si se cambia hay que copiarlo a AWS con `scp` y reiniciar `plataforma-iot-publisher`); `payload_generator.py` genera las 10 métricas aleatorias, compartido por ambos.
- `frontend/`: Next.js 16 (App Router), TypeScript, Tailwind v3, shadcn/ui, Recharts. Desplegado en Vercel con auto-deploy en cada push.
- `supabase/schema.sql`: respaldo del esquema completo (tablas, funciones, triggers, RLS). Se mantiene a mano; actualízalo después de cada migración hecha en el SQL Editor. Se escribió sin `supabase db dump` porque requiere Docker, que el autor no tiene.

## Estructura del frontend

- `app/page.tsx`: landing pública (estática).
- `app/auth/*`: login, registro, recuperar contraseña, `confirm/route.ts` (su `next` por defecto es `/protected`).
- `app/protected/page.tsx`: dashboard de dispositivos con Realtime (`components/device-list.tsx`).
- `app/protected/devices/new`: alta de dispositivo; `devices/[id]`: detalle con tabla, gráfica (línea/barras/puntos) y botón de eliminar.
- `app/protected/plan`: planes y uso diario.
- `app/protected/settings` + `components/org-settings-form.tsx`: página "Personalizar" de la organización (nombre, color de acento, formato de hora 12/24 h). Escribe en `tenants` (`name`, `accent_color`, `time_format`). El acento se aplica en `app/protected/layout.tsx` como la variable CSS `--brand-rgb`; `brand` en `tailwind.config.ts` sale de esa variable (por defecto verde pino en `globals.css`). El estado "en línea" usa el color fijo `online`, no `brand`.
- `components/device-tabs.tsx`: la pantalla de un dispositivo tiene pestañas Lecturas / Conectar / Personalizar; todas quedan montadas y las inactivas se ocultan con `hidden` para no perder estado. `components/device-customize.tsx` es la pestaña Personalizar (nombre, ubicación, color). La gráfica favorita (`devices.chart_type`) se guarda sola al elegirla en `telemetry-chart.tsx`.
- `lib/palette.ts`: paleta cerrada de colores (dispositivos y acento; solo los marcados `accent` pueden ser acento porque el texto claro debe leerse encima). El color por defecto de un dispositivo sale de su id (`colorForDevice`).
- `lib/supabase/proxy.ts` + `proxy.ts` (en Next 16 "middleware" se llama proxy): refresca la sesión y manda a `/protected/plan` a los tenants con `plan_selected = false`.
- `lib/metric-catalog.ts`: catálogo de 10 métricas con su unidad fija.
- `components/device-connect.tsx` + `lib/device-scripts.ts`: tarjeta "Conectar este dispositivo" del detalle (`devices/[id]`). Muestra la URL y el token, y genera/descarga un gemelo digital en Python, un sketch para ESP32 y un ejemplo cURL con el token y la métrica ya puestos (rangos en `lib/metric-catalog.ts`, iguales a `simulator/payload_generator.py`). "Regenerar token" llama a la función SQL `regenerate_device_token` (los usuarios no tienen UPDATE sobre `devices`). La URL de los scripts sale de `window.location.origin`.
- `app/api/ingest/route.ts`: puerta HTTP para dispositivos y scripts externos (alternativa al MQTT). `POST` con `Authorization: Bearer <devices.api_token>` y un JSON con el campo de la métrica del dispositivo (ej. `{"temperatura": 22.5}`). Responde 201, 401 (token ausente o inválido, mismo mensaje), 400 (JSON o métrica inválidos), 413 (más de 2 KB) y 429 (límite diario del plan, viene del trigger). Usa `lib/supabase/admin.ts` (llave de servicio, solo servidor).

## Modelo de datos

`tenants` (con `plan_id`, `plan_selected`, `accent_color` hex o null, `time_format` '12h'|'24h'), `profiles`, `devices` (`device_key` único y público; `api_token` único y secreto, solo visible para su tenant por RLS, usado por `/api/ingest`; `cloud_simulation` boolean, por defecto true: si está activa, el publicador de AWS le envía lecturas simuladas; el dueño la cambia con la función SQL `set_cloud_simulation` desde el interruptor de la tarjeta "Conectar este dispositivo"; personalización: `color` hex o null, `location` hasta 40 caracteres, `chart_type` 'line'|'bar'|'scatter'). Los usuarios solo tienen UPDATE (permiso por columna, más política por tenant) sobre `name`, `color`, `location` y `chart_type`; `api_token`, `device_key` y `cloud_simulation` solo se cambian con las funciones SQL), `telemetry` (`payload` jsonb), `plans` (basico/medio/pro). El trigger `handle_new_user` crea un tenant nuevo por cada registro. El aislamiento entre tenants es solo por RLS, vía la función `get_my_tenant_id()`; no hay lógica de tenant en el código de la app.

Los límites por plan los imponen dos triggers `BEFORE INSERT` en Postgres: `enforce_device_limit` (dispositivos por tenant) y `enforce_reading_limit` (lecturas por dispositivo en una ventana móvil de 24 horas; no se borra nada, las lecturas viejas se conservan para el histórico).

## Comandos

```bash
cd frontend && npm run dev      # desarrollo
cd frontend && npm run build    # verificar tipos y compilación antes de commitear
py simulator/publish_test.py device-001   # una lectura de prueba (Windows)
```

## Gotchas conocidos

- Realtime: el canal no debe suscribirse hasta que `supabase.auth.getSession()` resuelva; si no, RLS descarta los eventos en silencio. Ver el comentario en `device-list.tsx`. Además, la tabla `telemetry` debe estar en la publicación `supabase_realtime`.
- Fechas en Server Components: pasar siempre `timeZone: "America/Bogota"`; el servidor de Vercel corre en UTC.
- Aleatoriedad en componentes cliente: no usar `Math.random()` durante el render (desajuste de hidratación). Hacerlo en un `useEffect`.
- Navegar con `window.location.href` (no `router.push`) justo después de una escritura de la que depende el proxy, como al elegir plan.
- Botones `variant="outline"` sobre fondo oscuro necesitan `bg-transparent` explícito.
- Gráficas Recharts: no añadir la unidad a los ticks del eje Y (se truncan); la unidad va solo en el tooltip y la tabla.
- Python en systemd: agregar `Environment=PYTHONUNBUFFERED=1` o `journalctl` no muestra los `print`.
- Si `npm run build` falla con EPERM sobre `.next` (OneDrive), borrar la carpeta `.next` y repetir.
- El proxy (`proxy.ts`) manda a login a toda petición sin sesión. Las rutas que usan dispositivos o `curl` (hoy `/api/ingest`) deben excluirse en su `matcher`, o reciben una redirección en vez de procesarse.
- `SUPABASE_SERVICE_KEY` es una variable solo de servidor: va en `frontend/.env.local` y en Vercel (Environment Variables, tipo Secret), nunca con prefijo `NEXT_PUBLIC_`. Debe existir en Vercel antes del push o `/api/ingest` responde 500.
- Si se agrega otra columna de `devices` que el usuario pueda editar, hay que añadirla al `grant update (...)` por columna en `schema.sql` y en Supabase; sin eso el UPDATE falla con permission denied (a propósito para el resto de columnas).
- Cualquier color nuevo que deba cambiar con el acento de la organización debe usar `brand` (variable CSS); lo que significa un estado (en línea) usa colores fijos como `online`.
- PowerShell 5.1 parte los JSON con espacios al pasarlos a `curl.exe -d`. Para probar `/api/ingest`: escribir el JSON a un archivo con `Set-Content -Encoding ascii` y enviarlo con `-d "@archivo"`.

## Despliegue

- Frontend: Vercel, automático al hacer push.
- Bridge y publicador automático: una instancia EC2 (Ubuntu) en AWS, cada uno como servicio systemd (`plataforma-iot-bridge`, `plataforma-iot-publisher`) dentro de un virtualenv, con el `.env` en el servidor. Los archivos se copian con `scp`; el servidor no tiene credenciales de GitHub. Intervalo actual del publicador: 3600 s.
- No correr `bridge.py` en la laptop mientras el de AWS esté activo: cada mensaje se insertaría dos veces.

## Pendientes conocidos

- Probar el sketch de ESP32 (`.ino`) en Wokwi y anotar el resultado; está generado y revisado a ojo, no probado en hardware.
- Cambiar el nombre en las plantillas de correo de Supabase Auth (Authentication → Emails) junto con el dominio y el SMTP propios.
- Validación formal (pruebas funcionales con prueba real de aislamiento entre dos tenants, rendimiento con latencia medida, usabilidad con usuarios reales) y su documentación.
- Decidir cómo darle a un cliente externo un script de simulación sin compartir la credencial maestra de HiveMQ (HiveMQ Cloud permite credenciales con permiso por topic).
- Dominio propio y SMTP personalizado para los correos de Auth.
- Revisión de responsividad móvil de las pantallas posteriores a la landing.
