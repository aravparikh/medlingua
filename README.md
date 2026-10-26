# MedLingua

Real-time, two-way medical translation between English and Spanish, Mandarin
Chinese, Vietnamese, Russian, Hindi, and Punjabi — built for seniors and people
with limited English. The app is React Native + Expo (SDK 54); a small Next.js
site serves the `/privacy` and `/terms` pages linked from inside the app.

## Repo layout

| Path | What it is |
|---|---|
| `mobile/` | The MedLingua app (React Native + Expo, SDK 54). This is the product. |
| `app/`, `components/` | The Next.js landing + legal site (`/privacy`, `/terms`). |
| `proxy/` | Cloudflare Worker that holds the OpenAI key for production builds. |

## Run the app (Expo Go, localhost)

You need [Expo Go](https://expo.dev/go) on your phone and an OpenAI API key.

```bash
cd mobile
npm install
cp .env.example .env        # then paste your OpenAI key into EXPO_PUBLIC_OPENAI_API_KEY
npx expo start              # opens the dev server + QR code on localhost
```

Scan the QR code with Expo Go (or press `i` for the iOS simulator, `a` for
Android). The phone and your computer must be on the same network so the device
can reach the Metro server on localhost. `expo start` also accepts:

```bash
npm run ios                 # start and open the iOS simulator
npm run android             # start and open an Android emulator
npm run web                 # run in the browser
```

In this local mode the app calls OpenAI directly and your key is inlined into
the dev bundle. That is fine for development on your own device, but never ship
a store build this way — set `EXPO_PUBLIC_API_PROXY_URL` to your deployed proxy
instead (see `proxy/README.md`), which keeps the key out of the binary.

## Run the web site (localhost)

The Next.js site hosts the privacy policy and terms.

```bash
npm install
npm run dev                 # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) to see it. Pages live in
`app/`; edits hot-reload.

## More

- `mobile/README.md` — app internals, adding a language, project structure.
- `LAUNCH.md` — App Store submission checklist.
- `proxy/README.md` — standing up the key proxy for production.
