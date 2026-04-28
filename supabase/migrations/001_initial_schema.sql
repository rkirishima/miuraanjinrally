-- Enable UUID extension


-- Participants table (riders)
create table participants (
  id uuid primary key default gen_random_uuid(),
  rider_number text unique not null,  -- e.g. "R001"
  pin_hash text not null,             -- hashed 4-digit PIN
  rider_name text not null,
  motorcycle_make text,
  motorcycle_model text,
  motorcycle_year integer,
  emergency_contact text,
  emergency_phone text,
  is_admin boolean default false,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Checkpoints table
create table checkpoints (
  id integer primary key,             -- 1-6
  name text not null,
  description text,
  hint text not null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  radius_meters integer not null default 100,
  quiz_question text not null,
  quiz_answer text not null,          -- canonical answer
  quiz_answer_aliases text[],         -- additional accepted answers
  mission_description text not null,
  order_index integer not null,       -- display order
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Checkpoint completions
create table checkpoint_completions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade not null,
  checkpoint_id integer references checkpoints(id) not null,
  arrived_at timestamptz,             -- when GPS proximity triggered
  quiz_passed_at timestamptz,         -- when quiz was answered correctly
  photo_uploaded_at timestamptz,      -- when photo was uploaded
  completed_at timestamptz,           -- when all steps done
  photo_url text,
  quiz_answer_given text,
  gps_lat numeric(10,7),
  gps_lon numeric(10,7),
  unique(participant_id, checkpoint_id)
);

-- Quiz attempts log
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade not null,
  checkpoint_id integer references checkpoints(id) not null,
  answer_given text not null,
  is_correct boolean not null,
  attempted_at timestamptz default now()
);

-- Event settings
create table event_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- ============================================================
-- updated_at trigger for participants
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger participants_updated_at
  before update on participants
  for each row execute procedure set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================
create index idx_checkpoint_completions_participant_id
  on checkpoint_completions(participant_id);

create index idx_quiz_attempts_participant_checkpoint
  on quiz_attempts(participant_id, checkpoint_id);

-- ============================================================
-- Enable Realtime
-- ============================================================
alter publication supabase_realtime add table checkpoint_completions;
alter publication supabase_realtime add table participants;

-- ============================================================
-- Row Level Security
-- ============================================================

-- Helper function: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from participants where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- ---------- participants ----------
alter table participants enable row level security;

-- Any authenticated user can read their own row
create policy "participants_select_own" on participants
  for select
  using (id = auth.uid() or is_admin());

-- Own row update only
create policy "participants_update_own" on participants
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can insert (used by admin setup scripts through service role; here for completeness)
create policy "participants_insert_admin" on participants
  for insert
  with check (is_admin());

-- ---------- checkpoints ----------
alter table checkpoints enable row level security;

-- All authenticated users can read active checkpoints
create policy "checkpoints_select_authenticated" on checkpoints
  for select
  using (auth.role() = 'authenticated');

-- Only admins can insert/update/delete
create policy "checkpoints_write_admin" on checkpoints
  for all
  using (is_admin())
  with check (is_admin());

-- ---------- checkpoint_completions ----------
alter table checkpoint_completions enable row level security;

-- Participants read/insert their own completions; admins read all
create policy "completions_select" on checkpoint_completions
  for select
  using (participant_id = auth.uid() or is_admin());

create policy "completions_insert_own" on checkpoint_completions
  for insert
  with check (participant_id = auth.uid());

create policy "completions_update_own" on checkpoint_completions
  for update
  using (participant_id = auth.uid())
  with check (participant_id = auth.uid());

-- ---------- quiz_attempts ----------
alter table quiz_attempts enable row level security;

-- Participants insert their own; read their own; admins read all
create policy "quiz_attempts_select" on quiz_attempts
  for select
  using (participant_id = auth.uid() or is_admin());

create policy "quiz_attempts_insert_own" on quiz_attempts
  for insert
  with check (participant_id = auth.uid());

-- ---------- event_settings ----------
alter table event_settings enable row level security;

-- All authenticated users can read
create policy "event_settings_select_authenticated" on event_settings
  for select
  using (auth.role() = 'authenticated');

-- Only admins can write
create policy "event_settings_write_admin" on event_settings
  for all
  using (is_admin())
  with check (is_admin());
