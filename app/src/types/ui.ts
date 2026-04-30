/* ---- UI base (from ui/base.json) ---- */

export interface UiBaseLangSwitch {
  langNames: Record<string, string>;
}

export interface UiBaseFooter {
  version: string;
  year: string;
}

export interface UiBase {
  langSwitch: UiBaseLangSwitch;
  footer: UiBaseFooter;
}

/* ---- Shared UI (from ui/shared/{lang}.json) ---- */

export interface SharedNav {
  about: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  contact: string;
}

export interface SharedLangSwitch {
  translateAlert: string;
  translateSwitch: string;
  translateDismiss: string;
}

export interface SharedUi {
  nav: SharedNav;
  langSwitch: SharedLangSwitch;
}

/* ---- Terminal UI (from ui/terminal/{lang}/ui.json) ---- */

export interface BootLine {
  text: string;
  type: string;
}

export interface TerminalNav {
  about: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  contact: string;
}

export interface TerminalLangSwitch {
  selectLabel: string;
  translateAlert: string;
  translateSwitch: string;
  translateDismiss: string;
}

export interface TerminalHero {
  codeBlockFile: string;
  topBarSuffix: string;
  role: string;
  tagline: string;
  bootLines: BootLine[];
  bootReady: string;
  prompt: string;
  terminalTitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface TerminalShell {
  toggleMenu: string;
  mobileNav: string;
}

export interface TerminalAbout {
  command: string;
  avatarLabel: string;
  bioTitle: string;
  langLabel: string;
}

export interface TerminalSkills {
  command: string;
  subtitle: string;
}

export interface TerminalExperience {
  command: string;
  subtitle: string;
}

export interface TerminalProjects {
  command: string;
  subtitle: string;
  allLabel: string;
  featuredBadge: string;
  itemsBadge: string;
  openBtn: string;
}

export interface TerminalEducation {
  command: string;
  subtitle: string;
  certsTitle: string;
}

export interface TerminalContact {
  command: string;
  headline: string;
  subtitle: string;
}

export interface TerminalFooter {
  builtWith: string;
  tagline: string;
  lastUpdated: string;
  session: string;
}

export interface TerminalUi {
  nav: TerminalNav;
  langSwitch: TerminalLangSwitch;
  shell: TerminalShell;
  hero: TerminalHero;
  about: TerminalAbout;
  skills: TerminalSkills;
  experience: TerminalExperience;
  projects: TerminalProjects;
  education: TerminalEducation;
  contact: TerminalContact;
  footer: TerminalFooter;
}

/* ---- OS UI (from ui/os/{lang}/ui.json) ---- */

export interface OsMenuBar {
  aboutMac: string;
  settings: string;
  appStore: string;
  sleep: string;
  restart: string;
  lockScreen: string;
  downloadCV: string;
  defaultApp: string;
  fullscreen: string;
  language: string;
  back: string;
}

export interface OsLockScreen {
  clickToUnlock: string;
  locked: string;
  battery: string;
  swipeToUnlock: string;
}

export interface OsAbout {
  metricsLabels: string[];
}

export interface OsContact {
  headline: string;
  subtitle: string;
}

export interface OsEducation {
  navEducation: string;
  navCertifications: string;
}

// Skills labels derived from profile.json categories — no UI keys needed
export type OsSkills = Record<string, never>;

export interface OsFinder {
  pathPrefix: string;
  favorites: string;
  projects: string;
  experience: string;
  tags: string;
  all: string;
  colName: string;
  colDate: string;
  colTags: string;
  present: string;
  remote: string;
  detailBack: string;
  detailOpen: string;
  detailInfo: string;
  detailTags: string;
  footerSelected: string;
  footerItems: string;
}

export interface OsSettings {
  navAppearance: string;
  navDesktopDock: string;
  navWallpaper: string;
  navDateTime: string;
  navLanguage: string;
  appearance: string;
  light: string;
  dark: string;
  auto: string;
  accentColor: string;
  dock: string;
  size: string;
  magnification: string;
  autoHide: string;
  wallpaper: string;
  current: string;
  mode: string;
  frame: string;
  loop: string;
  images: string;
  animations: string;
  dateTime: string;
  menuClock: string;
  format24h: string;
  showSeconds: string;
  showWeekday: string;
  showDate: string;
  preview: string;
  mobileClockNote: string;
  mobileDockNote: string;
  languageRegion: string;
  preferredLanguage: string;
  accentColors: string[];
  navAccessibility: string;
  display: string;
  fontSize: string;
  fontSizeDefault: string;
  fontSizeSmall: string;
  fontSizeLarge: string;
  fontSizeLargest: string;
  reduceMotion: string;
  reduceMotionDesc: string;
  highContrast: string;
  highContrastDesc: string;
}

export interface OsAppStoreStats {
  ratings: string;
  ages: string;
  chart: string;
  developer: string;
  language: string;
  size: string;
}

export interface OsAppStore {
  navAll: string;
  navOpenSource: string;
  navPortfolio: string;
  search: string;
  open: string;
  share: string;
  noAppsFound: string;
  description: string;
  platform: string;
  stats: OsAppStoreStats;
}

export interface OsBrowser {
  contentBlocked: string;
  openInNewTab: string;
  home: string;
  title: string;
  reload: string;
  openExternal: string;
  startPage: string;
  favorites: string;
}

export interface OsLaunchpad {
  searchPlaceholder: string;
}

export interface OsPreview {
  of: string;
  verify: string;
  noImage: string;
  issuer: string;
}

export interface OsNotes {
  search: string;
  noResults: string;
  readTime: string;
}

export interface OsPlayground {
  run: string;
  output: string;
  copied: string;
  copy: string;
}

export interface OsNotifications {
  welcomeTitle: string;
  welcomeBody: string;
  speedTestTitle: string;
  speedTestBody: string;
  terminalTitle: string;
  terminalBody: string;
  cvTitle: string;
  cvBody: string;
  articleTitle: string;
  articleBody: string;
}

export interface OsNotificationCenter {
  title: string;
  clearAll: string;
  empty: string;
  timeNow: string;
  timeMinutes: string;
  timeHours: string;
}

export interface OsStickies {
  newNote: string;
  deleteNote: string;
  placeholder: string;
  empty: string;
  confirmDelete: string;
}

export interface OsContextMenu {
  open: string;
  close: string;
  showWindow: string;
  showInFinder: string;
  changeWallpaper: string;
  settings: string;
  aboutThisMac: string;
  turnHidingOn: string;
  turnHidingOff: string;
}

export interface OsShortcuts {
  title: string;
  hint: string;
  general: string;
  windows: string;
  openSettings: string;
  toggleLaunchpad: string;
  notifCenter: string;
  keyboardShortcuts: string;
  closePanel: string;
  switchWindows: string;
}

export interface OsAchievementItem {
  name: string;
  desc: string;
}

export interface OsAchievements {
  windowTitle: string;
  counter: string;
  locked: string;
  unlocked: string;
  unlockedAt: string;
  explorer: OsAchievementItem;
  hacker: OsAchievementItem;
  curious: OsAchievementItem;
  artist: OsAchievementItem;
  speedster: OsAchievementItem;
  polyglot: OsAchievementItem;
  customizer: OsAchievementItem;
  dev: OsAchievementItem;
  networker: OsAchievementItem;
  retro: OsAchievementItem;
  archivist: OsAchievementItem;
  certified: OsAchievementItem;
}

export interface OsFooter {
  copyright: string;
  tagline: string;
  inspiration: string;
}

export interface OsSpeedTest {
  ready: string;
  testing: string;
  complete: string;
  failed: string;
  btnRun: string;
  btnRunning: string;
  btnRetry: string;
  download: string;
  upload: string;
  latency: string;
  jitter: string;
  qualityBad: string;
  qualityPoor: string;
  qualityAverage: string;
  qualityGood: string;
  qualityGreat: string;
}

export interface OsTerminal {
  welcome: string;
  lastLogin: string;
  cmdNotFound: string;
  noSuchFile: string;
  isDirectory: string;
  missingOperand: string;
  notADirectory: string;
  openMissing: string;
  openNotFound: string;
  opening: string;
  openingRepo: string;
  sudoCmdNotFound: string;
  helpDesc: string;
  lsDesc: string;
  catDesc: string;
  cdDesc: string;
  pwdDesc: string;
  whoamiDesc: string;
  clearDesc: string;
  skillsDesc: string;
  experienceDesc: string;
  projectsDesc: string;
  contactDesc: string;
  openDesc: string;
  historyDesc: string;
  echoDesc: string;
  dateDesc: string;
  unameDesc: string;
  neofetchDesc: string;
  cowsayDesc: string;
  pingDesc: string;
  matrixDesc: string;
  nfName: string;
  nfRole: string;
  nfOS: string;
  nfShell: string;
  nfSkills: string;
  nfProjects: string;
  nfExp: string;
  nfLanguages: string;
  nfTechnologies: string;
  nfShipped: string;
  nfYears: string;
  eggHireMe: string;
  eggHireMeAvailable: string;
  eggRmDoubt: string;
  eggVim: string;
  eggExit: string;
  eggSudoRm: string;
  eggMatrix: string;
  eggCowDefault: string;
}

export interface OsUi {
  menuBar: OsMenuBar;
  lockScreen: OsLockScreen;
  about: OsAbout;
  contact: OsContact;
  education: OsEducation;
  skills: OsSkills;
  finder: OsFinder;
  settings: OsSettings;
  speedTest: OsSpeedTest;
  appStore: OsAppStore;
  browser: OsBrowser;
  launchpad: OsLaunchpad;
  terminal: OsTerminal;
  preview: OsPreview;
  notes: OsNotes;
  playground: OsPlayground;
  notifications: OsNotifications;
  notificationCenter: OsNotificationCenter;
  stickies: OsStickies;
  contextMenu: OsContextMenu;
  shortcuts: OsShortcuts;
  achievements: OsAchievements;
  footer: OsFooter;
}

/* ---- Liquid Glass UI (from ui/liquid-glass/{lang}/ui.json) ---- */

export interface LiquidGlassNav {
  about: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  contact: string;
}

export interface LiquidGlassLangSwitch {
  selectLabel: string;
  translateAlert: string;
  translateSwitch: string;
  translateDismiss: string;
}

export interface LiquidGlassHero {
  ctaPrimary: string;
  ctaSecondary: string;
  scrollHint: string;
}

export interface LiquidGlassAbout {
  label: string;
  bioTitle: string;
  langLabel: string;
}

export interface LiquidGlassSkills {
  label: string;
  title: string;
  subtitle: string;
  levelExpert: string;
  levelAdvanced: string;
  levelIntermediate: string;
}

export interface LiquidGlassExperience {
  label: string;
  title: string;
  subtitle: string;
}

export interface LiquidGlassProjects {
  label: string;
  title: string;
  subtitle: string;
  allLabel: string;
  featuredBadge: string;
  openBtn: string;
}

export interface LiquidGlassEducation {
  label: string;
  title: string;
  subtitle: string;
  certsTitle: string;
}

export interface LiquidGlassContact {
  headline: string;
  subtitle: string;
  emailLabel: string;
}

export interface LiquidGlassFooter {
  builtWith: string;
}

export interface LiquidGlassUi {
  nav: LiquidGlassNav;
  langSwitch: LiquidGlassLangSwitch;
  hero: LiquidGlassHero;
  about: LiquidGlassAbout;
  skills: LiquidGlassSkills;
  experience: LiquidGlassExperience;
  projects: LiquidGlassProjects;
  education: LiquidGlassEducation;
  contact: LiquidGlassContact;
  footer: LiquidGlassFooter;
}
