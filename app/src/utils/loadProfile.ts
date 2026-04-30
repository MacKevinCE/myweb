import { deepMerge } from './deepMerge';
import { validateProfileData } from './validateData';
import { validateUiData } from './validateUi';
import { languages } from './i18n';
import type { Theme } from './themes';
import type { ThemeContent } from '../types';

interface LangSwitchTexts {
  translateAlert: string;
  translateSwitch: string;
  translateDismiss: string;
}

const dataModules = import.meta.glob('../data/**/*.json', { eager: true });

function get(path: string): Record<string, unknown> {
  const mod = dataModules[path] as { default?: Record<string, unknown> } | undefined;
  return mod?.default ?? {};
}

/** Whether a Record has any own keys (i.e. the JSON module actually existed). */
function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Type-assertion helper. The double cast (`unknown` → `ThemeContent`) is
 * intentional: `Record<string, unknown>` has no structural overlap with
 * `ThemeContent`, so TypeScript requires the intermediate `unknown`.
 * This is safe because `loadContent` validates the merged object with
 * `validateProfileData` and `validateUiData` right before calling this
 * — any structural mismatch is already surfaced as build-time warnings.
 */
function asThemeContent(data: Record<string, unknown>): ThemeContent {
  return data as unknown as ThemeContent;
}

/**
 * Returns the data at `path`, falling back to the English equivalent
 * when the requested language file doesn't exist.
 */
function getWithFallback(path: string, fallbackPath: string, label: string): Record<string, unknown> {
  const data = get(path);
  if (!isEmpty(data)) return data;

  console.warn(`[loadProfile] Missing ${label} "${path}", falling back to English`);
  return get(fallbackPath);
}

/**
 * Loads and merges all content for a given language and theme.
 *
 * Merges five data layers in order:
 * 1. Profile base (`profile/base.json`) — shared, non-translatable fields
 * 2. Profile content (`profile/{lang}/profile.json`) — translated profile data
 * 3. UI base (`ui/base.json`) — shared UI strings (langNames, footer version)
 * 4. Shared UI (`ui/shared/{lang}.json`) — common translated UI (nav, langSwitch)
 * 5. Theme UI (`ui/{theme}/{lang}/ui.json`) — theme-specific translated UI
 *
 * When a language-specific file is missing, falls back to English (`en`)
 * so partially-translated languages remain renderable.
 *
 * Runs build-time validation on the merged result and logs warnings
 * for any missing required fields. Never throws — the build continues
 * even with incomplete data so partial content is still renderable.
 *
 * @param lang - Language code (e.g. "en", "es", "pt")
 * @param theme - Theme identifier (e.g. "terminal", "os", "liquid-glass")
 * @returns Fully merged content object typed to the theme
 */
export function loadContent(lang: string, theme: Theme): ThemeContent {
  const profile = getWithFallback(
    `../data/profile/${lang}/profile.json`,
    '../data/profile/en/profile.json',
    'profile',
  );

  const sharedUi = getWithFallback(
    `../data/ui/shared/${lang}.json`,
    '../data/ui/shared/en.json',
    'shared UI',
  );

  const themeUi = getWithFallback(
    `../data/ui/${theme}/${lang}/ui.json`,
    `../data/ui/${theme}/en/ui.json`,
    `theme UI (${theme})`,
  );

  const merged = deepMerge(
    get('../data/profile/base.json'),
    profile,
    get('../data/ui/base.json'),
    sharedUi,
    themeUi,
  );

  const profileResult = validateProfileData(merged, lang);
  if (!profileResult.valid) {
    for (const error of profileResult.errors) {
      console.warn(`[validateData] ${error}`);
    }
  }

  const uiResult = validateUiData(merged, theme, lang);
  if (!uiResult.valid) {
    for (const error of uiResult.errors) {
      console.warn(`[validateUi] ${error}`);
    }
  }

  return asThemeContent(merged);
}

export function loadLangSwitchTexts(): Record<string, LangSwitchTexts> {
  const result: Record<string, LangSwitchTexts> = {};
  for (const l of languages) {
    const ui = get(`../data/ui/shared/${l}.json`) as Record<string, Record<string, string>>;
    const ls = ui.langSwitch;
    if (ls) {
      result[l] = {
        translateAlert: ls.translateAlert,
        translateSwitch: ls.translateSwitch,
        translateDismiss: ls.translateDismiss,
      };
    }
  }
  return result;
}
