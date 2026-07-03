# Arquitectura Dental Pilot v0.1.0

## Enfoque

Para V1 se usa una arquitectura simple, sin costo fijo de infraestructura:

```txt
Next.js + Supabase + OpenAI opcional
```

## Principios

- Mobile-first.
- Una clínica en V1.
- Moneda configurable.
- IA como núcleo, pero controlada.
- Human-in-the-loop.
- Preparado para RAG con pgvector.
- Prompts versionados.
- JSON validado.
- Logs de IA desde el inicio.

## Por qué no FastAPI todavía

Para una sola clínica y una V1 sin pagar infraestructura, Next.js es suficiente para validar el flujo. FastAPI puede entrar en V1.1/V2 si necesitamos:

- jobs largos,
- agentes más pesados,
- colas,
- procesamiento IA asíncrono,
- observabilidad avanzada.

## Escalamiento futuro

```txt
V1: Next.js + Supabase
V1.1: Next.js + Supabase + FastAPI Free/Render
V2: Cloud Run + Redis/Queue + Observabilidad
```

## v0.3.0 - Separación Demo vs Sistema Real

A partir de v0.3.0 existen dos experiencias:

- Demo pública: `/demo/dashboard` y `/demo/patients`, con datos mock, sin persistencia y sin login.
- Sistema real: rutas protegidas como `/dashboard` y `/patients`, usando Supabase cuando está configurado.

Esta separación permite mostrar el producto comercialmente sin exponer datos reales.
