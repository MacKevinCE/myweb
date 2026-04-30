import { settings, saveSettings } from './persist';

export function applyAccentColor(color: string) {
  document.documentElement.style.setProperty('--os-accent', color);
}

export function initAccent() {
  // Color dot selection
  const dots = document.querySelectorAll<HTMLElement>('[data-stg-color]');
  dots.forEach((d) => {
    d.addEventListener('click', () => {
      if (d.classList.contains('stg-color-dot--selected')) return;
      dots.forEach((x) => x.classList.remove('stg-color-dot--selected'));
      d.classList.add('stg-color-dot--selected');
      const color = (d as HTMLElement).dataset.stgColor;
      if (color) {
        settings.accentColor = color;
        applyAccentColor(color);
        saveSettings(settings, 'accentColor');
      }
    });
  });
}

export function restoreAccent() {
  applyAccentColor(settings.accentColor);
  const activeDot = document.querySelector<HTMLElement>(
    `[data-stg-color="${settings.accentColor}"]`
  );
  if (activeDot) {
    document
      .querySelectorAll('[data-stg-color]')
      .forEach((d) => d.classList.remove('stg-color-dot--selected'));
    activeDot.classList.add('stg-color-dot--selected');
  }
}
