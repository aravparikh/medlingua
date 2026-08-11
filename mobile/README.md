# MedLingua (iOS app)

Real-time, two-way medical translation between English and Spanish, Mandarin
Chinese, Vietnamese, or Russian — built for seniors and people with limited
English. React Native + Expo (SDK 54).

## How it works

1. Each person has one big button labeled in their own language.
2. Hold the button (or tap it) and speak. Release (or tap again) when done.
3. Whisper transcribes → GPT-4o translates for a medical context → the
   translation appears in large text and is spoken aloud (OpenAI TTS, with
   on-device speech as an automatic fallback).
4. "Play again 🔊" replays the audio as often as needed.

Nothing is stored: transcripts live only in memory, and the one temporary TTS
audio file is overwritten each turn.

Additional features:

- **Conversation thread** — the whole visit scrolls as a chat-style
  transcript (English turns left, the other language right). Memory only:
  cleared when the language changes and gone when the app closes.
- **Face-the-patient mode** — "🔃 Flip text" on the latest turn rotates the
  translation 180° so the phone can lie flat between the two people.
- **Quick phrases** — "💬 Quick phrases" opens pre-translated clinician
  questions ("Where does it hurt?", "Rate your pain 1–10", …) and patient
  responses ("Yes", "I don't understand", …). Tap to speak instantly — no
  network needed (on-device speech covers audio offline).
- **Auto-detect mode** — the "✨ Auto" toggle swaps the two buttons for a
  single Speak button; Whisper detects which language was spoken and the app
  translates in the right direction automatically.

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # then paste your OpenAI API key
npx expo start --ios   # or scan the QR code with Expo Go*
```

*Recording and speech need a development build or simulator/device build —
`npx expo run:ios` — because `expo-audio` is a native module (it is included
in Expo Go, so Expo Go works for quick previews too).

> **Before shipping to the App Store:** `EXPO_PUBLIC_` env vars are inlined
> into the JS bundle, so the OpenAI key would ship inside the app. Stand up a
> tiny proxy server that holds the key and forwards the three OpenAI calls,
> then point `BASE_URL` in `src/services/openai.ts` at it and delete the
> `Authorization` headers. Call sites don't change.

## Submitting

```bash
npm install -g eas-cli
eas build --platform ios
eas submit --platform ios
```

`app.json` already sets the bundle identifier (`com.medlingua.app`),
microphone usage description, and portrait-only orientation.

## Adding a language

1. Add one entry to `LANGUAGES` in [src/config/languages.ts](src/config/languages.ts).
2. Add its UI strings to [src/i18n/strings.ts](src/i18n/strings.ts).
3. Add its quick-phrase translations in [src/config/phrases.ts](src/config/phrases.ts).
4. If auto-detect should recognize it, add its Whisper name to
   `WHISPER_NAME_TO_CODE` in [src/services/openai.ts](src/services/openai.ts).

The picker, speak-button labels, Whisper hint, TTS voice, and accessibility
language tags all read from that config.

## Structure

```
App.tsx                      # screen switching (no nav library, on purpose)
src/
  config/languages.ts        # single source of truth for languages
  i18n/strings.ts            # all UI text, in all 5 languages
  theme.ts                   # design tokens: palette (AAA contrast), Lexend/Noto Sans
                             #   type scale, 4-pt spacing, radius, elevation, motion
  hooks/useReducedMotion.ts  # system Reduce Motion — all animations respect it
  services/openai.ts         # Whisper, GPT-4o translation, TTS
  services/storage.ts        # tiny prefs file (language + onboarding only)
  components/                # SpeakButton (hold-or-tap), Pulse
  screens/                   # Onboarding, LanguageSelect, Conversation, About
```
