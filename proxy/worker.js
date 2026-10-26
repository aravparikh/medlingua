/**
 * MedLingua API proxy — a Cloudflare Worker that stands between the app and
 * OpenAI so the API key never ships inside the app binary.
 *
 * What it enforces:
 *  - POST only, to exactly the endpoints the app uses
 *  - a GLOBAL daily request cap — the real bill protection. The per-device
 *    id is client-minted, so an attacker can mint a fresh one per request;
 *    the global cap is what actually bounds a leaked endpoint.
 *  - a per-device daily cap (KV-backed) so one runaway install can't eat
 *    the whole global budget
 *  - a model allowlist on JSON requests
 *  - a body-size ceiling (client-asserted content-length; OpenAI's own
 *    25 MB Whisper limit is the hard backstop for chunked uploads)
 *
 * Known-accepted softness: KV counters are read-modify-write and eventually
 * consistent, so a burst near a cap can overshoot it by a small factor —
 * caps here bound the bill, they are not exact quotas.
 *
 * Deploy: see proxy/README.md. Secrets: OPENAI_API_KEY (wrangler secret),
 * KV binding: USAGE. Optional vars: DAILY_REQUEST_LIMIT (default 300),
 * GLOBAL_DAILY_REQUEST_LIMIT (default 2000).
 */

const ALLOWED_PATHS = new Set([
  '/v1/audio/transcriptions',
  '/v1/chat/completions',
  '/v1/audio/speech',
  // Used only by the confidence gate's embeddings drift scorer, which is off
  // by default (DRIFT_SCORER in mobile/src/config/safeguard.ts).
  '/v1/embeddings',
]);

const ALLOWED_MODELS = new Set([
  'whisper-1',
  'gpt-4o',
  'gpt-4o-mini-tts',
  'text-embedding-3-small',
]);

const MAX_BODY_BYTES = 26_000_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'POST' || !ALLOWED_PATHS.has(url.pathname)) {
      return json({ error: 'not found' }, 404);
    }

    // The app sends a random per-install id — identity for rate limiting only.
    const deviceId = request.headers.get('x-medlingua-device') ?? '';
    if (!/^[a-f0-9]{16,64}$/i.test(deviceId)) {
      return json({ error: 'missing device id' }, 403);
    }

    const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: 'request too large' }, 413);
    }

    // Two daily caps, TTL 36h so keys self-clean after the day rolls:
    // global first (the bill protection — device ids are client-minted and
    // can't be trusted for that), then per-device (one runaway install).
    // intOr: a mistyped limit env var must fail closed to the default, never
    // NaN — `used >= NaN` is always false, which would silently disable the cap.
    const day = new Date().toISOString().slice(0, 10);
    const globalKey = `global:${day}`;
    const globalUsed = parseInt((await env.USAGE.get(globalKey)) ?? '0', 10);
    const globalLimit = intOr(env.GLOBAL_DAILY_REQUEST_LIMIT, 2000);
    if (globalUsed >= globalLimit) {
      return json({ error: 'service daily limit reached' }, 429);
    }

    const usageKey = `${deviceId}:${day}`;
    const used = parseInt((await env.USAGE.get(usageKey)) ?? '0', 10);
    const limit = intOr(env.DAILY_REQUEST_LIMIT, 300);
    if (used >= limit) {
      return json({ error: 'daily limit reached' }, 429);
    }
    await env.USAGE.put(globalKey, String(globalUsed + 1), { expirationTtl: 60 * 60 * 36 });
    await env.USAGE.put(usageKey, String(used + 1), { expirationTtl: 60 * 60 * 36 });

    const contentType = request.headers.get('content-type') ?? '';
    let body = request.body;

    // JSON bodies (chat, TTS) get a model allowlist. Multipart (Whisper audio)
    // streams through untouched — its path already pins the endpoint.
    if (contentType.includes('application/json')) {
      let parsed;
      try {
        parsed = await request.json();
      } catch {
        return json({ error: 'invalid JSON' }, 400);
      }
      if (!ALLOWED_MODELS.has(parsed?.model)) {
        return json({ error: 'model not allowed' }, 400);
      }
      body = JSON.stringify(parsed);
    }

    const upstream = await fetch(`https://api.openai.com${url.pathname}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'content-type': contentType,
      },
      body,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Parses a limit env var; anything non-numeric falls back to the default
 * (fail-closed) instead of NaN (which would disable the comparison). */
function intOr(value, fallback) {
  const n = parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}
