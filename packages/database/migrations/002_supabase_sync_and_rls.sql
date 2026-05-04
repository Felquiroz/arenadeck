-- ArenaDeck - Supabase sync + RLS + Realtime
-- Run this file in Supabase SQL Editor (safe to re-run).

create extension if not exists pgcrypto;

-- =========================
-- TABLE SHAPE ALIGNMENT
-- =========================

alter table if exists public.users
  alter column id set default gen_random_uuid(),
  alter column username set not null,
  alter column email set not null,
  alter column password_hash set not null,
  alter column elo_rating set default 1200,
  alter column role set default 'PLAYER',
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table if exists public.tournaments
  alter column id set default gen_random_uuid(),
  alter column name set not null,
  alter column game_type set not null,
  alter column format set not null,
  alter column state set default 'OPEN',
  alter column max_players set not null,
  alter column rounds set default 0,
  alter column current_round set default 0,
  alter column organizer_id set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table if exists public.participants
  alter column id set default gen_random_uuid(),
  alter column user_id set not null,
  alter column tournament_id set not null,
  alter column current_points set default 0,
  alter column omw_percentage set default 0,
  alter column gw_percentage set default 0,
  alter column seed set default 0,
  alter column has_bye set default false,
  alter column created_at set default now();

alter table if exists public.matches
  alter column id set default gen_random_uuid(),
  alter column tournament_id set not null,
  alter column round_number set not null,
  alter column player1_id set not null,
  alter column status set default 'PENDING',
  alter column player1_wins set default 0,
  alter column player2_wins set default 0,
  alter column draws set default 0,
  alter column created_at set default now(),
  alter column updated_at set default now();

-- Constraints / indexes expected by the app:
create unique index if not exists participants_user_tournament_unique
  on public.participants(user_id, tournament_id);

create unique index if not exists matches_tournament_round_table_unique
  on public.matches(tournament_id, round_number, table_number);

create unique index if not exists users_username_unique
  on public.users(username);

create unique index if not exists users_email_unique
  on public.users(email);

create unique index if not exists users_qr_code_unique
  on public.users(qr_code);

create index if not exists idx_tournaments_state on public.tournaments(state);
create index if not exists idx_tournaments_organizer on public.tournaments(organizer_id);
create index if not exists idx_participants_tournament on public.participants(tournament_id);
create index if not exists idx_matches_tournament_round on public.matches(tournament_id, round_number);

-- Keep updated_at in sync:
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
before update on public.users
for each row execute function public.update_updated_at_column();

drop trigger if exists update_tournaments_updated_at on public.tournaments;
create trigger update_tournaments_updated_at
before update on public.tournaments
for each row execute function public.update_updated_at_column();

drop trigger if exists update_matches_updated_at on public.matches;
create trigger update_matches_updated_at
before update on public.matches
for each row execute function public.update_updated_at_column();

-- =========================
-- RLS (development-friendly)
-- =========================
alter table public.users enable row level security;
alter table public.tournaments enable row level security;
alter table public.participants enable row level security;
alter table public.matches enable row level security;

drop policy if exists users_select_all on public.users;
create policy users_select_all on public.users
for select to anon, authenticated using (true);

drop policy if exists users_insert_all on public.users;
create policy users_insert_all on public.users
for insert to anon, authenticated with check (true);

drop policy if exists users_update_all on public.users;
create policy users_update_all on public.users
for update to anon, authenticated using (true) with check (true);

drop policy if exists tournaments_select_all on public.tournaments;
create policy tournaments_select_all on public.tournaments
for select to anon, authenticated using (true);

drop policy if exists tournaments_insert_all on public.tournaments;
create policy tournaments_insert_all on public.tournaments
for insert to anon, authenticated with check (true);

drop policy if exists tournaments_update_all on public.tournaments;
create policy tournaments_update_all on public.tournaments
for update to anon, authenticated using (true) with check (true);

drop policy if exists tournaments_delete_all on public.tournaments;
create policy tournaments_delete_all on public.tournaments
for delete to anon, authenticated using (true);

drop policy if exists participants_select_all on public.participants;
create policy participants_select_all on public.participants
for select to anon, authenticated using (true);

drop policy if exists participants_insert_all on public.participants;
create policy participants_insert_all on public.participants
for insert to anon, authenticated with check (true);

drop policy if exists participants_update_all on public.participants;
create policy participants_update_all on public.participants
for update to anon, authenticated using (true) with check (true);

drop policy if exists participants_delete_all on public.participants;
create policy participants_delete_all on public.participants
for delete to anon, authenticated using (true);

drop policy if exists matches_select_all on public.matches;
create policy matches_select_all on public.matches
for select to anon, authenticated using (true);

drop policy if exists matches_insert_all on public.matches;
create policy matches_insert_all on public.matches
for insert to anon, authenticated with check (true);

drop policy if exists matches_update_all on public.matches;
create policy matches_update_all on public.matches
for update to anon, authenticated using (true) with check (true);

drop policy if exists matches_delete_all on public.matches;
create policy matches_delete_all on public.matches
for delete to anon, authenticated using (true);

-- =========================
-- REALTIME (live standings/matches)
-- =========================
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tournaments'
    ) then
      execute 'alter publication supabase_realtime add table public.tournaments';
    end if;
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
    ) then
      execute 'alter publication supabase_realtime add table public.participants';
    end if;
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
    ) then
      execute 'alter publication supabase_realtime add table public.matches';
    end if;
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'users'
    ) then
      execute 'alter publication supabase_realtime add table public.users';
    end if;
  end if;
end $$;
