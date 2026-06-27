ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected'));

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_document_path text NOT NULL,
  selfie_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners or admins can view verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = profile_id OR public.is_admin(auth.uid()));

CREATE POLICY "Owners can insert own verification requests"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete verification requests"
  ON public.verification_requests FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_verification_requests_profile ON public.verification_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

CREATE TRIGGER set_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET verification_status = 'pending', is_verified = false
      WHERE id = NEW.profile_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.profiles
        SET verification_status = 'verified', is_verified = true
        WHERE id = NEW.profile_id;
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.profiles
        SET verification_status = 'rejected', is_verified = false
        WHERE id = NEW.profile_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_profile_verification
  AFTER INSERT OR UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();