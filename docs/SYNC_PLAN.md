# Auth + cloud-sync — technisch plan (Supabase)

Status: **ontwerp**. De lokale fundering (sync-metadata kolommen + triggers,
versiegestuurde migraties) staat al in de repo; dit document beschrijft hoe we
daarop authenticatie en bidirectionele sync bouwen.

Uitgangspunt blijft **offline-first**: SQLite is altijd de bron van waarheid op
het toestel; sync draait op de achtergrond en mag nooit de offline-werking
blokkeren.

---

## 1. Wat er al ligt (fundering)

`db/migrations.ts` (schemaversie 3) heeft elke syncbare tabel uitgebreid met:

| kolom        | type    | rol                                                        |
|--------------|---------|------------------------------------------------------------|
| `uuid`       | TEXT    | globaal stabiele sleutel (RFC-4122 v4), uniek geïndexeerd  |
| `updated_at` | TEXT    | ISO-timestamp van laatste lokale wijziging                 |
| `version`    | INTEGER | monotone teller, +1 bij elke lokale wijziging              |
| `deleted`    | INTEGER | tombstone-vlag voor verwijderingen (0/1)                   |

Triggers (`trg_<tabel>_insert` / `_update`) houden `uuid`, `updated_at` en
`version` automatisch bij. De update-trigger slaat over wanneer `version`
expliciet wordt gezet (`NEW.version <> OLD.version`) — zo kan de sync-laag een
remote-versie toepassen **zonder** een nieuwe lokale wijziging te triggeren.

`SYNCABLE_TABLES` (volgorde = FK-afhankelijkheid):

```
exercises → week_templates → template_days → template_day_exercises
→ workout_days → workout_exercises → workout_sets
body_metrics (geen FK's; sinds schema v5)
```

---

## 2. Benodigde dependencies

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage \
  react-native-url-polyfill expo-web-browser expo-auth-session expo-crypto
```

- `@supabase/supabase-js` — client (auth + Postgres + realtime).
- `@react-native-async-storage/async-storage` — persistente auth-sessie.
- `react-native-url-polyfill` — vereist door supabase-js in RN (`import 'react-native-url-polyfill/auto'`).
- `expo-auth-session` + `expo-web-browser` — Google OAuth redirect-flow.
- `expo-crypto` — UUID's client-side genereren waar nodig (parity met de SQL-expressie).

Env (gelezen via `process.env.EXPO_PUBLIC_*`, dus veilig in de bundle — de anon
key is publiek en wordt afgeschermd door RLS):

```
# .env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Voeg `.env` toe aan `.gitignore` (lokale waarden) en documenteer de keys in
`.env.example`.

---

## 3. Authenticatie

### Methoden
1. **E-mail + wachtwoord** (`supabase.auth.signUp` / `signInWithPassword`).
2. **Google** (aanrader, sluit aan op de Play Store). Via `expo-auth-session`
   met `supabase.auth.signInWithIdToken({ provider: 'google', token })`, of de
   PKCE-webflow met `signInWithOAuth` + deep link terug naar `fittrack://`.

### Sessiebeheer
- Supabase-client met `auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }`.
- Nieuwe `store/authStore.ts` (Zustand): `session`, `user`, `status`,
  `signIn/signUp/signInWithGoogle/signOut`. Abonneer op
  `supabase.auth.onAuthStateChange`.
- UI: vervang het "Binnenkort"-blok in `app/(tabs)/settings.tsx` door een
  account-sectie (ingelogd: e-mail + uitloggen + syncstatus; uitgelogd: knop
  naar een nieuw `app/modals/auth.tsx` scherm).
- **Sync is optioneel**: zonder login werkt alles lokaal door. Pas na login
  wordt de sync-engine geactiveerd.

---

## 4. Supabase-schema (Postgres)

Eén tabel per lokale tabel, met `user_id` voor isolatie. `uuid` is de primaire
sleutel; FK's verwijzen naar de **uuid** van de ouder (niet naar lokale int-id's).

```sql
-- voorbeeld voor twee tabellen; herhaal het patroon voor elke syncbare tabel
create table exercises (
  uuid        uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text not null default 'custom',
  is_custom   boolean not null default false,
  version     integer not null default 1,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table workout_sets (
  uuid                 uuid primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  workout_exercise_uuid uuid not null references workout_exercises(uuid) on delete cascade,
  set_number           integer not null,
  weight               real not null default 0,
  reps                 integer not null default 0,
  version              integer not null default 1,
  deleted              boolean not null default false,
  updated_at           timestamptz not null default now()
);

create index on exercises (user_id, updated_at);
create index on workout_sets (user_id, updated_at);
```

> **Schema v5 (RPE, dag-notities, lichaamsmetingen).** De lokale migratie 5
> voegt `workout_sets.rpe` (real, nullable) en `workout_days.notes` (text,
> nullable) toe en introduceert een nieuwe syncbare tabel `body_metrics`. De
> sync-engine (`db/sync/engine.ts`) verstuurt deze velden al. **Voor het remote
> backend live gaat** moet het Postgres-schema bijgewerkt worden, anders falen
> push/pull voor die kolommen/tabel:
>
> ```sql
> alter table workout_sets add column rpe real;
> alter table workout_days add column notes text;
>
> create table body_metrics (
>   uuid        uuid primary key,
>   user_id     uuid not null references auth.users(id) on delete cascade,
>   date        text not null,
>   weight      real,
>   body_fat    real,
>   note        text,
>   version     integer not null default 1,
>   deleted     boolean not null default false,
>   updated_at  timestamptz not null default now()
> );
> create unique index on body_metrics (user_id, date);
> create index on body_metrics (user_id, updated_at);
> -- RLS-policy "own rows" zoals hieronder, ook voor body_metrics.
> ```

### Row Level Security (verplicht)

```sql
alter table exercises enable row level security;
create policy "own rows" on exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- idem voor elke tabel
```

De anon key in de app is hierdoor veilig: een gebruiker ziet/wijzigt enkel eigen
rijen. **Nooit** de service-role key in de app.

---

## 5. Sync-engine

Nieuwe map `db/sync/`:

- `client.ts` — supabase-client (singleton).
- `mapping.ts` — lokale rij ↔ remote payload; vertaalt lokale int-FK's naar
  parent-`uuid` en omgekeerd (lookup via de `uuid`-kolommen die er al zijn).
- `engine.ts` — `pull()`, `push()`, `syncAll()`.
- `state.ts` — lokale `sync_state` tabel (cursor per tabel). Toe te voegen in
  **migratie 4**:

```sql
CREATE TABLE IF NOT EXISTS sync_state (
  table_name     TEXT PRIMARY KEY,
  last_pulled_at TEXT,   -- server-timestamp cursor
  last_pushed_at TEXT
);
```

### Push (lokaal → remote)
1. Per tabel (ouder→kind): selecteer "dirty" rijen
   (`updated_at > last_pushed_at`).
2. Map naar payload (int-FK → parent-uuid, `user_id` = huidige user).
3. `upsert(payload, { onConflict: 'uuid' })`.
4. Bewaar de hoogste `updated_at` als nieuwe `last_pushed_at`.

### Pull (remote → lokaal)
1. Per tabel (ouder→kind): `select * where updated_at > last_pulled_at`.
2. Voor elke rij: bestaat de `uuid` lokaal?
   - **Nee** → insert (met expliciete `version` = remote-versie, zodat de
     insert-trigger geen nieuwe versie maakt; FK-uuid → lokale int-id resolven).
   - **Ja** → conflictregel toepassen (zie onder); bij "remote wint":
     `UPDATE ... SET version = <remote>, ...` — de update-trigger slaat over
     omdat `version` verandert.
3. `deleted = true` → lokaal soft-deleten (zie §6).
4. Bewaar de hoogste server-`updated_at` als nieuwe `last_pulled_at`.

### Conflictresolutie — last-write-wins, deterministisch
Vergelijk in deze volgorde:
1. hoogste `version` wint;
2. bij gelijke `version`: nieuwste `updated_at` wint;
3. bij gelijke timestamp: hoogste `uuid` (lexicografisch) — louter om
   determinisme te garanderen.

Server-`updated_at` (Postgres `now()`) is leidend om client-klokafwijking te
neutraliseren; bewaar lokaal eventueel een aparte `server_updated_at`-cursor.

### Triggers
- `syncAll()` bij: app-foreground, na een mutatie (gedebounced ~2 s), en een
  handmatige "Nu synchroniseren"-knop in Settings.
- Later optioneel: Supabase Realtime voor near-instant pull.

---

## 6. Verwijderingen → tombstones

De fundering heeft `deleted`, maar de huidige queries doen nog **harde**
`DELETE`. Bij de sync-uitrol omzetten naar soft-delete zodat verwijderingen
syncen:

- `deleteCustomExercise`, `deleteTemplate`, `removeWorkoutExercise`,
  `removeSet`, … → `UPDATE ... SET deleted = 1` (trigger bumpt version/updated_at).
- Alle `SELECT`-queries → `WHERE deleted = 0` toevoegen.
- ON DELETE CASCADE vervalt voor soft-deletes → kinderen expliciet mee
  soft-deleten (in een transactie of via een trigger).
- Fysiek opruimen (`VACUUM`/purge) pas nadat de tombstone met succes gepusht is.

> Dit is bewust **niet** in de fundering doorgevoerd: het raakt elke query en
> hoort bij de sync-implementatie, niet bij de losse kolom-migratie.

---

## 7. Versionering-haakjes

- **Schema**: `getSchemaVersion()` — pull mag pas draaien als lokaal schema ≥
  het schema waarop de remote-data is geschreven (anders eerst migreren).
- **Rij**: `version`-kolom drijft de conflictregel (§5).
- **Export**: back-ups dragen al `schemaVersion` + `appVersion` (`lib/backup.ts`).
- **App-release**: zie `docs/PLAY_STORE.md` (EAS `autoIncrement`).

---

## 8. Uitrol in fasen

1. **Auth-only** — supabase-client, `authStore`, login/registratie-UI,
   sessiepersistentie. Nog geen sync. (Klein, los te testen.)
2. **Remote-schema + RLS** — SQL-migraties in Supabase, policies testen met twee
   accounts.
3. **Soft-delete migratie (4)** — `sync_state` tabel + queries omzetten (§6),
   volledig lokaal te testen.
4. **Push** — eenrichting upload van dirty rijen; verifieer in de Supabase-tabel.
5. **Pull + conflicten** — tweerichting; test offline-edits op twee toestellen.
6. **Triggers + UI** — auto-sync op foreground/mutatie, syncstatus + "Nu
   synchroniseren" in Settings, foutafhandeling/retry.
7. **(Optioneel)** Realtime, en account-/dataverwijdering (AVG) + privacybeleid
   bijwerken.

## 9. Open beslissingen

- Google OAuth: native id-token (vereist Google Cloud client-id's per platform)
  vs. PKCE-webflow met deep link. Webflow is sneller op te zetten.
- Bewaarbeleid tombstones (hoelang voor purge).
- Conflict-UX: stille LWW (voorstel) vs. de gebruiker laten kiezen bij een
  echte botsing.
