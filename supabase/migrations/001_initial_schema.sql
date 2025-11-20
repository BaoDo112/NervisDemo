-- Job Recruitment & Interview Prep Platform - Initial Database Schema
-- This migration creates all necessary tables with RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'recruiter', 'admin')),
    avatar_url TEXT,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url TEXT,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    location VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interview', 'accepted', 'rejected')),
    recruiter_notes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL,
    questions JSONB DEFAULT '[]',
    overall_score JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create voice_analyses table
CREATE TABLE public.voice_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    transcription TEXT NOT NULL,
    analysis_scores JSONB NOT NULL DEFAULT '{}',
    suggestions JSONB DEFAULT '[]',
    cache_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_tags table
CREATE TABLE public.job_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'skill'
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_salary ON public.jobs(salary_min, salary_max);
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);

CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);

CREATE INDEX idx_voice_analyses_user_id ON public.voice_analyses(user_id);
CREATE INDEX idx_voice_analyses_session_id ON public.voice_analyses(session_id);
CREATE INDEX idx_voice_analyses_created_at ON public.voice_analyses(created_at DESC);
CREATE INDEX idx_voice_analyses_cache_key ON public.voice_analyses(cache_key);

CREATE INDEX idx_job_tags_job_id ON public.job_tags(job_id);
CREATE INDEX idx_job_tags_tag_name ON public.job_tags(tag_name);
CREATE INDEX idx_job_tags_category ON public.job_tags(category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for companies table
CREATE POLICY "Anyone can view companies" ON public.companies
    FOR SELECT TO authenticated, anon;

CREATE POLICY "Recruiters can manage own company" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'recruiter'
            AND users.profile_data->>'company_id' = companies.id::text
        )
    );

-- RLS Policies for jobs table
CREATE POLICY "Anyone can view active jobs" ON public.jobs
    FOR SELECT TO authenticated, anon
    USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Recruiters can manage company jobs" ON public.jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'recruiter'
            AND users.profile_data->>'company_id' = jobs.company_id::text
        )
    );

-- RLS Policies for applications table
CREATE POLICY "Users can view own applications" ON public.applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can view company applications" ON public.applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            JOIN public.users u ON u.id = auth.uid()
            WHERE j.id = applications.job_id
            AND u.role = 'recruiter'
            AND u.profile_data->>'company_id' = j.company_id::text
        )
    );

CREATE POLICY "Recruiters can update company applications" ON public.applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            JOIN public.users u ON u.id = auth.uid()
            WHERE j.id = applications.job_id
            AND u.role = 'recruiter'
            AND u.profile_data->>'company_id' = j.company_id::text
        )
    );

-- RLS Policies for interview_sessions table
CREATE POLICY "Users can view own sessions" ON public.interview_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.interview_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.interview_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for voice_analyses table
CREATE POLICY "Users can view own analyses" ON public.voice_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses" ON public.voice_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for job_tags table
CREATE POLICY "Anyone can view job tags" ON public.job_tags
    FOR SELECT TO authenticated, anon;

CREATE POLICY "Recruiters can manage job tags" ON public.job_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            JOIN public.users u ON u.id = auth.uid()
            WHERE j.id = job_tags.job_id
            AND u.role = 'recruiter'
            AND u.profile_data->>'company_id' = j.company_id::text
        )
    );

-- Grant permissions to roles
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.job_tags TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'job_seeker')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();