import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../src/data/os-wallpapers', () => ({
  defaultWallpaper: {
    src: '/images/default.png',
    name: 'Default',
    category: 'image' as const,
  },
}));
vi.mock('../../../src/scripts/os/achievements', () => ({
  track: vi.fn(),
}));

import {
  loadSettings,
  saveSettings,
} from '../../../src/scripts/os/settings/persist';

const STORAGE_KEY = 'os-settings';

describe('settings persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when localStorage is empty', () => {
    const s = loadSettings();

    expect(s.appearance).toBe('auto');
    expect(s.dockSize).toBe(100);
    expect(s.magnification).toBe(25);
    expect(s.autoHide).toBe(false);
    expect(s.clock24h).toBe(false);
    expect(s.reduceMotion).toBe(false);
  });

  it('returns stored values when valid data exists', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        appearance: 'dark',
        dockSize: 80,
        clock24h: true,
      })
    );

    const s = loadSettings();

    expect(s.appearance).toBe('dark');
    expect(s.dockSize).toBe(80);
    expect(s.clock24h).toBe(true);
    // Non-overridden fields keep defaults
    expect(s.autoHide).toBe(false);
  });

  it('returns defaults when localStorage has corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json-at-all');

    const s = loadSettings();

    expect(s.appearance).toBe('auto');
    expect(s.dockSize).toBe(100);
  });

  it('sanitizes invalid field values back to defaults', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        appearance: 'invalid-theme',
        dockSize: 'not-a-number',
        fontSize: 99, // out of valid range (-1..2)
      })
    );

    const s = loadSettings();

    expect(s.appearance).toBe('auto'); // invalid enum -> default
    expect(s.dockSize).toBe(100); // wrong type -> default
    expect(s.fontSize).toBe(0); // out of range -> default
  });

  it('persists settings to localStorage via saveSettings', () => {
    const s = loadSettings();
    s.appearance = 'dark';
    s.dockSize = 60;

    saveSettings(s);

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw!);
    expect(parsed.appearance).toBe('dark');
    expect(parsed.dockSize).toBe(60);
  });
});
