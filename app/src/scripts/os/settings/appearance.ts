import { settings, saveSettings } from './persist';
import { notify, getNotifI18n } from '../notifications';

export function applyAppearance(pref: 'light' | 'dark' | 'auto') {
  let resolved: 'light' | 'dark';
  if (pref === 'auto') {
    resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } else {
    resolved = pref;
  }
  document.documentElement.setAttribute('data-os-mode', resolved);
  const mc = document.getElementById('meta-theme-color');
  if (mc) mc.setAttribute('content', resolved === 'light' ? '#f0f0f5' : '#1a1a2e');
}

export function initAppearance() {
  // Theme / appearance selection
  const themes = document.querySelectorAll<HTMLElement>('[data-stg-theme]');
  themes.forEach((t) => {
    t.addEventListener('click', () => {
      if (t.classList.contains('stg-theme--selected')) return;
      themes.forEach((x) => x.classList.remove('stg-theme--selected'));
      t.classList.add('stg-theme--selected');
      themes.forEach((x) => {
        const label = x.querySelector('.stg-theme-label');
        if (label) {
          label.classList.toggle('stg-theme-label--active', x === t);
        }
      });
      const appearance = t.dataset.stgTheme as 'light' | 'dark' | 'auto';
      settings.appearance = appearance;
      applyAppearance(appearance);
      saveSettings(settings, 'appearance');
      const nt = getNotifI18n();
      notify(nt.settingsTitle || 'Settings', nt.appearanceChanged || 'Appearance changed', undefined, 'settings-window');
    });
  });

  // Listen for system preference changes (for auto mode)
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (settings.appearance === 'auto') {
      applyAppearance('auto');
    }
  });
}

export function restoreAppearance() {
  applyAppearance(settings.appearance);
  const themes = document.querySelectorAll<HTMLElement>('[data-stg-theme]');
  const activeTheme = document.querySelector<HTMLElement>(`[data-stg-theme="${settings.appearance}"]`);
  if (activeTheme) {
    themes.forEach((x) => {
      x.classList.remove('stg-theme--selected');
      const label = x.querySelector('.stg-theme-label');
      if (label) label.classList.remove('stg-theme-label--active');
    });
    activeTheme.classList.add('stg-theme--selected');
    const label = activeTheme.querySelector('.stg-theme-label');
    if (label) label.classList.add('stg-theme-label--active');
  }
}
