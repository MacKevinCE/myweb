import { managedWindows, windowConfigs, W } from '../../../data/os-apps';
import { getLayoutMode } from '../responsive';
import { loadDockRegistry } from './dock';
import { openWindow, setupWindow, setupFinderAlias } from './lifecycle';

export { openWindow, minimizeWindow, registerReset } from './lifecycle';
export { bringToFront, updateMenuBarApp } from './zIndex';
export type { WindowState } from './state';
export {
  windowStates,
  getDesktopSize,
  getWebBorder,
  getDefaultSize,
  getMinSize,
  getMaxSize,
  getOrigin,
  clampOrigin,
  MENU_BAR_H,
  DESKTOP_PADDING,
  MIN_W,
  MIN_H,
} from './state';

export function initWindowManager() {
  loadDockRegistry();

  // Setup all managed windows from the centralized registry
  managedWindows.forEach((id) => setupWindow(id));

  // Setup finder tab aliases from windowConfigs
  Object.entries(windowConfigs).forEach(([id, c]) => {
    if (c?.finderAlias) setupFinderAlias(id, c.finderAlias as 'projects' | 'experience');
  });

  // Auto-open windows after lock screen unlocks
  // On tablet: only open About (Code Swift doesn't fit alongside)
  const mode = getLayoutMode();
  const autoOpenIds = Object.entries(windowConfigs)
    .filter(([id, c]) => {
      if (!c?.autoOpen) return false;
      if (mode === 'tablet' && id !== W.ABOUT) return false;
      if (mode === 'mobile') return false;
      return true;
    })
    .map(([id]) => id);

  const lockEl = document.getElementById('lock-screen');
  const openAutoWindows = () => {
    autoOpenIds.forEach((id) => {
      const win = document.getElementById(id);
      if (win) openWindow(win);
    });
  };

  if (lockEl && lockEl.style.visibility !== 'hidden') {
    // Lock screen is visible — wait for unlock
    const observer = new MutationObserver(() => {
      if (lockEl.style.visibility === 'hidden') {
        observer.disconnect();
        openAutoWindows();
      }
    });
    observer.observe(lockEl, { attributes: true, attributeFilter: ['style'] });
  } else {
    // No lock screen — open immediately
    openAutoWindows();
  }

}
