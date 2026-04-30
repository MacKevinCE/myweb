import { openWindow } from './windowManager';
import { showLockScreen } from './lockScreen';
import { track } from './achievements';

export function initOsMenu() {
  const btn = document.getElementById('os-menu-btn');
  const menu = document.getElementById('os-menu');
  if (!btn || !menu) return;

  // Toggle on click
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.contains('os-menu--open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('os-menu--open')) return;
    if (!menu.contains(e.target as Node) && !btn.contains(e.target as Node)) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('os-menu--open')) {
      closeMenu();
    }
  });

  // Menu item actions
  menu.querySelectorAll<HTMLElement>('[data-menu-action]').forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.dataset.menuAction;
      closeMenu();
      handleAction(action);
    });
  });

  function openMenu() {
    menu!.classList.add('os-menu--open');
    btn!.classList.add('os-menu-btn--active');
    track('os-menu');
  }

  function closeMenu() {
    menu!.classList.remove('os-menu--open');
    btn!.classList.remove('os-menu-btn--active');
  }
}

function handleAction(action: string | undefined) {
  switch (action) {
    case 'about': {
      const aboutWin = document.getElementById('about-window');
      if (aboutWin) openWindow(aboutWin);
      break;
    }
    case 'settings': {
      const settingsWin = document.getElementById('settings-window');
      if (settingsWin) openWindow(settingsWin);
      break;
    }
    case 'appstore': {
      const storeWin = document.getElementById('app-store-window');
      if (storeWin) openWindow(storeWin);
      break;
    }
    case 'download-cv': {
      const lang = document.documentElement.lang || 'en';
      const isThemeRoute = window.location.pathname.startsWith('/os/');
      window.open(
        `/cv/${lang}?id=${isThemeRoute ? 'os' : 'default'}`,
        '_blank'
      );
      track('cv-download');
      break;
    }
    case 'restart':
      window.location.reload();
      break;
    case 'lock':
      showLockScreen();
      break;
    case 'sleep': {
      const overlay = createOverlay();
      overlay.style.background = '#000';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.8s ease';
      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });

      // Click to wake → show lock screen
      overlay.addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.addEventListener(
          'transitionend',
          () => {
            overlay.remove();
            showLockScreen();
          },
          { once: true }
        );
      });
      break;
    }
  }
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '9999';
  overlay.style.cursor = 'default';
  return overlay;
}
