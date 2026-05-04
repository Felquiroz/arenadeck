# ArenaDeck + Supabase Checklist

Este checklist deja el proyecto estable para demo/entrega (BD + frontend + realtime).

## 1) Ejecutar sincronización de base

1. Abrir Supabase SQL Editor.
2. Ejecutar completo:
   - `packages/database/migrations/002_supabase_sync_and_rls.sql`

Esto:
- Alinea columnas/defaults esperados por la app.
- Asegura índices/constraints usados por torneos y matches.
- Habilita y configura RLS para uso desde cliente.
- Activa tablas en `supabase_realtime` para tabla en vivo.

## 2) Validar variables de entorno

`apps/web/.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`apps/api/.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`

## 3) Compilar monorepo

```bash
npm run build
```

Debe terminar sin errores.

## 4) Ejecutar app

```bash
npm --workspace @arenadeck/api run dev
npm --workspace @arenadeck/web run dev -- --host 0.0.0.0 --port 5173
```

## 5) Flujo funcional mínimo

1. Login admin.
2. Crear torneo.
3. Agregar jugadores (normal/QR/demo).
4. Iniciar ronda.
5. Reportar resultados.
6. Ver tabla y ELO actualizado en tiempo real.
7. Avanzar a siguiente ronda.

## 6) Si falla creación de torneo

Revisar mensaje exacto en UI.
Si aparece RLS `42501`, re-ejecutar `002_supabase_sync_and_rls.sql`.
