create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-match-reminders',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://lqghfpjbmoqbzffvyayd.supabase.co/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
