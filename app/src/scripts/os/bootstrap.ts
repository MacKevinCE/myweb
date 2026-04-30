/**
 * Single entry point for all OS theme script initialization.
 * Imports and calls all init functions in the correct dependency order.
 */
import { initResponsive } from './responsive';
import { initLockScreen } from './lockScreen';
import { initWindowManager } from './window';
import { initSkillsTabs } from './skillsTabs';
import { initEducationTabs } from './educationTabs';
import { initFinderTabs } from './finder';
import { initOsMenu } from './osMenu';
import { initLaunchpad } from './launchpad';
import { initSettingsTabs } from './settings';
import { initBrowser } from './browser';
import { initDockMagnify } from './dockMagnify';
import { initAppStore } from './appStore';
import { initTerminal } from './terminal/index';
import { initPreview } from './preview';
import { initNotes } from './notes';
import { initPlayground } from './playground';
import { initStickies } from './stickies';
import { initAchievements, track } from './achievements';
import { initNotifications, notify, getNotifI18n } from './notifications';
import { initContextMenu } from './contextMenu';
import { initDialog } from './dialog';
import { initShortcuts } from './shortcuts';
import { initAppSwitcher } from './appSwitcher';
import { initSpeedTest } from './speedTest';
import { openWindow } from './window';

export function initOS() {
  // Responsive detection must be first
  initResponsive();

  // Lock screen must init before window manager
  initLockScreen();

  // Notifications — must init before triggers
  initNotifications();

  // Window manager before dock and other UI that opens windows
  initWindowManager();

  // Global listener: open window from notification action
  document.addEventListener('open-window', (e) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.el) openWindow(detail.el);
  });

  // Tab-based windows
  initSkillsTabs();
  initEducationTabs();
  initFinderTabs();

  // Menus and overlays
  initOsMenu();
  initLaunchpad();

  // Settings (appearance, wallpaper, dock sliders, clock, etc.)
  initSettingsTabs();

  // Browser
  initBrowser();

  // Dock magnification + auto-hide
  initDockMagnify();

  // App Store
  initAppStore();

  // Terminal
  initTerminal();

  // Preview (certificate viewer)
  initPreview();

  // Notes (blog/articles)
  initNotes();

  // Playground (code snippets)
  initPlayground();

  // Stickies (quick notes)
  initStickies();

  // Speed Test
  initSpeedTest();

  // Confirmation dialog (OS alert sheet)
  initDialog();

  // Context menu (right-click)
  initContextMenu();

  // Keyboard shortcuts (Cmd+Space, Cmd+,, Alt+Tab)
  initShortcuts();
  initAppSwitcher();

  // Achievements (Game Center — must init after notifications)
  initAchievements();

  // Resident achievement — 5 minutes on the page
  setTimeout(() => track('time-spent'), 5 * 60 * 1000);

  // Web fullscreen toggle (menu bar button)
  const fsBtn = document.getElementById('os-fullscreen-btn');
  if (fsBtn && document.fullscreenEnabled) {
    fsBtn.style.display = '';
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        track('web-fullscreen');
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Welcome notification — fires 2 seconds after lock screen unlocks
  const lockEl = document.getElementById('lock-screen');
  if (lockEl) {
    const observer = new MutationObserver(() => {
      if (lockEl.style.visibility === 'hidden') {
        observer.disconnect();
        setTimeout(() => {
          const t = getNotifI18n();
          notify(t.welcomeTitle || 'Welcome', t.welcomeBody || 'Explore the portfolio', undefined, 'about-window');
        }, 2000);
      }
    });
    observer.observe(lockEl, { attributes: true, attributeFilter: ['style'] });
  } else {
    // No lock screen — notify immediately after a delay
    setTimeout(() => {
      const t = getNotifI18n();
      notify(t.welcomeTitle || 'Welcome', t.welcomeBody || 'Explore the portfolio', undefined, 'about-window');
    }, 2000);
  }
}
