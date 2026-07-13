-- Migrare: slug-uri lizibile pentru profilurile artiștilor
-- Rulează acest fișier în Supabase Dashboard → SQL Editor → New query → Run.
--
-- Ce face:
--   1. Adaugă coloana `slug` în tabela profiles ("Apuseni Fest" -> "apuseni-fest")
--   2. Generează automat slug la crearea oricărui profil nou (trigger)
--   3. Completează slug-urile pentru toate profilurile existente (backfill)
--   4. Garantează unicitatea (duplicate primesc sufix: "apuseni-fest-1")
--
-- Slug-urile sunt STABILE: odată generate, nu se schimbă nici dacă artistul
-- își redenumește numele de scenă, ca linkurile distribuite să nu moară.

-- 1. Extensia unaccent (transformă diacriticele: "Ștefan" -> "Stefan")
create extension if not exists unaccent;

-- 2. Funcția de slugificare
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(public.unaccent(coalesce(input, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- 3. Coloana slug
alter table public.profiles add column if not exists slug text;

-- 4. Trigger: generează slug unic la insert (doar dacă slug e gol)
create or replace function public.set_profile_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  -- Nu suprascrie un slug existent (slug-urile sunt stabile)
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  base := public.slugify(new.stage_name);
  if base is null or base = '' then
    base := left(new.id::text, 8);
  end if;

  candidate := base;
  loop
    exit when not exists (
      select 1 from public.profiles where slug = candidate and id <> new.id
    );
    n := n + 1;
    candidate := base || '-' || n;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists profiles_set_slug on public.profiles;
create trigger profiles_set_slug
  before insert or update on public.profiles
  for each row
  when (new.slug is null)
  execute function public.set_profile_slug();

-- 5. Backfill: generează slug pentru toate profilurile existente
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id, stage_name from public.profiles where slug is null loop
    base := public.slugify(r.stage_name);
    if base is null or base = '' then
      base := left(r.id::text, 8);
    end if;
    candidate := base;
    n := 0;
    while exists (select 1 from public.profiles where slug = candidate and id <> r.id) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    update public.profiles set slug = candidate where id = r.id;
  end loop;
end;
$$;

-- 6. Index unic (după backfill, ca să nu blocheze rândurile vechi)
create unique index if not exists profiles_slug_key on public.profiles (slug);

-- Verificare rapidă (opțional): rulează separat după migrare
-- select stage_name, slug from public.profiles order by created_at desc limit 10;
