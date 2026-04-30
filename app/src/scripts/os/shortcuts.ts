import { toggleLaunchpad } from './launchpad';
import {
  showAppSwitcher,
  cycleNext,
  isAppSwitcherVisible,
} from './appSwitcher';

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.userAgent);

export function initShortcuts() {
  document.addEventListener('keydown', handleShortcut);

  // Close shortcuts overlay on click outside panel
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) {
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('shortcuts-overlay--visible');
      }
    });
  }
}

function toggleShortcutsOverlay() {
  const overlay = document.getElementById('shortcuts-overlay');
  if (!overlay) return;
  if (overlay.style.display === 'none') {
    overlay.style.display = '';
    overlay.classList.add('shortcuts-overlay--visible');
  } else {
    overlay.style.display = 'none';
    overlay.classList.remove('shortcuts-overlay--visible');
  }
}

function handleShortcut(e: KeyboardEvent) {
  const mod = isMac ? e.metaKey : e.ctrlKey;

  // Escape → Close shortcuts overlay (if open)
  if (e.key === 'Escape') {
    const overlay = document.getElementById('shortcuts-overlay');
    if (overlay && overlay.style.display !== 'none') {
      overlay.style.display = 'none';
      overlay.classList.remove('shortcuts-overlay--visible');
      e.preventDefault();
      return;
    }
  }

  // ? → Toggle shortcuts overlay
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    // Don't trigger if user is typing in an input/textarea
    const active = document.activeElement;
    if (
      active &&
      (active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        (active as HTMLElement).isContentEditable)
    )
      return;

    e.preventDefault();
    toggleShortcutsOverlay();
    return;
  }

  // Cmd/Ctrl + , → Open Settings
  if (mod && e.key === ',') {
    e.preventDefault();
    const win = document.getElementById('settings-window');
    if (win) {
      document.dispatchEvent(
        new CustomEvent('open-window', { detail: { el: win } })
      );
    }
    return;
  }

  // Alt + Space → Toggle Launchpad
  // Use e.code because Alt+Space produces non-breaking space on macOS
  if (e.altKey && (e.code === 'Space' || e.key === ' ')) {
    e.preventDefault();
    toggleLaunchpad();
    return;
  }

  // Alt + N → Toggle Notification Center
  if (e.altKey && (e.code === 'KeyN' || e.key === 'n' || e.key === 'N')) {
    e.preventDefault();
    const clock = document.getElementById('os-clock');
    if (clock) clock.click();
    return;
  }

  // Alt + Tab → App Switcher
  if (e.altKey && e.key === 'Tab') {
    e.preventDefault();
    if (isAppSwitcherVisible()) {
      cycleNext();
    } else {
      showAppSwitcher();
    }
    return;
  }
}
