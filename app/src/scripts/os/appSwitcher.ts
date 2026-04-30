import { osApps, icons, W } from '../../data/os-apps';
import { windowStates } from './window/state';

let switcherEl: HTMLElement | null = null;
let barEl: HTMLElement | null = null;
let openWindows: HTMLElement[] = [];
let selectedIndex = 0;
let isVisible = false;

/** Lookup: windowId -> { name, gradient, iconSvg } from the central osApps registry */
const appLookup: Record<
  string,
  { name: string; gradient: string; iconSvg: string }
> = Object.fromEntries(
  osApps
    .filter((a) => a.id !== W.LAUNCHPAD)
    .map((a) => [
      a.id,
      {
        name: a.name,
        gradient: a.gradient,
        iconSvg: a.isText
          ? ''
          : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round">${icons[a.icon] || ''}</svg>`,
      },
    ])
);

export function initAppSwitcher() {
  switcherEl = document.getElementById('app-switcher');
  barEl = document.getElementById('app-switcher-bar');

  // Alt key release confirms selection
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Alt' && isVisible) {
      confirmSelection();
    }
  });
}

export function showAppSwitcher() {
  if (!switcherEl || !barEl) return;

  // Collect visible managed windows, sorted by z-index descending (most recent first)
  openWindows = [];
  windowStates.forEach((_s, id) => {
    const win = document.getElementById(id);
    if (win && win.style.display !== 'none') openWindows.push(win);
  });
  openWindows.sort(
    (a, b) =>
      parseInt(b.style.zIndex || '0', 10) - parseInt(a.style.zIndex || '0', 10)
  );

  if (openWindows.length === 0) return;

  // Build items
  barEl.innerHTML = '';
  selectedIndex = 0;

  openWindows.forEach((win, i) => {
    const id = win.id;
    const data = appLookup[id];
    const name = data?.name || id.replace('-window', '');

    const item = document.createElement('div');
    item.className = `app-switcher-item${i === 0 ? ' app-switcher-item--active' : ''}`;
    item.dataset.index = String(i);

    const iconDiv = document.createElement('div');
    iconDiv.className = `app-switcher-icon ${data?.gradient || ''}`;
    if (data?.iconSvg) {
      iconDiv.innerHTML = data.iconSvg;
    } else {
      // Text-based icon (e.g. App Store "A")
      const app = osApps.find((a) => a.id === id);
      if (app?.isText) {
        iconDiv.innerHTML = `<span style="font-size:20px;font-weight:700;color:white">${app.icon}</span>`;
      }
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'app-switcher-name';
    nameSpan.textContent = name;

    item.appendChild(iconDiv);
    item.appendChild(nameSpan);
    barEl!.appendChild(item);

    item.addEventListener('click', () => {
      selectedIndex = i;
      confirmSelection();
    });
  });

  switcherEl.style.display = '';
  switcherEl.classList.add('app-switcher--visible');
  isVisible = true;
}

export function cycleNext() {
  if (!isVisible || openWindows.length === 0) return;
  const items = barEl?.querySelectorAll('.app-switcher-item');
  if (!items) return;
  items[selectedIndex]?.classList.remove('app-switcher-item--active');
  selectedIndex = (selectedIndex + 1) % openWindows.length;
  items[selectedIndex]?.classList.add('app-switcher-item--active');
}

function confirmSelection() {
  if (!switcherEl || openWindows.length === 0) return;
  const win = openWindows[selectedIndex];
  if (win) {
    document.dispatchEvent(
      new CustomEvent('open-window', { detail: { el: win } })
    );
  }
  hideSwitcher();
}

function hideSwitcher() {
  if (!switcherEl) return;
  switcherEl.style.display = 'none';
  switcherEl.classList.remove('app-switcher--visible');
  isVisible = false;
  openWindows = [];
}

export function isAppSwitcherVisible() {
  return isVisible;
}
