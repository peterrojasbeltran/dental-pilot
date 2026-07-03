# Regression checklist

Ejecutar antes de empaquetar cada versión.

## Técnico

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run dev`

## Navegación

- [ ] `/`
- [ ] `/login`
- [ ] `/dashboard`
- [ ] `/patients`
- [ ] `/appointments`
- [ ] `/services`
- [ ] `/settings`
- [ ] Home conserva el diseño base aprobado

## UX

- [ ] Sidebar desktop visible.
- [ ] Menú mobile visible con botón hamburguesa.
- [ ] Mobile no rompe layout.
- [ ] Cards legibles.
- [ ] Tablas con scroll horizontal.
- [ ] Paleta visual sin colores forzados.

## Negocio

- [ ] Bolivia como país default.
- [ ] BOB/Bs como moneda default.
- [ ] Servicios tienen precio y duración.
- [ ] Pacientes tienen estado y riesgo.

## Regresión adicional v0.3.0

- [ ] Home público mantiene UX de v0.2.1.
- [ ] Botón Ingresar al sistema abre la demo pública para visitantes.
- [ ] Demo pública no requiere login.
- [ ] Login real sigue funcionando.
- [ ] Menú mobile sigue visible después de login.
- [ ] CRM Kanban se visualiza correctamente en desktop.
- [ ] CRM Kanban usa scroll horizontal en móvil.
- [ ] Drawer de paciente se abre y cierra correctamente.

## Regresión adicional v0.6.2

- [ ] Pacientes muestra notificaciones tipo toast.
- [ ] Servicios muestra notificaciones tipo toast.
- [ ] Configuración muestra notificaciones tipo toast.
- [ ] Kanban muestra notificaciones tipo toast.
- [ ] No existen popups nativos ni mensajes inline ocultos en edición de pacientes.
- [ ] Pacientes usa el mismo patrón visual Activo/Inactivo que Servicios.
