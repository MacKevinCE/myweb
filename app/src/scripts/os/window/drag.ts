import { getLayoutMode } from '../responsive';
import { track } from '../achievements';
import {
  windowStates,
  MENU_BAR_H,
  DESKTOP_PADDING,
  getDesktopSize,
} from './state';

export function makeDraggable(win: HTMLElement, handle: HTMLElement) {
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let pendingExit = false; // defer fullscreen/zoom exit until actual movement
  let startMouseX = 0;
  let startMouseY = 0;

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    // Only exit fullscreen/zoom once actual movement is detected
    if (pendingExit) {
      const dx = Math.abs(e.clientX - startMouseX);
      const dy = Math.abs(e.clientY - startMouseY);
      if (dx < 3 && dy < 3) return; // ignore micro-movements

      const state = windowStates.get(win.id);
      if (state) {
        const prevW = state.fullscreen
          ? (parseFloat(state.preFullWidth) || win.offsetWidth * 0.6)
          : (parseFloat(state.preZoomWidth) || win.offsetWidth * 0.6);
        const prevH = state.fullscreen
          ? (parseFloat(state.preFullHeight) || win.offsetHeight * 0.6)
          : (parseFloat(state.preZoomHeight) || win.offsetHeight * 0.6);

        if (state.fullscreen) {
          state.fullscreen = false;
          win.classList.remove('os-window--fullscreen');
        }
        state.zoomed = false;

        const dsk = getDesktopSize();
        win.style.transition = 'none';
        win.style.left = `${Math.max(DESKTOP_PADDING, e.clientX - dsk.wb - prevW / 2)}px`;
        win.style.top = `${Math.max(MENU_BAR_H + DESKTOP_PADDING, e.clientY - dsk.wb - 20)}px`;
        win.style.width = `${prevW}px`;
        win.style.height = `${prevH}px`;
        win.style.borderRadius = '';

        offsetX = e.clientX - win.offsetLeft;
        offsetY = e.clientY - win.offsetTop;
      }
      pendingExit = false;
      return;
    }

    const { w: dw, h: dh } = getDesktopSize();
    const ww = win.offsetWidth;
    const wh = win.offsetHeight;

    const x = Math.max(DESKTOP_PADDING, Math.min(e.clientX - offsetX, dw - ww - DESKTOP_PADDING));
    const y = Math.max(MENU_BAR_H + DESKTOP_PADDING, Math.min(e.clientY - offsetY, dh - wh - DESKTOP_PADDING));

    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    pendingExit = false;
    win.style.transition = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    track('window-moved');
  };

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.os-window-dots')) return;
    if (getLayoutMode() === 'mobile') return;

    const state = windowStates.get(win.id);
    if (state?.lockedFullscreen) return; // Can't drag out of locked fullscreen
    pendingExit = !!(state?.fullscreen || state?.zoomed);
    startMouseX = e.clientX;
    startMouseY = e.clientY;

    dragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    win.style.transition = 'none';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}
