insert into storage.buckets (id, name, public)
values ('questions', 'questions', false)
on conflict (id) do nothing;

do $$ begin
  create policy "read_questions_authenticated" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'questions' and exists (
      select 1 from public.users u where u.id = auth.uid()
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert_questions_recruiter_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'questions' and exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('recruiter','admin')
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "update_questions_recruiter_admin" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'questions' and exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('recruiter','admin')
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "delete_questions_recruiter_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'questions' and exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('recruiter','admin')
    )
  );
exception when duplicate_object then null; end $$;