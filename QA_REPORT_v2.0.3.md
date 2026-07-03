# QA Report v2.0.3 — Global Layout & Demo Alignment

## Objetivo
Corregir hallazgos de layout global detectados en v2.0.2.

## Alcance validado

| Área | Caso | Resultado | Observación |
|---|---|---|---|
| Alertas | Campana visible fuera del Dashboard | PASS técnico | AppShell calcula alertas globales cuando una página no envía alertas propias. |
| Alertas | Demo con campana y datos mock | PASS técnico | AppShell usa prefijo /demo y datos mock cuando corresponde. |
| Sidebar desktop | Estado colapsado persistente | PASS técnico | Preferencia se guarda en localStorage. |
| Sidebar desktop | Evitar parpadeo visual | PASS técnico | Script inicial aplica data attribute antes del render visual y CSS controla ancho/labels. |
| Mobile | Menú mobile sin cambios | PASS técnico | MobileMenu no fue modificado funcionalmente. |
| SQL | Cambios de base de datos | PASS | No requiere SQL. |

## Notas QA
No se ejecutó `npm install` ni `npm run dev` en este entorno porque el ZIP no incluye `node_modules`.
Validación realizada por inspección de código sobre el ZIP v2.0.2 compartido por el usuario.

## Pruebas recomendadas en Antigravity
1. Abrir Dashboard y verificar campana.
2. Ir a Pacientes, Agenda, Tratamientos, Inventario y Finanzas: la campana debe seguir visible.
3. Contraer sidebar en desktop.
4. Cambiar de módulo: no debe verse el menú expandido antes de contraerse.
5. Revisar mobile: hamburguesa debe seguir igual.
6. Revisar Demo: campana y navegación deben conservar el mismo patrón.
