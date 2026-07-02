import { File, Paths } from 'expo-file-system';

/**
 * Tiny on-device preferences store (selected language, auto mode).
 * Deliberately not a database: conversations are never written anywhere.
 */
interface Prefs {
  languageCode?: string;
  autoMode?: boolean;
  disclaimerSeen?: boolean;
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
