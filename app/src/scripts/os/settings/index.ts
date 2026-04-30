export type { Settings } from './persist';
export { settings, loadSettings, saveSettings, reloadSettings, markSettingsReady } from './persist';
export { applyAppearance } from './appearance';
export { applyAccentColor } from './accent';
export { applyWallpaper, updateWallpaperControls } from './wallpaper';
export { updateMenuBarClock, resetSettings } from './tabs';
export { applyFontSize, applyReduceMotion, applyHighContrast } from './accessibility';

import { getLayoutMode } from '../responsive';
import { registerReset } from '../window/lifecycle';
import { W } from '../../../data/os-apps';
import { initAppearance, restoreAppearance } from './appearance';
import { initAccent, restoreAccent } from './accent';
import { initWallpaperPicker, restoreWallpaper } from './wallpaper';
import {
  initTabNav,
  initToggleSwitches,
  initAutoHideToggle,
  initDockSizeSlider,
  initMagnificationSlider,
  initDateTimeToggles,
  restoreDateTimeToggles,
  restoreDock,
  updateMenuBarClock,
  initLanguagePicker,
  initSettingsShortcuts,
  resetSettings,
} from './tabs';
import { initAccessibility, restoreAccessibility } from './accessibility';
import { markSettingsReady } from './persist';

export function initSettingsTabs() {
  const { navButtons, panels } = initTabNav();

  initAppearance();
  initAccent();
  initToggleSwitches();

  const autoHideToggle = initAutoHideToggle();

  // Dock sliders
  initDockSizeSlider();
  initMagnificationSlider();

  // Disable dock options on mobile
  if (getLayoutMode() === 'mobile') {
    const dockNote = document.getElementById('stg-mobile-dock-note');
    if (dockNote) dockNote.style.display = '';

    document.querySelectorAll<HTMLElement>('.stg-info-row--dock-disabled').forEach((row) => {
      row.classList.add('stg-info-row--disabled');
    });
  }

  // Wallpaper picker
  initWallpaperPicker();

  // DateTime toggles
  initDateTimeToggles(updateMenuBarClock);

  // Language picker
  initLanguagePicker();

  // Accessibility
  initAccessibility();

  // Restore saved settings on load
  restoreAppearance();
  restoreDock(autoHideToggle);
  restoreWallpaper();
  restoreAccent();
  restoreDateTimeToggles();
  restoreAccessibility();

  // Settings shortcuts (lang button, clock click)
  initSettingsShortcuts(navButtons, panels);

  // All settings initialized — enable achievement tracking for user interactions
  markSettingsReady();

  // Start clock updater
  updateMenuBarClock();
  setInterval(updateMenuBarClock, 1000);

  registerReset(W.SETTINGS, resetSettings);
}
