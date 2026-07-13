create extension if not exists unaccent;

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

alter table public.profiles add column if not exists slug text;

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

create unique index if not exists profiles_slug_key on public.profiles (slug);