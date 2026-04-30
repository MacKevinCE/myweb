import { getLayoutMode, shouldStage, hideMobileLaunchpad, updateHomeIndicator } from '../responsive';
import { switchFinderTab } from '../finder';
import { track } from '../achievements';
import { isDockAutoHide } from '../dockMagnify';
import { W } from '../../../data/os-apps';
import {
  windowStates,
  MENU_BAR_H,
  DESKTOP_PADDING,
  getDesktopSize,
  getWebBorder,
  getDefaultSize,
  getMinSize,
  getMaxSize,
  getOrigin,
  clampOrigin,
} from './state';
import { bringToFront, updateMenuBarApp } from './zIndex';
import { dockAddDynamic, dockRemoveDynamic } from './dock';
import { makeDraggable } from './drag';
import { makeResizable } from './resize';

/* ---- Reset registry ---- */
const resetRegistry = new Map<string, () => void>();

/** Register a reset function for a window. Called by each module during init. */
export function registerReset(windowId: string, resetFn: () => void) {
  resetRegistry.set(windowId, resetFn);
}

/* ---- Fullscreen ---- */
function toggleFullscreen(win: HTMLElement) {
  const state = windowStates.get(win.id);
  if (!state) return;
  if (state.lockedFullscreen) return; // Can't exit — window doesn't fit

  if (state.fullscreen) {
    exitFullscreen(win, state);
  } else {
    enterFullscreen(win, state);
  }
}

function enterFullscreen(win: HTMLElement, state: import('./state').WindowState) {
  // Save current geometry
  state.preFullLeft = win.style.left;
  state.preFullTop = win.style.top;
  state.preFullWidth = win.style.width || window.getComputedStyle(win).width;
  state.preFullHeight = win.style.height || window.getComputedStyle(win).height;

  state.fullscreen = true;
  win.classList.add('os-window--fullscreen');

  const wb = getWebBorder();
  const desktopW = window.innerWidth - wb * 2;
  const desktopH = window.innerHeight - wb * 2;

  // Reserve space for dock when it's always visible (not auto-hide)
  let dockReserve = 0;
  if (!isDockAutoHide()) {
    const dock = document.querySelector('.os-dock') as HTMLElement | null;
    if (dock) dockReserve = dock.offsetHeight + 8; // 8px bottom margin
  }

  win.style.transition = 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease';
  win.style.left = `${DESKTOP_PADDING}px`;
  win.style.top = `${MENU_BAR_H + DESKTOP_PADDING}px`;
  win.style.width = `${desktopW - DESKTOP_PADDING * 2}px`;
  win.style.height = `${desktopH - MENU_BAR_H - DESKTOP_PADDING * 2 - dockReserve}px`;
  if (DESKTOP_PADDING == 0) {
    win.style.borderRadius = '0';
  }

  win.addEventListener('transitionend', () => {
    win.style.transition = '';
  }, { once: true });
}

export function exitFullscreen(win: HTMLElement, state: import('./state').WindowState) {
  state.fullscreen = false;
  win.classList.remove('os-window--fullscreen');

  win.style.transition = 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease';
  win.style.left = state.preFullLeft;
  win.style.top = state.preFullTop;
  win.style.width = state.preFullWidth;
  win.style.height = state.preFullHeight;
  win.style.borderRadius = '';

  win.addEventListener('transitionend', () => {
    win.style.transition = '';
  }, { once: true });
}

/* ---- Zoom (expand from center, clamp to desktop) ---- */

function toggleZoom(win: HTMLElement, max?: [number, number]) {
  const state = windowStates.get(win.id);
  if (!state) return;
  if (state.lockedFullscreen) return;

  // If fullscreen, exit first
  if (state.fullscreen) {
    exitFullscreen(win, state);
    return;
  }

  const anim = 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease';

  if (state.zoomed) {
    // Restore previous size
    state.zoomed = false;
    win.style.transition = anim;
    win.style.left = state.preZoomLeft;
    win.style.top = state.preZoomTop;
    win.style.width = state.preZoomWidth;
    win.style.height = state.preZoomHeight;
    win.addEventListener('transitionend', () => { win.style.transition = ''; }, { once: true });
  } else {
    // Save current geometry
    const curLeft = win.offsetLeft;
    const curTop = win.offsetTop;
    const curW = win.offsetWidth;
    const curH = win.offsetHeight;
    state.preZoomLeft = `${curLeft}px`;
    state.preZoomTop = `${curTop}px`;
    state.preZoomWidth = `${curW}px`;
    state.preZoomHeight = `${curH}px`;
    state.zoomed = true;

    // Target size: maxSize if provided, else fill desktop
    const { w: dsW, h: dsH } = getDesktopSize();
    const desktopW = dsW - DESKTOP_PADDING * 2;
    const desktopH = dsH - MENU_BAR_H - DESKTOP_PADDING * 2;
    const targetW = max ? Math.min(max[0], desktopW) : desktopW;
    const targetH = max ? Math.min(max[1], desktopH) : desktopH;

    // Expand from center of current position
    const cx = curLeft + curW / 2;
    const cy = curTop + curH / 2;
    let newLeft = Math.round(cx - targetW / 2);
    let newTop = Math.round(cy - targetH / 2);

    // Clamp to desktop margins
    newLeft = Math.max(DESKTOP_PADDING, Math.min(newLeft, dsW - targetW - DESKTOP_PADDING));
    newTop = Math.max(MENU_BAR_H + DESKTOP_PADDING, Math.min(newTop, dsH - targetH - DESKTOP_PADDING));

    win.style.transition = anim;
    win.style.left = `${newLeft}px`;
    win.style.top = `${newTop}px`;
    win.style.width = `${targetW}px`;
    win.style.height = `${targetH}px`;
    win.addEventListener('transitionend', () => { win.style.transition = ''; }, { once: true });
  }
}

/* ---- Open / Close / Minimize ---- */
export function openWindow(win: HTMLElement) {
  const state = windowStates.get(win.id);
  if (!state) return;

  if (win.style.display !== 'none') {
    bringToFront(win);
    return;
  }

  const mode = getLayoutMode();

  // Mobile: single-window mode — hide all others + auto-hide launchpad
  if (mode === 'mobile') {
    hideMobileLaunchpad();
    windowStates.forEach((_s, id) => {
      if (id === win.id) return;
      const other = document.getElementById(id);
      if (other && other.style.display !== 'none') {
        other.style.display = 'none';
        other.classList.remove('os-window--opening', 'os-window--closing', 'os-window--minimizing');
      }
    });
  }

  if (!state.minimized) {
    // Reset to default geometry
    const rawOrigin = getOrigin(win.id);
    const [cl, ct] = clampOrigin(win.id, rawOrigin[0], rawOrigin[1]);
    win.style.left = `${cl}px`;
    win.style.top = `${ct}px`;

    const def = getDefaultSize(win.id);
    win.style.width = `${def[0]}px`;
    win.style.height = `${def[1]}px`;

    win.style.borderRadius = '';
    state.fullscreen = false;
    state.zoomed = false;
    win.classList.remove('os-window--fullscreen');
  }

  const wasMinimized = state.minimized;
  state.minimized = false;
  win.style.display = 'flex';
  win.classList.remove('os-window--closing', 'os-window--minimizing', 'os-window--restoring');

  if (wasMinimized) {
    // Restore from dock: reverse genie animation
    const dockIcon = document.querySelector<HTMLElement>(`[data-dock-id="${win.id}"]`);
    const dockRect = dockIcon?.getBoundingClientRect();
    const winRect = win.getBoundingClientRect();

    if (dockRect) {
      const targetX = dockRect.left + dockRect.width / 2;
      const targetY = dockRect.top + dockRect.height / 2;
      const originX = targetX - winRect.left;
      const originY = targetY - winRect.top;
      win.style.transformOrigin = `${originX}px ${originY}px`;
    } else {
      win.style.transformOrigin = '50% 100%';
    }

    win.classList.add('os-window--restoring');
  } else {
    win.classList.add('os-window--opening');
  }
  // Ensure the window can receive focus
  if (!win.hasAttribute('tabindex')) win.setAttribute('tabindex', '-1');

  bringToFront(win);
  dockAddDynamic(win.id);
  updateHomeIndicator();
  track('window-opened', { id: win.id });
  win.addEventListener(
    'animationend',
    () => {
      win.classList.remove('os-window--opening', 'os-window--restoring');
      win.style.transformOrigin = '';
      // Focus the window or its first focusable element for keyboard accessibility
      const focusable = win.querySelector<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
      else win.focus();
      // Auto-fullscreen windows that don't fit in the viewport
      if (mode !== 'mobile' && shouldStage(win.id)) {
        state.lockedFullscreen = true;
        enterFullscreen(win, state);
        // Disable green dot — can't exit fullscreen
        const prefix = win.id.replace('-window', '');
        const greenDot = document.getElementById(`${prefix}-fullscreen`) as HTMLButtonElement | null;
        if (greenDot) {
          greenDot.disabled = true;
          greenDot.classList.add('os-dot--disabled');
        }
      }
    },
    { once: true }
  );
}

function closeWindow(win: HTMLElement) {
  const state = windowStates.get(win.id);
  if (state) {
    state.minimized = false;
    state.fullscreen = false;
    state.zoomed = false;
    // Re-enable green dot if it was disabled by locked fullscreen
    if (state.lockedFullscreen) {
      const prefix = win.id.replace('-window', '');
      const greenDot = document.getElementById(`${prefix}-fullscreen`) as HTMLButtonElement | null;
      if (greenDot) {
        greenDot.disabled = false;
        greenDot.classList.remove('os-dot--disabled');
      }
    }
    state.lockedFullscreen = false;
    win.classList.remove('os-window--fullscreen');
  }

  win.classList.remove('os-window--opening', 'os-window--minimizing');
  win.classList.add('os-window--closing');
  win.addEventListener(
    'animationend',
    () => {
      win.style.display = 'none';
      win.classList.remove('os-window--closing');
      // Reset size to default
      const def = getDefaultSize(win.id);
      win.style.width = `${def[0]}px`;
      win.style.height = `${def[1]}px`;
      // Reset window to initial state on close (via registry)
      resetRegistry.get(win.id)?.()

      // Reset scroll position for all windows
      win.querySelectorAll<HTMLElement>('.os-window-body, [class*="-body"], [class*="-scroll"]').forEach(el => {
        el.scrollTop = 0;
      });

      win.style.borderRadius = '';
      dockRemoveDynamic(win.id);
      updateMenuBarApp();
      updateHomeIndicator();

      // Focus the next topmost visible window, or fall back to document body
      let topWin: HTMLElement | null = null;
      let maxZ = 0;
      windowStates.forEach((_s, id) => {
        const other = document.getElementById(id);
        if (!other || other.style.display === 'none') return;
        const z = parseInt(other.style.zIndex || '0', 10);
        if (z > maxZ) { maxZ = z; topWin = other; }
      });
      if (topWin) (topWin as HTMLElement).focus();
      else document.body.focus();
    },
    { once: true }
  );
}

export function minimizeWindow(win: HTMLElement) {
  const state = windowStates.get(win.id);
  if (state) state.minimized = true;

  // Find the dock icon to animate towards
  const dockIcon = document.querySelector<HTMLElement>(`[data-dock-id="${win.id}"]`);
  const dockRect = dockIcon?.getBoundingClientRect();
  const winRect = win.getBoundingClientRect();

  if (dockRect) {
    // Calculate where the dock icon center is relative to the window
    const targetX = dockRect.left + dockRect.width / 2;
    const targetY = dockRect.top + dockRect.height / 2;
    const originX = targetX - winRect.left;
    const originY = targetY - winRect.top;

    win.style.transformOrigin = `${originX}px ${originY}px`;
  } else {
    // Fallback: animate towards bottom center (dock area)
    win.style.transformOrigin = `50% calc(100vh - ${winRect.top}px)`;
  }

  win.classList.remove('os-window--opening', 'os-window--closing');
  win.classList.add('os-window--minimizing');
  win.addEventListener(
    'animationend',
    () => {
      win.style.display = 'none';
      win.classList.remove('os-window--minimizing');
      win.style.transformOrigin = '';
      updateMenuBarApp();
      updateHomeIndicator();
    },
    { once: true }
  );
}

/** Minimize all visible windows (Show Desktop) */
export function minimizeAll() {
  windowStates.forEach((_s, id) => {
    const win = document.getElementById(id);
    if (win && win.style.display !== 'none') {
      minimizeWindow(win);
    }
  });
}

/* ---- Setup ---- */

function setupFinderAlias(alias: string, tab: 'projects' | 'experience') {
  const finderWin = document.getElementById(W.FINDER);
  if (!finderWin) return;

  document.querySelectorAll(`[data-open-window="${alias}"]`).forEach((el) => {
    el.addEventListener('click', () => {
      switchFinderTab(tab);
      openWindow(finderWin);
    });
  });
}

export function setupWindow(windowId: string) {
  // Derive sub-element IDs from the window ID prefix
  const prefix = windowId.replace('-window', '');
  const win = document.getElementById(windowId);
  const titlebar = document.getElementById(`${prefix}-titlebar`);
  const closeBtn = document.getElementById(`${prefix}-close`);
  const minimizeBtn = document.getElementById(`${prefix}-minimize`);
  const fullscreenBtn = document.getElementById(`${prefix}-fullscreen`);
  if (!win || !titlebar || !closeBtn || !minimizeBtn) return;

  // Read config from centralized registry
  const defaultSize = getDefaultSize(windowId);
  const min = getMinSize(windowId);
  const max = getMaxSize(windowId);
  const rawOrigin = getOrigin(windowId);

  // Apply size
  win.style.width = `${defaultSize[0]}px`;
  win.style.height = `${defaultSize[1]}px`;

  // Apply origin, clamped to desktop bounds
  const [clampedLeft, clampedTop] = clampOrigin(windowId, rawOrigin[0], rawOrigin[1]);
  win.style.left = `${clampedLeft}px`;
  win.style.top = `${clampedTop}px`;

  windowStates.set(windowId, {
    minimized: false,
    fullscreen: false,
    lockedFullscreen: false,
    zoomed: false,
    defaultLeft: `${clampedLeft}px`,
    defaultTop: `${clampedTop}px`,
    defaultWidth: `${defaultSize[0]}px`,
    defaultHeight: `${defaultSize[1]}px`,
    preFullLeft: '',
    preFullTop: '',
    preFullWidth: '',
    preFullHeight: '',
    preZoomLeft: '',
    preZoomTop: '',
    preZoomWidth: '',
    preZoomHeight: '',
  });

  // Open triggers
  document.querySelectorAll(`[data-open-window="${windowId}"]`).forEach((el) => {
    el.addEventListener('click', () => openWindow(win));
  });

  closeBtn.addEventListener('click', () => { closeWindow(win); track('window-button', { id: 'red' }); });
  minimizeBtn.addEventListener('click', () => { minimizeWindow(win); track('window-button', { id: 'yellow' }); });

  // Resizable if it has minSize or maxSize
  const resizable = !!(min || max);
  const ds = getDesktopSize();
  const canFullscreen = !max || max[0] > (ds.w - DESKTOP_PADDING * 2) || max[1] > (ds.h - MENU_BAR_H - DESKTOP_PADDING * 2);

  if (resizable) {
    if (fullscreenBtn) {
      if (canFullscreen) {
        fullscreenBtn.addEventListener('click', () => {
          toggleFullscreen(win);
          track('window-button', { id: 'green' });
        });
      } else {
        (fullscreenBtn as HTMLButtonElement).disabled = true;
        fullscreenBtn.classList.add('os-dot--disabled');
      }
    }

    titlebar.addEventListener('dblclick', (e) => {
      if ((e.target as HTMLElement).closest('.os-window-dots')) return;
      track('titlebar-dblclick', { id: windowId });
      if (max && !canFullscreen) {
        toggleZoom(win, max);
      } else {
        toggleFullscreen(win);
      }
    });

    const [mw, mh] = min ?? defaultSize ?? [200, 150];
    makeResizable(win, mw, mh, max?.[0], max?.[1]);
  } else {
    if (fullscreenBtn) {
      (fullscreenBtn as HTMLButtonElement).disabled = true;
      fullscreenBtn.classList.add('os-dot--disabled');
    }
  }

  win.addEventListener('mousedown', () => bringToFront(win));
  makeDraggable(win, titlebar);
}

export { setupFinderAlias };
