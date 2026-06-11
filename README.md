# FitTrack

Lokale fitness-tracker voor Android/iOS, gebouwd met **React Native + Expo**.
Plan workouts per week via herbruikbare templates, log sets (gewicht + reps) per
oefening, en zie meteen de progressie t.o.v. de vorige sessie.

## Tech stack

| Onderdeel | Keuze |
|---|---|
| Framework | React Native + Expo (SDK 51) |
| Database | `expo-sqlite` (lokaal, relationeel) |
| Navigatie | Expo Router (file-based) + Bottom Tabs |
| State | Zustand |
| Styling | StyleSheet + design tokens (`constants/colors.ts`) |

## Aan de slag

```bash
npm install
npm start          # Expo dev server
npm run android    # of: npm run ios
npm run typecheck  # tsc --noEmit
```

## Projectstructuur

```
app/                 Expo Router schermen
  (tabs)/            Bottom-tab schermen: today, week, templates, library
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
- **Bibliotheek** — oefeningen zoeken/filteren, eigen oefeningen toevoegen, detail met
  recente sessies.

## Toekomst

Cloud sync via Supabase (zie technisch document, sectie 10). Offline-first blijft het
uitgangspunt: de app werkt altijd lokaal, sync gebeurt op de achtergrond.
