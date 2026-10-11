ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

UPDATE public.gallery_items g SET position = s.rn
FROM (SELECT id, row_number() OVER (PARTITION BY profile_id, type ORDER BY created_at, id) AS rn FROM public.gallery_items) s
WHERE s.id = g.id;

CREATE INDEX IF NOT EXISTS gallery_items_profile_type_position_idx ON public.gallery_items(profile_id, type, position);

-- New items go to the end of their type list.
CREATE OR REPLACE FUNCTION public.set_gallery_item_position()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  SELECT COALESCE(max(position), 0) + 1 INTO NEW.position
  FROM public.gallery_items WHERE profile_id = NEW.profile_id AND type = NEW.type;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS set_gallery_item_position_trg ON public.gallery_items;
CREATE TRIGGER set_gallery_item_position_trg BEFORE INSERT ON public.gallery_items
FOR EACH ROW EXECUTE FUNCTION public.set_gallery_item_position();

-- Active = within the owner's effective plan limit for that media type, by position.
CREATE OR REPLACE FUNCTION public.gallery_item_is_active(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE((
    SELECT (SELECT count(*) FROM public.gallery_items o
              WHERE o.profile_id = g.profile_id AND o.type = g.type
                AND (o.position < g.position OR (o.position = g.position AND o.id < g.id)))
           < public.plan_limit(g.profile_id, CASE WHEN g.type = 'video' THEN 'gallery_videos' ELSE 'gallery_images' END)
    FROM public.gallery_items g WHERE g.id = _id
  ), false);
$$;
GRANT EXECUTE ON FUNCTION public.gallery_item_is_active(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view gallery items" ON public.gallery_items;
CREATE POLICY "Public sees active gallery items; owners and admins see all"
ON public.gallery_items FOR SELECT TO anon, authenticated
USING (
  auth.uid() = profile_id
  OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()))
  OR public.gallery_item_is_active(id)
);

-- Owner reorders one media type by giving the full ordered id list.
CREATE OR REPLACE FUNCTION public.reorder_gallery_items(_type text, _ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE i int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(_ids) x WHERE NOT EXISTS (
      SELECT 1 FROM public.gallery_items g WHERE g.id = x AND g.profile_id = auth.uid() AND g.type = _type)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  FOR i IN 1 .. COALESCE(array_length(_ids, 1), 0) LOOP
    UPDATE public.gallery_items SET position = i WHERE id = _ids[i] AND profile_id = auth.uid();
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.reorder_gallery_items(text, uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.reorder_gallery_items(text, uuid[]) TO authenticated;