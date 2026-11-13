# Final data sync: Lovable database -> Muzicalist Supabase

Run this once Lovable has been **frozen** (nobody edits or publishes there) and right before the
site is switched to the new project. Goal: after it, the two databases hold the same data, and
only the differences listed under "Expected differences" remain.

Projects: source `ccdgoduekpiesdmkluff` (Lovable), destination `fpqvupbqoqsalrfahvab` (Supabase).
**Nothing is ever written to the source.** Every step on the source is a read-only SELECT.

## 0. Before starting
- [ ] The owner confirmed in writing that nobody edits/publishes in Lovable.
- [ ] Take a fresh export of the Lovable database (Cloud -> Database -> Export) and keep it as the
      archive (it holds personal data: store it offline, not in the repo).
- [ ] The destination has the same schema: same function count and definitions (see section 5).

## 1. Delta report (read-only)
Per-table fingerprint, run on BOTH databases and compared. It ignores `updated_at` and normalises
the old project address inside URLs, so the intentional rewrite does not show up as a difference.

```sql
select string_agg(table_name || '=' || n || ':' || h, ',' order by table_name)
from (
  select table_name,
    (xpath('/row/n/text()', x))[1]::text as n,
    (xpath('/row/h/text()', x))[1]::text as h
  from (
    select table_name, query_to_xml(format($q$
      select count(*) as n,
             left(md5(coalesce(string_agg(md5(replace((to_jsonb(t) - 'updated_at')::text,
               'ccdgoduekpiesdmkluff', 'fpqvupbqoqsalrfahvab')), '' order by (to_jsonb(t) - 'updated_at')::text), '')), 10) as h
      from public.%I t$q$, table_name), false, true, '') as x
    from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'
  ) a
) b;
```

For every table that differs, list the differing rows by primary key:
`left(id::text,8) || '=' || left(md5(<same normalised row text>),6)` on both sides, then compare.

Accounts (compare equal = nothing to do):
```sql
select count(*) || ':' || left(md5(coalesce(string_agg(md5(concat_ws('|', id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, banned_until, deleted_at, phone, is_anonymous)),
  '' order by id), '')), 10) from auth.users;
select count(*) || ':' || left(md5(coalesce(string_agg(md5(concat_ws('|', id, user_id, provider, provider_id,
  identity_data)), '' order by id), '')), 10) from auth.identities;
```

## 2. Apply (destination only)
Rules per table, after confirming the delta report:

| Tables | Rule |
|---|---|
| `activity_*` | insert missing rows, update changed ones (usage statistics) |
| `notifications`, `followers`, `profiles`, `ui_text_translations`, anything else that differs | upsert by primary key from the source; **delete** destination rows that no longer exist in the source |
| `pending_artist_registrations` | upsert (copy `avatar_base64` exactly) |
| `email_template_versions` | **skip**: the destination holds intentional edits (new logo address, AI line removed) |
| `auth.users`, `auth.identities` | new users / changed password hashes: copy the rows (none were different on 2026-11-13) |
| any column holding a storage URL | replace `ccdgoduekpiesdmkluff.supabase.co` with `fpqvupbqoqsalrfahvab.supabase.co` while copying |

Mechanics for each table:
```sql
-- source (read-only): the rows to move
select jsonb_agg(to_jsonb(x)) from public.<table> x where id in (...);

-- destination: upsert them
begin;
alter table public.<table> disable trigger user;   -- only on tables with triggers (profiles, posts, ...)
insert into public.<table>
  select * from jsonb_populate_recordset(null::public.<table>, '<json from above>'::jsonb)
  on conflict (id) do update set (<cols>) = (excluded.<cols>);
alter table public.<table> enable trigger user;
commit;
```

Storage (public bucket `avatars`): list names and sizes on both sides, write the missing ones to a
tab-separated file (`name<TAB>mime`) and run the transfer tool on it:
`python3 storage_transfer/transfer.py <list file>`. It downloads each file from the source's public
URL and uploads it to the destination (service key fetched at run time; nothing stored in the file).

Sequences: `booking_contract_number_seq`, `moderation_case_number_seq` must be >= the source values.

## 3. Verify
Run the delta report again. The only differences left must be the ones in the next section.
Also check: users, identities, storage object count/bytes, function count, cron jobs.

## 4. Expected differences after the sync
- `email_template_versions`: edited on purpose in the destination.
- The 4 videos (about 578 MB) that are not in destination storage (Free plan, 50 MB per file).
- `pgmq` queues, the Lovable email functions and queue triggers: removed on purpose.
- Vault: only `welcome_email_trigger_secret` exists in the destination.

## 5. State on 2026-11-13 (dry run, read-only)
- 49 of 59 tables identical. Auth users and identities identical. Storage: 846 of 850 objects.
- Differences: `activity_*` (about 192 rows), `notifications` (+1), `ui_text_translations` (+215),
  `followers` (1 added, 1 removed in the source), `profiles` (1 row), `pending_artist_registrations`
  (14 rows, a trailing newline in `avatar_base64`), `email_template_versions` (intentional).
- Schema: 155 functions in `public` on the destination (the 6 old email-queue functions were removed
  on purpose); everything else matches the source.

## 5b. Pre-sync done on 2026-11-13 (before the freeze)
Applied to the destination only (the source was only read): activity statistics (`activity_daily`,
`activity_event_counts`, `activity_sessions`), 217 UI translations, 1 follower swapped (old row removed,
new one added), its notification, the profile row `22eb40e1`, and the 14 `pending_artist_registrations`
whose `avatar_base64` had one extra trailing newline. Triggers were disabled only inside each
transaction and are all enabled again.

Result of the re-run report: **55 of 59 tables identical**. Still different, all expected:
- `activity_daily` (+1 row) and `activity_sessions` (+2 rows): traffic generated on the test site;
- `activity_event_dedupe`: deliberately not copied (an anti-duplicate cache pruned daily by a cron);
- `email_template_versions`: intentional edits in the destination.
Auth users and identities identical; storage 846 of 850 objects (the 4 videos).

The final pass after the freeze only has to catch what changed since this run.

## 6. Rollback
The source is never modified, so rolling back means pointing the site's `VITE_SUPABASE_*` values
back at the old project. If a table was synced wrongly, re-run the upsert for that table from the
source; the destination can also be restored from its own backup (Pro plan) or from the export.
