/**
 * Central achievements engine.
 * Tracks user interactions and unlocks achievements à la Game Center.
 * One-way dependency: imports FROM notifications.ts, never the reverse.
 */

import { notify, getNotifI18n } from './notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AchievementEvent =
  | 'window-opened'
  | 'terminal-command'
  | 'article-read'
  | 'sticky-created'
  | 'speedtest-run'
  | 'lang-changed'
  | 'setting-changed'
  | 'playground-run'
  | 'contact-sent'
  | 'finder-opened'
  | 'certs-viewed'
  | 'window-moved'
  | 'titlebar-dblclick'
  | 'window-button'
  | 'launchpad-open'
  | 'web-fullscreen'
  | 'os-menu'
  | 'cv-download'
  | 'notif-center'
  | 'time-spent'
  | 'all-complete';

export interface AchievementDef {
  id: string;
  icon: string;
  event: AchievementEvent;
  threshold: number;
  trackUnique?: boolean;
}

interface AchievementState {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  uniqueSet?: string[];
}

interface AchievementStore {
  version: number;
  states: Record<string, AchievementState>;
}

// ---------------------------------------------------------------------------
// Definitions (21 achievements)
// ---------------------------------------------------------------------------

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'explorer',
    icon: '🗺️',
    event: 'window-opened',
    threshold: 10,
    trackUnique: true,
  },
  { id: 'hacker', icon: '💻', event: 'terminal-command', threshold: 5 },
  {
    id: 'curious',
    icon: '📖',
    event: 'article-read',
    threshold: 3,
    trackUnique: true,
  },
  { id: 'artist', icon: '🎨', event: 'sticky-created', threshold: 3 },
  { id: 'speedster', icon: '⚡', event: 'speedtest-run', threshold: 1 },
  { id: 'polyglot', icon: '🌍', event: 'lang-changed', threshold: 1 },
  { id: 'customizer', icon: '⚙️', event: 'setting-changed', threshold: 1 },
  { id: 'dev', icon: '🧑‍💻', event: 'playground-run', threshold: 1 },
  { id: 'networker', icon: '📬', event: 'contact-sent', threshold: 1 },
  {
    id: 'archivist',
    icon: '🗂️',
    event: 'finder-opened',
    threshold: 5,
    trackUnique: true,
  },
  {
    id: 'certified',
    icon: '🏅',
    event: 'certs-viewed',
    threshold: 3,
    trackUnique: true,
  },
  { id: 'mover', icon: '🪟', event: 'window-moved', threshold: 3 },
  {
    id: 'organizer',
    icon: '📐',
    event: 'titlebar-dblclick',
    threshold: 2,
    trackUnique: true,
  },
  {
    id: 'controller',
    icon: '🔴 🟠 🟢',
    event: 'window-button',
    threshold: 3,
    trackUnique: true,
  },
  { id: 'launcher', icon: '🚀', event: 'launchpad-open', threshold: 2 },
  { id: 'cinema', icon: '🎬', event: 'web-fullscreen', threshold: 1 },
  { id: 'menu', icon: '🖥️', event: 'os-menu', threshold: 1 },
  { id: 'recruiter', icon: '📄', event: 'cv-download', threshold: 1 },
  { id: 'informed', icon: '🔔', event: 'notif-center', threshold: 1 },
  { id: 'resident', icon: '🏠', event: 'time-spent', threshold: 1 },
  { id: 'completist', icon: '🏆', event: 'all-complete', threshold: 1 },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'os-achievements';
const STORE_VERSION = 1;

let initialized = false;
let store: AchievementStore = { version: STORE_VERSION, states: {} };

// Fix 3: Event lookup Map — O(1) instead of filter on every track() call
const EVENT_MAP = new Map<AchievementEvent, AchievementDef[]>();
for (const a of ACHIEVEMENTS) {
  const list = EVENT_MAP.get(a.event) || [];
  list.push(a);
  EVENT_MAP.set(a.event, list);
}

// Fix 4: Runtime Sets for O(1) uniqueSet lookups (serialized to arrays for storage)
const uniqueSets = new Map<string, Set<string>>();

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function load(): AchievementStore {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (raw.version === STORE_VERSION && raw.states)
      return raw as AchievementStore;
  } catch {
    /* ignore corrupt data */
  }
  return { version: STORE_VERSION, states: {} };
}

function save() {
  // Serialize Sets back to arrays before persisting
  for (const [id, set] of uniqueSets) {
    if (store.states[id]) {
      store.states[id].uniqueSet = [...set];
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

// Fix 1: Lazy init — load from localStorage only on first access
function ensureInit() {
  if (initialized) return;
  initialized = true;
  store = load();

  let dirty = false;
  for (const def of ACHIEVEMENTS) {
    if (!store.states[def.id]) {
      store.states[def.id] = { unlocked: false, unlockedAt: null, progress: 0 };
      dirty = true;
    }
    // Hydrate uniqueSets from stored arrays
    if (def.trackUnique && store.states[def.id].uniqueSet) {
      uniqueSets.set(def.id, new Set(store.states[def.id].uniqueSet));
    }
  }

  if (dirty) save();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Track an achievement event.
 * For `trackUnique` achievements, pass `payload.id` to count distinct values.
 * Idempotent: already-unlocked achievements are skipped.
 */
export function track(event: AchievementEvent, payload?: { id?: string }) {
  ensureInit();

  // Fix 3: O(1) event lookup via pre-built Map
  const matching = EVENT_MAP.get(event);
  if (!matching) return;

  let dirty = false;

  for (const def of matching) {
    const state = store.states[def.id];
    if (!state || state.unlocked) continue;

    if (def.trackUnique) {
      // Fix 4: Use runtime Set for O(1) has/add
      let set = uniqueSets.get(def.id);
      if (!set) {
        set = new Set();
        uniqueSets.set(def.id, set);
      }
      const uid = payload?.id ?? '';
      if (uid && !set.has(uid)) {
        set.add(uid);
        state.progress = set.size;
        dirty = true;
      }
    } else {
      state.progress++;
      dirty = true;
    }

    if (state.progress >= def.threshold) {
      state.unlocked = true;
      state.unlockedAt = new Date().toISOString();
      dirty = true;
      notifyUnlock(def);
      document.dispatchEvent(
        new CustomEvent('achievement-unlocked', { detail: { id: def.id } })
      );
    }
  }

  // Fix 2: Single save at the end, only when state actually changed
  if (dirty) save();

  // Check meta-achievement: completist (all others unlocked)
  const completistState = store.states['completist'];
  if (completistState && !completistState.unlocked) {
    const allOthersUnlocked = ACHIEVEMENTS.filter(
      (a) => a.id !== 'completist'
    ).every((a) => store.states[a.id]?.unlocked);
    if (allOthersUnlocked) {
      completistState.unlocked = true;
      completistState.unlockedAt = new Date().toISOString();
      completistState.progress = 1;
      save();
      const completistDef = ACHIEVEMENTS.find((a) => a.id === 'completist')!;
      notifyUnlock(completistDef);
      document.dispatchEvent(
        new CustomEvent('achievement-unlocked', {
          detail: { id: 'completist' },
        })
      );
    }
  }
}

/** Returns all 21 achievements merged with their current state. */
export function getAchievements(): Array<AchievementDef & AchievementState> {
  ensureInit();
  return ACHIEVEMENTS.map((def) => ({
    ...def,
    ...store.states[def.id],
  }));
}

/** Returns count of unlocked vs total achievements. */
export function getProgress(): { unlocked: number; total: number } {
  ensureInit();
  let unlocked = 0;
  for (const id in store.states) {
    if (store.states[id].unlocked) unlocked++;
  }
  return { unlocked, total: ACHIEVEMENTS.length };
}

/**
 * Initialize the achievements engine.
 * Call once during bootstrap — loads persisted state from localStorage
 * and ensures every achievement definition has a state entry.
 */
export function initAchievements() {
  ensureInit();
}

// ---------------------------------------------------------------------------
// Internal — notification on unlock
// ---------------------------------------------------------------------------

function notifyUnlock(def: AchievementDef) {
  const t = getNotifI18n();
  const title = t.achievementTitle || 'Achievement Unlocked!';
  const body = `${def.icon}  ${t[`ach_${def.id}`] || def.id}`;
  notify(title, body, undefined, 'achievements-window');
}
