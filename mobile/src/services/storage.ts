import { File, Paths } from 'expo-file-system';

/**
 * Tiny on-device preferences store (selected language, auto mode).
 * Deliberately not a database: conversations are never written anywhere.
 */
interface Prefs {
  languageCode?: string;
  autoMode?: boolean;
  disclaimerSeen?: boolean;
  /** Random per-install id sent to the API proxy for rate limiting only.
   * Not derived from the person or the device — a fresh install gets a new one. */
  deviceId?: string;
}

const prefsFile = () => new File(Paths.document, 'medlingua-prefs.json');

export function loadPrefs(): Prefs {
  try {
    const file = prefsFile();
    if (!file.exists) return {};
    return JSON.parse(file.textSync()) as Prefs;
  } catch {
    return {};
  }
}

export function savePrefs(update: Partial<Prefs>): void {
  try {
    const merged = { ...loadPrefs(), ...update };
    const file = prefsFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(merged));
  } catch {
    // Preferences are a convenience; the app works without them.
  }
}

/** Returns the stable per-install id, minting one on first use. */
export function getDeviceId(): string {
  const existing = loadPrefs().deviceId;
  if (existing) return existing;
  const minted = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  savePrefs({ deviceId: minted });
  return minted;
}
