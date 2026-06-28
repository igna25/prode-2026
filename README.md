# Prode Mundialista 2026

PWA en React para predicciones de la fase eliminatoria del Mundial 2026.

## Desarrollo

```bash
npm install
npm run dev
```

La app funciona con datos locales si no hay credenciales de Supabase. Para conectar Supabase, copiar `.env.example` a `.env.local` y completar:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PASSWORD`

## Scripts

- `npm run dev`: servidor local Vite.
- `npm run build`: build de producción.
- `npm run test`: tests unitarios del sistema de puntuación.

## Supabase

La migración inicial está en `supabase/migrations/001_initial_schema.sql`. Las Edge Functions están en:

- `supabase/functions/sync-matches`
- `supabase/functions/calculate-points`
- `supabase/functions/send-notifications`
