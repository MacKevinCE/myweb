import { defaultWallpaper } from '../../../data/os-wallpapers';
import { track } from '../achievements';
import type { WallpaperCategory } from '../../../data/os-wallpapers';

const STORAGE_KEY = 'os-settings';

/** Guard flag: prevents tracking during settings initialization */
let userInteracted = false;

/** Call after all settings init is complete to enable achievement tracking */
export function markSettingsReady() { userInteracted = true; }

export interface Settings {
  appearance: 'light' | 'dark' | 'auto';
  dockSize: number;
  magnification: number;
  autoHide: boolean;
  wallpaper: string;
  wallpaperName: string;
  wallpaperCategory: WallpaperCategory;
  wallpaperMode: 'loop' | 'frame';
  accentColor: string;
  clock24h: boolean;
  clockSeconds: boolean;
  clockWeekday: boolean;
  clockDate: boolean;
  fontSize: number;
  reduceMotion: boolean;
  highContrast: boolean;
}

const DEFAULTS: Settings = {
  appearance: 'auto',
  dockSize: 100,
  magnification: 25,
  autoHide: false,
  wallpaper: defaultWallpaper.src,
  wallpaperName: defaultWallpaper.name,
  wallpaperCategory: defaultWallpaper.category,
  wallpaperMode: 'loop',
  accentColor: 'var(--os-stg-blue)',
  clock24h: false,
  clockSeconds: false,
  clockWeekday: true,
  clockDate: true,
  fontSize: 0,
  reduceMotion: false,
  highContrast: false,
};

const VALID_APPEARANCE = new Set<string>(['light', 'dark', 'auto']);
const VALID_WALLPAPER_CATEGORY = new Set<string>(['image', 'animation']);
const VALID_WALLPAPER_MODE = new Set<string>(['loop', 'frame']);

/**
 * Validates individual fields and replaces invalid values with defaults.
 * Prevents corrupted or tampered localStorage from causing runtime errors.
 */
function sanitize(data: Record<string, unknown>): Partial<Settings> {
  const result: Partial<Settings> = {};

  if (typeof data.appearance === 'string' && VALID_APPEARANCE.has(data.appearance)) {
    result.appearance = data.appearance as Settings['appearance'];
  }
  if (typeof data.dockSize === 'number' && isFinite(data.dockSize)) {
    result.dockSize = data.dockSize;
  }
  if (typeof data.magnification === 'number' && isFinite(data.magnification)) {
    result.magnification = data.magnification;
  }
  if (typeof data.autoHide === 'boolean') result.autoHide = data.autoHide;
  if (typeof data.wallpaper === 'string') result.wallpaper = data.wallpaper;
  if (typeof data.wallpaperName === 'string') result.wallpaperName = data.wallpaperName;

  if (typeof data.wallpaperCategory === 'string' && VALID_WALLPAPER_CATEGORY.has(data.wallpaperCategory)) {
    result.wallpaperCategory = data.wallpaperCategory as Settings['wallpaperCategory'];
  }
  if (typeof data.wallpaperMode === 'string' && VALID_WALLPAPER_MODE.has(data.wallpaperMode)) {
    result.wallpaperMode = data.wallpaperMode as Settings['wallpaperMode'];
  }
  if (typeof data.accentColor === 'string') result.accentColor = data.accentColor;
  if (typeof data.clock24h === 'boolean') result.clock24h = data.clock24h;
  if (typeof data.clockSeconds === 'boolean') result.clockSeconds = data.clockSeconds;
  if (typeof data.clockWeekday === 'boolean') result.clockWeekday = data.clockWeekday;
  if (typeof data.clockDate === 'boolean') result.clockDate = data.clockDate;
  if (typeof data.fontSize === 'number' && isFinite(data.fontSize) && data.fontSize >= -1 && data.fontSize <= 2) {
    result.fontSize = data.fontSize;
  }
  if (typeof data.reduceMotion === 'boolean') result.reduceMotion = data.reduceMotion;
  if (typeof data.highContrast === 'boolean') result.highContrast = data.highContrast;

  return result;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { ...DEFAULTS };
      }
      const data = parsed as Record<string, unknown>;

      // Migrate old wallpaperType → wallpaperCategory
      if (data.wallpaperType && !data.wallpaperCategory) {
        data.wallpaperCategory = data.wallpaperType === 'video' ? 'animation' : data.wallpaperType;
        delete data.wallpaperType;
      }
      // Migrate old 'video' category → 'animation' (all videos are now muted animations)
      if (data.wallpaperCategory === 'video') {
        data.wallpaperCategory = 'animation';
      }
      // Remove deprecated wallpaperMuted field
      delete data.wallpaperMuted;

      return { ...DEFAULTS, ...sanitize(data) };
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings, settingKey?: string) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  if (userInteracted && settingKey) {
    track('setting-changed', { id: settingKey });
  }
}

/** Module-level settings instance, shared across all settings sub-modules */
export let settings = loadSettings();

/** Reset the settings instance (for testing or re-init) */
export function reloadSettings() {
  settings = loadSettings();
}
