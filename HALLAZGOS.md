# Hallazgos v2.0.5

- Se preparó entrega para prueba piloto.
- SQL oficiales: `sql/create_database.sql` y `sql/reset_clean_database.sql`.
- SQL antiguos movidos a `sql/legacy/`.
- Pendientes futuros documentados en `POST_PILOT_PENDING.md`.

---

# Hallazgos v2.0.4

## Hallazgo principal

El Dashboard y la campana global podían mostrar cantidades distintas de alertas porque existían dos cálculos separados.

## Corrección

Se centralizó el cálculo en `getGlobalOperationalAlerts`, reutilizado por Dashboard, Topbar y demo.

## Impacto

- Mejora consistencia.
- Reduce confusión del usuario.
- Evita divergencia futura entre módulos.
