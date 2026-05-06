CREATE TABLE public.pending_artist_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_plain text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  stage_name text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  county text NOT NULL,
  specialization text,
  experience_level text,
  career_start_year int,
  avatar_base64 text,
  plan text NOT NULL,
  billing text NOT NULL,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_artist_registrations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pending_artist_session ON public.pending_artist_registrations(stripe_session_id);
CREATE INDEX idx_pending_artist_email ON public.pending_artist_registrations(email);