-- Supabase SQL migration for Šeimos Medis (Family Tree)
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Enable UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table people (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null check (char_length(trim(first_name)) between 1 and 120),
  last_name text check (last_name is null or char_length(trim(last_name)) <= 120),
  maiden_name text check (maiden_name is null or char_length(trim(maiden_name)) <= 120),
  gender text check (gender in ('M', 'F')),
  birth_date text check (
    birth_date is null
    or birth_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
  ),
  birth_place text check (birth_place is null or char_length(trim(birth_place)) <= 160),
  death_date text check (
    death_date is null
    or death_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
  ),
  death_place text check (death_place is null or char_length(trim(death_place)) <= 160),
  burial_place text check (burial_place is null or char_length(trim(burial_place)) <= 160),
  cause_of_death text check (cause_of_death is null or char_length(trim(cause_of_death)) <= 240),
  occupation text check (occupation is null or char_length(trim(occupation)) <= 120),
  notes text check (notes is null or char_length(notes) <= 5000),
  confidence text not null default 'confirmed'
    check (confidence in ('confirmed', 'probable', 'uncertain', 'legendary')),
  is_deceased boolean not null default false,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table marriages (
  id uuid primary key default uuid_generate_v4(),
  person1_id uuid not null references people(id) on delete cascade,
  person2_id uuid not null references people(id) on delete cascade,
  relationship_status text not null default 'married'
    check (relationship_status in ('married', 'divorced', 'widowed')),
  marriage_date text check (
    marriage_date is null
    or marriage_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
  ),
  divorce_date text check (
    divorce_date is null
    or divorce_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
  ),
  marriage_place text check (marriage_place is null or char_length(trim(marriage_place)) <= 160),
  order_index integer not null default 0,
  check (person1_id <> person2_id)
);

create table parent_child (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references people(id) on delete cascade,
  child_id uuid not null references people(id) on delete cascade,
  confidence text check (confidence in ('confirmed', 'probable', 'uncertain', 'legendary')),
  unique (parent_id, child_id),
  check (parent_id <> child_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_marriages_person1 on marriages(person1_id);
create index idx_marriages_person2 on marriages(person2_id);
create index idx_parent_child_parent on parent_child(parent_id);
create index idx_parent_child_child on parent_child(child_id);

-- ============================================================
-- APP-LEVEL AUTHORIZATION (header-based)
-- ============================================================

create table if not exists app_settings (
  id boolean primary key default true,
  app_password_hash text not null,
  updated_at timestamptz not null default now(),
  check (id = true)
);

insert into app_settings (id, app_password_hash)
values (true, crypt('CHANGE_ME_STRONG_APP_PASSWORD', gen_salt('bf')))
on conflict (id) do nothing;

create or replace function medis_request_password()
returns text
language sql
stable
as $$
  select coalesce(
    (current_setting('request.headers', true)::json ->> 'x-medis-password'),
    ''
  );
$$;

create or replace function medis_is_authorized()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from app_settings s
    where s.id = true
      and s.app_password_hash = crypt(medis_request_password(), s.app_password_hash)
  );
$$;

grant execute on function medis_request_password() to anon, authenticated;
grant execute on function medis_is_authorized() to anon, authenticated;
revoke all on app_settings from anon, authenticated;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Require valid app password header for all operations.
-- ============================================================

alter table people enable row level security;
alter table marriages enable row level security;
alter table parent_child enable row level security;
alter table app_settings enable row level security;

drop policy if exists "Allow all on people" on people;
drop policy if exists "Allow all on marriages" on marriages;
drop policy if exists "Allow all on parent_child" on parent_child;

drop policy if exists "App auth on people" on people;
drop policy if exists "App auth on marriages" on marriages;
drop policy if exists "App auth on parent_child" on parent_child;
drop policy if exists "No direct app_settings read" on app_settings;

create policy "App auth on people"
  on people for all
  using (medis_is_authorized())
  with check (medis_is_authorized());

create policy "App auth on marriages"
  on marriages for all
  using (medis_is_authorized())
  with check (medis_is_authorized());

create policy "App auth on parent_child"
  on parent_child for all
  using (medis_is_authorized())
  with check (medis_is_authorized());

create policy "No direct app_settings read"
  on app_settings for select
  using (false);

-- ============================================================
-- OPTIONAL: Sample data for testing
-- Uncomment and run to seed the database with a small family
-- ============================================================

/*
insert into people (first_name, last_name, gender, birth_date, confidence) values
  ('Jonas', 'Kazlauskas', 'M', '1935', 'confirmed'),
  ('Ona', 'Kazlauskienė', 'F', '1938', 'confirmed'),
  ('Petras', 'Kazlauskas', 'M', '1960-05-12', 'confirmed'),
  ('Marija', 'Kazlauskaitė', 'F', '1963-08-20', 'confirmed'),
  ('Antanas', 'Kazlauskas', 'M', '1985-01-15', 'confirmed');

-- Get IDs for relationships (run after insert, replace UUIDs):
-- insert into marriages (person1_id, person2_id, marriage_date) values ('<jonas_id>', '<ona_id>', '1958');
-- insert into parent_child (parent_id, child_id) values ('<jonas_id>', '<petras_id>');
-- insert into parent_child (parent_id, child_id) values ('<ona_id>', '<petras_id>');
*/
