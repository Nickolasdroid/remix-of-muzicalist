-- First-party activity analytics. Writes only through SECURITY DEFINER RPCs; reads only for admins.
CREATE TABLE public.activity_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  active_seconds integer NOT NULL DEFAULT 0,
  client_tab_id uuid,
  last_seq integer NOT NULL DEFAULT 0
);
CREATE INDEX activity_sessions_user_last_idx ON public.activity_sessions(user_id, last_seen_at DESC);
CREATE INDEX activity_sessions_started_idx ON public.activity_sessions(started_at);

CREATE TABLE public.activity_daily (
  user_id uuid NOT NULL,
  day date NOT NULL,
  account_type text NOT NULL,
  active_seconds integer NOT NULL DEFAULT 0,
  sessions integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX activity_daily_day_idx ON public.activity_daily(day);

CREATE TABLE public.activity_event_counts (
  user_id uuid NOT NULL,
  day date NOT NULL,
  event text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, event)
);
CREATE INDEX activity_event_counts_day_idx ON public.activity_event_counts(day);

CREATE TABLE public.activity_event_dedupe (
  client_event_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_event_dedupe_created_idx ON public.activity_event_dedupe(created_at);

GRANT SELECT ON public.activity_sessions, public.activity_daily, public.activity_event_counts TO authenticated;
GRANT ALL ON public.activity_sessions, public.activity_daily, public.activity_event_counts, public.activity_event_dedupe TO service_role;

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_event_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_event_dedupe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read activity sessions" ON public.activity_sessions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins read activity daily" ON public.activity_daily FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins read activity events" ON public.activity_event_counts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Heartbeat: the client reports active seconds since its last flush. The server
-- caps the increment by real elapsed time, ignores replays (seq), and splits
-- sessions after 30 minutes without activity.
CREATE OR REPLACE FUNCTION public.activity_heartbeat(_tab_id uuid, _seq integer, _active_seconds integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_type text;
  v_s public.activity_sessions%ROWTYPE;
  v_add int;
  v_new boolean := false;
BEGIN
  IF v_uid IS NULL OR _tab_id IS NULL OR _seq IS NULL THEN RETURN; END IF;
  SELECT user_type::text INTO v_type FROM public.user_roles WHERE user_id = v_uid LIMIT 1;
  IF v_type IS NULL OR v_type NOT IN ('artist', 'user') THEN RETURN; END IF; -- admins/moderators not tracked

  SELECT * INTO v_s FROM public.activity_sessions
   WHERE user_id = v_uid AND last_seen_at > now() - interval '30 minutes'
   ORDER BY last_seen_at DESC LIMIT 1 FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.activity_sessions(user_id, account_type, client_tab_id, last_seq)
    VALUES (v_uid, v_type, _tab_id, _seq) RETURNING * INTO v_s;
    v_new := true;
    v_add := LEAST(GREATEST(COALESCE(_active_seconds, 0), 0), 90);
  ELSE
    IF v_s.client_tab_id = _tab_id AND _seq <= v_s.last_seq THEN RETURN; END IF; -- replay
    v_add := LEAST(GREATEST(COALESCE(_active_seconds, 0), 0), 90,
                   CEIL(EXTRACT(EPOCH FROM now() - v_s.last_seen_at))::int + 5);
  END IF;

  UPDATE public.activity_sessions
     SET last_seen_at = now(), active_seconds = active_seconds + v_add,
         client_tab_id = _tab_id, last_seq = _seq
   WHERE id = v_s.id;

  INSERT INTO public.activity_daily(user_id, day, account_type, active_seconds, sessions)
  VALUES (v_uid, (now() AT TIME ZONE 'UTC')::date, v_type, v_add, CASE WHEN v_new THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, day) DO UPDATE
    SET active_seconds = activity_daily.active_seconds + EXCLUDED.active_seconds,
        sessions = activity_daily.sessions + EXCLUDED.sessions,
        account_type = EXCLUDED.account_type;
END $$;

CREATE OR REPLACE FUNCTION public.track_activity_event(_event text, _client_event_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR _client_event_id IS NULL THEN RETURN; END IF;
  IF _event NOT IN ('artist_profile_view','search_performed','search_result_click','post_view',
                    'announcements_view','booking_started','gallery_media_open') THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND user_type IN ('artist','user')) THEN RETURN; END IF;
  INSERT INTO public.activity_event_dedupe(client_event_id, user_id) VALUES (_client_event_id, v_uid)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN; END IF;
  INSERT INTO public.activity_event_counts(user_id, day, event, count)
  VALUES (v_uid, (now() AT TIME ZONE 'UTC')::date, _event, 1)
  ON CONFLICT (user_id, day, event) DO UPDATE SET count = activity_event_counts.count + 1;
END $$;

REVOKE EXECUTE ON FUNCTION public.activity_heartbeat(uuid, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.track_activity_event(text, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.activity_heartbeat(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_activity_event(text, uuid) TO authenticated;

-- Admin overview for [_from, _to] (UTC days).
CREATE OR REPLACE FUNCTION public.admin_activity_overview(_from date, _to date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  WITH d AS (SELECT * FROM public.activity_daily WHERE day BETWEEN _from AND _to AND active_seconds > 0),
  firsts AS (SELECT user_id, min(day) first_day FROM public.activity_daily WHERE active_seconds > 0 GROUP BY user_id),
  series AS (
    SELECT g::date AS day,
      count(d.user_id) FILTER (WHERE d.account_type='user') AS users,
      count(d.user_id) FILTER (WHERE d.account_type='artist') AS artists,
      COALESCE(sum(d.active_seconds),0) AS active_seconds,
      count(d.user_id) FILTER (WHERE f.first_day = g::date) AS new_users,
      count(d.user_id) FILTER (WHERE f.first_day < g::date) AS returning_users
    FROM generate_series(_from, _to, interval '1 day') g
    LEFT JOIN d ON d.day = g::date
    LEFT JOIN firsts f ON f.user_id = d.user_id
    GROUP BY g ORDER BY g)
  SELECT jsonb_build_object(
    'tracking_started', (SELECT min(day) FROM public.activity_daily),
    'active_users', (SELECT count(DISTINCT user_id) FROM d),
    'active_by_type', (SELECT jsonb_object_agg(account_type, n) FROM (SELECT account_type, count(DISTINCT user_id) n FROM d GROUP BY account_type) x),
    'avg_dau', (SELECT round(avg(users + artists)::numeric, 1) FROM series),
    'mau', (SELECT count(DISTINCT user_id) FROM public.activity_daily WHERE active_seconds > 0 AND day BETWEEN _to - 29 AND _to),
    'sessions', (SELECT COALESCE(sum(sessions),0) FROM public.activity_daily WHERE day BETWEEN _from AND _to),
    'active_seconds', (SELECT COALESCE(sum(active_seconds),0) FROM d),
    'seconds_by_type', (SELECT jsonb_object_agg(account_type, s) FROM (SELECT account_type, sum(active_seconds) s FROM d GROUP BY account_type) x),
    'returning_users', (SELECT count(DISTINCT d.user_id) FROM d JOIN firsts f USING (user_id) WHERE f.first_day < _from OR EXISTS (
        SELECT 1 FROM d d2 WHERE d2.user_id = d.user_id AND d2.day > f.first_day)),
    'new_users', (SELECT count(*) FROM firsts WHERE first_day BETWEEN _from AND _to),
    'series', (SELECT COALESCE(jsonb_agg(to_jsonb(series)), '[]'::jsonb) FROM series)
  ) INTO r;
  RETURN r;
END $$;

-- Admin per-account table. No email/phone returned.
CREATE OR REPLACE FUNCTION public.admin_activity_accounts(
  _from date, _to date, _search text DEFAULT NULL, _type text DEFAULT NULL, _plan text DEFAULT NULL,
  _status text DEFAULT NULL, _sort text DEFAULT 'active_seconds', _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  WITH base AS (
    SELECT p.id, COALESCE(NULLIF(p.stage_name,''), trim(p.first_name||' '||p.last_name)) AS name,
      ur.user_type::text AS account_type,
      CASE WHEN ur.user_type='artist' THEN public.effective_plan(p.id) END AS plan,
      (SELECT max(last_seen_at) FROM public.activity_sessions s WHERE s.user_id=p.id) AS last_active,
      COALESCE(a.secs,0) AS active_seconds, COALESCE(a.sess,0) AS sessions, COALESCE(a.days,0) AS active_days,
      COALESCE(e.views,0) AS profile_views, COALESCE(e.searches,0) AS searches
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.user_type IN ('artist','user')
    LEFT JOIN (SELECT user_id, sum(active_seconds) secs, sum(sessions) sess, count(*) FILTER (WHERE active_seconds>0) days
               FROM public.activity_daily WHERE day BETWEEN _from AND _to GROUP BY user_id) a ON a.user_id=p.id
    LEFT JOIN (SELECT user_id, sum(count) FILTER (WHERE event='artist_profile_view') views,
                      sum(count) FILTER (WHERE event='search_performed') searches
               FROM public.activity_event_counts WHERE day BETWEEN _from AND _to GROUP BY user_id) e ON e.user_id=p.id
    WHERE (_search IS NULL OR _search='' OR COALESCE(p.stage_name,'')||' '||p.first_name||' '||p.last_name ILIKE '%'||_search||'%')
      AND (_type IS NULL OR ur.user_type::text=_type)
  ), f AS (
    SELECT * FROM base
    WHERE (_plan IS NULL OR plan=_plan)
      AND (_status IS NULL OR (_status='active' AND active_seconds>0) OR (_status='inactive' AND active_seconds=0))
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM f),
    'rows', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM (
      SELECT * FROM f ORDER BY
        CASE WHEN _sort='name' THEN NULL ELSE
          CASE _sort WHEN 'sessions' THEN sessions WHEN 'active_days' THEN active_days
                     WHEN 'last_active' THEN EXTRACT(EPOCH FROM last_active)::bigint ELSE active_seconds END END DESC NULLS LAST,
        name ASC
      LIMIT LEAST(_limit,100) OFFSET GREATEST(_offset,0)) x), '[]'::jsonb)
  ) INTO r;
  RETURN r;
END $$;

-- Admin detail for one account. Completed actions come from existing tables.
CREATE OR REPLACE FUNCTION public.admin_activity_account_detail(_user uuid, _from date, _to date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb; t1 timestamptz := _from::timestamptz; t2 timestamptz := (_to + 1)::timestamptz;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT jsonb_build_object(
    'series', COALESCE((SELECT jsonb_agg(jsonb_build_object('day', g::date, 'active_seconds', COALESCE(d.active_seconds,0), 'sessions', COALESCE(d.sessions,0)) ORDER BY g)
       FROM generate_series(_from, _to, interval '1 day') g LEFT JOIN public.activity_daily d ON d.user_id=_user AND d.day=g::date), '[]'::jsonb),
    'last_active', (SELECT max(last_seen_at) FROM public.activity_sessions WHERE user_id=_user),
    'sessions', (SELECT count(*) FROM public.activity_sessions WHERE user_id=_user AND started_at >= t1 AND started_at < t2),
    'avg_session_seconds', (SELECT round(avg(active_seconds)) FROM public.activity_sessions WHERE user_id=_user AND started_at >= t1 AND started_at < t2),
    'events', COALESCE((SELECT jsonb_object_agg(event, n) FROM (SELECT event, sum(count) n FROM public.activity_event_counts WHERE user_id=_user AND day BETWEEN _from AND _to GROUP BY event) x), '{}'::jsonb),
    'completed', jsonb_build_object(
      'booking_requests_sent', (SELECT count(*) FROM public.booking_requests WHERE requester_user_id=_user AND created_at >= t1 AND created_at < t2),
      'follows', (SELECT count(*) FROM public.followers WHERE follower_id=_user AND created_at >= t1 AND created_at < t2),
      'posts_created', (SELECT count(*) FROM public.posts WHERE profile_id=_user AND created_at >= t1 AND created_at < t2),
      'announcements_created', (SELECT count(*) FROM public.announcements WHERE profile_id=_user AND created_at >= t1 AND created_at < t2),
      'reviews_written', (SELECT count(*) FROM public.reviews WHERE reviewer_user_id=_user AND created_at >= t1 AND created_at < t2),
      'gallery_uploads', (SELECT count(*) FROM public.gallery_items WHERE profile_id=_user AND created_at >= t1 AND created_at < t2))
  ) INTO r;
  RETURN r;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_activity_overview(date,date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_activity_accounts(date,date,text,text,text,text,text,int,int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_activity_account_detail(uuid,date,date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_activity_overview(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_activity_accounts(date,date,text,text,text,text,text,int,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_activity_account_detail(uuid,date,date) TO authenticated;

-- Retention: individual sessions 180 days, dedupe keys 2 days; daily aggregates kept 2 years.
CREATE OR REPLACE FUNCTION public.prune_activity_data()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  DELETE FROM public.activity_sessions WHERE last_seen_at < now() - interval '180 days';
  DELETE FROM public.activity_event_dedupe WHERE created_at < now() - interval '2 days';
  DELETE FROM public.activity_daily WHERE day < (now() - interval '730 days')::date;
  DELETE FROM public.activity_event_counts WHERE day < (now() - interval '730 days')::date;
$$;
REVOKE EXECUTE ON FUNCTION public.prune_activity_data() FROM anon, public, authenticated;
SELECT cron.schedule('prune-activity-data', '17 3 * * *', 'SELECT public.prune_activity_data()');