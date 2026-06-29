alter table public.matches
add column if not exists notified boolean not null default false;
