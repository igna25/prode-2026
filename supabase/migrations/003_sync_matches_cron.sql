select cron.schedule(
  'sync-matches-and-calc-points',
  '*/2 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-matches',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
