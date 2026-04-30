/**
 * Responsive layout mode detection for OS theme.
 * Sets data-os-layout attribute on <html> and fires callbacks on change.
 * Mobile mode: gesture navigation (swipe for launchpad, swipe-up to minimize).
 */

import { windowStates, getDesktopSize, getDefaultSize, MENU_BAR_H } from './window/state';


export type LayoutMode = 'desktop' | 'tablet' | 'mobile';

const MQ_TABLET = window.matchMedia('(max-width: 1023px) and (min-width: 768px)');
const MQ_MOBILE = window.matchMedia('(max-width: 767px)');

let currentMode: LayoutMode = 'desktop';
const listeners: Set<(mode: LayoutMode) => void> = new Set();

export function getLayoutMode(): LayoutMode {
  return currentMode;
}

export function onLayoutChange(cb: (mode: LayoutMode) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function detect(): LayoutMode {
  if (MQ_MOBILE.matches) return 'mobile';
  if (MQ_TABLET.matches) return 'tablet';
  return 'desktop';
}

function update() {
  const next = detect();
  if (next === currentMode) return;
  // Reload page on layout mode change to ensure clean state
  window.location.reload();
}

/* ---- Stage detection ---- */

/** Check if a window's default size doesn't fit in the available desktop area. */
export function shouldStage(windowId: string): boolean {
  const ds = getDesktopSize();
  const availW = ds.w;
  const availH = ds.h - MENU_BAR_H;
  const size = getDefaultSize(windowId);
  return size[0] > availW || size[1] > availH;
}

/* ---- Mobile gesture navigation ---- */

let lpVisible = false;

/** Show the launchpad as a slide-in overlay from the right */
export function showMobileLaunchpad() {
  if (getLayoutMode() !== 'mobile') return;
  const launchpad = document.querySelector<HTMLElement>('.lp-backdrop');
  if (!launchpad) return;

  lpVisible = true;
  launchpad.classList.add('lp-backdrop--mobile-visible');
}

/** Hide the launchpad overlay */
export function hideMobileLaunchpad() {
  if (getLayoutMode() !== 'mobile') return;
  const launchpad = document.querySelector<HTMLElement>('.lp-backdrop');
  if (!launchpad) return;

  lpVisible = false;
  launchpad.classList.remove('lp-backdrop--mobile-visible');
}

export function isMobileLaunchpadVisible(): boolean {
  return lpVisible;
}

function initMobileGestures() {
  if (getLayoutMode() !== 'mobile') return;

  const desktop = document.querySelector<HTMLElement>('.os-desktop');
  const launchpad = document.querySelector<HTMLElement>('.lp-backdrop');
  if (!desktop || !launchpad) return;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  // --- Swipe on desktop: left → show launchpad ---
  desktop.addEventListener('touchstart', (e) => {
    // Don't track if touching a window or interactive element
    if ((e.target as HTMLElement).closest('.os-window, .os-menubar, .os-footer')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  desktop.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    // Swipe left (negative dx) with enough distance and mostly horizontal
    if (dx < -60 && dy < Math.abs(dx)) {
      showMobileLaunchpad();
    }
  }, { passive: true });

  // --- Swipe on launchpad: right → back to desktop ---
  launchpad.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  launchpad.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    // Swipe right (positive dx) with enough distance and mostly horizontal
    if (dx > 60 && dy < Math.abs(dx)) {
      hideMobileLaunchpad();
    }
  }, { passive: true });
}

/** Show/hide the home indicator based on whether a window is open. */
export function updateHomeIndicator() {
  if (getLayoutMode() !== 'mobile') return;
  const indicator = document.querySelector<HTMLElement>('.os-home-indicator');
  if (!indicator) return;

  // Check if any window is visible
  let hasVisibleWindow = false;
  windowStates.forEach((_s, id) => {
    const win = document.getElementById(id);
    if (win && win.style.display !== 'none') hasVisibleWindow = true;
  });

  indicator.classList.toggle('os-home-indicator--visible', hasVisibleWindow);
}

function initWindowSwipeUp() {
  if (getLayoutMode() !== 'mobile') return;

  const indicator = document.querySelector<HTMLElement>('.os-home-indicator');
  if (!indicator) return;

  // Dynamically import minimizeWindow to avoid circular deps
  import('./window/lifecycle').then(({ minimizeWindow }) => {
    let startY = 0;
    let startTime = 0;
    let swiping = false;
    let activeWin: HTMLElement | null = null;

    indicator.addEventListener('touchstart', (e) => {
      if (getLayoutMode() !== 'mobile') return;
      e.preventDefault();

      // Find the topmost visible window
      let topWin: HTMLElement | null = null;
      let topZ = -1;
      windowStates.forEach((_s, id) => {
        const win = document.getElementById(id);
        if (!win || win.style.display === 'none') return;
        const z = parseInt(win.style.zIndex || '0');
        if (z > topZ) { topZ = z; topWin = win; }
      });

      if (!topWin) return;
      activeWin = topWin;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      swiping = true;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!swiping || !activeWin || getLayoutMode() !== 'mobile') return;
      const dy = startY - e.touches[0].clientY; // positive = swiping up
      if (dy <= 0) return;

      e.preventDefault();

      // Progress 0→1 based on how far the finger has traveled
      const progress = Math.min(dy / (window.innerHeight * 0.4), 1);
      const scale = 1 - (progress * 0.3);       // 1.0 → 0.7
      const radius = progress * 24;              // 0 → 24px
      const opacity = 1 - (progress * 0.3);      // 1.0 → 0.7

      activeWin.style.transition = 'none';
      activeWin.style.transform = `scale(${scale})`;
      activeWin.style.setProperty('border-radius', `${radius}px`, 'important');
      activeWin.style.opacity = `${opacity}`;
      activeWin.style.transformOrigin = 'center bottom';
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (!swiping || !activeWin || getLayoutMode() !== 'mobile') return;
      swiping = false;

      const dy = startY - e.changedTouches[0].clientY;
      const dt = Date.now() - startTime;
      const velocity = dy / dt; // px/ms

      const win = activeWin;
      activeWin = null;

      if (dy > window.innerHeight * 0.2 || (dy > 50 && velocity > 0.5)) {
        // Threshold met — animate out and minimize
        win.style.transition = 'transform 0.3s ease-out, border-radius 0.3s ease-out, opacity 0.3s ease-out';
        win.style.transform = 'scale(0.5)';
        win.style.opacity = '0';
        win.style.setProperty('border-radius', '24px', 'important');

        const onEnd = () => {
          win.removeEventListener('transitionend', onEnd);
          // Reset all inline swipe styles
          win.style.transform = '';
          win.style.removeProperty('border-radius');
          win.style.opacity = '';
          win.style.transition = '';
          win.style.transformOrigin = '';
          // Actually minimize via the existing lifecycle
          minimizeWindow(win);
        };
        win.addEventListener('transitionend', onEnd);
      } else {
        // Snap back to full size
        win.style.transition = 'transform 0.25s ease-out, border-radius 0.25s ease-out, opacity 0.25s ease-out';
        win.style.transform = '';
        win.style.setProperty('border-radius', '0px', 'important');
        win.style.opacity = '';

        const onEnd = () => {
          win.removeEventListener('transitionend', onEnd);
          win.style.transition = '';
          win.style.transformOrigin = '';
          win.style.removeProperty('border-radius');
        };
        win.addEventListener('transitionend', onEnd);
      }
    });
  });
}

/* ---- Init ---- */

export function initResponsive() {
  currentMode = detect();
  document.documentElement.setAttribute('data-os-layout', currentMode);
  MQ_TABLET.addEventListener('change', update);
  MQ_MOBILE.addEventListener('change', update);

  // Initialize mobile gestures if starting in mobile mode
  if (currentMode === 'mobile') {
    initMobileGestures();
    initWindowSwipeUp();
  }
}
