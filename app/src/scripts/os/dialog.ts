import { getEl } from './utils';

let dialogEl: HTMLElement | null = null;
let messageEl: HTMLElement | null = null;
let confirmBtn: HTMLElement | null = null;
let cancelBtn: HTMLElement | null = null;
let resolver: ((value: boolean) => void) | null = null;

export function initDialog() {
  dialogEl = getEl('os-dialog');
  messageEl = getEl('os-dialog-message');
  confirmBtn = getEl('os-dialog-confirm');
  cancelBtn = getEl('os-dialog-cancel');

  if (!confirmBtn || !cancelBtn) return;

  confirmBtn.addEventListener('click', () => resolve(true));
  cancelBtn.addEventListener('click', () => resolve(false));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialogEl?.style.display !== 'none') {
      resolve(false);
    }
  });
}

function resolve(value: boolean) {
  if (!dialogEl) return;
  dialogEl.style.display = 'none';
  if (resolver) {
    resolver(value);
    resolver = null;
  }
}

/**
 * Show a desktop-style confirmation dialog.
 * Returns true if confirmed, false if cancelled.
 */
export function confirm(
  message: string,
  confirmLabel?: string,
  cancelLabel?: string,
): Promise<boolean> {
  if (!dialogEl || !messageEl || !confirmBtn || !cancelBtn) {
    // Fallback to native confirm if dialog not available
    return Promise.resolve(window.confirm(message));
  }

  messageEl.textContent = message;
  if (confirmLabel) confirmBtn.textContent = confirmLabel;
  if (cancelLabel) cancelBtn.textContent = cancelLabel;

  dialogEl.style.display = '';

  // Focus the cancel button (safer default)
  cancelBtn.focus();

  return new Promise((res) => {
    resolver = res;
  });
}
