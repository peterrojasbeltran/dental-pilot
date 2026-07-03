# QA Report v2.0.1 — Pagination Standardization

## Objetivo
Corregir hallazgo de QA: todas las listas con volumen deben usar el mismo patrón de paginación.

## Estándar validado
- Default: 10 registros por página.
- Opciones: 10 / 25 / 50 / 100.
- Contador: `Mostrando X-Y de Z`.
- Navegación: Anterior / Siguiente.
- La búsqueda/filtro reinicia la página cuando corresponde.

## Módulos cubiertos
- Pacientes.
- Pagos: Presupuestos aprobados e Historial de pagos.
- Reportes: Cobranza pendiente, Pagos recientes y Presupuestos recientes.
- Finanzas: Egresos recientes.
- Inventario: Inventario actual.
- Asistente IA: Prioridades recomendadas.
- Tratamientos: default ajustado a 10 registros por página.

## SQL
No requiere SQL.
