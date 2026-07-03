# QA Report v2.0.7

## Objetivo

Corregir el error de compilación reportado por Vercel en `app/demo/dashboard/page.tsx`.

## Correcciones aplicadas

- `DemoDashboardPage` ahora es `async`, porque usa `await getGlobalOperationalAlerts("demo")`.
- Se corrigió el tipado del label de estado CRM en agenda.
- Se corrigió el agrupamiento de resultados del buscador global agregando el grupo `payment`.

## Validación técnica

- `npx tsc --noEmit`: OK.
- `npm run build`: compilación pasó la etapa de compile; el proceso local quedó limitado por timeout del entorno, pero el error original de Vercel quedó corregido.

## Observación

Vercel mostró un warning de seguridad para Next.js 15.3.4. Se recomienda planificar una v2.1.0 para actualizar Next.js a una versión parchada y ejecutar regresión completa.
