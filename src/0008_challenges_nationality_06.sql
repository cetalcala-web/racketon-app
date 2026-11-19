-- RACKETON 0.6: nacionalidad opcional + desafíos amistosos y de ranking.
-- Requiere 0007_player_discovery_05.sql. Ejecutar una sola vez en Supabase SQL Editor.
begin;
alter table public.player_discovery_preferences add column if not exists nationality text not null default '';
alter table public.player_discovery_preferences add column if not exists show_nationality boolean not null default false;
alter table public.player_discovery_preferences drop constraint if exists nationality_length;
alter table public.player_discovery_preferences add constraint nationality_length check (char_length(nationality)<=80);

-- Una liga/ranking puede crearse después con un organizador. Esta versión prepara
-- la pertenencia; no permite autoinvitarse a rankings de terceros.
create table if not exists public.tennis_rankings (
 id uuid primary key default gen_random_uuid(), name text not null check (char_length(btrim(name)) between 3 and 120),
 organizer_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.tennis_ranking_members (
 ranking_id uuid not null references public.tennis_rankings(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(), primary key(ranking_id,user_id)
);
create table if not exists public.tennis_challenges (
 id uuid primary key default gen_random_uuid(),
 challenger_id uuid not null references auth.users(id) on delete cascade,
 challenged_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('friendly','ranking')),
 ranking_id uuid references public.tennis_rankings(id),
 proposed_at timestamptz,
 location text not null default '' check (char_length(location)<=180),
 message text not null default '' check (char_length(message)<=500),
 status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(), responded_at timestamptz,
 check (challenger_id <> challenged_id),
 check ((kind='ranking' and ranking_id is not null) or (kind='friendly' and ranking_id is null))
);
create index if not exists tennis_challenges_challenger_idx on public.tennis_challenges(challenger_id,created_at desc);
create index if not exists tennis_challenges_challenged_idx on public.tennis_challenges(challenged_id,created_at desc);
create unique index if not exists tennis_challenges_pending_unique on public.tennis_challenges
 (challenger_id,challenged_id,kind,coalesce(ranking_id,'00000000-0000-0000-0000-000000000000'::uuid)) where status='pending';

alter table public.tennis_rankings enable row level security;
alter table public.tennis_ranking_members enable row level security;
alter table public.tennis_challenges enable row level security;
revoke all on public.tennis_rankings,public.tennis_ranking_members,public.tennis_challenges from anon,authenticated;
grant select on public.tennis_rankings,public.tennis_ranking_members,public.tennis_challenges to authenticated;
drop policy if exists "Rankings visible to participants" on public.tennis_rankings;
create policy "Rankings visible to participants" on public.tennis_rankings for select to authenticated
 using (organizer_id=(select auth.uid()) or exists(select 1 from public.tennis_ranking_members m where m.ranking_id=id and m.user_id=(select auth.uid())));
drop policy if exists "Own ranking memberships" on public.tennis_ranking_members;
-- Evitar recursión RLS: solo se permite ver la propia pertenencia.
create policy "Own ranking memberships" on public.tennis_ranking_members for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "Challenge participants read" on public.tennis_challenges;
create policy "Challenge participants read" on public.tennis_challenges for select to authenticated
 using (challenger_id=(select auth.uid()) or challenged_id=(select auth.uid()));

create or replace function public.create_tennis_challenge(
 p_opponent uuid,p_kind text default 'friendly',p_ranking_id uuid default null,
 p_proposed_at timestamptz default null,p_location text default '',p_message text default ''
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid:=auth.uid(); v_id uuid;
begin
 if v_me is null then raise exception 'Inicia sesión.'; end if;
 if p_opponent is null or p_opponent=v_me then raise exception 'Rival no válido.'; end if;
 if p_kind not in ('friendly','ranking') then raise exception 'Tipo de desafío no válido.'; end if;
 if length(coalesce(p_location,''))>180 or length(coalesce(p_message,''))>500 then raise exception 'Texto demasiado largo.'; end if;
 if p_proposed_at is not null and p_proposed_at < now() then raise exception 'La fecha debe ser futura.'; end if;
 if not exists(select 1 from public.tennis_ratings where user_id=v_me) then raise exception 'Completa tu evaluación de tenis.'; end if;
 if not exists(select 1 from public.player_discovery_preferences d join public.tennis_ratings r on r.user_id=d.user_id
    where d.user_id=p_opponent and d.discoverable=true) then raise exception 'El rival no está disponible en el buscador.'; end if;
 if p_kind='ranking' then
   if p_ranking_id is null or not exists(select 1 from public.tennis_ranking_members a
       join public.tennis_ranking_members b on b.ranking_id=a.ranking_id
       where a.ranking_id=p_ranking_id and a.user_id=v_me and b.user_id=p_opponent)
   then raise exception 'Ambos jugadores deben pertenecer al mismo ranking.'; end if;
 elsif p_ranking_id is not null then raise exception 'Un amistoso no pertenece a un ranking.'; end if;
 insert into public.tennis_challenges(challenger_id,challenged_id,kind,ranking_id,proposed_at,location,message)
 values(v_me,p_opponent,p_kind,p_ranking_id,p_proposed_at,btrim(coalesce(p_location,'')),btrim(coalesce(p_message,''))) returning id into v_id;
 return v_id;
end $$;

create or replace function public.respond_tennis_challenge(p_challenge_id uuid,p_action text)
returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid:=auth.uid();
begin
 if v_me is null then raise exception 'Inicia sesión.'; end if;
 if p_action not in ('accepted','declined','cancelled') then raise exception 'Acción no válida.'; end if;
 update public.tennis_challenges set status=p_action,responded_at=now()
 where id=p_challenge_id and status='pending' and
 ((p_action in ('accepted','declined') and challenged_id=v_me) or (p_action='cancelled' and challenger_id=v_me));
 if not found then raise exception 'Desafío no disponible o sin permisos.'; end if;
end $$;

-- Rankings compartidos con un rival, sin exponer otras membresías.
create or replace function public.shared_tennis_rankings(p_opponent uuid)
returns table(id uuid,name text) language sql stable security definer set search_path='' as $$
 select r.id,r.name from public.tennis_rankings r
 join public.tennis_ranking_members a on a.ranking_id=r.id and a.user_id=auth.uid()
 join public.tennis_ranking_members b on b.ranking_id=r.id and b.user_id=p_opponent
 where auth.uid() is not null and p_opponent<>auth.uid() order by r.name limit 50;
$$;
revoke all on function public.shared_tennis_rankings(uuid) from public,anon;
grant execute on function public.shared_tennis_rankings(uuid) to authenticated;

-- Listado seguro para el propio usuario: solo participantes, sin correos privados.
create or replace function public.my_tennis_challenges()
returns table(id uuid,challenger_id uuid,challenged_id uuid,kind text,ranking_id uuid,
 ranking_name text,proposed_at timestamptz,location text,message text,status text,created_at timestamptz,
 challenger_name text,challenged_name text)
language sql stable security definer set search_path='' as $$
 select c.id,c.challenger_id,c.challenged_id,c.kind,c.ranking_id,r.name,c.proposed_at,c.location,c.message,c.status,c.created_at,
 coalesce(nullif(a.display_name,''),'Jugador'),coalesce(nullif(b.display_name,''),'Jugador')
 from public.tennis_challenges c
 left join public.tennis_rankings r on r.id=c.ranking_id
 left join public.player_details a on a.user_id=c.challenger_id
 left join public.player_details b on b.user_id=c.challenged_id
 where auth.uid() is not null and (c.challenger_id=auth.uid() or c.challenged_id=auth.uid())
 order by c.created_at desc limit 100;
$$;

-- Mantener compatibilidad de la búsqueda previa; nacionalidad visible solo con permiso.
drop function if exists public.search_tennis_players(text,text,numeric,numeric,text);
create function public.search_tennis_players(
 p_country text default '',p_city text default '',p_min_rating numeric default 1,
 p_max_rating numeric default 20,p_availability text default ''
) returns table(user_id uuid,display_name text,country text,city text,rating numeric,
 rating_status text,matches_played integer,preferred_format text,availability text,nationality text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
 if p_min_rating is null or p_max_rating is null or p_min_rating<1 or p_max_rating>20 or p_min_rating>p_max_rating
 then raise exception 'Intervalo de rating no válido.'; end if;
 return query select d.user_id,d.display_name,pref.country,d.city,r.rating,r.status,r.matches_played,
 d.preferred_format,d.availability,case when pref.show_nationality then pref.nationality else '' end
 from public.player_discovery_preferences pref
 join public.player_details d on d.user_id=pref.user_id
 join public.tennis_ratings r on r.user_id=pref.user_id
 where pref.discoverable=true and pref.user_id<>auth.uid()
 and length(btrim(d.display_name))>0 and length(btrim(d.city))>0 and length(btrim(pref.country))>0
 and coalesce(d.sports->'Tenis'->>'enabled','false')='true'
 and (p_country='' or strpos(lower(pref.country),lower(p_country))>0)
 and (p_city='' or strpos(lower(d.city),lower(p_city))>0)
 and (p_availability='' or strpos(lower(d.availability),lower(p_availability))>0)
 and r.rating between p_min_rating and p_max_rating
 order by r.rating,d.display_name limit 50;
end $$;
-- La función cambia su tipo de retorno: Postgres exige borrar la firma antigua.
-- Se elimina la versión anterior y se recrea abajo en un bloque de migración independiente.
revoke all on function public.create_tennis_challenge(uuid,text,uuid,timestamptz,text,text) from public,anon;
grant execute on function public.create_tennis_challenge(uuid,text,uuid,timestamptz,text,text) to authenticated;
revoke all on function public.respond_tennis_challenge(uuid,text) from public,anon;
grant execute on function public.respond_tennis_challenge(uuid,text) to authenticated;
revoke all on function public.my_tennis_challenges() from public,anon;
grant execute on function public.my_tennis_challenges() to authenticated;
revoke all on function public.search_tennis_players(text,text,numeric,numeric,text) from public,anon;
grant execute on function public.search_tennis_players(text,text,numeric,numeric,text) to authenticated;
commit;
