# Google Play — release-checklist

Stappen om FitTrack klaar te maken voor de Play Store. Wat al in de repo geregeld
is, staat aangevinkt; de rest vereist assets, een Play Console-account of
handmatige actie.

## Configuratie (in repo)

- [x] `android.package` = `be.tomvanhees.fittrack` (definitief — niet meer te
      wijzigen na eerste upload).
- [x] `android.versionCode` = `1` in `app.json` (basiswaarde).
- [x] `production`-profiel bouwt een **AAB** (`app-bundle`) — vereist door Play.
- [x] `production.autoIncrement: true` + `cli.appVersionSource: "local"` → EAS
      verhoogt `versionCode` automatisch bij elke productie-build, zodat elke
      upload uniek en oplopend is.
- [x] `android.permissions: []` — de app vraagt geen extra permissies; dit houdt
      de Play-listing schoon en de privacy-sectie eenvoudig.
- [x] `eas submit` productie-config (`internal` track, `draft` releaseStatus).
- [x] Privacybeleid: `docs/PRIVACY_POLICY.md` (host als publieke URL).

## App-versie bumpen per release

`versionName` (zichtbaar voor gebruikers) staat in `app.json` → `expo.version`.
`versionCode` (intern, Play-uniek) wordt door EAS opgehoogd.

1. Verhoog `expo.version` (bv. `1.0.0` → `1.0.1`) bij een nieuwe release.
2. `eas build -p android --profile production` — EAS bumpt `versionCode`.
3. `eas submit -p android --latest` — upload naar de gekozen track.

## Nog te doen (handmatig / assets)

- [ ] **App-icoon**: lever een 1024×1024 PNG en stel een adaptive icon in
      (`android.adaptiveIcon.foregroundImage` + `backgroundColor`). Zonder asset
      gebruikt de build het standaard Expo-icoon — niet geschikt voor publicatie.
- [ ] **Feature graphic** (1024×500) en **minstens 2 screenshots** per
      form-factor voor de Store-listing.
- [ ] **Play Console**: app aanmaken, content-rating-vragenlijst, Data Safety-
      formulier (sluit aan op `PRIVACY_POLICY.md`: geen dataverzameling), en de
      privacybeleid-URL invullen.
- [ ] **Service account**: maak een Google service-account met de
      *Service Account User* + Play Console-rechten, download de JSON en bewaar
      die als `google-service-account.json` in de projectroot (staat in
      `.gitignore`). Pas dan werkt `eas submit`.
- [ ] **App signing**: laat Google Play App Signing de sleutel beheren (EAS
      genereert de upload-key bij de eerste productie-build).
- [ ] **16 KB page size**: SDK 56 (RN 0.85) levert dit standaard — geen actie,
      mits je publiceert vanuit een SDK 56-build.

## Eerste publicatie — volgorde

```bash
eas build -p android --profile production        # maakt AAB + upload-key
eas submit -p android --latest                   # naar 'internal' track (draft)
# → in Play Console: review draft, promoot naar closed/open/production testing
```
