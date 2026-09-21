-- ============================================================================
-- SVU Campus Exploration App — Database Schema (Supabase / Postgres)
-- ============================================================================
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh
-- project. Safe to re-run: everything is IF NOT EXISTS / drop-and-recreate
-- for enum types only.

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type gem_type as enum ('joker','diamond','ruby','sapphire','emerald','onyx');
exception when duplicate_object then null; end $$;

do $$ begin
  create type redemption_status as enum ('issued','claimed');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Students (pre-made accounts — no self-signup in this version)
-- ----------------------------------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_code text unique not null,       -- the "Pre-Set User" login id
  password_hash text not null,             -- bcrypt hash of "Pre-Set Password"
  display_name text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Categories (the 7 exploration categories)
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                -- e.g. 'institute_tour'
  label text not null,                     -- e.g. 'Institute Tour'
  gem_type gem_type not null,              -- reward type for this category
  is_gate boolean not null default false,  -- must be completed before other categories unlock
  sort_order int not null default 0,
  reward_mode text not null default 'weighted', -- 'all' = every location awards its gem; 'weighted' = gem_pool gems hidden across locations
  gem_pool int                             -- total gems available in this category, when reward_mode = 'weighted'
);

-- ----------------------------------------------------------------------------
-- Locations (individual spots within a category)
-- ----------------------------------------------------------------------------
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  proximity_radius_m int not null default 40,
  did_you_know text,                       -- short fact shown on the flashcard
  info_md text,                            -- longer info content (markdown)
  image_url text,
  pdf_url text,                            -- e.g. Institute Tour PDF
  video_url text,                          -- e.g. Campus History then-vs-now video
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- Quiz questions (one or more per location — spec implies one per location)
-- ----------------------------------------------------------------------------
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  prompt text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('a','b','c','d')),
  shard_reward int not null default 1
);

-- ----------------------------------------------------------------------------
-- Per-student, per-location progress
-- ----------------------------------------------------------------------------
create table if not exists student_location_progress (
  student_id uuid not null references students(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  geotagged_at timestamptz,                -- when they were confirmed physically present
  quiz_passed_at timestamptz,              -- when they answered the quiz correctly
  shard_awarded boolean not null default false,
  gem_awarded gem_type,                    -- null unless this location's hidden gem was assigned+found
  primary key (student_id, location_id)
);

-- ----------------------------------------------------------------------------
-- Hidden, per-student gem assignment
-- Generated once per student per category (respecting the weighting in the
-- brief, e.g. 2 gems across 7 eateries) the first time they enter that
-- category, so it stays stable across the session but is never shown to them.
-- ----------------------------------------------------------------------------
create table if not exists student_gem_assignments (
  student_id uuid not null references students(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  gem_type gem_type not null,
  primary key (student_id, location_id)
);

-- ----------------------------------------------------------------------------
-- Shard → Joker Gem conversions (log)
-- ----------------------------------------------------------------------------
create table if not exists shard_conversions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  shards_used int not null,
  joker_gems_created int not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Prizes & recipes (config table — edit freely, no rebuild needed)
-- ----------------------------------------------------------------------------
create table if not exists prizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  recipe jsonb not null,                   -- e.g. {"diamond":2,"ruby":1,"joker":1}
  active boolean not null default true,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- Redemptions (code issued at redemption time, claimed at the prize desk)
-- ----------------------------------------------------------------------------
create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  prize_id uuid not null references prizes(id),
  code text unique not null,               -- short code shown to student & staff
  gems_consumed jsonb not null,            -- snapshot of what was deducted
  status redemption_status not null default 'issued',
  issued_at timestamptz not null default now(),
  claimed_at timestamptz
);

-- Needed so the seed script can upsert by natural key.
do $$ begin
  alter table locations add constraint locations_category_name_unique unique (category_id, name);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table prizes add constraint prizes_name_unique unique (name);
exception when duplicate_object then null; end $$;

create index if not exists idx_slp_student on student_location_progress(student_id);
create index if not exists idx_sga_student on student_gem_assignments(student_id);
create index if not exists idx_redemptions_student on redemptions(student_id);
create index if not exists idx_redemptions_code on redemptions(code);
