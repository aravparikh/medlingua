# MedLingua — App Store launch checklist

What's done in the repo vs. what only you (account owner) can do. Work top to
bottom; the account items have lead time, start them first.

## ✅ Done in the repo

| Item | Where |
|---|---|
| API key proxy (Cloudflare Worker: per-device daily cap, model allowlist, size ceiling) | `proxy/` — deploy per its README |
| App speaks to proxy when `EXPO_PUBLIC_API_PROXY_URL` is set; no key in production binaries; random per-install id for rate limiting | `mobile/src/services/openai.ts`, `storage.ts` |
| `eas.json` with preview/production profiles (+ placeholders to fill) | `mobile/eas.json` |
| iOS `buildNumber`, `ITSAppUsesNonExemptEncryption: false` | `mobile/app.json` |
| Privacy manifest (collected data types: audio/photos/user content, not linked, no tracking + required-reason APIs) | `mobile/app.json → ios.privacyManifests` |
| Permission strings: microphone, camera, photo library | `mobile/app.json` plugins |
| Prominent medical disclaimer (first-run banner + About, ×5 languages) | shipped earlier |
| AI/data-sharing disclosure & consent copy (first-run banner + About, ×5 languages) | this pass |
| Privacy Policy & Terms pages, linked from inside the app | site `/privacy`, `/terms`; About screen buttons |
| Robustness: offline, timeouts+retry, mic/camera denied, empty & low-confidence transcription, hallucination filters, grounded summaries | shipped earlier (QA’d) |
| Full brand asset set regenerated from the drawn BrandMark: 1024² icon (no alpha), splash tile, Android adaptive fg/bg/monochrome, favicon | `mobile/assets/` |
| Claim audit passed: recordings deleted at every exit, TTS cache swept on mount, Device ID declared in privacy manifest, dev-key path refused in release builds (`__DEV__` gate), proxy global daily cap + NaN-proof limits | commits `efe1afd`, `f1b0d00` |

## 🔑 You: accounts & deploys (start now — lead time)

1. **Apple Developer Program** ($99/yr) — enrollment can take days: developer.apple.com
2. **Deploy the proxy** (~10 min, free): follow `proxy/README.md`, then paste the
   Worker URL into `mobile/eas.json` (both `preview` and `production` env) and
   your `.env` for device testing. Rotate your OpenAI key after (the old one
   was used in dev bundles).
3. **Deploy the landing site** to any static/Next.js host so `/privacy` and
   `/terms` are public. Then update `SITE_BASE_URL` in
   `mobile/src/config/links.ts` to the real domain, and set up `hello@…` mail
   forwarding (or change the address in the two legal pages).

## 📦 You: build & submit sequence

```bash
npm i -g eas-cli && eas login
cd mobile
eas build -p ios --profile production   # first run walks you through certificates
eas submit -p ios                       # needs ascAppId in eas.json (from App Store Connect)
```
Then TestFlight → install on your phone → run the full loop once → Submit for Review.

**SDK note:** the repo is pinned to Expo SDK 54 so your Expo Go can run it. If
EAS/Apple rejects the build for an outdated iOS SDK toolchain, upgrade before
submitting (`npx expo install expo@latest && npx expo install --fix`) — your
Expo Go on-device testing then needs a development build instead
(`eas build --profile development`).

## 🏪 App Store Connect answers (copy-paste ready)

- **Name:** MedLingua *(9/30 chars)*
- **Subtitle:** Medical translator for visits *(29/30)*
- **Category:** Medical
- **Regulated Medical Device Status:** **No** — communication aid; does not
  diagnose, treat, or drive clinical decisions (the app says so on screen).
- **Age rating questionnaire:** answer No to everything → 4+ (content is
  user-generated conversation, unmoderated chat doesn't apply — 1-to-1 in-person
  aid, nothing is stored or shared between users).
- **Keywords (100):** `medical,translator,interpreter,spanish,chinese,vietnamese,russian,hindi,punjabi,clinic` *(86/100)*
- **Support URL:** your deployed site. **Privacy Policy URL:** `<site>/privacy`
- **Description (draft):**
  > MedLingua helps an English speaker and a non-English speaker talk to each
  > other during a medical visit. Tap your button, speak, and hear the
  > translation aloud — in large, clear type built for seniors.
  >
  > • English ↔ Español, 中文, Tiếng Việt, Русский, हिन्दी, ਪੰਜਾਬੀ
  > • Voice, typing, and one-tap medical phrases (incl. an emergency set)
  > • “Where does it hurt?” body map and a 0–10 pain scale
  > • Teach-back check: makes sure instructions were truly understood
  > • Medication label scanner explained in plain words
  > • A take-home visit summary that self-destructs — nothing is ever stored
  >
  > MedLingua is a communication aid, not a medical device, and not a
  > substitute for a certified interpreter.

### Privacy Nutrition Label
- **Data collected:** Audio Data; Photos or Videos; Other User Content;
  Identifiers → Device ID (the random per-install id sent to the proxy for
  rate limiting — declared to match `ios.privacyManifests`)
- **Linked to user:** No (no accounts; random install id only)
- **Used for tracking:** No
- **Purpose:** App Functionality
- Disclose third-party processing by OpenAI (matches in-app consent + policy).

### Review Notes (paste into the Notes field)
> MedLingua translates in-person medical conversations. Speech is transcribed
> (Whisper), translated (GPT-4o), and spoken aloud (OpenAI TTS) via our own
> rate-limited proxy server; no account is needed and nothing is stored.
> To test: open the app → tap “Español” → tap the green “Speak English”
> button, say “Where does it hurt?”, tap Done → the Spanish translation
> appears and is spoken. The AI-use and data-sharing notice is shown on first
> run; the privacy policy is linked on the info screen (top right).

## 📸 Still to produce (needs your device)
- ≥3 screenshots at 6.9" iPhone size (conversation with a few turns, body map,
  summary are the strongest three; add the phrases sheet and scanner if you
  have five).
- One full TestFlight pass of every flow on hardware.
