# Dental Pilot v2.0.7

Versión de preparación para prueba piloto con SQL ordenado y pendientes post piloto documentados.

## Cambios principales

- Las alertas del Dashboard y la campana global usan la misma fuente de datos.
- El contador de alertas es consistente en todos los módulos.
- La demo usa datos mock para alertas y mantiene el mismo patrón visual.
- Se mantienen los scripts SQL oficiales de creación completa y reinicio limpio.
- Se documentan los SQL oficiales en `sql/README.md`.
- Se mueven SQL antiguos a `sql/legacy/` para evitar confusión.
- Se agrega `POST_PILOT_PENDING.md` con pendientes para retomar después de la prueba piloto.
- Se agrega guía de GitHub y Vercel.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Si queda caché de una versión anterior:

```bash
rm -rf .next
npm run dev
```

## Variables de entorno

Crear `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## SQL

Para la prueba piloto usar solo los dos scripts oficiales. Ver también `sql/README.md`.

No usar los archivos de `sql/legacy/`; quedan solo como referencia histórica.

### Crear base completa desde cero

Ejecutar en Supabase SQL Editor:

```text
sql/create_database.sql
```

Uso recomendado: proyecto Supabase nuevo o base vacía.

### Limpiar datos y dejar base mínima

Ejecutar en Supabase SQL Editor:

```text
sql/reset_clean_database.sql
```

Este script limpia datos operativos y deja precargados:

- configuración Bolivia;
- servicios odontológicos base;
- insumos base;
- categorías de egresos;
- doctores y consultorios base;
- plantillas de automatización.

También limpia conversaciones y logs de IA (`conversations`, `ai_logs`) si esas tablas existen.

No afecta la demo porque la demo usa datos mock del código.

## Subir a GitHub

Repositorio sugerido:

```text
https://github.com/peterrojasbeltran/dental-pilot
```

Pasos:

```bash
cd dental-pilot-v2.0.7
git init
git add .
git commit -m "Dental Pilot v2.0.7"
git branch -M main
git remote add origin https://github.com/peterrojasbeltran/dental-pilot.git
git push -u origin main
```

Si el repositorio ya existe:

```bash
git remote -v
git add .
git commit -m "Dental Pilot v2.0.7"
git push
```

## Desplegar en Vercel

1. Entrar a Vercel.
2. Crear **New Project**.
3. Importar el repositorio `peterrojasbeltran/dental-pilot`.
4. Framework: **Next.js**.
5. Agregar variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

6. Deploy.
7. Probar rutas principales:

```text
/
/login
/dashboard
/patients
/appointments
/treatments
/payments
/reports
/inventory
/finances
/ai-assistant
/automations
/demo/dashboard
```

## Nota de producto

La versión `v2.0.7` no agrega módulos nuevos. Ordena la entrega para prueba piloto, refuerza el reset limpio y deja documentados los pendientes post piloto.


## Vercel Analytics y Speed Insights

La versión `v2.0.7` ya incluye la integración de código para Vercel Analytics y Speed Insights.

Después del deploy en Vercel, activar desde el dashboard del proyecto:

- Web Analytics
- Speed Insights

No se requieren variables de entorno adicionales para esta integración.
