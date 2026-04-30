import { settings, saveSettings } from './persist';

/** Apply font size scale to CSS variables */
export function applyFontSize(size: number) {
  const root = document.documentElement;
  // Scale factors: -1=smaller, 0=default, 1=larger, 2=largest
  const scales: Record<number, number> = { '-1': 0.85, '0': 1, '1': 1.15, '2': 1.3 };
  const s = scales[size] ?? 1;

  // Base sizes used throughout the OS theme
  const bases = [7, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26];
  bases.forEach(px => {
    root.style.setProperty(`--os-fs-${px}`, `${Math.round(px * s)}px`);
  });
}

/** Apply reduce motion preference */
export function applyReduceMotion(reduce: boolean) {
  document.documentElement.classList.toggle('os-reduce-motion', reduce);
}

/** Apply high contrast preference */
export function applyHighContrast(contrast: boolean) {
  document.documentElement.classList.toggle('os-high-contrast', contrast);
}

export function initAccessibility() {
  // Font size buttons
  const fontBtns = document.querySelectorAll<HTMLElement>('[data-stg-fontsize]');
  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = parseInt(btn.dataset.stgFontsize || '0', 10);
      if (size === settings.fontSize) return;

      fontBtns.forEach(b => b.classList.remove('stg-font-btn--active'));
      btn.classList.add('stg-font-btn--active');

      settings.fontSize = size;
      applyFontSize(size);
      saveSettings(settings, 'fontSize');
    });
  });

  // Reduce motion toggle
  const motionToggle = document.getElementById('stg-reduce-motion-toggle');
  if (motionToggle) {
    motionToggle.addEventListener('click', () => {
      settings.reduceMotion = motionToggle.classList.contains('stg-toggle--on');
      applyReduceMotion(settings.reduceMotion);
      saveSettings(settings, 'reduceMotion');
    });
  }

  // High contrast toggle
  const contrastToggle = document.getElementById('stg-high-contrast-toggle');
  if (contrastToggle) {
    contrastToggle.addEventListener('click', () => {
      settings.highContrast = contrastToggle.classList.contains('stg-toggle--on');
      applyHighContrast(settings.highContrast);
      saveSettings(settings, 'highContrast');
    });
  }
}

export function restoreAccessibility() {
  applyFontSize(settings.fontSize);
  applyReduceMotion(settings.reduceMotion);
  applyHighContrast(settings.highContrast);

  // Restore font size button
  const fontBtns = document.querySelectorAll<HTMLElement>('[data-stg-fontsize]');
  fontBtns.forEach(btn => {
    const size = parseInt(btn.dataset.stgFontsize || '0', 10);
    btn.classList.toggle('stg-font-btn--active', size === settings.fontSize);
  });

  // Restore toggles
  const motionToggle = document.getElementById('stg-reduce-motion-toggle');
  if (motionToggle) {
    motionToggle.classList.toggle('stg-toggle--on', settings.reduceMotion);
  }
  const contrastToggle = document.getElementById('stg-high-contrast-toggle');
  if (contrastToggle) {
    contrastToggle.classList.toggle('stg-toggle--on', settings.highContrast);
  }
}
