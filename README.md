# FitTrack

Lokale fitness-tracker voor Android/iOS, gebouwd met **React Native + Expo**.
Plan workouts per week via herbruikbare templates, log sets (gewicht + reps) per
oefening, en zie meteen de progressie t.o.v. de vorige sessie.

## Tech stack

| Onderdeel | Keuze |
|---|---|
| Framework | React Native 0.85 + Expo (SDK 56, new architecture) |
| Database | `expo-sqlite` (lokaal, relationeel) |
| Navigatie | Expo Router (file-based) + Bottom Tabs |
| State | Zustand |
| Styling | StyleSheet + design tokens (`constants/colors.ts`) |

## Aan de slag

Dit is een **development build** project — geen Expo Go. Expo Go ondersteunt
alleen de nieuwste SDK en draait Expo's generieke shell i.p.v. de echte native
binary, dus we bouwen een eigen dev client. De JS-ontwikkelloop (fast refresh)
blijft identiek.

```bash
npm install                  # gebruik --legacy-peer-deps indien nodig (zie .npmrc)
npx expo run:android         # bouwt + installeert de dev client lokaal (1e keer traag)
npm start                    # Metro dev server — dev client verbindt automatisch
npm run typecheck            # tsc --noEmit
npm test                     # jest
```

Na de eerste `expo run:android` is de dagelijkse loop gewoon `npm start`: de
dev-client-app op toestel/emulator verbindt met Metro en je krijgt fast refresh
op elke JS-save. Opnieuw `expo run:android` draaien hoeft **alleen** wanneer
native dependencies of native config in `app.json` wijzigen.

### Vereisten voor lokaal bouwen

- Android Studio + Android SDK (`ANDROID_HOME` ingesteld), JDK 17
- Een draaiende emulator of een toestel met USB-debugging (`npx expo run:android --device`)

### Distribueerbare build (APK / Play Store)

Voor een installeerbare APK of een Play Store-bundle via
[EAS](https://docs.expo.dev/build/introduction/) (cloud, geen lokale toolchain
nodig):

```bash
npm install -g eas-cli
eas login                                  # gratis Expo-account
eas build -p android --profile preview     # APK (internal distribution)
eas build -p android --profile production  # AAB voor de Play Store
```

De build-profielen staan in [`eas.json`](eas.json): `development` (dev client),
`preview` (APK om te sideloaden) en `production` (AAB). Een eigen app-icoon is
optioneel — zonder asset gebruikt de build het Expo-icoon.

> **16 KB page size:** Google Play vereist 16 KB-uitgelijnde native libraries.
> SDK 56 (RN 0.85) levert deze standaard — vandaar dat de oude 16 KB-waarschuwing
> verdwijnt zodra je met een SDK 56-build draait i.p.v. een oude build.

De native mappen `android/` en `ios/` worden gegenereerd (CNG) en staan in
`.gitignore` — niet handmatig bewerken; ze worden uit `app.json` herbouwd.

## Projectstructuur

```
app/                 Expo Router schermen
  (tabs)/            Bottom-tab schermen: today, week, templates, settings (Meer)
  library.tsx        Oefeningenbibliotheek (stack-scherm, via Meer)
  modals/            add-exercise, edit-template, exercise-detail
  _layout.tsx        Root layout + DB-init
components/          UI-componenten per domein (today / week / templates / shared)
db/
  schema.ts          CREATE TABLE statements + initDatabase()
  seed.ts            Standaard oefeningen (eenmalig geseed)
  queries/           CRUD: exercises, workouts, templates
store/               Zustand stores: workoutStore, libraryStore
lib/                 date- en progressie-helpers
types/               TypeScript types
constants/           colors (design tokens) + categories
```

## Datamodel

SQLite met 7 tabellen: `exercises`, `week_templates`, `template_days`,
`template_day_exercises`, `workout_days`, `workout_exercises`, `workout_sets`.
Zie [`db/schema.ts`](db/schema.ts) voor het volledige schema.

## Functionaliteit

- **Vandaag** — sets loggen met de vorige waarden als referentie + progressie-badge
  (`+5 kg`, `+2 reps`, `Gelijk`, `Nieuw`). Workout afronden, swipe-to-delete op kaartjes.
- **Week** — weeknavigatie met status per dag (workout / rust / afgerond), dag bewerken,
  template toepassen op de week.
- **Templates** — herbruikbare weekschema's aanmaken/bewerken per weekdag.
- **Bibliotheek** — oefeningen zoeken/filteren, eigen oefeningen toevoegen én
  bewerken, detail met recente sessies.
- **Meer** — volledige data-export als JSON-back-up (met schema- + app-versie),
  plus app-info. Hier landt later account & cloud-sync.

## Migraties & versionering

Het schema wordt versiegestuurd gemigreerd via `PRAGMA user_version`
(`db/migrations.ts`, `SCHEMA_VERSION`). Elke syncbare tabel draagt sync-metadata
(`uuid`, `updated_at`, `version`, `deleted`) die door triggers automatisch wordt
bijgehouden — de local-first fundering voor cloud-sync.

## Toekomst

Authenticatie + cloud-sync via Supabase: zie [`docs/SYNC_PLAN.md`](docs/SYNC_PLAN.md).
Offline-first blijft het uitgangspunt: de app werkt altijd lokaal, sync gebeurt op
de achtergrond. Play Store-release: zie [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md).
