# Changelog

## v2.0.8 - Ajuste login piloto
- Se dejan vacíos los campos de usuario y contraseña en el login real.
- No se modifican flujos funcionales, demo, base de datos ni lógica de autenticación.

## v2.0.7 - Vercel build fix

- Se corrigió `app/demo/dashboard/page.tsx` declarando `DemoDashboardPage` como `async` para permitir `await getGlobalOperationalAlerts("demo")`.
- Se corrigieron errores TypeScript detectados en `appointment-workspace.tsx` y `global-search.tsx`.
- Se validó `npx tsc --noEmit` correctamente.
- Objetivo: corregir el fallo de build reportado en Vercel para la rama `main`.

## v2.0.6 - Vercel Analytics ready

- Se agregaron las dependencias `@vercel/analytics` y `@vercel/speed-insights`.
- Se integraron los componentes `<Analytics />` y `<SpeedInsights />` en `app/layout.tsx`.
- Se actualizó la versión visible de la aplicación a `v2.0.6`.
- Objetivo: dejar el proyecto listo para medir visitas y performance al desplegar en Vercel.

## v2.0.5 — Pilot Prep + SQL Cleanup

### Corregido

- `sql/reset_clean_database.sql` ahora también limpia `conversations` y `ai_logs` cuando existen.

### Agregado

- `sql/README.md` con instrucciones claras de qué SQL usar para la prueba piloto.
- `POST_PILOT_PENDING.md` con pendientes para retomar después de la prueba piloto.

### Ordenado

- Scripts SQL antiguos movidos a `sql/legacy/` para evitar que se usen por error durante la prueba piloto.


## v2.0.4 — Global Alerts + SQL/Deploy Prep

### Corregido

- El Dashboard ya no calcula alertas con una lógica distinta a la campana global.
- La cantidad de alertas es consistente entre Dashboard, Topbar y módulos internos.
- La demo usa datos mock para alertas y mantiene consistencia visual.

### Agregado

- `sql/create_database.sql`: creación completa de base de datos desde cero.
- `sql/reset_clean_database.sql`: limpieza de datos operativos con precarga mínima.
- Guía de GitHub y Vercel en README.

### SQL

- No requiere migración nueva obligatoria.
- Scripts opcionales disponibles para creación/reinicio de base.
