create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  created_at timestamptz default now(),
  credits integer not null default 3
);

create table if not exists public.saved_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Type discriminator for unified table: 'idea' or 'hackathon'
  analysis_type text not null default 'idea' check (analysis_type in ('idea','hackathon','frankenstein')),
  idea text not null,
  analysis jsonb not null,
  audio_base64 text,
  created_at timestamptz default now()
);

do $$
begin
  create type public.user_tier as enum ('free', 'paid', 'admin');
exception
  when duplicate_object then null;
end $$;

alter table profiles add column if not exists tier public.user_tier not null default 'free';
alter table profiles add column if not exists credits integer not null default 3;

-- Create credit_transactions table for audit trail
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('deduct', 'add', 'refund', 'admin_adjustment')),
  description text not null,
  metadata jsonb,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table saved_analyses add column if not exists audio_base64 text;

-- Ensure unified schema column exists for fresh or previously-seeded DBs
alter table saved_analyses add column if not exists analysis_type text;
alter table saved_analyses alter column analysis_type set default 'idea';
update saved_analyses set analysis_type = 'idea' where analysis_type is null;
alter table saved_analyses alter column analysis_type set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'saved_analyses_analysis_type_check'
  ) then
    alter table saved_analyses
      add constraint saved_analyses_analysis_type_check
      check (analysis_type in ('idea','hackathon','frankenstein'));
  end if;
end $$;

-- Helpful indexes for common query patterns
create index if not exists idx_saved_analyses_user_id on saved_analyses(user_id);
create index if not exists idx_saved_analyses_type on saved_analyses(analysis_type);
create index if not exists idx_saved_analyses_user_type on saved_analyses(user_id, analysis_type);
create index if not exists idx_saved_analyses_created_at on saved_analyses(created_at desc);

-- Credit system indexes
create index if not exists idx_profiles_credits on profiles(credits);
create index if not exists idx_credit_transactions_user_timestamp on credit_transactions(user_id, timestamp desc);
create index if not exists idx_credit_transactions_type on credit_transactions(type);
create index if not exists idx_credit_transactions_timestamp on credit_transactions(timestamp);

create table if not exists public.saved_hackathon_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_description text not null,
  selected_category text not null check (selected_category in ('resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest')),
  kiro_usage text not null,
  analysis jsonb not null,
  audio_base64 text,
  supporting_materials jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table saved_analyses enable row level security;
alter table credit_transactions enable row level security;

drop policy if exists "Profiles are self-readable" on profiles;
create policy "Profiles are self-readable" on profiles
  for select using (auth.uid() = id);

-- Ensure insert and update policies for profiles (to match production)
drop policy if exists "Profiles are self-insertable" on profiles;
create policy "Profiles are self-insertable" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Profiles are self-updatable" on profiles;
create policy "Profiles are self-updatable" on profiles
  for update using (auth.uid() = id);

drop policy if exists "Saved analyses: owner access" on saved_analyses;
create policy "Saved analyses: owner access" on saved_analyses
  for select using (auth.uid() = user_id);

drop policy if exists "Saved analyses: owner insert" on saved_analyses;
create policy "Saved analyses: owner insert" on saved_analyses
  for insert with check (auth.uid() = user_id);

drop policy if exists "Saved analyses: owner update" on saved_analyses;
create policy "Saved analyses: owner update" on saved_analyses
  for update using (auth.uid() = user_id);

drop policy if exists "Saved analyses: owner delete" on saved_analyses;
create policy "Saved analyses: owner delete" on saved_analyses
  for delete using (auth.uid() = user_id);

-- Credit transactions RLS policies
drop policy if exists "Credit transactions: owner access" on credit_transactions;
create policy "Credit transactions: owner access" on credit_transactions
  for select using (auth.uid() = user_id);

-- Prevent direct user inserts/updates/deletes (system only via service role)
drop policy if exists "Credit transactions: no user insert" on credit_transactions;
create policy "Credit transactions: no user insert" on credit_transactions
  for insert with check (false);

drop policy if exists "Credit transactions: no user update" on credit_transactions;
create policy "Credit transactions: no user update" on credit_transactions
  for update using (false);

drop policy if exists "Credit transactions: no user delete" on credit_transactions;
create policy "Credit transactions: no user delete" on credit_transactions
  for delete using (false);

alter table saved_hackathon_analyses enable row level security;

drop policy if exists "Saved hackathon analyses: owner access" on saved_hackathon_analyses;
create policy "Saved hackathon analyses: owner access" on saved_hackathon_analyses
  for select using (auth.uid() = user_id);

drop policy if exists "Saved hackathon analyses: owner insert" on saved_hackathon_analyses;
create policy "Saved hackathon analyses: owner insert" on saved_hackathon_analyses
  for insert with check (auth.uid() = user_id);

drop policy if exists "Saved hackathon analyses: owner update" on saved_hackathon_analyses;
create policy "Saved hackathon analyses: owner update" on saved_hackathon_analyses
  for update using (auth.uid() = user_id);

drop policy if exists "Saved hackathon analyses: owner delete" on saved_hackathon_analyses;
create policy "Saved hackathon analyses: owner delete" on saved_hackathon_analyses
  for delete using (auth.uid() = user_id);

-- Automatically create a profile row for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert a default profile for the new auth user.
  -- `tier` defaults to 'free' and `credits` defaults to 3 via table defaults.
  insert into public.profiles (id, credits)
  values (new.id, 3)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Ensure the trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
