-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid,
  user_id uuid,
  cover_letter text,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'reviewed'::character varying, 'interview'::character varying, 'accepted'::character varying, 'rejected'::character varying]::text[])),
  recruiter_notes jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  website character varying,
  logo_url text,
  contact_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documents (
  id bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  content text NOT NULL,
  metadata jsonb,
  embedding USER-DEFINED,
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.interview_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_type character varying NOT NULL,
  questions jsonb DEFAULT '[]'::jsonb,
  overall_score jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT interview_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT interview_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.job_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid,
  tag_name character varying NOT NULL,
  category character varying DEFAULT 'skill'::character varying,
  CONSTRAINT job_tags_pkey PRIMARY KEY (id),
  CONSTRAINT job_tags_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  title character varying NOT NULL,
  description text NOT NULL,
  requirements jsonb DEFAULT '[]'::jsonb,
  benefits jsonb DEFAULT '[]'::jsonb,
  location character varying,
  salary_min integer,
  salary_max integer,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'paused'::character varying, 'closed'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.question_buckets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  difficulty text CHECK (difficulty = ANY (ARRAY['Dễ'::text, 'Trung cấp'::text, 'Nâng cao'::text])),
  duration text,
  tags ARRAY,
  category text CHECK (category = ANY (ARRAY['jobs'::text, 'scholarship'::text, 'startup'::text, 'softskills'::text])),
  creator_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  views integer DEFAULT 0,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  questions jsonb DEFAULT '[]'::jsonb,
  file_url text,
  CONSTRAINT question_buckets_pkey PRIMARY KEY (id),
  CONSTRAINT question_buckets_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  role character varying DEFAULT 'job_seeker'::character varying CHECK (role::text = ANY (ARRAY['job_seeker'::character varying, 'recruiter'::character varying, 'admin'::character varying]::text[])),
  avatar_url text,
  profile_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.video_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  caller_id uuid,
  receiver_id uuid,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'rejected'::character varying, 'missed'::character varying]::text[])),
  recording_url text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_calls_pkey PRIMARY KEY (id),
  CONSTRAINT video_calls_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES public.users(id),
  CONSTRAINT video_calls_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.voice_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid,
  user_id uuid,
  transcription text NOT NULL,
  analysis_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  cache_key character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT voice_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT voice_analyses_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.interview_sessions(id),
  CONSTRAINT voice_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);