# plataforma-iot-tesis

Proyecto de Grado (Ingeniería de Sistemas, UNAB): plataforma IoT modular y multi-tenant. Autor: Sergio Alejandro Amaya Corzo. Idioma de trabajo y de la interfaz: español.

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
- `simulator/`: `publish_test.py <device_key>` publica una vez; `auto_publisher.py` publica en bucle a todos los dispositivos (relee la tabla en cada ronda, intervalo en `PUBLISH_INTERVAL_SECONDS`); `payload_generator.py` genera las 10 métricas aleatorias, compartido por ambos.
- `frontend/`: Next.js 16 (App Router), TypeScript, Tailwind v3, shadcn/ui, Recharts. Desplegado en Vercel con auto-deploy en cada push.
- `supabase/schema.sql`: respaldo del esquema completo (tablas, funciones, triggers, RLS). Se mantiene a mano; actualízalo después de cada migración hecha en el SQL Editor. Se escribió sin `supabase db dump` porque requiere Docker, que el autor no tiene.

## Estructura del frontend

- `app/page.tsx`: landing pública (estática).
- `app/auth/*`: login, registro, recuperar contraseña, `confirm/route.ts` (su `next` por defecto es `/protected`).
- `app/protected/page.tsx`: dashboard de dispositivos con Realtime (`components/device-list.tsx`).
- `app/protected/devices/new`: alta de dispositivo; `devices/[id]`: detalle con tabla, gráfica (línea/barras/puntos) y botón de eliminar.
- `app/protected/plan`: planes y uso diario.
- `lib/supabase/proxy.ts` + `proxy.ts` (en Next 16 "middleware" se llama proxy): refresca la sesión y manda a `/protected/plan` a los tenants con `plan_selected = false`.
- `lib/metric-catalog.ts`: catálogo de 10 métricas con su unidad fija.

## Modelo de datos

`tenants` (con `plan_id`, `plan_selected`), `profiles`, `devices` (`device_key` único), `telemetry` (`payload` jsonb), `plans` (basico/medio/pro). El trigger `handle_new_user` crea un tenant nuevo por cada registro. El aislamiento entre tenants es solo por RLS, vía la función `get_my_tenant_id()`; no hay lógica de tenant en el código de la app.

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

## Despliegue

- Frontend: Vercel, automático al hacer push.
- Bridge y publicador automático: una instancia EC2 (Ubuntu) en AWS, cada uno como servicio systemd (`plataforma-iot-bridge`, `plataforma-iot-publisher`) dentro de un virtualenv, con el `.env` en el servidor. Los archivos se copian con `scp`; el servidor no tiene credenciales de GitHub. Intervalo actual del publicador: 3600 s.
- No correr `bridge.py` en la laptop mientras el de AWS esté activo: cada mensaje se insertaría dos veces.

## Pendientes conocidos

- Validación formal (pruebas funcionales con prueba real de aislamiento entre dos tenants, rendimiento con latencia medida, usabilidad con usuarios reales) y su documentación.
- Decidir cómo darle a un cliente externo un script de simulación sin compartir la credencial maestra de HiveMQ (HiveMQ Cloud permite credenciales con permiso por topic).
- Dominio propio y SMTP personalizado para los correos de Auth.
- Revisión de responsividad móvil de las pantallas posteriores a la landing.
