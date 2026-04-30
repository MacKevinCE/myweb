import { getEl } from './utils';

interface ContextMenuItem {
  label: string;
  action: () => void;
  separator?: boolean;
}

let menuEl: HTMLElement | null = null;
let itemsEl: HTMLElement | null = null;
let i18n: Record<string, string> = {};

export function initContextMenu() {
  menuEl = getEl('ctx-menu');
  itemsEl = getEl('ctx-menu-items');

  // Load i18n
  const i18nEl = getEl('ctx-i18n');
  if (i18nEl) {
    try { i18n = JSON.parse(i18nEl.textContent || '{}'); } catch { /* ignore */ }
  }

  // Close on click outside
  document.addEventListener('click', hideMenu);
  document.addEventListener('contextmenu', (e) => {
    // If clicking outside registered areas, hide and let default menu show
    if (!handleContextMenu(e)) {
      hideMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideMenu();
  });

  // Close on scroll
  document.addEventListener('scroll', hideMenu, true);
}

function showMenu(x: number, y: number, items: ContextMenuItem[]) {
  if (!menuEl || !itemsEl) return;

  itemsEl.innerHTML = '';

  for (const item of items) {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.className = 'ctx-separator';
      itemsEl.appendChild(sep);
      continue;
    }

    const btn = document.createElement('button');
    btn.className = 'ctx-item';
    btn.textContent = item.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      item.action();
      hideMenu();
    });
    itemsEl.appendChild(btn);
  }

  menuEl.style.display = '';

  // Position — adjust if would go off-screen
  const rect = menuEl.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 8;
  const maxY = window.innerHeight - rect.height - 8;
  menuEl.style.left = `${Math.min(x, maxX)}px`;
  menuEl.style.top = `${Math.min(y, maxY)}px`;
}

function hideMenu() {
  if (menuEl) menuEl.style.display = 'none';
}

function handleContextMenu(e: MouseEvent): boolean {
  const target = e.target as HTMLElement;

  // 1. Dock icon (fixed or dynamic)
  const dockSlot = target.closest('.os-dock-slot') as HTMLElement | null;
  if (dockSlot) {
    e.preventDefault();
    handleDockContext(e.clientX, e.clientY, dockSlot);
    return true;
  }

  // 2. Dock divider
  const dockDivider = target.closest('.os-dock-divider') as HTMLElement | null;
  if (dockDivider) {
    e.preventDefault();
    handleDockDividerContext(e.clientX, e.clientY);
    return true;
  }

  // 3. Desktop icon
  const desktopIcon = target.closest('.os-icon-wrapper') as HTMLElement | null;
  if (desktopIcon) {
    e.preventDefault();
    handleDesktopIconContext(e.clientX, e.clientY, desktopIcon);
    return true;
  }

  // 4. Desktop background (wallpaper area, not on any window or UI element)
  const onDesktop = target.closest('.os-wallpaper') ||
                     target.closest('.os-desktop-icons') ||
                     (target.classList.contains('os-desktop'));
  if (onDesktop && !target.closest('.os-window') && !target.closest('.os-dock') && !target.closest('.os-menubar')) {
    e.preventDefault();
    handleDesktopContext(e.clientX, e.clientY);
    return true;
  }

  return false;
}

function handleDockContext(x: number, y: number, slot: HTMLElement) {
  const windowId = slot.dataset.dockId || slot.dataset.openWindow;
  if (!windowId) return;

  const win = document.getElementById(windowId);
  const isOpen = win && win.style.display !== 'none';

  const items: ContextMenuItem[] = [];

  if (isOpen) {
    items.push({
      label: i18n.showWindow || 'Show Window',
      action: () => {
        if (win) document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
      }
    });
    items.push({ separator: true, label: '', action: () => {} });
    items.push({
      label: i18n.close || 'Close',
      action: () => {
        const prefix = windowId.replace('-window', '');
        const closeBtn = document.getElementById(`${prefix}-close`);
        if (closeBtn) closeBtn.click();
      }
    });
  } else {
    items.push({
      label: i18n.open || 'Open',
      action: () => {
        if (win) document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
      }
    });
  }

  showMenu(x, y, items);
}

function handleDockDividerContext(x: number, y: number) {
  const autoHideToggle = document.getElementById('stg-autohide-toggle');
  const isHiding = autoHideToggle?.classList.contains('stg-toggle--on') ?? false;

  const items: ContextMenuItem[] = [{
    label: isHiding ? (i18n.turnHidingOff || 'Turn Hiding Off') : (i18n.turnHidingOn || 'Turn Hiding On'),
    action: () => {
      if (autoHideToggle) autoHideToggle.click();
    }
  }];

  showMenu(x, y, items);
}

function handleDesktopIconContext(x: number, y: number, icon: HTMLElement) {
  const windowId = icon.dataset.openWindow;
  if (!windowId) return;

  const items: ContextMenuItem[] = [{
    label: i18n.open || 'Open',
    action: () => {
      const win = document.getElementById(windowId);
      if (win) document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
    }
  }];

  // If it's a Finder alias (Projects, Experience), add "Show in Finder"
  const isFinderContent = windowId === 'projects-window' || windowId === 'experience-window';
  if (isFinderContent) {
    items.push({
      label: i18n.showInFinder || 'Show in Finder',
      action: () => {
        const finderWin = document.getElementById('finder-window');
        if (finderWin) document.dispatchEvent(new CustomEvent('open-window', { detail: { el: finderWin } }));
      }
    });
  }

  showMenu(x, y, items);
}

function handleDesktopContext(x: number, y: number) {
  const items: ContextMenuItem[] = [
    {
      label: i18n.changeWallpaper || 'Change Wallpaper',
      action: () => {
        const win = document.getElementById('settings-window');
        if (win) {
          document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
          // Navigate to wallpaper tab after window opens
          requestAnimationFrame(() => {
            const wpTab = win.querySelector<HTMLElement>('[data-stg-tab="wallpaper"]');
            if (wpTab) wpTab.click();
          });
        }
      }
    },
    {
      label: i18n.settings || 'Settings',
      action: () => {
        const win = document.getElementById('settings-window');
        if (win) document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
      }
    },
    {
      label: i18n.keyboardShortcuts || 'Keyboard Shortcuts',
      action: () => {
        const overlay = document.getElementById('shortcuts-overlay');
        if (overlay) {
          overlay.style.display = '';
          overlay.classList.add('shortcuts-overlay--visible');
        }
      }
    },
    { separator: true, label: '', action: () => {} },
    {
      label: i18n.aboutThisMac || 'About This Mac',
      action: () => {
        const win = document.getElementById('about-window');
        if (win) document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
      }
    }
  ];

  showMenu(x, y, items);
}

export function getContextI18n() { return i18n; }
