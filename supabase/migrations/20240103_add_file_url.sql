-- Add file_url column to question_buckets
alter table public.question_buckets 
add column if not exists file_url text;

-- Create storage bucket for question files
insert into storage.buckets (id, name, public)
values ('question-files', 'question-files', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'question-files' );

create policy "Recruiters can upload question files"
  on storage.objects for insert
  with check (
    bucket_id = 'question-files' 
    and auth.role() = 'authenticated'
  );

create policy "Creators can update their own files"
  on storage.objects for update
  using ( bucket_id = 'question-files' and auth.uid() = owner );

create policy "Creators can delete their own files"
  on storage.objects for delete
  using ( bucket_id = 'question-files' and auth.uid() = owner );
