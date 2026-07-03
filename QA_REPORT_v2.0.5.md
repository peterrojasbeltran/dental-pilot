# QA Report v2.0.5

## Alcance

Preparación de Dental Pilot para prueba piloto. No se agregan módulos funcionales.

## Cambios revisados

- Versión actualizada a `v2.0.5`.
- `reset_clean_database.sql` limpia también `conversations` y `ai_logs`.
- SQL oficiales documentados en `sql/README.md`.
- SQL antiguos movidos a `sql/legacy/`.
- Pendientes post piloto documentados en `POST_PILOT_PENDING.md`.

## Validación realizada

- Revisión de estructura del ZIP.
- Revisión de scripts SQL principales.
- Revisión de documentación README/CHANGELOG/KNOWN_ISSUES.

## Resultado

Apto para entregar a una médica para prueba piloto controlada.

## Nota

Antes de usar en Supabase productivo, ejecutar primero en un proyecto Supabase de prueba.
