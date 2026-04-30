import { windowConfigs } from '../../../data/os-apps';
import type { WindowConfig } from '../../../data/os-apps';

export interface WindowState {
  minimized: boolean;
  fullscreen: boolean;
  /** Fullscreen was forced because window doesn't fit — lock exit */
  lockedFullscreen: boolean;
  zoomed: boolean;
  defaultLeft: string;
  defaultTop: string;
  defaultWidth: string;
  defaultHeight: string;
  // Saved geometry before fullscreen/zoom
  preFullLeft: string;
  preFullTop: string;
  preFullWidth: string;
  preFullHeight: string;
  preZoomLeft: string;
  preZoomTop: string;
  preZoomWidth: string;
  preZoomHeight: string;
}

export const MENU_BAR_H = 28;
export const DESKTOP_PADDING = 0;
export const MIN_W = 200;
export const MIN_H = 150;

export const windowStates = new Map<string, WindowState>();

/** Read --os-web-border and return desktop-available dimensions */
export function getWebBorder(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--os-web-border')
    .trim();
  return parseFloat(raw) || 0;
}

export function getDesktopSize() {
  const wb = getWebBorder();
  return {
    w: window.innerWidth - wb * 2,
    h: window.innerHeight - wb * 2,
    wb,
  };
}

/** Helpers to read from the centralized windowConfigs */
export function cfg(id: string): WindowConfig {
  return windowConfigs[id] ?? {};
}

export function getDefaultSize(id: string): [number, number] {
  return (
    cfg(id).defaultSize ?? [
      Math.round(getDesktopSize().w / 2),
      Math.round(getDesktopSize().h / 2),
    ]
  );
}

export function getMinSize(id: string): [number, number] | undefined {
  return cfg(id).minSize;
}

export function getMaxSize(id: string): [number, number] | undefined {
  return cfg(id).maxSize;
}

export function getOrigin(id: string): [number, number] {
  return cfg(id).origin ?? [0, 0];
}

/** Clamp origin so window fits within the desktop area */
export function clampOrigin(
  windowId: string,
  left: number,
  top: number
): [number, number] {
  const ds = getDesktopSize();
  const size = getDefaultSize(windowId);
  const maxLeft = Math.max(0, ds.w - size[0]);
  const maxTop = Math.max(0, ds.h - MENU_BAR_H - size[1]);
  return [
    Math.max(0, Math.min(left, maxLeft)),
    Math.max(MENU_BAR_H, Math.min(top, maxTop + MENU_BAR_H)),
  ];
}
