/**
 * Desktop-style notification system.
 * Notifications slide in from top-right, stack, auto-dismiss.
 */

import { escapeHtml } from './utils';

let container: HTMLElement | null = null;
let notifI18n: Record<string, string> = {};

const DISMISS_MS = 5000;  // Auto-dismiss after 5 seconds
const MAX_VISIBLE = 3;    // Max notifications visible at once
const queue: { title: string; body: string; icon?: string; action?: string; gradient?: string }[] = [];
let visibleCount = 0;

/* ── Notification history ─────────────────────────────────────────── */

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  icon: string; // SVG inner content or empty
  iconGradient?: string; // CSS gradient class for app icon background
  timestamp: number; // Date.now()
  action?: string; // window ID to open on click (e.g. 'achievements-window')
}

const history: NotificationRecord[] = [];
let historyIdCounter = 0;

/** Default MK logo SVG inner content used when no icon is provided. */
export const DEFAULT_NOTIF_ICON = '<rect x="1.5" y="3.5" width="21" height="18" rx="2.5" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="0.5" stroke-opacity="0.4"/><rect x="1.5" y="3.5" width="21" height="4.5" rx="2.5" fill="currentColor" opacity="0.15"/><rect x="1.5" y="6" width="21" height="2" fill="currentColor" opacity="0.15"/><circle cx="5" cy="5.8" r="0.9" fill="#ef4444"/><circle cx="8" cy="5.8" r="0.9" fill="#fbbf24"/><circle cx="11" cy="5.8" r="0.9" fill="#34d399"/><text x="12" y="17" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7" font-weight="700" fill="currentColor">MK</text>';

function getContainer(): HTMLElement | null {
  if (!container) container = document.getElementById('os-notif-container');
  return container;
}

let dockRegistry: Record<string, { name: string; icon: string; gradient: string }> | null = null;

function resolveAppInfo(action?: string): { icon: string; gradient: string } | null {
  if (!action) return null;
  if (!dockRegistry) {
    const el = document.getElementById('dock-icon-registry');
    if (el) {
      try { dockRegistry = JSON.parse(el.textContent || '{}'); } catch { /* ignore */ }
    }
  }
  const entry = dockRegistry?.[action];
  return entry ? { icon: entry.icon, gradient: entry.gradient } : null;
}

/**
 * Show a notification toast.
 * @param title — Bold title text
 * @param body — Description text
 * @param icon — Optional: SVG inner content for the icon (from uiIcons), defaults to app icon or MK logo
 * @param action — Optional: window element ID to open when notification is clicked
 */
export function notify(title: string, body: string, icon?: string, action?: string) {
  // Auto-resolve app icon + gradient from dock registry
  const appInfo = !icon ? resolveAppInfo(action) : null;
  const resolvedIcon = icon || appInfo?.icon || DEFAULT_NOTIF_ICON;
  const resolvedGradient = appInfo?.gradient || '';

  // Record in history before any DOM work
  const record: NotificationRecord = {
    id: `notif-${++historyIdCounter}`,
    title,
    body,
    icon: resolvedIcon,
    iconGradient: resolvedGradient,
    timestamp: Date.now(),
    action,
  };
  history.unshift(record); // newest first
  if (history.length > 100) history.pop();

  // Dispatch event so Notification Center can update live
  document.dispatchEvent(new CustomEvent('notification-added', { detail: record }));

  // Skip toast if Notification Center is open — it shows there directly
  const ncPanel = document.getElementById('nc-panel');
  if (ncPanel?.classList.contains('nc-panel--open')) return;

  if (visibleCount >= MAX_VISIBLE) {
    queue.push({ title, body, icon: resolvedIcon, action, gradient: resolvedGradient });
    return;
  }
  showNotification(title, body, resolvedIcon, action, resolvedGradient);
}

function showNotification(title: string, body: string, icon?: string, action?: string, gradient?: string) {
  const c = getContainer();
  if (!c) return;

  visibleCount++;

  const el = document.createElement('div');
  el.className = 'os-notif';

  const hasAppIcon = icon && icon !== DEFAULT_NOTIF_ICON;
  const gradientClass = gradient || '';
  const iconHtml = hasAppIcon
    ? `<div class="os-notif-icon ${gradientClass}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></div>`
    : `<div class="os-notif-icon os-notif-icon--app"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">${DEFAULT_NOTIF_ICON}</svg></div>`;

  el.innerHTML = `
    ${iconHtml}
    <div class="os-notif-content">
      <span class="os-notif-title">${escapeHtml(title)}</span>
      <span class="os-notif-body">${escapeHtml(body)}</span>
    </div>
    <button class="os-notif-close" aria-label="Dismiss">\u00d7</button>
  `;

  // Insert at the top of container
  c.prepend(el);

  // Trigger slide-in animation
  requestAnimationFrame(() => {
    el.classList.add('os-notif--visible');
  });

  // Close button
  el.querySelector('.os-notif-close')?.addEventListener('click', () => dismiss(el));

  // Click body to open action window (if any) and dismiss
  if (action) el.style.cursor = 'pointer';
  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.os-notif-close')) return;
    if (action) {
      const win = document.getElementById(action);
      if (win) {
        document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
      }
    }
    dismiss(el);
  });

  // Auto-dismiss
  let timer = setTimeout(() => dismiss(el), DISMISS_MS);

  // Pause timer on hover
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => {
    timer = setTimeout(() => dismiss(el), 2000);
  });
}

function dismiss(el: HTMLElement) {
  if (el.classList.contains('os-notif--dismissing')) return;
  el.classList.add('os-notif--dismissing');
  el.classList.remove('os-notif--visible');

  el.addEventListener('transitionend', () => {
    el.remove();
    visibleCount--;
    // Process queue
    if (queue.length > 0 && visibleCount < MAX_VISIBLE) {
      const next = queue.shift()!;
      showNotification(next.title, next.body, next.icon, next.action, next.gradient);
    }
  }, { once: true });
}

/** Load i18n strings for notification triggers. */
export function getNotifI18n(): Record<string, string> {
  if (Object.keys(notifI18n).length === 0) {
    const el = document.getElementById('os-notif-i18n');
    if (el) {
      try { notifI18n = JSON.parse(el.textContent || '{}'); } catch { /* ignore */ }
    }
  }
  return notifI18n;
}

/** Initialize notifications and fire welcome notification after unlock. */
export function initNotifications() {
  container = document.getElementById('os-notif-container');
}

/* ── History helpers ──────────────────────────────────────────────── */

/** Returns all notification records, newest first. */
export function getNotificationHistory(): NotificationRecord[] {
  return history;
}

/** Dismiss a single notification by id. */
export function dismissNotification(id: string): void {
  const idx = history.findIndex(n => n.id === id);
  if (idx !== -1) history.splice(idx, 1);
}

/** Clear all notifications. */
export function clearAllNotifications(): void {
  history.length = 0;
}
