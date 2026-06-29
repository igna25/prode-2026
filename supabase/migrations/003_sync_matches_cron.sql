-- FIX: previous cron used current_setting('app.settings.service_role_key') which returns NULL.
-- Both cron jobs are removed and rescheduled with the actual service_role_key.
--
-- DO NOT run this file directly — run the generated SQL from scripts/fix-crons.sql instead.
-- Or run the SQL below in Supabase Dashboard > SQL Editor after replacing SERVICE_ROLE_KEY.

-- Remove old broken cron jobs
select cron.unschedule('send-match-reminders');
select cron.unschedule('sync-matches-and-calc-points');

-- send-match-reminders: runs every 5 min
select cron.schedule(
  'send-match-reminders',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 
'https://lqghfpjbmoqbzffvyayd.supabase.co/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- sync-matches-and-calc-points: runs every 2 min
select cron.schedule(
  'sync-matches-and-calc-points',
  '*/2 * * * *',
  $$
    select net.http_post(
      url := 
'https://lqghfpjbmoqbzffvyayd.supabase.co/functions/v1/sync-matches',
      headers := jsonb_build_object(
        'Authorization', 'Bearer SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
