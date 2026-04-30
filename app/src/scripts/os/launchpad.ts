import { openWindow } from './windowManager';
import { track } from './achievements';
import {
  getLayoutMode,
  showMobileLaunchpad,
  hideMobileLaunchpad,
  isMobileLaunchpadVisible,
} from './responsive';

let backdrop: HTMLElement | null = null;
let panel: HTMLElement | null = null;
let searchInput: HTMLInputElement | null = null;
let appButtons: HTMLElement[] = [];

export function initLaunchpad() {
  backdrop = document.getElementById('launchpad-backdrop');
  panel = document.getElementById('launchpad-panel');
  searchInput = document.getElementById('launchpad-search') as HTMLInputElement | null;
  const grid = document.getElementById('launchpad-grid');
  if (!backdrop || !grid) return;

  appButtons = Array.from(grid.querySelectorAll<HTMLElement>('.lp-app'));

  // Launchpad trigger — dock icon with no openWindow
  document.querySelectorAll<HTMLElement>('[data-open-launchpad]').forEach((el) => {
    el.addEventListener('click', () => toggleLaunchpad());
  });

  // Click on backdrop (outside panel) → close
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeLaunchpad();
  });

  // Escape → close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) closeLaunchpad();
  });

  // Search filter
  searchInput?.addEventListener('input', () => {
    if (!searchInput) return;
    const q = (searchInput.value || '').toLowerCase().trim();
    appButtons.forEach((btn) => {
      const name = btn.dataset.lpName || '';
      btn.classList.toggle('lp-app--hidden', q !== '' && !name.includes(q));
    });
  });

  // App click → open window + close launchpad
  appButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const windowId = btn.dataset.lpWindow;
      if (windowId) {
        const win = document.getElementById(windowId);
        if (win) openWindow(win);
      }
      track('launchpad-open');
      closeLaunchpad();
    });
  });
}

function isOpen(): boolean {
  // On mobile, check the slide-in state instead of display
  if (getLayoutMode() === 'mobile') {
    return isMobileLaunchpadVisible();
  }
  return backdrop?.style.display !== 'none';
}

export function toggleLaunchpad() {
  if (isOpen()) {
    closeLaunchpad();
  } else {
    openLaunchpad();
  }
}

function openLaunchpad() {
  if (!backdrop) return;

  // On mobile, use slide-in gesture system
  if (getLayoutMode() === 'mobile') {
    showMobileLaunchpad();
    return;
  }

  backdrop.style.display = 'flex';
  backdrop.classList.remove('lp-backdrop--closing');
  backdrop.classList.add('lp-backdrop--opening');

  // Reset search
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  appButtons.forEach((btn) => btn.classList.remove('lp-app--hidden'));

  // Lock panel height so it doesn't shrink when search filters apps
  requestAnimationFrame(() => {
    if (panel) panel.style.minHeight = `${panel.offsetHeight}px`;
  });

  backdrop.addEventListener('animationend', () => {
    if (!backdrop) return;
    backdrop.classList.remove('lp-backdrop--opening');
  }, { once: true });
}

function closeLaunchpad() {
  if (!backdrop) return;

  // On mobile, use slide-out gesture system
  if (getLayoutMode() === 'mobile') {
    hideMobileLaunchpad();
    return;
  }

  backdrop.classList.add('lp-backdrop--closing');
  backdrop.addEventListener('animationend', () => {
    if (!backdrop) return;
    backdrop.style.display = 'none';
    backdrop.classList.remove('lp-backdrop--closing');
    // Release locked height for next open
    if (panel) panel.style.minHeight = '';
  }, { once: true });
}
