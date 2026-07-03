# Pendientes post piloto — Dental Pilot

Este documento deja los puntos para retomar después de que una médica pruebe Dental Pilot con datos reales.

## 1. Validación funcional con clínica real

- Confirmar si el flujo Paciente → Cita → Tratamiento → Pago es natural para recepción y doctores.
- Revisar si los estados del CRM/Kanban reflejan el proceso real de venta y atención.
- Validar si los campos actuales de paciente, cita y tratamiento son suficientes.
- Registrar fricciones de uso en móvil, tablet y desktop.

## 2. Notificaciones y alertas

- Validar si las alertas actuales son útiles o generan ruido.
- Definir reglas reales: citas próximas, presupuestos pendientes, pacientes sin seguimiento, pagos vencidos, stock bajo.
- Agregar estado de alerta leída/no leída si la clínica lo necesita.
- Evaluar prioridad por rol: recepción, doctor, administrador.

## 3. Roles y permisos

- Definir perfiles mínimos: administrador, recepción, doctor, finanzas.
- Restringir información sensible según rol.
- Revisar si un usuario debe ver solo su clínica o varias clínicas.
- Preparar arquitectura multi-clínica antes de escalar.

## 4. Datos y base de datos

- Revisar el modelo con datos reales de la prueba piloto.
- Ajustar campos obligatorios/opcionales según operación real.
- Confirmar si se requiere auditoría detallada por cambios de paciente, cita, tratamiento y pagos.
- Separar datos demo, datos seed y datos productivos.

## 5. Agenda clínica

- Validar reglas de solapamiento por doctor, consultorio y horario.
- Agregar vista semanal/mensual si la clínica lo solicita.
- Evaluar recordatorios automáticos por WhatsApp.
- Revisar duración por servicio y disponibilidad por doctor.

## 6. Tratamientos, presupuestos y pagos

- Mejorar impresión o exportación de presupuestos.
- Definir si se manejarán cuotas, adelantos, saldos y descuentos.
- Validar si los pagos deben asociarse a tratamiento, cita o paciente.
- Evaluar comprobantes, facturación o integración local futura.

## 7. Inventario y finanzas

- Confirmar si el inventario básico aporta valor o debe simplificarse.
- Definir responsable de registrar entradas/salidas.
- Mejorar reportes de egresos por categoría.
- Evaluar margen por tratamiento cuando existan costos reales.

## 8. IA y automatizaciones

- Medir qué casos de IA generan valor real: resumen de paciente, seguimiento, priorización, mensajes sugeridos.
- Conectar IA a datos reales con guardrails y trazabilidad.
- Definir plantillas aprobadas para comunicación con pacientes.
- Preparar historial de conversaciones y logs para observabilidad.

## 9. UX/UI

- Observar uso real antes de agregar nuevas pantallas.
- Mejorar textos, vacíos de estado y mensajes de error.
- Revisar navegación móvil con usuarios reales.
- Pulir consistencia visual antes de una demo comercial.

## 10. Preparación comercial

- Definir propuesta de valor según feedback de la médica.
- Identificar métricas de valor: citas recuperadas, presupuestos cerrados, pacientes reactivados, reducción de ausencias.
- Preparar demo comercial con datos ficticios realistas.
- Definir pricing inicial para Bolivia y arquitectura configurable por país.

## 11. Hardening técnico antes de producción

- Revisar RLS por clínica y rol.
- Agregar pruebas E2E de flujos críticos.
- Revisar manejo de errores y estados de carga.
- Configurar backups, monitoreo y checklist de despliegue.
- Validar variables de entorno y separación dev/stage/prod.

## Decisión recomendada

Después de la prueba piloto, no avanzar directo a más módulos. Primero consolidar feedback, priorizar problemas reales y cerrar una versión estable v2.1 enfocada en operación diaria de clínica.
