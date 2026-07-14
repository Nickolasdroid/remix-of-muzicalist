-- Migrare: cache global de traduceri UI
-- Rulează în Supabase Dashboard → SQL Editor (sau cere-i lui Lovable să o ruleze).
--
-- Scop: fiecare text de interfață se traduce prin AI O SINGURĂ DATĂ per limbă,
-- pentru toți vizitatorii, pentru totdeauna. Înainte, fiecare vizitator nou
-- declanșa propriile apeluri AI pentru aceleași texte.

create table if not exists public.ui_text_translations (
  lang text not null,
  source_text text not null,
  translated_text text not null,
  created_at timestamptz not null default now(),
  primary key (lang, source_text)
);

comment on table public.ui_text_translations is
  'Cache global pentru traducerile AI ale textelor de interfață. Scris doar de funcția edge translate-locale (service role).';

-- RLS activat, fără politici publice: doar funcțiile edge (service role) citesc/scriu.
alter table public.ui_text_translations enable row level security;

-- Index pentru dump-ul per limbă
create index if not exists ui_text_translations_lang_idx on public.ui_text_translations (lang);
