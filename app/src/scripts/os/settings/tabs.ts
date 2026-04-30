import { openWindow } from '../window/lifecycle';
import { track } from '../achievements';
import { settings, saveSettings } from './persist';
import type { Settings } from './persist';
import { setMagnification, setAutoHide, setDockScale } from '../dockMagnify';
import { getLayoutMode } from '../responsive';

/* ---- Reusable slider helper ---- */
interface SliderOpts {
  trackId: string;
  fillId: string;
  thumbId: string;
  labelId: string;
  min: number;
  max: number;
  initial: number;
  formatLabel?: (v: number) => string;
  onChange: (value: number) => void;
}

function initSlider(opts: SliderOpts) {
  const track = document.getElementById(opts.trackId);
  const fill = document.getElementById(opts.fillId);
  const thumb = document.getElementById(opts.thumbId);
  const label = document.getElementById(opts.labelId);
  if (!track || !fill || !thumb || !label) return;

  const { min, max } = opts;
  const fmt = opts.formatLabel ?? ((v) => v + '%');

  function pctFromValue(v: number) {
    return ((v - min) / (max - min)) * 100;
  }

  function valueFromPct(p: number) {
    return Math.round(min + (p / 100) * (max - min));
  }

  function update(value: number) {
    const clamped = Math.max(min, Math.min(max, value));
    const p = pctFromValue(clamped);
    fill!.style.width = p + '%';
    thumb!.style.left = p + '%';
    label!.textContent = fmt(clamped);
    opts.onChange(clamped);
  }

  function handlePointer(e: PointerEvent) {
    const rect = track!.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    update(valueFromPct((x / rect.width) * 100));
  }

  track.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handlePointer(e);
    const onMove = (ev: PointerEvent) => handlePointer(ev);
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });

  // Use saved value instead of hardcoded initial
  update(opts.initial);
}

export function updateSliderUI(fillId: string, thumbId: string, labelId: string,
  value: number, min: number, max: number, fmt: (v: number) => string) {
  const fill = document.getElementById(fillId);
  const thumb = document.getElementById(thumbId);
  const label = document.getElementById(labelId);
  if (!fill || !thumb || !label) return;
  const p = ((value - min) / (max - min)) * 100;
  fill.style.width = p + '%';
  thumb.style.left = p + '%';
  label.textContent = fmt(value);
}

function applyDockSize(value: number) {
  setDockScale(value / 100);
  updateSliderUI('stg-dock-slider-fill', 'stg-dock-slider-thumb', 'stg-dock-size-val',
    value, 50, 200, (v) => v + '%');
}

/* ---- Dock size slider (50% – 200%) ---- */
export function initDockSizeSlider() {
  initSlider({
    trackId: 'stg-dock-slider',
    fillId: 'stg-dock-slider-fill',
    thumbId: 'stg-dock-slider-thumb',
    labelId: 'stg-dock-size-val',
    min: 50,
    max: 200,
    initial: settings.dockSize,
    onChange(value) {
      settings.dockSize = value;
      applyDockSize(value);
      saveSettings(settings, 'dockSize');
    },
  });
}

/* ---- Magnification slider (0% – 50%) ---- */
export function initMagnificationSlider() {
  initSlider({
    trackId: 'stg-mag-slider',
    fillId: 'stg-mag-slider-fill',
    thumbId: 'stg-mag-slider-thumb',
    labelId: 'stg-mag-val',
    min: 0,
    max: 50,
    initial: settings.magnification,
    formatLabel(v) {
      if (v === 0) return 'Off';
      return v + '%';
    },
    onChange(value) {
      settings.magnification = value;
      setMagnification(value);
      saveSettings(settings, 'magnification');
    },
  });
}

/* ---- Toggle switches ---- */
export function initToggleSwitches() {
  const toggles = document.querySelectorAll<HTMLElement>('.stg-toggle');
  toggles.forEach((t) => {
    t.addEventListener('click', () => {
      t.classList.toggle('stg-toggle--on');
    });
  });
}

/* ---- Reset navigation (not values) ---- */
export function resetSettings() {
  const navButtons = document.querySelectorAll<HTMLElement>('[data-stg-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-stg-panel]');

  const firstBtn = navButtons[0];
  if (!firstBtn) return;
  const firstKey = firstBtn.dataset.stgTab!;

  navButtons.forEach((b) => b.classList.remove('os-nav--active'));
  firstBtn.classList.add('os-nav--active');

  panels.forEach((p) => {
    p.classList.toggle('stg-panel--active', p.dataset.stgPanel === firstKey);
  });
}

/* ---- Tab navigation ---- */
export function initTabNav() {
  const navButtons = document.querySelectorAll<HTMLElement>('[data-stg-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-stg-panel]');

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('os-nav--active')) return;
      const key = btn.dataset.stgTab!;
      navButtons.forEach((b) => b.classList.remove('os-nav--active'));
      btn.classList.add('os-nav--active');
      panels.forEach((p) => {
        p.classList.toggle('stg-panel--active', p.dataset.stgPanel === key);
      });
    });
  });

  return { navButtons, panels };
}

/* ---- Auto-hide toggle ---- */
export function initAutoHideToggle(): HTMLElement | null {
  const autoHideToggle = document.getElementById('stg-autohide-toggle');
  if (autoHideToggle) {
    autoHideToggle.addEventListener('click', () => {
      settings.autoHide = autoHideToggle.classList.contains('stg-toggle--on');
      setAutoHide(settings.autoHide);
      saveSettings(settings, 'autoHide');
    });
  }
  return autoHideToggle;
}

/* ---- DateTime toggles ---- */
type BooleanSettingsKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export function initDateTimeToggles(updateMenuBarClock: () => void) {
  const isMobile = getLayoutMode() === 'mobile';

  // Show mobile notice and disable toggles
  if (isMobile) {
    const note = document.getElementById('stg-mobile-note');
    if (note) note.style.display = '';

    document.querySelectorAll<HTMLElement>('.stg-info-row--mobile-disabled').forEach((row) => {
      row.classList.add('stg-info-row--disabled');
    });
  }

  const map: [string, BooleanSettingsKey][] = [
    ['stg-24h-toggle', 'clock24h'],
    ['stg-seconds-toggle', 'clockSeconds'],
    ['stg-weekday-toggle', 'clockWeekday'],
    ['stg-date-toggle', 'clockDate'],
  ];

  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      settings[key] = el.classList.contains('stg-toggle--on');
      saveSettings(settings, key);
      updateMenuBarClock();
    });
  });
}

export function restoreDateTimeToggles() {
  const map: [string, keyof Settings][] = [
    ['stg-24h-toggle', 'clock24h'],
    ['stg-seconds-toggle', 'clockSeconds'],
    ['stg-weekday-toggle', 'clockWeekday'],
    ['stg-date-toggle', 'clockDate'],
  ];

  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (settings[key]) {
      el.classList.add('stg-toggle--on');
    } else {
      el.classList.remove('stg-toggle--on');
    }
  });
}

/* ---- Dock restore ---- */
export function restoreDock(autoHideToggle: HTMLElement | null) {
  // Dock size
  applyDockSize(settings.dockSize);

  // Magnification
  setMagnification(settings.magnification);
  updateSliderUI('stg-mag-slider-fill', 'stg-mag-slider-thumb', 'stg-mag-val',
    settings.magnification, 0, 50,
    (v) => v === 0 ? 'Off' : v + '%');

  // Auto-hide
  if (autoHideToggle) {
    if (settings.autoHide) {
      autoHideToggle.classList.add('stg-toggle--on');
    } else {
      autoHideToggle.classList.remove('stg-toggle--on');
    }
    setAutoHide(settings.autoHide);
  }
}

/* ---- Menu bar clock ---- */
function formatClock(s: Settings): string {
  const now = new Date();
  const locale = document.documentElement.lang || 'en';

  // Mobile: always short time only (e.g. "9:41")
  if (getLayoutMode() === 'mobile') {
    return now.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  }

  const parts: string[] = [];

  if (s.clockDate) {
    const dateOpts: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    if (s.clockWeekday) dateOpts.weekday = 'short';
    parts.push(now.toLocaleDateString(locale, dateOpts));
  } else if (s.clockWeekday) {
    parts.push(now.toLocaleDateString(locale, { weekday: 'short' }));
  }

  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !s.clock24h,
  };
  if (s.clockSeconds) timeOpts.second = '2-digit';
  parts.push(now.toLocaleTimeString(locale, timeOpts));

  return parts.join('  ');
}

export function updateMenuBarClock() {
  const el = document.getElementById('os-clock');
  if (el) el.textContent = formatClock(settings);

  const preview = document.getElementById('stg-clock-preview');
  if (preview) preview.textContent = formatClock(settings);
}

/* ---- Language picker ---- */
export function initLanguagePicker() {
  const items = document.querySelectorAll<HTMLElement>('[data-stg-lang]');
  const currentLang = getCurrentLang();

  items.forEach((item) => {
    if (item.dataset.stgLang === currentLang) {
      item.classList.add('stg-lang-item--active');
    }
    item.addEventListener('click', () => {
      const lang = item.dataset.stgLang;
      if (!lang || lang === currentLang) return;
      track('lang-changed');
      // Preserve /os/ prefix if present, otherwise navigate to root /{lang}
      const prefix = window.location.pathname.startsWith('/os/') ? '/os/' : '/';
      window.location.href = `${prefix}${lang}`;
    });
  });
}

function getCurrentLang(): string {
  // Match /os/{lang} or root /{lang} (when OS is the default theme)
  const match = window.location.pathname.match(/(?:\/os)?\/(\w+)/);
  return match ? match[1] : 'es';
}

/* ---- Settings shortcuts (lang button, clock click) ---- */
export function initSettingsShortcuts(
  navButtons: NodeListOf<HTMLElement>,
  panels: NodeListOf<HTMLElement>,
) {
  // Lang button → set text and open Settings on Idioma y región
  const langBtn = document.getElementById('os-lang-btn');
  const langText = document.getElementById('os-lang-text');
  if (langText) langText.textContent = getCurrentLang();
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const win = document.getElementById('settings-window');
      if (win) openWindow(win);
      navButtons.forEach((b) => b.classList.remove('os-nav--active'));
      const langNav = document.querySelector<HTMLElement>('[data-stg-tab="language"]');
      if (langNav) langNav.classList.add('os-nav--active');
      panels.forEach((p) => p.classList.toggle('stg-panel--active', p.dataset.stgPanel === 'language'));
    });
  }
}
