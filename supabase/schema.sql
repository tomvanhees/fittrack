-- supabase/schema.sql
--
-- Remote schema voor FitTrack cloud-sync. Plak dit volledig in de Supabase
-- SQL-editor (Dashboard → SQL Editor → New query → Run). Idempotent: veilig
-- om opnieuw te draaien.
--
-- Spiegelt de 7 lokale SQLite-tabellen (zie db/migrations.ts). Verschillen:
--   * de globale sleutel is `uuid` (PK) i.p.v. een lokale auto-increment id;
--   * relaties verwijzen naar de `*_uuid` van de ouder, niet naar lokale id's;
--   * elke rij heeft `user_id` zodat Row Level Security per gebruiker isoleert;
--   * sync-metadata: version (monotone teller), deleted (tombstone), updated_at.
--
-- Conflictresolutie (in de sync-engine, db/sync/): hoogste `version` wint, dan
-- nieuwste `updated_at`, dan hoogste `uuid`. De client zet deze waarden bij een
-- upsert; daarom overschrijft de server `updated_at` NIET met een trigger.

-- ───────────────────────── Tabellen ─────────────────────────

create table if not exists public.exercises (
  uuid        uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text not null default 'custom',
  is_custom   boolean not null default false,
  version     integer not null default 1,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists public.week_templates (
  uuid        uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  text,
  version     integer not null default 1,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists public.template_days (
  uuid           uuid primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  template_uuid  uuid not null references public.week_templates(uuid) on delete cascade,
  weekday        integer not null check (weekday between 0 and 6),
  label          text,
  version        integer not null default 1,
  deleted        boolean not null default false,
  updated_at     timestamptz not null default now()
);

create table if not exists public.template_day_exercises (
  uuid               uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  template_day_uuid  uuid not null references public.template_days(uuid) on delete cascade,
  exercise_uuid      uuid not null references public.exercises(uuid),
  sort_order         integer not null default 0,
  sets               integer not null default 3,
  version            integer not null default 1,
  deleted            boolean not null default false,
  updated_at         timestamptz not null default now()
);

create table if not exists public.workout_days (
  uuid               uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               text not null,
  template_day_uuid  uuid references public.template_days(uuid),
  is_rest_day        boolean not null default false,
  completed_at       text,
  version            integer not null default 1,
  deleted            boolean not null default false,
  updated_at         timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.workout_exercises (
  uuid               uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  workout_day_uuid   uuid not null references public.workout_days(uuid) on delete cascade,
  exercise_uuid      uuid not null references public.exercises(uuid),
  sort_order         integer not null default 0,
  planned_sets       integer,
  version            integer not null default 1,
  deleted            boolean not null default false,
  updated_at         timestamptz not null default now()
);

create table if not exists public.workout_sets (
  uuid                  uuid primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  workout_exercise_uuid uuid not null references public.workout_exercises(uuid) on delete cascade,
  set_number            integer not null,
  weight                real not null default 0,
  reps                  integer not null default 0,
  completed_at          text,
  version               integer not null default 1,
  deleted               boolean not null default false,
  updated_at            timestamptz not null default now()
);

-- ───────────────────── Indexen (pull-cursor) ─────────────────────
-- De sync-engine haalt per tabel rijen op met `updated_at > cursor` voor de
-- huidige gebruiker; deze index maakt die query snel.

create index if not exists idx_exercises_user_updated              on public.exercises (user_id, updated_at);
create index if not exists idx_week_templates_user_updated         on public.week_templates (user_id, updated_at);
create index if not exists idx_template_days_user_updated          on public.template_days (user_id, updated_at);
create index if not exists idx_template_day_exercises_user_updated on public.template_day_exercises (user_id, updated_at);
create index if not exists idx_workout_days_user_updated           on public.workout_days (user_id, updated_at);
create index if not exists idx_workout_exercises_user_updated      on public.workout_exercises (user_id, updated_at);
create index if not exists idx_workout_sets_user_updated           on public.workout_sets (user_id, updated_at);

-- ─────────────────── Row Level Security (verplicht) ───────────────────
-- Elke gebruiker ziet/wijzigt enkel eigen rijen. Hierdoor is de anon key in
-- de app veilig: zonder geldige sessie of voor andermans rijen geeft Postgres
-- niets terug.

alter table public.exercises               enable row level security;
alter table public.week_templates          enable row level security;
alter table public.template_days           enable row level security;
alter table public.template_day_exercises  enable row level security;
alter table public.workout_days            enable row level security;
alter table public.workout_exercises       enable row level security;
alter table public.workout_sets            enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'exercises', 'week_templates', 'template_days', 'template_day_exercises',
    'workout_days', 'workout_exercises', 'workout_sets'
  ]
  loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format(
      'create policy own_rows on public.%I for all to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id)', t
    );
  end loop;
end $$;
