/**
 * Dock magnification + auto-hide.
 *
 * Magnification: each icon scales based on distance from cursor
 * using a Gaussian falloff. Icons physically resize so flex layout
 * shifts neighbours apart naturally.
 *
 * Auto-hide: dock slides off-screen and reappears when the cursor
 * reaches the bottom edge of the viewport.
 */

import { getLayoutMode, onLayoutChange } from './responsive';

let dock: HTMLElement | null = null;
let slots: HTMLElement[] = [];
let icons: HTMLElement[] = [];
let baseSize = 48;
let maxScale = 1.25;
let autoHide = false;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let magnifyAttached = false;
const INFLUENCE = 120;
const EDGE_ZONE = 4; // px from viewport bottom to trigger peek
const BASE_ICON_SIZE = 48;
const MIN_ICON_SIZE = 32; // never shrink below this
let userDockScale = 1; // scale set by user in settings

export function initDockMagnify() {
  dock = document.querySelector('.os-dock');
  if (!dock) return;

  // Read initial dock scale from CSS (may have been set by persisted settings)
  const initialScale = parseFloat(
    dock.style.getPropertyValue('--dock-scale') || '1'
  );
  if (initialScale > 0) userDockScale = initialScale;

  collectSlots();

  if (getLayoutMode() !== 'mobile') {
    attachMagnifyListeners();
  }

  // When mouse enters dock, keep it visible and clear hide timer
  dock.addEventListener('mouseenter', () => {
    if (!autoHide || !dock) return;
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    dock.classList.add('os-dock--peek');
  });

  // Edge detection for auto-hide: mouse near bottom of viewport
  document.addEventListener('mousemove', onEdgeDetect);

  const dynamic = document.getElementById('dock-dynamic');
  if (dynamic) {
    const observer = new MutationObserver(() => collectSlots());
    observer.observe(dynamic, { childList: true });
  }

  // Recalculate fit on window resize
  window.addEventListener('resize', () => fitDock());

  // Attach/detach magnification on layout change (active on desktop + tablet)
  onLayoutChange((mode) => {
    if (mode !== 'mobile') {
      attachMagnifyListeners();
    } else {
      detachMagnifyListeners();
    }
  });
}

function attachMagnifyListeners() {
  if (magnifyAttached || !dock) return;
  dock.addEventListener('mousemove', onMove);
  dock.addEventListener('mouseleave', onLeave);
  magnifyAttached = true;
}

function detachMagnifyListeners() {
  if (!magnifyAttached || !dock) return;
  dock.removeEventListener('mousemove', onMove);
  dock.removeEventListener('mouseleave', onLeave);
  magnifyAttached = false;
  resetIcons();
}

function collectSlots() {
  if (!dock) return;
  slots = Array.from(dock.querySelectorAll<HTMLElement>('.os-dock-slot'));
  icons = slots
    .map((s) => s.querySelector('.os-dock-icon') as HTMLElement)
    .filter(Boolean);
  fitDock();
}

/**
 * Auto-shrink dock icons when they exceed available width.
 * Calculates the ideal --dock-scale so all icons fit without overflow.
 * Respects user-set scale as maximum and MIN_ICON_SIZE as floor.
 */
function fitDock() {
  if (!dock) return;

  // Temporarily reset to user scale to measure natural width
  dock.style.setProperty('--dock-scale', String(userDockScale));

  // Count items: slots + dividers (visible ones only)
  const slotCount = slots.length;
  if (slotCount === 0) return;

  const dividers = dock.querySelectorAll<HTMLElement>('.os-dock-divider');
  let dividerWidth = 0;
  dividers.forEach((d) => {
    if (d.style.display !== 'none') dividerWidth += 1 + 8; // 1px width + 4px margin each side
  });

  const padding = 32; // 16px padding each side
  const gap = (slotCount - 1) * 4; // 4px gap between slots
  const availableWidth = window.innerWidth - 40; // 20px margin each side of screen
  const iconSizeAtUserScale = BASE_ICON_SIZE * userDockScale;
  const neededWidth =
    slotCount * iconSizeAtUserScale + gap + dividerWidth + padding;

  if (neededWidth <= availableWidth) {
    // Fits fine at user scale
    dock.style.setProperty('--dock-scale', String(userDockScale));
    return;
  }

  // Calculate scale that fits
  const availableForIcons = availableWidth - gap - dividerWidth - padding;
  const idealIconSize = availableForIcons / slotCount;
  const clampedSize = Math.max(MIN_ICON_SIZE, idealIconSize);
  const newScale = clampedSize / BASE_ICON_SIZE;

  dock.style.setProperty(
    '--dock-scale',
    String(Math.min(newScale, userDockScale))
  );

  // If even at min size it doesn't fit, add scroll as last resort
  if (clampedSize <= MIN_ICON_SIZE) {
    dock.style.overflowX = 'auto';
    dock.style.maxWidth = `${availableWidth}px`;
  } else {
    dock.style.overflowX = '';
    dock.style.maxWidth = '';
  }
}

export function setMagnification(value: number) {
  maxScale = value === 0 ? 1 : 1 + value / 100;
  if (maxScale <= 1) resetIcons();
}

/** Update the user-set dock scale and recalculate fit. */
export function setDockScale(scale: number) {
  userDockScale = scale;
  fitDock();
}

/** Returns true if dock is in auto-hide mode. */
export function isDockAutoHide(): boolean {
  return autoHide;
}

export function setAutoHide(enabled: boolean) {
  if (!dock) return;
  if (getLayoutMode() === 'mobile') {
    // Force remove autohide classes on mobile (no hover available)
    dock.classList.remove('os-dock--autohide', 'os-dock--peek');
    return;
  }
  autoHide = enabled;
  if (enabled) {
    // Hide after a short delay
    scheduleHide();
  } else {
    // Show immediately
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    dock.classList.remove('os-dock--autohide', 'os-dock--peek');
  }
}

function scheduleHide() {
  if (!dock || !autoHide) return;
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    if (dock && autoHide) {
      dock.classList.add('os-dock--autohide');
      dock.classList.remove('os-dock--peek');
    }
  }, 800);
}

function onEdgeDetect(e: MouseEvent) {
  if (!autoHide || !dock) return;
  const nearBottom = e.clientY >= window.innerHeight - EDGE_ZONE;
  if (nearBottom) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    dock.classList.add('os-dock--peek');
  }
}

function onMove(e: MouseEvent) {
  if (maxScale <= 1) {
    resetIcons();
    return;
  }
  if (!dock) return;

  const scale = parseFloat(
    dock.style.getPropertyValue('--dock-scale') || String(userDockScale)
  );
  baseSize = BASE_ICON_SIZE * scale;

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const slot = slots[i];
    const rect = slot.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(e.clientX - center);

    const factor = Math.max(0, 1 - (dist / INFLUENCE) ** 2);
    const s = 1 + (maxScale - 1) * factor;
    const size = Math.round(baseSize * s);

    icon.style.width = size + 'px';
    icon.style.height = size + 'px';
    icon.style.borderRadius = Math.round(16 * scale * s) + 'px';
    icon.style.transform = `translateY(${-Math.round((size - baseSize) * 0.5)}px)`;
  }
}

function onLeave() {
  resetIcons();
  // If auto-hide is on, schedule hiding after mouse leaves dock
  if (autoHide) scheduleHide();
}

function resetIcons() {
  if (!dock) return;
  for (const icon of icons) {
    icon.style.width = '';
    icon.style.height = '';
    icon.style.borderRadius = '';
    icon.style.transform = '';
  }
}
