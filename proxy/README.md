# MedLingua API proxy

A ~100-line Cloudflare Worker that holds the OpenAI key so it never ships
inside the app binary. The app talks only to this Worker; the Worker forwards
to OpenAI and enforces a global daily cap (the bill protection — device ids
are client-minted, so per-device limits alone can be sidestepped by minting
fresh ids), a per-device daily cap, a model allowlist, and a body size
ceiling.

## Deploy (one time, ~10 minutes, free tier is fine)

```bash
cd proxy
npm install -g wrangler          # or use npx wrangler for every command
wrangler login                   # opens the browser to your Cloudflare account

# 1. Create the usage-counter store and paste its id into wrangler.toml
wrangler kv namespace create USAGE

# 2. Give the Worker your OpenAI key (stored encrypted at Cloudflare,
#    never in this repo)
wrangler secret put OPENAI_API_KEY

# 3. Ship it
wrangler deploy
```

The deploy prints your endpoint, e.g. `https://medlingua-proxy.<you>.workers.dev`.

## Point the app at it

- **Dev:** add to `mobile/.env`:
  `EXPO_PUBLIC_API_PROXY_URL=https://medlingua-proxy.<you>.workers.dev`
- **Production builds:** set the same variable in `mobile/eas.json` →
  `build.production.env`.

When the variable is set, the app sends no API key at all — just a random
per-install device id used for rate limiting. When it is unset, development
builds fall back to calling OpenAI directly with `EXPO_PUBLIC_OPENAI_API_KEY`;
release builds refuse the direct-key path entirely (they show the app's
"not ready" error) so a build misconfiguration can never embed the key.

## Knobs

- `GLOBAL_DAILY_REQUEST_LIMIT` in `wrangler.toml` (default 2000 requests/day
  across all devices — the hard ceiling on what a leaked endpoint can cost).
- `DAILY_REQUEST_LIMIT` in `wrangler.toml` (default 300 requests/device/day —
  roughly 100 conversation turns).
- Both limits fall back to their defaults if the var is mistyped — a bad
  value can never silently disable the cap.
- Rotate the OpenAI key any time with `wrangler secret put OPENAI_API_KEY`;
  no app update needed.

Note on the KV free tier: it allows 1,000 writes/day and the Worker now does
two counter writes per request, so free-tier deployments effectively cap out
around ~500 requests/day — and fail closed (HTTP 500) beyond that. Fine for
a pilot; the $5 Workers paid plan lifts it.
