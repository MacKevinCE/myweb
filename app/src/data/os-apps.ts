/**
 * Single source of truth for all OS-theme app definitions.
 * Consumed by: DesktopIcons, Dock, Launchpad, and windowManager.
 */

/* ---- SVG icon paths (Lucide-compatible) ---- */

export const icons: Record<string, string> = {
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  folder:
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  briefcase:
    '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  graduationCap:
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  smile:
    '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 13s1 1.5 3 1.5 3-1.5 3-1.5"/><circle cx="9" cy="10" r="0.5" fill="currentColor"/><circle cx="15" cy="10" r="0.5" fill="currentColor"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  grid3x3:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  'speed-test':
    '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  terminal:
    '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  preview:
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.1-1.1a2 2 0 0 0-2.81 0L10 22"/>',
  notes:
    '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>',
  stickies:
    '<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M14 3v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  'terminal-run':
    '<polyline points="6 17 12 11 6 5"/><polygon points="16 7 22 12 16 17"/>',
  trophy:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
};

/* ---- Common UI icon paths (Lucide-compatible inner SVG content) ---- */

export const uiIcons: Record<string, string> = {
  chevronUp: '<path d="m18 15-6-6-6 6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  sidebarLeft:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  sidebarRight:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  externalLink:
    '<path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/>',
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  mapPin:
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  clock:
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  activity: '<path d="M2 12h4l3-9 4 18 3-9h4"/>',
  refreshCw:
    '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  fullscreen:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
};

/** Resolve UI icon key to SVG inner content */
export function getUiIcon(key: string): string {
  return uiIcons[key] || '';
}

/* ---- Window IDs ---- */

export const W = {
  ABOUT: 'about-window',
  SKILLS: 'skills-window',
  PROJECTS: 'projects-window',
  EXPERIENCE: 'experience-window',
  EDUCATION: 'education-window',
  CONTACT: 'contact-window',
  FINDER: 'finder-window',
  BROWSER: 'browser-window',
  SETTINGS: 'settings-window',
  LAUNCHPAD: 'launchpad',
  APP_STORE: 'app-store-window',
  SPEED_TEST: 'speed-test-window',
  TERMINAL: 'terminal-window',
  PREVIEW: 'preview-window',
  NOTES: 'notes-window',
  PLAYGROUND: 'playground-window',
  STICKIES: 'stickies-window',
  ACHIEVEMENTS: 'achievements-window',
} as const;

export type WindowId = (typeof W)[keyof typeof W];

/* ---- Window manager config ---- */

export interface WindowConfig {
  defaultSize?: [number, number];
  minSize?: [number, number];
  maxSize?: [number, number];
  origin?: [number, number];
  autoOpen?: boolean;
  /** Finder tab alias — if set, this "window" opens a Finder tab instead */
  finderAlias?: string;
}

export const windowConfigs: Partial<Record<string, WindowConfig>> = {
  // Auto-open
  [W.ABOUT]: { defaultSize: [500, 700], origin: [80, 60], autoOpen: true },
  // Large windows: centered cascade
  [W.FINDER]: {
    defaultSize: [1100, 600],
    origin: [120, 80],
    minSize: [1000, 500],
  },
  [W.BROWSER]: {
    defaultSize: [900, 640],
    origin: [150, 105],
    minSize: [500, 400],
  },
  [W.APP_STORE]: {
    defaultSize: [800, 700],
    origin: [180, 130],
    minSize: [750, 600],
  },
  // Medium windows: diagonal cascade
  [W.EDUCATION]: {
    defaultSize: [800, 650],
    origin: [210, 155],
    minSize: [750, 600],
    maxSize: [900, 750],
  },
  [W.NOTES]: {
    defaultSize: [800, 600],
    origin: [240, 180],
    minSize: [700, 450],
  },
  [W.PLAYGROUND]: {
    defaultSize: [800, 600],
    origin: [270, 205],
    minSize: [700, 500],
  },
  [W.TERMINAL]: {
    defaultSize: [700, 500],
    origin: [620, 60],
    minSize: [600, 350],
    autoOpen: true,
  },
  [W.PREVIEW]: {
    defaultSize: [750, 550],
    origin: [330, 130],
    minSize: [700, 400],
  },
  [W.SETTINGS]: {
    defaultSize: [650, 600],
    origin: [360, 155],
    minSize: [550, 550],
    maxSize: [850, 700],
  },
  [W.SKILLS]: {
    defaultSize: [550, 600],
    origin: [390, 105],
    minSize: [500, 550],
    maxSize: [600, 700],
  },
  // Small windows: offset to avoid overlap with large ones
  [W.CONTACT]: { defaultSize: [400, 500], origin: [450, 80] },
  [W.SPEED_TEST]: { defaultSize: [380, 490], origin: [480, 130] },
  [W.STICKIES]: {
    defaultSize: [500, 450],
    origin: [200, 260],
    minSize: [400, 400],
  },
  [W.ACHIEVEMENTS]: {
    defaultSize: [500, 500],
    origin: [420, 180],
    minSize: [400, 400],
    maxSize: [600, 700],
  },
  [W.PROJECTS]: { finderAlias: 'projects' },
  [W.EXPERIENCE]: { finderAlias: 'experience' },
};

/** IDs of real windows (have a DOM element with titlebar, not aliases) */
export const managedWindows = [
  W.ABOUT,
  W.CONTACT,
  W.SKILLS,
  W.EDUCATION,
  W.FINDER,
  W.SETTINGS,
  W.BROWSER,
  W.APP_STORE,
  W.SPEED_TEST,
  W.TERMINAL,
  W.PREVIEW,
  W.NOTES,
  W.PLAYGROUND,
  W.STICKIES,
  W.ACHIEVEMENTS,
] as const;

/* ---- App registry ---- */

export interface OsApp {
  /** Window id (e.g. "about-window") */
  id: string;
  /** Display name shown in menus, dock tooltips, and launchpad */
  name: string;
  /** Title shown in the window title bar */
  windowTitle: string;
  /** Key into the `icons` record */
  icon: string;
  /** CSS gradient class for the icon background */
  gradient: string;
  /** CSS shadow class (empty string = no shadow) */
  shadow: string;
  /** Desktop label (e.g. "AboutMe.app") — omit to hide from desktop */
  desktopLabel?: string;
  /** If true, the icon shows text instead of an SVG (e.g. App Store "A") */
  isText?: boolean;
  /** Dock placement: 'fixed-left' | 'fixed-right' | 'dynamic' (default) */
  dockSlot?: 'fixed-left' | 'fixed-right';
  /** If true, shows in the Launchpad grid (default false) */
  launchpad?: boolean;
}

export const osApps: OsApp[] = [
  // ── Launchpad Row 1: Portfolio (your profile) ──
  {
    id: W.ABOUT,
    name: 'About Me',
    windowTitle: 'About Me',
    icon: 'user',
    gradient: 'os-gradient-green',
    shadow: 'os-shadow-green',
    desktopLabel: 'About Me',
    launchpad: true,
  },
  {
    id: W.SKILLS,
    name: 'Skills',
    windowTitle: 'Skills',
    icon: 'code',
    gradient: 'os-gradient-yellow',
    shadow: 'os-shadow-yellow',
    desktopLabel: 'Skills',
    launchpad: true,
  },
  {
    id: W.EDUCATION,
    name: 'Education',
    windowTitle: 'Education',
    icon: 'graduationCap',
    gradient: 'os-gradient-pink',
    shadow: 'os-shadow-pink',
    desktopLabel: 'Education',
    launchpad: true,
  },
  {
    id: W.PREVIEW,
    name: 'Preview',
    windowTitle: 'Preview — Certifications',
    icon: 'preview',
    gradient: 'os-gradient-blue',
    shadow: 'os-shadow-blue',
    launchpad: true,
  },
  {
    id: W.CONTACT,
    name: 'Contact',
    windowTitle: 'Contact',
    icon: 'mail',
    gradient: 'os-gradient-cyan',
    shadow: 'os-shadow-cyan',
    desktopLabel: 'Contact',
    launchpad: true,
  },
  // ── Launchpad Row 2: Tools ──
  {
    id: W.FINDER,
    name: 'Finder',
    windowTitle: 'Finder',
    icon: 'smile',
    gradient: 'os-gradient-finder',
    shadow: 'os-shadow-blue',
    dockSlot: 'fixed-left',
    launchpad: true,
  },
  {
    id: W.BROWSER,
    name: 'Browser',
    windowTitle: 'Browser',
    icon: 'globe',
    gradient: 'os-gradient-blue',
    shadow: 'os-shadow-blue',
    launchpad: true,
  },
  {
    id: W.TERMINAL,
    name: 'Terminal',
    windowTitle: 'Terminal',
    icon: 'terminal',
    gradient: 'os-gradient-darkslate',
    shadow: '',
    launchpad: true,
  },
  {
    id: W.APP_STORE,
    name: 'App Store',
    windowTitle: 'App Store',
    icon: 'A',
    gradient: 'os-gradient-appstore',
    shadow: 'os-shadow-blue',
    isText: true,
    dockSlot: 'fixed-left',
    launchpad: true,
  },
  {
    id: W.NOTES,
    name: 'Notes',
    windowTitle: 'Notes',
    icon: 'notes',
    gradient: 'os-gradient-yellow',
    shadow: 'os-shadow-yellow',
    launchpad: true,
  },
  // ── Launchpad Row 3: Utilities ──
  {
    id: W.PLAYGROUND,
    name: 'Playgrounds',
    windowTitle: 'Playgrounds',
    icon: 'terminal-run',
    gradient: 'os-gradient-orange',
    shadow: 'os-shadow-orange',
    launchpad: true,
  },
  {
    id: W.STICKIES,
    name: 'Stickies',
    windowTitle: 'Stickies',
    icon: 'stickies',
    gradient: 'os-gradient-orange',
    shadow: 'os-shadow-orange',
    launchpad: true,
  },
  {
    id: W.SPEED_TEST,
    name: 'Speed Test',
    windowTitle: 'Speed Test',
    icon: 'speed-test',
    gradient: 'os-gradient-blue',
    shadow: 'os-shadow-blue',
    launchpad: true,
  },
  {
    id: W.SETTINGS,
    name: 'Settings',
    windowTitle: 'Settings',
    icon: 'settings',
    gradient: 'os-gradient-slate',
    shadow: '',
    dockSlot: 'fixed-right',
    launchpad: true,
  },
  {
    id: W.ACHIEVEMENTS,
    name: 'Game Center',
    windowTitle: 'Game Center',
    icon: 'trophy',
    gradient: 'os-gradient-purple',
    shadow: 'os-shadow-purple',
    launchpad: true,
  },
  // ── Desktop-only aliases (Finder tabs) ──
  {
    id: W.PROJECTS,
    name: 'Projects',
    windowTitle: 'Projects',
    icon: 'folder',
    gradient: 'os-gradient-blue',
    shadow: 'os-shadow-blue',
    desktopLabel: 'Projects',
  },
  {
    id: W.EXPERIENCE,
    name: 'Experience',
    windowTitle: 'Experience',
    icon: 'briefcase',
    gradient: 'os-gradient-purple',
    shadow: 'os-shadow-purple',
    desktopLabel: 'Experience',
  },
  // ── Dock-only (no launchpad, no desktop) ──
  {
    id: W.LAUNCHPAD,
    name: 'Launchpad',
    windowTitle: 'Launchpad',
    icon: 'grid3x3',
    gradient: 'os-gradient-darkslate',
    shadow: '',
    dockSlot: 'fixed-left',
  },
];

/* ---- Derived helpers ---- */

/** Apps that appear on the desktop (right-side icon grid) */
export const desktopApps = osApps.filter((a) => a.desktopLabel);

/** Apps shown in the launchpad grid */
export const launchpadApps = osApps.filter((a) => a.launchpad);

/** Fixed dock items on the left */
export const dockFixedLeft = osApps.filter((a) => a.dockSlot === 'fixed-left');

/** Fixed dock items on the right */
export const dockFixedRight = osApps.filter(
  (a) => a.dockSlot === 'fixed-right'
);

/** Map windowId → app name (for menubar) */
export const appNames: Record<string, string> = Object.fromEntries(
  osApps.map((a) => [a.id, a.name])
);

/** Map windowId → window title bar text */
export const windowTitles: Record<string, string> = Object.fromEntries(
  osApps.map((a) => [a.id, a.windowTitle])
);

/** Dock registry for dynamic icons (consumed by windowManager JS) */
export const dockRegistry: Record<
  string,
  { name: string; icon: string; gradient: string }
> = Object.fromEntries(
  osApps
    .filter((a) => a.id !== W.LAUNCHPAD)
    .map((a) => [
      a.id,
      {
        name: a.name,
        icon: a.isText ? '' : icons[a.icon],
        gradient: a.gradient,
      },
    ])
);

/** Resolve icon key to SVG path string */
export function getIconPath(key: string): string {
  return icons[key] || icons.folder;
}
