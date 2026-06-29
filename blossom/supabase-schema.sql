-- Run in Supabase SQL editor, then add URL + anon key to blossom/js/config.js

create table if not exists public.blossom_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.blossom_saves enable row level security;

create policy "Users read own save"
  on public.blossom_saves for select
  using (auth.uid() = user_id);

create policy "Users upsert own save"
  on public.blossom_saves for insert
  with check (auth.uid() = user_id);

create policy "Users update own save"
  on public.blossom_saves for update
  using (auth.uid() = user_id);