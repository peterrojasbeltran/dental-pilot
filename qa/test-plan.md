# Dental Pilot - Plan de QA funcional manual

## Objetivo

Validar cada versión antes de entregar ZIP descargable, reduciendo errores de regresión mientras todavía no existe QA automatizado.

## Alcance V1

- Instalación local.
- Build.
- Login/logout.
- Rutas protegidas.
- Lectura de datos desde Supabase.
- Responsive básico.
- Navegación principal.
- Formato de moneda Bolivia.

## Criterio de salida por versión

Una versión solo se entrega si:

1. Compila sin errores críticos.
2. `npm run typecheck` no falla.
3. `npm run build` no falla.
4. Las rutas principales cargan.
5. No existen errores críticos conocidos.
6. Se documentan limitaciones no críticas en `KNOWN_ISSUES.md` si aplica.

## Severidad

- Crítico: impide ejecutar, login, navegación o build.
- Alto: rompe flujo principal.
- Medio: error visual o funcional no bloqueante.
- Bajo: ajuste de copy, estilo o mejora menor.
