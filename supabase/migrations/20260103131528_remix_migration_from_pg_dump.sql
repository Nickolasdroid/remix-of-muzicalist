CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: artist_specialization; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.artist_specialization AS ENUM (
    'Singer',
    'Instrumentalist',
    'DJ',
    'Band'
);


--
-- Name: experience_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.experience_level AS ENUM (
    'Beginner',
    'Intermediate',
    'Advanced',
    'Professional'
);


--
-- Name: user_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_type AS ENUM (
    'artist',
    'user'
);


--
-- Name: get_or_create_conversation(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_or_create_conversation(_artist_id uuid, _participant_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user uuid;
BEGIN
  v_current_user := auth.uid();
  
  -- Validate: current user must be one of the participants
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_current_user NOT IN (_artist_id, _participant_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if conversation exists (including soft-deleted) in either direction
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (artist_id = _artist_id AND participant_id = _participant_id)
     OR (artist_id = _participant_id AND participant_id = _artist_id);
  
  IF v_conversation_id IS NOT NULL THEN
    -- Conversation exists, restore it for the current user
    IF v_current_user = (SELECT artist_id FROM public.conversations WHERE id = v_conversation_id) THEN
      UPDATE public.conversations SET deleted_by_artist = false WHERE id = v_conversation_id;
    ELSE
      UPDATE public.conversations SET deleted_by_participant = false WHERE id = v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
  END IF;
  
  -- No conversation exists, create new one
  INSERT INTO public.conversations (artist_id, participant_id)
  VALUES (_artist_id, _participant_id)
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;


--
-- Name: get_user_type(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_type(_user_id uuid) RETURNS public.user_type
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT user_type
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;


--
-- Name: handle_new_message_undelete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_message_undelete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_artist_id uuid;
  v_participant_id uuid;
BEGIN
  -- Get conversation participants
  SELECT artist_id, participant_id
    INTO v_artist_id, v_participant_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  -- If sender is the artist, reset deleted_by_participant so participant sees the conversation again
  IF NEW.sender_id = v_artist_id THEN
    UPDATE public.conversations
      SET deleted_by_participant = false
    WHERE id = NEW.conversation_id AND deleted_by_participant = true;
  -- If sender is the participant, reset deleted_by_artist so artist sees the conversation again
  ELSIF NEW.sender_id = v_participant_id THEN
    UPDATE public.conversations
      SET deleted_by_artist = false
    WHERE id = NEW.conversation_id AND deleted_by_artist = true;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: soft_delete_conversation(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.soft_delete_conversation(_conversation_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_artist_id uuid;
  v_participant_id uuid;
BEGIN
  SELECT artist_id, participant_id
    INTO v_artist_id, v_participant_id
  FROM public.conversations
  WHERE id = _conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF auth.uid() = v_artist_id THEN
    UPDATE public.conversations
      SET deleted_by_artist = true,
          deleted_at_by_artist = now()
    WHERE id = _conversation_id;
  ELSIF auth.uid() = v_participant_id THEN
    UPDATE public.conversations
      SET deleted_by_participant = true,
          deleted_at_by_participant = now()
    WHERE id = _conversation_id;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    title text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    media_url text,
    media_type text
);


--
-- Name: booking_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    requester_name text NOT NULL,
    requester_email text NOT NULL,
    requester_phone text NOT NULL,
    event_date date NOT NULL,
    event_type text,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    event_end_date date
);


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    event_date date NOT NULL,
    status text NOT NULL,
    event_type text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT calendar_events_status_check CHECK ((status = ANY (ARRAY['busy'::text, 'blocked'::text, 'available'::text])))
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artist_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_by_artist boolean DEFAULT false NOT NULL,
    deleted_by_participant boolean DEFAULT false NOT NULL,
    deleted_at_by_artist timestamp with time zone,
    deleted_at_by_participant timestamp with time zone
);


--
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gallery_items_type_check CHECK ((type = ANY (ARRAY['image'::text, 'video'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    content text NOT NULL,
    media_url text,
    media_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT posts_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    stage_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    county text NOT NULL,
    specialization public.artist_specialization,
    music_genres text,
    experience_level public.experience_level,
    number_of_events integer DEFAULT 0 NOT NULL,
    career_start_year integer,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    plan text DEFAULT 'Free'::text NOT NULL,
    bio text,
    estimated_price text,
    facebook_url text,
    instagram_url text,
    youtube_url text,
    tiktok_url text,
    spotify_url text,
    country text DEFAULT 'România'::text,
    instruments text
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    reviewer_name text NOT NULL,
    reviewer_email text NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewer_user_id uuid,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_type public.user_type NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: booking_requests booking_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_profile_id_event_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_profile_id_event_date_key UNIQUE (profile_id, event_date);


--
-- Name: conversations conversations_artist_id_participant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_artist_id_participant_id_key UNIQUE (artist_id, participant_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);


--
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);


--
-- Name: idx_reviews_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_profile_id ON public.reviews USING btree (profile_id);


--
-- Name: unique_conversation_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_conversation_pair ON public.conversations USING btree (LEAST(artist_id, participant_id), GREATEST(artist_id, participant_id));


--
-- Name: messages on_message_insert_undelete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_message_insert_undelete AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_undelete();


--
-- Name: profiles set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: announcements update_announcements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: booking_requests update_booking_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: calendar_events update_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: announcements announcements_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: calendar_events calendar_events_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: gallery_items gallery_items_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: posts posts_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_user_id_fkey FOREIGN KEY (reviewer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: booking_requests Anyone can create booking requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create booking requests" ON public.booking_requests FOR INSERT WITH CHECK (true);


--
-- Name: reviews Anyone can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);


--
-- Name: announcements Anyone can view announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);


--
-- Name: calendar_events Anyone can view calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view calendar events" ON public.calendar_events FOR SELECT USING (true);


--
-- Name: gallery_items Anyone can view gallery items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view gallery items" ON public.gallery_items FOR SELECT USING (true);


--
-- Name: posts Anyone can view posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);


--
-- Name: reviews Anyone can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);


--
-- Name: reviews Artists can delete reviews on their profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Artists can delete reviews on their profile" ON public.reviews FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: booking_requests Artists can delete their booking requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Artists can delete their booking requests" ON public.booking_requests FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: booking_requests Artists can update their booking requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Artists can update their booking requests" ON public.booking_requests FOR UPDATE USING ((auth.uid() = profile_id));


--
-- Name: booking_requests Artists can view their booking requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Artists can view their booking requests" ON public.booking_requests FOR SELECT USING ((auth.uid() = profile_id));


--
-- Name: reviews Reviewers can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviewers can delete their own reviews" ON public.reviews FOR DELETE USING ((auth.uid() = reviewer_user_id));


--
-- Name: conversations Users can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (((auth.uid() = participant_id) AND (auth.uid() <> artist_id)));


--
-- Name: announcements Users can create their own announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own announcements" ON public.announcements FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: calendar_events Users can create their own calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own calendar events" ON public.calendar_events FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: gallery_items Users can create their own gallery items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own gallery items" ON public.gallery_items FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: posts Users can create their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: messages Users can delete messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete messages in their conversations" ON public.messages FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.artist_id = auth.uid()) OR (c.participant_id = auth.uid()))))));


--
-- Name: conversations Users can delete their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their conversations" ON public.conversations FOR DELETE USING (((auth.uid() = artist_id) OR (auth.uid() = participant_id)));


--
-- Name: announcements Users can delete their own announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own announcements" ON public.announcements FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: calendar_events Users can delete their own calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: gallery_items Users can delete their own gallery items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own gallery items" ON public.gallery_items FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users can insert their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.artist_id = auth.uid()) OR (c.participant_id = auth.uid())))))));


--
-- Name: messages Users can update messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update messages in their conversations" ON public.messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.artist_id = auth.uid()) OR (c.participant_id = auth.uid()))))));


--
-- Name: conversations Users can update their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their conversations" ON public.conversations FOR UPDATE TO authenticated USING (((auth.uid() = artist_id) OR (auth.uid() = participant_id))) WITH CHECK (true);


--
-- Name: announcements Users can update their own announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own announcements" ON public.announcements FOR UPDATE USING ((auth.uid() = profile_id));


--
-- Name: calendar_events Users can update their own calendar events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own calendar events" ON public.calendar_events FOR UPDATE USING ((auth.uid() = profile_id));


--
-- Name: posts Users can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING ((auth.uid() = profile_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.artist_id = auth.uid()) OR (c.participant_id = auth.uid()))))));


--
-- Name: conversations Users can view their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING ((((auth.uid() = artist_id) AND (deleted_by_artist = false)) OR ((auth.uid() = participant_id) AND (deleted_by_participant = false))));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;