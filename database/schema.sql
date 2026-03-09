-- HomePilot Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- HOUSEHOLDS (multi-tenant support for SaaS)
-- ============================================================
create table if not exists households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  admin_user_id uuid references auth.users(id),
  meal_plan_day int not null default 5, -- 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  photo_proof_days int not null default 30,
  timezone text not null default 'Asia/Singapore',
  created_at timestamptz default now()
);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references households(id),
  role text not null check (role in ('admin', 'helper')),
  language text not null default 'id', -- id=Bahasa, tl=Tagalog, th=Thai, my=Burmese, en=English
  display_name text,
  created_at timestamptz default now()
);

-- ============================================================
-- CHORES
-- ============================================================
create table if not exists chores (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  title_en text not null,
  time_slot text, -- e.g. '06:30', '07:00-09:00', '09:00-13:30'
  time_label text, -- e.g. 'Morning', 'Afternoon'
  days_of_week int[] not null default '{1,2,3,4,5,6}', -- 0=Sun,1=Mon,...,6=Sat; empty = every day
  is_monthly boolean not null default false,
  youtube_url text,
  requires_photo boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- ============================================================
-- CHORE COMPLETIONS (daily tick-offs)
-- ============================================================
create table if not exists chore_completions (
  id uuid primary key default uuid_generate_v4(),
  chore_id uuid references chores(id) on delete cascade,
  household_id uuid references households(id),
  completed_by uuid references auth.users(id),
  date date not null default current_date,
  photo_url text,
  admin_reviewed boolean default false,
  admin_note text,
  created_at timestamptz default now(),
  unique(chore_id, date)
);

-- ============================================================
-- TRANSLATION CACHE
-- ============================================================
create table if not exists translations (
  id uuid primary key default uuid_generate_v4(),
  source_text text not null,
  language text not null,
  translated_text text not null,
  created_at timestamptz default now(),
  unique(source_text, language)
);

-- ============================================================
-- AD-HOC INSTRUCTIONS
-- ============================================================
create table if not exists instructions (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  sent_by uuid references auth.users(id),
  message_en text not null,
  message_translated text,
  language text not null default 'id',
  youtube_url text,
  sent_at timestamptz default now(),
  acknowledged_at timestamptz,
  is_active boolean default true
);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  subscription_json jsonb not null,
  created_at timestamptz default now(),
  unique(user_id)
);

-- ============================================================
-- RECIPES
-- ============================================================
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  title text not null,
  cuisine_theme text not null check (cuisine_theme in ('western', 'vegetarian', 'chinese_main', 'chinese_side', 'noodles', 'indonesian', 'indian', 'baby_breakfast', 'baby_dinner', 'baby_snack', 'other')),
  source_url text, -- Instagram or YouTube URL
  ingredients_json jsonb, -- [{name, qty, is_pantry}]
  steps_en text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- MEAL PLANS (weekly)
-- ============================================================
create table if not exists meal_plans (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  week_start_date date not null, -- Monday of that week
  status text not null default 'pending' check (status in ('pending', 'approved', 'ordered')),
  monday_recipe_id uuid references recipes(id),
  tuesday_recipe_id uuid references recipes(id),
  wednesday_main_id uuid references recipes(id),
  wednesday_side1_id uuid references recipes(id),
  wednesday_side2_id uuid references recipes(id),
  thursday_recipe_id uuid references recipes(id),
  friday_recipe_id uuid references recipes(id),
  use_up_ingredients text, -- free text from helper/admin
  admin_notes text,
  curated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- PANTRY CHECKS (helper fills on meal planning day)
-- ============================================================
create table if not exists pantry_checks (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  checked_by uuid references auth.users(id),
  items_json jsonb not null default '[]', -- [{name, available: bool}]
  free_text_leftovers text,
  submitted_at timestamptz default now(),
  week_start_date date not null
);

-- ============================================================
-- GROCERY LISTS
-- ============================================================
create table if not exists grocery_lists (
  id uuid primary key default uuid_generate_v4(),
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  household_id uuid references households(id),
  items_json jsonb not null default '[]', -- [{name, category, qty, is_pantry, have_confirmed, redmart_url, lazada_url, alert}]
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table households enable row level security;
alter table profiles enable row level security;
alter table chores enable row level security;
alter table chore_completions enable row level security;
alter table translations enable row level security;
alter table instructions enable row level security;
alter table push_subscriptions enable row level security;
alter table recipes enable row level security;
alter table meal_plans enable row level security;
alter table pantry_checks enable row level security;
alter table grocery_lists enable row level security;

-- Helper function to get current user's household_id
create or replace function get_household_id()
returns uuid as $$
  select household_id from profiles where id = auth.uid()
$$ language sql security definer;

-- Helper function to get current user's role
create or replace function get_user_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer;

-- Households: members can read their own
create policy "household_members_read" on households for select
  using (id = get_household_id());

-- Profiles: own profile read/write + household members read
create policy "profiles_own_rw" on profiles for all
  using (id = auth.uid());
create policy "profiles_household_read" on profiles for select
  using (household_id = get_household_id());

-- Chores: household members can read, admin can write
create policy "chores_read" on chores for select
  using (household_id = get_household_id());
create policy "chores_admin_write" on chores for all
  using (household_id = get_household_id() and get_user_role() = 'admin')
  with check (household_id = get_household_id() and get_user_role() = 'admin');

-- Chore completions: household members read, helpers write own
create policy "completions_read" on chore_completions for select
  using (household_id = get_household_id());
create policy "completions_helper_write" on chore_completions for all
  using (household_id = get_household_id() and completed_by = auth.uid())
  with check (household_id = get_household_id() and completed_by = auth.uid());

-- Translations: all authenticated users read, service role writes
create policy "translations_read" on translations for select
  using (auth.role() = 'authenticated');

-- Instructions: household members
create policy "instructions_read" on instructions for select
  using (household_id = get_household_id());
create policy "instructions_admin_write" on instructions for all
  using (household_id = get_household_id() and get_user_role() = 'admin')
  with check (household_id = get_household_id() and get_user_role() = 'admin');
create policy "instructions_helper_ack" on instructions for update
  using (household_id = get_household_id() and get_user_role() = 'helper')
  with check (household_id = get_household_id() and get_user_role() = 'helper');

-- Push subscriptions: own only
create policy "push_own" on push_subscriptions for all
  using (user_id = auth.uid());

-- Recipes: household members read, admin write
create policy "recipes_read" on recipes for select
  using (household_id = get_household_id());
create policy "recipes_admin_write" on recipes for all
  using (household_id = get_household_id() and get_user_role() = 'admin')
  with check (household_id = get_household_id() and get_user_role() = 'admin');

-- Meal plans: household members
create policy "meal_plans_read" on meal_plans for select
  using (household_id = get_household_id());
create policy "meal_plans_admin_write" on meal_plans for all
  using (household_id = get_household_id() and get_user_role() = 'admin')
  with check (household_id = get_household_id() and get_user_role() = 'admin');

-- Pantry checks: household members
create policy "pantry_read" on pantry_checks for select
  using (household_id = get_household_id());
create policy "pantry_helper_write" on pantry_checks for insert
  with check (household_id = get_household_id());

-- Grocery lists: household members read, admin write
create policy "grocery_read" on grocery_lists for select
  using (household_id = get_household_id());
create policy "grocery_admin_write" on grocery_lists for all
  using (household_id = get_household_id() and get_user_role() = 'admin')
  with check (household_id = get_household_id() and get_user_role() = 'admin');

-- ============================================================
-- ENABLE REALTIME for live updates
-- ============================================================
alter publication supabase_realtime add table instructions;
alter publication supabase_realtime add table chore_completions;
alter publication supabase_realtime add table pantry_checks;
alter publication supabase_realtime add table meal_plans;
