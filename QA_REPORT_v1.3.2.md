# QA Report — Dental Pilot v1.3.2

## Objetivo
Versión de hardening y regresión para preparar Dental Pilot como candidato a piloto real en consultorio odontológico pequeño.

## Alcance revisado
- Pacientes
- CRM Kanban
- Agenda
- Tratamientos
- Presupuestos
- Pagos
- Inventario
- Finanzas
- Reportes
- AI Assistant
- Automatizaciones
- Demo
- Scripts SQL de reinicio y dataset

## Resultado general
**Estado:** Release Candidate técnico para piloto controlado.

La revisión se enfocó en código, estructura, consistencia UX y SQL. No se ejecutó una prueba E2E real con navegador conectado a Supabase desde este entorno, por lo que la validación final debe realizarse en Antigravity/local.

## Regresión funcional sugerida

| Módulo | Caso | Estado esperado |
|---|---|---|
| Pacientes | Crear paciente | Debe aparecer en listado y CRM |
| Pacientes | Editar teléfono duplicado | Debe bloquearse |
| Pacientes | Desactivar/reactivar | Debe conservar historial |
| Agenda | Crear cita | Debe validar doctor/paciente/consultorio |
| Agenda | Editar cita | Debe permitir solo estados editables |
| Agenda | Finalizar/no asistió/cancelar | Debe bloquear edición posterior |
| CRM | Mover estado | Debe persistir |
| CRM | Finalizado | Debe archivar según regla |
| Tratamientos | Editar pendiente/presupuestado | Debe recalcular total |
| Tratamientos | Editar aprobado/finalizado | Debe bloquearse |
| Presupuestos | Aprobar/rechazar | Debe actualizar estado CRM/financiero |
| Pagos | Pago parcial | Debe actualizar saldo |
| Pagos | Sobrepago | Debe bloquearse |
| Pagos | Anular pago | Debe recalcular saldo |
| Inventario | Entrada/salida/ajuste | Debe actualizar stock |
| Inventario | Salida mayor al stock | Debe bloquearse |
| Finanzas | Crear/editar egreso | Debe reflejarse en reportes |
| Finanzas | Anular egreso | Debe excluirse de métricas activas |
| Reportes | Periodo | Debe recalcular métricas |
| AI Assistant | Riesgos/cobranza/inventario | Debe derivarse de datos reales |
| Automatizaciones | ON/OFF y plantillas | Debe persistir configuración |
| Demo | Navegación | Debe mantenerse en solo lectura |

## QA UX aplicado en v1.3.2
- Se identificó repetición de implementaciones de buscador.
- Se agregó un componente reutilizable `SearchInput` y se aplicó en Inventario y Finanzas, los dos módulos donde ya habían aparecido errores visuales.
- Se recomienda migrar gradualmente todos los buscadores restantes a ese componente para reducir regresiones futuras.

## QA SQL aplicado en v1.3.2
- Se corrigió `reset_full_database.sql` para que incluya Finanzas y no deje instrucciones fuera del flujo principal.
- Se actualizó `reset_clinic_data.sql` para limpiar egresos y automatizaciones operativas sin afectar catálogos.
- Se agregó `seed_large_dataset.sql` para pruebas de volumen.
- Se agregó migración de auditoría para pagos, egresos e inventario.

## Validación pendiente en local
Ejecutar:

```bash
rm -rf .next
npm install
npm run typecheck
npm run build
npm run dev
```

Luego validar los casos funcionales de la tabla anterior usando Supabase conectado.
