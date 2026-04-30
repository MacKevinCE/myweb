import { appNames } from '../../../data/os-apps';
import { windowStates } from './state';

let topZ = 30;

export function bringToFront(win: HTMLElement) {
  topZ++;
  win.style.zIndex = String(topZ);
  updateMenuBarApp(win.id);
}

export function updateMenuBarApp(windowId?: string) {
  const el = document.querySelector<HTMLElement>('.os-menubar-app');
  if (!el) return;

  if (windowId && appNames[windowId]) {
    el.textContent = appNames[windowId];
    return;
  }

  // Find the topmost visible window
  let topWinId = '';
  let maxZ = 0;
  windowStates.forEach((_state, id) => {
    const win = document.getElementById(id);
    if (!win || win.style.display === 'none') return;
    const z = parseInt(win.style.zIndex || '0', 10);
    if (z > maxZ) {
      maxZ = z;
      topWinId = id;
    }
  });

  el.textContent = topWinId ? appNames[topWinId] || 'Finder' : 'Finder';
}
