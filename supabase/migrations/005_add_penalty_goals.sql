alter table public.matches
add column if not exists penalty_home int,
add column if not exists penalty_away int;
