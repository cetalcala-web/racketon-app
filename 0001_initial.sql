-- RACKETON 0.1 — Esquema inicial seguro. Ejecutar en SQL Editor de Supabase.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  municipality text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.sports (
  id text primary key,
  name text not null unique
);
insert into public.sports(id,name) values ('tennis','Tenis'),('padel','Pádel'),('pickleball','Pickleball'),('squash','Squash'),('badminton','Bádminton') on conflict(id) do nothing;
create table if not exists public.player_sports (
  player_id uuid not null references public.profiles(id) on delete cascade,
  sport_id text not null references public.sports(id),
  created_at timestamptz not null default now(),
  primary key(player_id,sport_id)
);
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organization_type text not null check (organization_type in ('club','federation','organizer')),
  created_at timestamptz not null default now()
);
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('member','manager','admin')),
  primary key(organization_id,user_id)
);
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  municipality text,
  created_at timestamptz not null default now()
);
create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id),
  sport_id text not null references public.sports(id),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sport_id text not null references public.sports(id),
  name text not null,
  status text not null default 'draft' check (status in ('draft','open','active','finished','cancelled')),
  created_at timestamptz not null default now()
);
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id),
  competition_id uuid references public.competitions(id),
  player_a uuid not null references public.profiles(id),
  player_b uuid not null references public.profiles(id),
  status text not null default 'proposed' check (status in ('proposed','accepted','played','confirmed','disputed','cancelled')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint different_players check(player_a <> player_b)
);
-- 0.1: acceso mínimo. No se habilitan operaciones de reservas/resultados sin lógica de autorización.
alter table public.profiles enable row level security;
alter table public.sports enable row level security;
alter table public.player_sports enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.venues enable row level security;
alter table public.courts enable row level security;
alter table public.competitions enable row level security;
alter table public.matches enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "read sports" on public.sports for select to anon, authenticated using (true);
create policy "read own sports" on public.player_sports for select to authenticated using (player_id = (select auth.uid()));
create policy "insert own sports" on public.player_sports for insert to authenticated with check (player_id = (select auth.uid()));
create policy "delete own sports" on public.player_sports for delete to authenticated using (player_id = (select auth.uid()));
create policy "read own memberships" on public.organization_members for select to authenticated using (user_id = (select auth.uid()));
-- Create profiles on signup, regardless of email-confirmation settings.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name','')) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
