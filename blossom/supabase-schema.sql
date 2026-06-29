-- Blossom Life — run once in Supabase SQL editor:
-- https://supabase.com/dashboard/project/mtqezgchhggmlrfzfyjb/sql/new

create table if not exists public.blossom_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.blossom_saves enable row level security;

drop policy if exists "Users read own save" on public.blossom_saves;
drop policy if exists "Users insert own save" on public.blossom_saves;
drop policy if exists "Users update own save" on public.blossom_saves;
drop policy if exists "Users upsert own save" on public.blossom_saves;

create policy "Users read own save"
  on public.blossom_saves for select
  using (auth.uid() = user_id);

create policy "Users insert own save"
  on public.blossom_saves for insert
  with check (auth.uid() = user_id);

create policy "Users update own save"
  on public.blossom_saves for update
  using (auth.uid() = user_id);