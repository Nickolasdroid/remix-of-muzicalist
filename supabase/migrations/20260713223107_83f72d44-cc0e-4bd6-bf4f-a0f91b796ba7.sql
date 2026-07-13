create or replace function public.slugify(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both '-' from
    regexp_replace(
      lower(public.unaccent(coalesce(input, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;