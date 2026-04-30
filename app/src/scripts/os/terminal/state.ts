/**
 * Terminal Engine — Shared mutable state.
 * All modules import from here to share state.
 */

import type { FSNode, ProfileData } from './types';

export const state = {
  cwd: '~',
  history: [] as string[],
  historyIndex: -1,
  fs: null as unknown as FSNode,
  profileData: null as unknown as ProfileData,
  t: {} as Record<string, string>,

  // DOM refs
  outputEl: null as unknown as HTMLElement,
  inputEl: null as unknown as HTMLInputElement,
  promptEl: null as unknown as HTMLElement,
  bodyEl: null as unknown as HTMLElement,
  suggestionsEl: null as null | HTMLElement,
};

// ---------------------------------------------------------------------------
// Helpers that depend only on state
// ---------------------------------------------------------------------------

export function tr(key: string, vars?: Record<string, string>): string {
  let text = state.t[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getLocale(): string {
  return document.documentElement.lang || 'en';
}
