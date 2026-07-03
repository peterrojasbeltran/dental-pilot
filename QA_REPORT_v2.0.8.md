# QA Report v2.0.8

## Objetivo
Eliminar credenciales precargadas del formulario de login para la prueba piloto.

## Cambios revisados
- `components/auth/login-form.tsx`: email inicial vacío.
- `components/auth/login-form.tsx`: contraseña inicial vacía.
- `package.json`: versión 2.0.8.
- `lib/version.ts`: versión v2.0.8.

## Resultado
Cambio acotado y seguro. No altera autenticación, rutas, Supabase ni datos demo.

## Validación pendiente
Ejecutar localmente antes de subir:

```bash
npm install
npm run build
```
