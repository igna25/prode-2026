create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text generated always as (lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))) stored,
  device_id text unique not null,
  push_subscription jsonb,
  created_at timestamptz not null default now()
);

alter table public.participants
add column if not exists name_normalized text
generated always as (lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))) stored;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  round text not null check (round in ('R32', 'R16', 'QF', 'SF', '3RD', 'FINAL')),
  team_home text not null default 'Por definir',
  team_away text not null default 'Por definir',
  team_home_code text,
  team_away_code text,
  goals_home int check (goals_home between 0 and 30),
  goals_away int check (goals_away between 0 and 30),
  winner_penalty text check (winner_penalty in ('HOME', 'AWAY')),
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'LIVE', 'FINISHED')),
  match_datetime timestamptz not null,
  stadium text,
  bracket_position bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_goals int not null check (predicted_home_goals between 0 and 15),
  predicted_away_goals int not null check (predicted_away_goals between 0 and 15),
  predicted_winner text check (predicted_winner in ('HOME', 'AWAY')),
  points_earned int check (points_earned between 0 and 6),
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, match_id),
  check (
    (predicted_home_goals = predicted_away_goals and predicted_winner is not null)
    or (predicted_home_goals <> predicted_away_goals and predicted_winner is null)
  )
);

create table if not exists public.admin_config (
  key text primary key,
  value text
);

create or replace function public.current_device_id()
returns text
language plpgsql
stable
as $$
declare
  headers jsonb;
begin
  headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  return nullif(headers ->> 'x-device-id', '');
exception
  when others then
    return null;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at
before update on public.matches
for each row execute function public.touch_updated_at();

drop trigger if exists predictions_touch_updated_at on public.predictions;
create trigger predictions_touch_updated_at
before update on public.predictions
for each row execute function public.touch_updated_at();

alter table public.participants enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.admin_config enable row level security;

drop policy if exists "participants are readable" on public.participants;
create policy "participants are readable"
on public.participants for select
using (true);

drop policy if exists "participants can register" on public.participants;
create policy "participants can register"
on public.participants for insert
with check (true);

drop policy if exists "participants can update own row" on public.participants;
create policy "participants can update own row"
on public.participants for update
using (true)
with check (true);

drop policy if exists "matches are readable" on public.matches;
create policy "matches are readable"
on public.matches for select
using (true);

drop policy if exists "matches can be inserted" on public.matches;
create policy "matches can be inserted"
on public.matches for insert
with check (true);

drop policy if exists "matches can be updated" on public.matches;
create policy "matches can be updated"
on public.matches for update
using (true)
with check (true);

drop policy if exists "predictions privacy select" on public.predictions;
create policy "predictions privacy select"
on public.predictions for select
using (true);

drop policy if exists "participants insert own predictions" on public.predictions;
create policy "participants insert own predictions"
on public.predictions for insert
with check (true);

drop policy if exists "participants update own unlocked predictions" on public.predictions;
create policy "participants update own unlocked predictions"
on public.predictions for update
using (true)
with check (true);

create index if not exists idx_matches_round_position on public.matches(round, bracket_position);
create index if not exists idx_matches_status_datetime on public.matches(status, match_datetime);
create index if not exists idx_predictions_participant on public.predictions(participant_id);
create index if not exists idx_predictions_match on public.predictions(match_id);
create unique index if not exists idx_participants_name_normalized_unique
on public.participants(name_normalized);
