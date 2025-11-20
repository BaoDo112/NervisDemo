-- Create video_calls table
CREATE TABLE IF NOT EXISTS public.video_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected', 'missed')),
    recording_url TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for video_calls
CREATE INDEX idx_video_calls_caller_id ON public.video_calls(caller_id);
CREATE INDEX idx_video_calls_receiver_id ON public.video_calls(receiver_id);
CREATE INDEX idx_video_calls_status ON public.video_calls(status);
CREATE INDEX idx_video_calls_created_at ON public.video_calls(created_at DESC);

-- Enable RLS for video_calls
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_calls
CREATE POLICY "Users can view their own calls" ON public.video_calls
    FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create calls" ON public.video_calls
    FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own calls" ON public.video_calls
    FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Create storage bucket for call recordings if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('call_recordings', 'call_recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for call_recordings
CREATE POLICY "Users can upload their own recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'call_recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'call_recordings' AND
        (
            auth.uid()::text = (storage.foldername(name))[1] OR
            EXISTS (
                SELECT 1 FROM public.video_calls
                WHERE recording_url LIKE '%' || name
                AND (caller_id = auth.uid() OR receiver_id = auth.uid())
            )
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_video_calls_updated_at
    BEFORE UPDATE ON public.video_calls
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
