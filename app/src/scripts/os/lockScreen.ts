import { getNotificationHistory, DEFAULT_NOTIF_ICON } from './notifications';

let lockEl: HTMLElement | null = null;
let timeEl: HTMLElement | null = null;
let dateEl: HTMLElement | null = null;
let clockInterval: ReturnType<typeof setInterval> | null = null;

const STORAGE_KEY = 'os-settings';

function getWallpaperMode(): 'loop' | 'frame' {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const cat = s.wallpaperCategory || s.wallpaperType || 'animation';
      if (cat === 'image') return 'frame';
      if (s.wallpaperMode === 'frame') return 'frame';
    }
  } catch { /* ignore */ }
  return 'loop';
}

export function initLockScreen() {
  lockEl = document.getElementById('lock-screen');
  timeEl = document.getElementById('lockscreen-time');
  dateEl = document.getElementById('lockscreen-date');
  if (!lockEl) return;

  updateLockClock();
  clockInterval = setInterval(updateLockClock, 1000);

  // Video state is handled by the early inline bootstrap script
  // and restoreSettings → applyWallpaper, no need to touch it here.

  // Click anywhere to unlock (desktop/tablet only)
  lockEl.addEventListener('click', () => {
    if (window.innerWidth < 768) return;
    unlock();
  });

  // Mobile gestures
  initMobileSwipe();
  initMobileSwipeDown();

  // Render notifications on lockscreen when a new one arrives while visible
  document.addEventListener('notification-added', () => {
    if (lockEl && lockEl.style.visibility !== 'hidden') {
      renderLockscreenNotifs();
    }
  });
}

function updateLockClock() {
  if (!timeEl || !dateEl) return;
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  timeEl.textContent = `${hours}:${minutes}`;
  dateEl.textContent = now.toLocaleDateString(document.documentElement.lang || 'en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function unlock() {
  if (!lockEl) return;
  const mode = getWallpaperMode();

  // User clicked — first interaction: start videos only if mode is loop
  if (mode === 'loop') {
    const desktopVid = document.querySelector('.os-wallpaper video') as HTMLVideoElement | null;
    if (desktopVid && desktopVid.paused) {
      desktopVid.play().catch(() => {});
    }
  }

  const lockVid = lockEl.querySelector('video') as HTMLVideoElement | null;

  // Reveal desktop before lockscreen fades out
  document.documentElement.classList.add('os-unlocked');

  lockEl.classList.add('lockscreen--unlocking');
  lockEl.addEventListener(
    'transitionend',
    () => {
      lockEl!.style.visibility = 'hidden';
      lockEl!.style.pointerEvents = 'none';
      lockEl!.classList.remove('lockscreen--unlocking');
      if (clockInterval) clearInterval(clockInterval);
      // Pause lock screen video when hidden to save resources
      if (lockVid) lockVid.pause();
    },
    { once: true }
  );
}

/** Show lock screen (used by sleep → wake and lock action) */
export function showLockScreen() {
  if (!lockEl) return;
  // Disable transition so lockscreen appears instantly (no fade-in delay)
  lockEl.style.transition = 'none';
  lockEl.style.visibility = '';
  lockEl.style.pointerEvents = '';
  lockEl.style.opacity = '';
  lockEl.classList.remove('lockscreen--unlocking');
  // Force repaint, then re-enable transition for future unlock fade-out
  lockEl.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions
  lockEl.style.transition = '';
  // Now hide desktop (lockscreen is already covering it)
  document.documentElement.classList.remove('os-unlocked');
  updateLockClock();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateLockClock, 1000);
  renderLockscreenNotifs();
  // Resume lock screen video only if mode is loop
  const lockVid = lockEl.querySelector('video') as HTMLVideoElement | null;
  if (lockVid) {
    if (getWallpaperMode() === 'loop') {
      if (lockVid.paused) lockVid.play().catch(() => {});
    } else {
      lockVid.pause();
      lockVid.currentTime = 0.001;
    }
  }
}

/* ── Mobile: swipe UP to unlock ──────────────────────────────────── */

function initMobileSwipe() {
  if (!lockEl) return;

  let startY = 0;
  let startTime = 0;
  let dragging = false;

  lockEl.addEventListener('touchstart', (e) => {
    if (window.innerWidth >= 768) return;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    dragging = true;
    lockEl!.classList.add('lockscreen--swiping');
    // Reveal desktop underneath while swiping
    document.documentElement.classList.add('os-unlocked');
  }, { passive: true });

  lockEl.addEventListener('touchmove', (e) => {
    if (!dragging || window.innerWidth >= 768) return;
    const dy = e.touches[0].clientY - startY;
    if (dy < 0) {
      lockEl!.style.transform = `translateY(${dy}px)`;
    }
  }, { passive: true });

  lockEl.addEventListener('touchend', (e) => {
    if (!dragging || window.innerWidth >= 768) return;
    dragging = false;
    lockEl!.classList.remove('lockscreen--swiping');

    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    const velocity = Math.abs(dy) / dt; // px/ms

    // Complete unlock if swiped > 30% of screen or fast enough
    if (dy < -(window.innerHeight * 0.3) || (dy < -50 && velocity > 0.5)) {
      // Animate out
      lockEl!.style.transition = 'transform 0.3s ease-out';
      lockEl!.style.transform = 'translateY(-100%)';
      lockEl!.addEventListener('transitionend', () => {
        unlock(); // call existing unlock function
        lockEl!.style.transform = '';
        lockEl!.style.transition = '';
      }, { once: true });
    } else {
      // Snap back — hide desktop again
      lockEl!.style.transition = 'transform 0.3s ease-out';
      lockEl!.style.transform = '';
      lockEl!.addEventListener('transitionend', () => {
        lockEl!.style.transition = '';
        document.documentElement.classList.remove('os-unlocked');
      }, { once: true });
    }
  });
}

/* ── Mobile: swipe DOWN from menubar to lock ─────────────────────── */

function initMobileSwipeDown() {
  const menubar = document.querySelector('.os-menubar') as HTMLElement | null;
  if (!menubar || !lockEl) return;

  let startY = 0;
  let startTime = 0;
  let swiping = false;

  menubar.addEventListener('touchstart', (e) => {
    if (window.innerWidth >= 768) return;
    // Only if lockscreen is NOT visible
    if (lockEl!.style.visibility !== 'hidden') return;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    swiping = true;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!swiping || window.innerWidth >= 768) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      // Show lockscreen partially — it comes from top
      lockEl!.style.visibility = '';
      lockEl!.style.pointerEvents = '';
      lockEl!.style.opacity = '1';
      lockEl!.classList.remove('lockscreen--unlocking');
      lockEl!.style.transition = 'none';
      lockEl!.style.transform = `translateY(${-window.innerHeight + dy}px)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!swiping || window.innerWidth >= 768) return;
    swiping = false;

    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    const velocity = dy / dt;

    if (dy > window.innerHeight * 0.4 || (dy > 80 && velocity > 0.5)) {
      // Complete lock
      lockEl!.style.transition = 'transform 0.3s ease-out';
      lockEl!.style.transform = 'translateY(0)';
      lockEl!.addEventListener('transitionend', () => {
        lockEl!.style.transform = '';
        lockEl!.style.transition = '';
        showLockScreen(); // existing function
        renderLockscreenNotifs(); // show notifications
      }, { once: true });
    } else {
      // Snap back — hide lockscreen
      lockEl!.style.transition = 'transform 0.3s ease-out';
      lockEl!.style.transform = 'translateY(-100%)';
      lockEl!.addEventListener('transitionend', () => {
        lockEl!.style.visibility = 'hidden';
        lockEl!.style.transform = '';
        lockEl!.style.transition = '';
      }, { once: true });
    }
  });
}

/* ── Render notifications on mobile lockscreen ───────────────────── */

function renderLockscreenNotifs() {
  if (window.innerWidth >= 768) return;
  const container = document.getElementById('lockscreen-notifs');
  if (!container) return;

  const history = getNotificationHistory();
  container.innerHTML = '';

  for (const notif of history.slice(0, 5)) { // max 5 on lockscreen
    const card = document.createElement('div');
    card.className = 'lockscreen-notif-card';

    const isAppIcon = notif.icon && notif.icon !== DEFAULT_NOTIF_ICON;

    const iconEl = document.createElement('div');
    iconEl.className = `lockscreen-notif-icon ${notif.iconGradient || ''}`;
    iconEl.innerHTML = isAppIcon
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${notif.icon}</svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">${DEFAULT_NOTIF_ICON}</svg>`;

    const contentEl = document.createElement('div');
    contentEl.className = 'lockscreen-notif-content';
    contentEl.innerHTML = `<div class="lockscreen-notif-title">${notif.title}</div><div class="lockscreen-notif-body">${notif.body}</div>`;

    const timeEl = document.createElement('div');
    timeEl.className = 'lockscreen-notif-time';
    const mins = Math.floor((Date.now() - notif.timestamp) / 60000);
    timeEl.textContent = mins < 1 ? 'now' : `${mins}m`;

    // Click on notification → unlock + open linked window
    if (notif.action) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        swipeUnlockAndOpen(notif.action!);
      });
    }

    card.appendChild(iconEl);
    card.appendChild(contentEl);
    card.appendChild(timeEl);
    container.appendChild(card);
  }
}

/** Fast swipe-up unlock triggered by notification click, then open a window */
function swipeUnlockAndOpen(windowId: string) {
  if (!lockEl || window.innerWidth >= 768) return;

  document.documentElement.classList.add('os-unlocked');
  lockEl.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
  lockEl.style.transform = 'translateY(-100%)';
  lockEl.addEventListener('transitionend', () => {
    unlock();
    lockEl!.style.transform = '';
    lockEl!.style.transition = '';
    // Open the linked window
    const win = document.getElementById(windowId);
    if (win) {
      document.dispatchEvent(new CustomEvent('open-window', { detail: { el: win } }));
    }
  }, { once: true });
}
