# Plataforma IoT Modular y Multi-Tenant

Prototipo de plataforma IoT desarrollado como Proyecto de Grado — Ingeniería de Sistemas, Universidad Autónoma de Bucaramanga.

**Autor:** Sergio Alejandro Amaya Corzo
**Director:** Mg. Javier Pinzón Castellanos
**Periodo:** 2026-2

---

## 📋 Descripción

El Internet de las Cosas (IoT) ha impulsado la creación de plataformas capaces de conectar dispositivos, procesar datos en tiempo real y visualizar información mediante dashboards. Sin embargo, soluciones comerciales como AWS IoT Core, Azure IoT Hub o ThingsBoard suelen implicar costos, dependencia del proveedor (*vendor lock-in*) y limitaciones de personalización — barreras importantes para entornos académicos y de experimentación.

Este proyecto diseña y construye un **prototipo funcional de plataforma IoT modular y multi-tenant**, que permite gestionar múltiples usuarios u organizaciones de forma aislada, recibir y procesar datos de dispositivos mediante un broker MQTT, y visualizarlos en tiempo real — como base de aprendizaje y experimentación en arquitecturas de software distribuidas.

## 🎯 Objetivo general

Diseñar un prototipo de plataforma IoT modular y multi-tenant que gestione dispositivos y visualice datos en tiempo real, facilitando la experimentación y el aprendizaje de arquitecturas IoT en entornos académicos.

## 🎯 Objetivos específicos

1. Analizar plataformas IoT existentes, identificando patrones arquitectónicos, funcionalidades y limitaciones en gestión de dispositivos, multi-tenancy, visualización de datos y escalabilidad.
2. Diseñar la arquitectura de la plataforma bajo un enfoque modular y multi-tenant, integrando la comunicación de dispositivos, el procesamiento de datos y la visualización.
3. Implementar un prototipo funcional que utilice un broker MQTT para la recepción y procesamiento de datos de dispositivos.
4. Evaluar el funcionamiento del prototipo frente a los indicadores técnicos y operativos definidos, en un entorno controlado.

## 🏗️ Arquitectura

```
[Dispositivos / Simuladores] --MQTT--> [Broker MQTT (HiveMQ Cloud)] --MQTT--> [Bridge (Python)]
                                                                                     |
                                                                          (procesa y persiste)
                                                                                     v
                                                          [Supabase — Postgres + Auth + Row Level Security + Realtime]
                                                                                     |
                                                                    (API + canal de tiempo real)
                                                                                     v
                                                                    [Dashboard Web (Next.js)]
                                                                    (por tenant, en tiempo real)
```

**Principios de diseño:**
- **Modular:** cada componente (ingesta, persistencia, visualización) es independiente y reemplazable.
- **Multi-tenant:** los datos de cada organización/usuario están aislados entre sí (implementado vía Row Level Security a nivel de base de datos), garantizando que ningún cliente pueda ver información de otro.
- **Tiempo real:** los datos de telemetría se reflejan en el dashboard sin necesidad de recargar la página.

## 🛠️ Stack tecnológico

| Componente | Tecnología |
|---|---|
| Comunicación de dispositivos | MQTT — HiveMQ Cloud |
| Procesamiento / puente MQTT → BD | Python |
| Base de datos, autenticación y aislamiento multi-tenant | Supabase (PostgreSQL + Row Level Security) |
| Comunicación en tiempo real | Supabase Realtime |
| Frontend / Dashboards | Next.js |
| Contenedores (simulador y bridge) | Docker |
| Control de versiones | Git + GitHub |

## 📁 Estructura del repositorio

```
/simulator   → Scripts que simulan dispositivos IoT publicando telemetría por MQTT
/bridge      → Servicio que se suscribe al broker MQTT y persiste los datos en Supabase
/frontend    → Aplicación Next.js con los dashboards multi-tenant
/docs        → Diagramas de arquitectura, decisiones de diseño y documentación técnica
```

## 🚧 Estado del proyecto

Proyecto en construcción activa (Proyecto de Grado I y II, 2026). Consulta `/docs` para el detalle de arquitectura y decisiones tomadas durante el desarrollo.

## 📄 Licencia

Proyecto académico — Universidad Autónoma de Bucaramanga.