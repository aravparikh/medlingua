/**
 * MedLingua API proxy — a Cloudflare Worker that stands between the app and
 * OpenAI so the API key never ships inside the app binary.
 *
 * What it enforces:
 *  - POST only, to exactly the three endpoints the app uses
 *  - a per-device daily request cap (KV-backed) so a leaked endpoint can't
 *    run up the bill
 *  - a model allowlist on JSON requests
 *  - a body-size ceiling (Whisper's own limit is 25 MB)
 *
 * Deploy: see proxy/README.md. Secrets: OPENAI_API_KEY (wrangler secret),
 * KV binding: USAGE. Optional var: DAILY_REQUEST_LIMIT (default 300).
 */

const ALLOWED_PATHS = new Set([
  '/v1/audio/transcriptions',
  '/v1/chat/completions',
  '/v1/audio/speech',
]);

const ALLOWED_MODELS = new Set(['whisper-1', 'gpt-4o', 'gpt-4o-mini-tts']);

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

    // Daily cap per device. TTL 36h so the key self-cleans after the day rolls.
    const day = new Date().toISOString().slice(0, 10);
    const usageKey = `${deviceId}:${day}`;
    const used = parseInt((await env.USAGE.get(usageKey)) ?? '0', 10);
    const limit = parseInt(env.DAILY_REQUEST_LIMIT ?? '300', 10);
    if (used >= limit) {
      return json({ error: 'daily limit reached' }, 429);
    }
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
