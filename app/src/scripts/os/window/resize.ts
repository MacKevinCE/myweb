import { getLayoutMode } from '../responsive';
import {
  windowStates,
  MENU_BAR_H,
  DESKTOP_PADDING,
  MIN_W,
  MIN_H,
  getDesktopSize,
} from './state';

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const EDGE_SIZE = 6;

export function makeResizable(win: HTMLElement, minW = MIN_W, minH = MIN_H, maxW?: number, maxH?: number) {
  const edges: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  edges.forEach((edge) => {
    const handle = document.createElement('div');
    handle.className = `os-resize os-resize--${edge}`;
    handle.style.position = 'absolute';
    handle.style.zIndex = '10';

    // Position each handle
    switch (edge) {
      case 'n':
        Object.assign(handle.style, { top: '0', left: `${EDGE_SIZE}px`, right: `${EDGE_SIZE}px`, height: `${EDGE_SIZE}px`, cursor: 'ns-resize' });
        break;
      case 's':
        Object.assign(handle.style, { bottom: '0', left: `${EDGE_SIZE}px`, right: `${EDGE_SIZE}px`, height: `${EDGE_SIZE}px`, cursor: 'ns-resize' });
        break;
      case 'e':
        Object.assign(handle.style, { top: `${EDGE_SIZE}px`, right: '0', bottom: `${EDGE_SIZE}px`, width: `${EDGE_SIZE}px`, cursor: 'ew-resize' });
        break;
      case 'w':
        Object.assign(handle.style, { top: `${EDGE_SIZE}px`, left: '0', bottom: `${EDGE_SIZE}px`, width: `${EDGE_SIZE}px`, cursor: 'ew-resize' });
        break;
      case 'nw':
        Object.assign(handle.style, { top: '0', left: '0', width: `${EDGE_SIZE}px`, height: `${EDGE_SIZE}px`, cursor: 'nwse-resize' });
        break;
      case 'ne':
        Object.assign(handle.style, { top: '0', right: '0', width: `${EDGE_SIZE}px`, height: `${EDGE_SIZE}px`, cursor: 'nesw-resize' });
        break;
      case 'sw':
        Object.assign(handle.style, { bottom: '0', left: '0', width: `${EDGE_SIZE}px`, height: `${EDGE_SIZE}px`, cursor: 'nesw-resize' });
        break;
      case 'se':
        Object.assign(handle.style, { bottom: '0', right: '0', width: `${EDGE_SIZE}px`, height: `${EDGE_SIZE}px`, cursor: 'nwse-resize' });
        break;
    }

    win.appendChild(handle);

    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let startW = 0;
    let startH = 0;

    handle.addEventListener('mousedown', (e: MouseEvent) => {
      if (getLayoutMode() === 'mobile') return;
      const state = windowStates.get(win.id);
      if (state?.lockedFullscreen) return; // Can't resize locked fullscreen
      e.stopPropagation();
      e.preventDefault();

      // Exit fullscreen/zoom if resizing
      if (state?.fullscreen) {
        state.fullscreen = false;
        win.classList.remove('os-window--fullscreen');
        win.style.borderRadius = '';
      }
      if (state) state.zoomed = false;

      startX = e.clientX;
      startY = e.clientY;
      startLeft = win.offsetLeft;
      startTop = win.offsetTop;
      startW = win.offsetWidth;
      startH = win.offsetHeight;

      win.style.transition = 'none';
      document.body.style.userSelect = 'none';

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newLeft = startLeft;
        let newTop = startTop;
        let newW = startW;
        let newH = startH;

        // East
        if (edge.includes('e')) {
          newW = Math.max(minW, startW + dx);
        }
        // West
        if (edge.includes('w')) {
          const dw = Math.min(dx, startW - minW);
          newLeft = startLeft + dw;
          newW = startW - dw;
        }
        // South
        if (edge === 's' || edge === 'se' || edge === 'sw') {
          newH = Math.max(minH, startH + dy);
        }
        // North
        if (edge === 'n' || edge === 'ne' || edge === 'nw') {
          const dh = Math.min(dy, startH - minH);
          newTop = Math.max(MENU_BAR_H + DESKTOP_PADDING, startTop + dh);
          newH = startH - (newTop - startTop);
        }

        // Clamp to max size
        if (maxW && newW > maxW) {
          if (edge.includes('w')) newLeft = startLeft + startW - maxW;
          newW = maxW;
        }
        if (maxH && newH > maxH) {
          if (edge === 'n' || edge === 'ne' || edge === 'nw') newTop = startTop + startH - maxH;
          newH = maxH;
        }

        // Clamp to desktop area
        const { w: _dw, h: _dh } = getDesktopSize();
        newLeft = Math.max(DESKTOP_PADDING, newLeft);
        newTop = Math.max(MENU_BAR_H + DESKTOP_PADDING, newTop);
        if (newLeft + newW > _dw - DESKTOP_PADDING) newW = _dw - DESKTOP_PADDING - newLeft;
        if (newTop + newH > _dh - DESKTOP_PADDING) newH = _dh - DESKTOP_PADDING - newTop;

        win.style.left = `${newLeft}px`;
        win.style.top = `${newTop}px`;
        win.style.width = `${newW}px`;
        win.style.height = `${newH}px`;
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        win.style.transition = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}
