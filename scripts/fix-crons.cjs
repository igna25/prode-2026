const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");

const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/);
if (!keyMatch) {
  console.error("Could not find SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const urlMatch = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/);
if (!urlMatch) {
  console.error("Could not find VITE_SUPABASE_URL in .env");
  process.exit(1);
}

const key = keyMatch[1];
const baseUrl = urlMatch[1];

const sql = `-- Fix cron jobs: wrong project ref + current_setting() returning NULL.
-- Run this in Supabase Dashboard > SQL Editor

-- Remove old broken cron jobs
select cron.unschedule('send-match-reminders');
select cron.unschedule('sync-matches-and-calc-points');

-- send-match-reminders: runs every 5 min
select cron.schedule(
  'send-match-reminders',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := '${baseUrl}/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ${key}',
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
      url := '${baseUrl}/functions/v1/sync-matches',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ${key}',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);`;

const outPath = path.join(__dirname, "fix-crons.sql");
fs.writeFileSync(outPath, sql);
console.log(`Generated: ${outPath}`);
console.log("Copy the SQL and run it in Supabase Dashboard > SQL Editor");
