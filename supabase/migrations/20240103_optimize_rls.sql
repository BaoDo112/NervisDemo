-- Optimize RLS policies for question_buckets to avoid unnecessary re-evaluation

-- Drop existing policies
drop policy if exists "Recruiters can insert question buckets" on public.question_buckets;
drop policy if exists "Creators can update their own buckets" on public.question_buckets;
drop policy if exists "Creators can delete their own buckets" on public.question_buckets;

-- Re-create optimized policies
create policy "Recruiters can insert question buckets"
    on public.question_buckets for insert
    with check (
        auth.uid() = creator_id 
        and exists (
            select 1 from public.users 
            where id = (select auth.uid()) -- Optimize auth.uid() call
            and (role = 'recruiter' or role = 'admin')
        )
    );

create policy "Creators can update their own buckets"
    on public.question_buckets for update
    using (auth.uid() = creator_id);

create policy "Creators can delete their own buckets"
    on public.question_buckets for delete
    using (auth.uid() = creator_id);
