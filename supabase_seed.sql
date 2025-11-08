create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.saved_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

alter table saved_analyses add column if not exists audio_base64 text;

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
  -- `tier` defaults to 'free' via table default.
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Ensure the trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
