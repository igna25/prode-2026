# Prode Mundialista 2026

PWA en React para predicciones de la fase eliminatoria del Mundial 2026.

## Desarrollo

```bash
npm install
npm run dev
```

La app carga los partidos desde la API pública de ESPN. No se requiere clave de API.

Opcionalmente, para sincronización en Supabase:

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
