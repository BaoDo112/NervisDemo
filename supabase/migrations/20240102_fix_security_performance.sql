-- Fix RLS Policy Performance for video_calls
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own calls" ON public.video_calls;
DROP POLICY IF EXISTS "Users can create calls" ON public.video_calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON public.video_calls;

-- Recreate policies with optimized auth.uid()
CREATE POLICY "Users can view their own calls" ON public.video_calls
    FOR SELECT USING ((select auth.uid()) = caller_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "Users can create calls" ON public.video_calls
    FOR INSERT WITH CHECK ((select auth.uid()) = caller_id);

CREATE POLICY "Users can update their own calls" ON public.video_calls
    FOR UPDATE USING ((select auth.uid()) = caller_id OR (select auth.uid()) = receiver_id);

-- Fix Security Warning for handle_new_user
-- Set search_path to public to prevent search_path hijacking
ALTER FUNCTION public.handle_new_user() SET search_path = public;
