# SQL oficiales para Dental Pilot

## Usar en la prueba piloto

1. `create_database.sql`
   - Usar solo si el proyecto Supabase está nuevo o la base está vacía.
   - Crea tablas, políticas RLS, índices y datos base.

2. `reset_clean_database.sql`
   - Usar cuando la base ya existe y se quiere limpiar para iniciar una prueba real.
   - Elimina datos operativos: pacientes, citas, tratamientos, pagos, egresos, inventario, automatizaciones, conversaciones y logs de IA.
   - Deja configuración Bolivia, servicios, insumos, categorías de egresos, doctores, consultorios y plantillas mínimas.
   - No afecta la demo porque la demo usa datos mock del código.

## No usar para la prueba piloto

Los scripts antiguos quedaron movidos a `sql/legacy/` solo como referencia histórica.
