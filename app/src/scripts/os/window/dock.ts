import { getLayoutMode } from '../responsive';
import { openWindow } from './lifecycle';

/* ---- Dock management ---- */
interface DockIconInfo {
  name: string;
  icon: string;
  gradient: string;
}

let dockRegistry: Record<string, DockIconInfo> = {};

export function loadDockRegistry() {
  const el = document.getElementById('dock-icon-registry');
  if (el) dockRegistry = JSON.parse(el.textContent || '{}');
}

export function dockAddDynamic(windowId: string) {
  // If already a fixed dock slot for this window, just show its dot
  const fixedSlot = document.querySelector<HTMLElement>(
    `.os-dock-slot[data-dock-id="${windowId}"][data-dock-fixed]`
  );
  if (fixedSlot) {
    const dot = fixedSlot.querySelector('.os-dock-dot');
    if (dot) dot.classList.remove('os-dock-dot--hidden');
    return;
  }

  // Don't add dynamic dock slots on mobile
  if (getLayoutMode() === 'mobile') return;

  // If dynamic slot already exists, just show dot
  const existing = document.querySelector<HTMLElement>(
    `.os-dock-slot[data-dock-id="${windowId}"]`
  );
  if (existing) {
    const dot = existing.querySelector('.os-dock-dot');
    if (dot) dot.classList.remove('os-dock-dot--hidden');
    return;
  }

  // Create a new dynamic dock slot
  const info = dockRegistry[windowId];
  if (!info) return;

  const slot = document.createElement('div');
  slot.className = 'os-dock-slot';
  slot.setAttribute('data-dock-id', windowId);
  slot.setAttribute('data-open-window', windowId);
  slot.setAttribute('role', 'button');
  slot.setAttribute('aria-label', info.name);
  slot.setAttribute('tabindex', '0');
  const tooltip = document.createElement('span');
  tooltip.className = 'os-dock-tooltip';
  tooltip.textContent = info.name;

  const iconDiv = document.createElement('div');
  iconDiv.className = `os-dock-icon ${info.gradient}`;
  iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="1.5"
           stroke-linecap="round" stroke-linejoin="round">
        ${info.icon}
      </svg>`;

  const dot = document.createElement('div');
  dot.className = 'os-dock-dot';

  slot.appendChild(tooltip);
  slot.appendChild(iconDiv);
  slot.appendChild(dot);

  // Wire up click and keyboard to open/focus window
  const handleOpen = () => {
    const win = document.getElementById(windowId);
    if (win) openWindow(win);
  };
  slot.addEventListener('click', handleOpen);
  slot.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  });

  // Insert into the dynamic zone
  const dynamic = document.getElementById('dock-dynamic');
  const rightDivider = document.getElementById('dock-divider-right');
  if (dynamic) {
    dynamic.appendChild(slot);
    if (rightDivider) rightDivider.style.display = '';
  }
}

export function dockRemoveDynamic(windowId: string) {
  // Fixed slots: just hide the dot, don't remove
  const fixedSlot = document.querySelector<HTMLElement>(
    `.os-dock-slot[data-dock-id="${windowId}"][data-dock-fixed]`
  );
  if (fixedSlot) {
    const dot = fixedSlot.querySelector('.os-dock-dot');
    if (dot) dot.classList.add('os-dock-dot--hidden');
    return;
  }

  // Remove dynamic slot
  const slot = document.querySelector<HTMLElement>(
    `.os-dock-slot[data-dock-id="${windowId}"]`
  );
  if (slot) slot.remove();

  // Hide right divider if no dynamic items remain
  const dynamicSlots = document.querySelectorAll(
    '.os-dock-slot[data-dock-id]:not([data-dock-fixed])'
  );
  if (dynamicSlots.length === 0) {
    const rightDivider = document.getElementById('dock-divider-right');
    if (rightDivider) rightDivider.style.display = 'none';
  }
}
