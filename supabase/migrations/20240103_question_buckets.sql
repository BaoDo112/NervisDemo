-- Create question_buckets table
create table if not exists public.question_buckets (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    difficulty text check (difficulty in ('Dễ', 'Trung cấp', 'Nâng cao')),
    duration text,
    tags text[],
    category text check (category in ('jobs', 'scholarship', 'startup', 'softskills')),
    creator_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    views integer default 0,
    rating numeric(3, 2) default 0,
    review_count integer default 0,
    questions jsonb default '[]'::jsonb -- Store questions as a JSON array of strings
);

-- Enable RLS
alter table public.question_buckets enable row level security;

-- Policies
create policy "Question buckets are viewable by everyone"
    on public.question_buckets for select
    using (true);

create policy "Recruiters can insert question buckets"
    on public.question_buckets for insert
    with check (
        auth.uid() = creator_id 
        and exists (
            select 1 from public.users 
            where id = auth.uid() 
            and (role = 'recruiter' or role = 'admin')
        )
    );

create policy "Creators can update their own buckets"
    on public.question_buckets for update
    using (auth.uid() = creator_id);

create policy "Creators can delete their own buckets"
    on public.question_buckets for delete
    using (auth.uid() = creator_id);

-- Grant permissions
grant select, insert, update, delete on public.question_buckets to authenticated;
grant select on public.question_buckets to anon;
