# QA Report v2.0.4

## Objetivo

Validar consistencia global de alertas y preparación para despliegue.

## Casos revisados

| Área | Caso | Resultado | Observación |
|---|---|---:|---|
| Dashboard | Contador de Requieren atención usa fuente global | PASS | Usa `getGlobalOperationalAlerts`. |
| Topbar | Campana visible en todos los módulos | PASS | Vive en `AppShell`. |
| Alertas | Cantidad consistente Dashboard vs otros módulos | PASS | Una sola fuente de cálculo. |
| Demo | Alertas demo usan datos mock | PASS | No dependen de base real. |
| SQL | Script creación completa agregado | PASS | `sql/create_database.sql`. |
| SQL | Script reinicio limpio agregado | PASS | `sql/reset_clean_database.sql`. |
| Deploy | README con GitHub/Vercel | PASS | Incluye pasos y variables. |

## Resultado

Versión apta para pruebas de despliegue.
