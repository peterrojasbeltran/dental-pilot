# QA Report v2.0.6 - Vercel Analytics

## Alcance

Validación técnica de integración de Vercel Analytics y Speed Insights para despliegue en Vercel.

## Cambios revisados

- `package.json` actualizado a versión `2.0.6`.
- Dependencias agregadas:
  - `@vercel/analytics`
  - `@vercel/speed-insights`
- `app/layout.tsx` actualizado con:
  - `Analytics` desde `@vercel/analytics/next`
  - `SpeedInsights` desde `@vercel/speed-insights/next`
- `lib/version.ts` actualizado a `v2.0.6`.

## Prueba recomendada antes de subir a Git

```bash
npm install
npm run typecheck
npm run build
```

## Resultado esperado

La aplicación debe compilar correctamente y, una vez desplegada en Vercel con Web Analytics y Speed Insights activos en el dashboard, empezará a registrar visitas y métricas de performance.

## Observación

No se modificó lógica funcional, base de datos, autenticación ni módulos clínicos.
