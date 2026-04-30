import type { WallpaperCategory } from '../../../data/os-wallpapers';
import { settings, saveSettings } from './persist';
import { notify, getNotifI18n } from '../notifications';

function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(src);
}

function isValidImageUrl(src: string): boolean {
  return /^(\/|https?:\/\/)/.test(src) && !/['"()\\]/.test(src);
}

/**
 * Try to play a video. If Safari blocks it (no user interaction yet),
 * queue it so the first user interaction will start all pending videos.
 */
const _pendingVideos = new Set<HTMLVideoElement>();

function safariPlay(vid: HTMLVideoElement) {
  const attempt = () => {
    const p = vid.play();
    if (p) {
      p.then(() => {
        _pendingVideos.delete(vid);
      }).catch(() => {
        // Autoplay blocked — queue for first user interaction
        _pendingVideos.add(vid);
      });
    }
  };

  if (vid.readyState >= 3) {
    attempt();
  } else {
    vid.addEventListener('canplay', attempt, { once: true });
  }
}

/** Flush all pending videos — call this on any user interaction */
function flushPendingVideos() {
  const effectiveMode = settings.wallpaperCategory === 'image' ? 'frame' : settings.wallpaperMode;
  if (effectiveMode === 'frame') {
    _pendingVideos.clear();
  } else {
    _pendingVideos.forEach((vid) => {
      if (vid.paused && vid.isConnected) {
        vid.play().catch(() => {});
      }
    });
    _pendingVideos.clear();
  }
  // Remove listeners after first interaction
  _interactionEvents.forEach((evt) => {
    document.removeEventListener(evt, flushPendingVideos);
  });
}

// Listen for the very first user interaction to unblock Safari autoplay
const _interactionEvents = ['click', 'touchstart', 'keydown'];
_interactionEvents.forEach((evt) => {
  document.addEventListener(evt, flushPendingVideos, { once: true, passive: true });
});

export function applyWallpaper(src: string, name: string) {
  const wpImg = document.getElementById('stg-wp-current') as HTMLImageElement | null;
  const wpVideo = document.getElementById('stg-wp-current-video') as HTMLVideoElement | null;
  const wpName = document.getElementById('stg-wp-name');
  const videoControls = document.getElementById('stg-wp-video-controls');
  const wpBg = document.querySelector('.os-wallpaper') as HTMLElement | null;
  const lockBg = document.querySelector('.lockscreen-bg') as HTMLElement | null;
  const isVideo = isVideoSrc(src);

  // Update settings panel preview
  if (wpName) wpName.textContent = name;

  if (isVideo) {
    if (wpImg) wpImg.style.display = 'none';
    if (wpVideo) {
      wpVideo.style.display = '';
      wpVideo.src = src;
      applyVideoState(wpVideo);
    }
    if (videoControls) videoControls.style.display = '';
  } else {
    if (wpImg) { wpImg.style.display = ''; wpImg.src = src; }
    if (wpVideo) { wpVideo.style.display = 'none'; wpVideo.src = ''; }
    if (videoControls) videoControls.style.display = 'none';
  }

  // Apply to desktop wallpaper
  if (wpBg) {
    const existingVideo = wpBg.querySelector('video');
    const sameSrc = existingVideo && existingVideo.getAttribute('src') === src;

    if (isVideo && sameSrc && existingVideo) {
      // Reuse existing SSR / previous video — don't destroy & recreate
      applyVideoState(existingVideo);
    } else {
      if (existingVideo) existingVideo.remove();

      if (isVideo) {
        wpBg.style.backgroundImage = 'none';
        const vid = createWallpaperVideo(src);
        wpBg.appendChild(vid);
      } else if (isValidImageUrl(src)) {
        wpBg.style.backgroundImage = `url('${src}')`;
      }
    }
  }

  // Apply to lock screen — same config as desktop
  if (lockBg) {
    const existingLockVideo = lockBg.querySelector('video');
    const sameSrc = existingLockVideo && existingLockVideo.getAttribute('src') === src;

    if (isVideo && sameSrc && existingLockVideo) {
      applyVideoState(existingLockVideo);
    } else {
      if (existingLockVideo) existingLockVideo.remove();

      if (isVideo) {
        lockBg.style.backgroundImage = 'none';
        const vid = createWallpaperVideo(src);
        lockBg.appendChild(vid);
      } else if (isValidImageUrl(src)) {
        lockBg.style.backgroundImage = `url('${src}')`;
      }
    }
  }
}

/** Create a new wallpaper <video> element with proper attributes */
function createWallpaperVideo(src: string): HTMLVideoElement {
  const mode = settings.wallpaperCategory === 'image' ? 'frame' : settings.wallpaperMode;

  const vid = document.createElement('video');
  vid.setAttribute('src', src);
  vid.playsInline = true;
  vid.setAttribute('playsinline', '');
  vid.setAttribute('webkit-playsinline', '');
  vid.preload = 'auto';
  vid.className = 'os-wallpaper-video';
  vid.muted = true;
  vid.setAttribute('muted', '');
  vid.loop = mode === 'loop';
  if (mode === 'frame') {
    vid.addEventListener('loadeddata', () => { vid.currentTime = 0.001; vid.pause(); }, { once: true });
  } else {
    safariPlay(vid);
  }
  return vid;
}

/**
 * Update wallpaper controls visibility based on the current category:
 * - image:     mode disabled (forced frame)
 * - animation: mode enabled
 */
export function updateWallpaperControls() {
  const controls = document.getElementById('stg-wp-video-controls');
  const modeRow = document.getElementById('stg-wp-mode-row');
  const modeBtns = document.querySelectorAll<HTMLElement>('[data-wp-mode]');
  if (!controls) return;

  const cat = settings.wallpaperCategory;

  controls.style.display = '';

  // --- Mode ---
  // Disabled for image (forced frame); enabled for animation
  if (modeRow) {
    modeRow.classList.toggle('stg-row--disabled', cat === 'image');
  }
  // image → show frame active; animation → restore user preference
  const displayMode = cat === 'image' ? 'frame' : settings.wallpaperMode;
  modeBtns.forEach((b) => {
    b.classList.toggle('stg-wp-mode-btn--active', b.dataset.wpMode === displayMode);
  });
}

function applyVideoState(vid: HTMLVideoElement) {
  // All videos are always muted (no audio tracks)
  const mode = settings.wallpaperCategory === 'image' ? 'frame' : settings.wallpaperMode;

  vid.muted = true;
  vid.setAttribute('muted', '');
  vid.loop = mode === 'loop';
  if (mode === 'frame') {
    vid.autoplay = false;
    vid.removeAttribute('autoplay');
    vid.pause();
    // Need data loaded before seeking — readyState >= 2 (HAVE_CURRENT_DATA)
    if (vid.readyState >= 2) {
      vid.currentTime = 0.001;
    } else {
      vid.addEventListener('loadeddata', () => {
        vid.currentTime = 0.001;
        vid.pause();
      }, { once: true });
    }
  } else {
    safariPlay(vid);
  }
}

function applyWallpaperVideoSettings() {
  // Update preview video
  const previewVid = document.getElementById('stg-wp-current-video') as HTMLVideoElement | null;
  if (previewVid && previewVid.src) {
    applyVideoState(previewVid);
  }

  // Update desktop video
  const desktopVid = document.querySelector('.os-wallpaper video') as HTMLVideoElement | null;
  if (desktopVid) {
    applyVideoState(desktopVid);
  }

  // Update lock screen video
  const lockVid = document.querySelector('.lockscreen-bg video') as HTMLVideoElement | null;
  if (lockVid) {
    applyVideoState(lockVid);
  }
}

export function initWallpaperPicker() {
  const wpThumbs = document.querySelectorAll<HTMLElement>('[data-wp]');

  wpThumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      if (thumb.classList.contains('stg-wp-thumb--active')) return;

      const src = thumb.dataset.wp!;
      const name = thumb.dataset.wpName || '';
      const category = (thumb.dataset.wpCategory || 'image') as WallpaperCategory;

      wpThumbs.forEach((t) => t.classList.remove('stg-wp-thumb--active'));
      thumb.classList.add('stg-wp-thumb--active');

      settings.wallpaper = src;
      settings.wallpaperName = name;
      settings.wallpaperCategory = category;
      applyWallpaper(src, name);
      updateWallpaperControls();
      saveSettings(settings, 'wallpaper');
      const nt = getNotifI18n();
      notify(nt.settingsTitle || 'Settings', nt.wallpaperChanged || 'Wallpaper updated', undefined, 'settings-window');
    });
  });

  // Force Safari to show first frame on video thumbnails
  document.querySelectorAll<HTMLVideoElement>('.stg-wp-thumb-video').forEach((vid) => {
    vid.addEventListener('loadedmetadata', () => { vid.currentTime = 0.001; }, { once: true });
  });

  // Mode buttons (frame / loop)
  const modeBtns = document.querySelectorAll<HTMLElement>('[data-wp-mode]');
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('stg-wp-mode-btn--active')) return;
      modeBtns.forEach((b) => b.classList.remove('stg-wp-mode-btn--active'));
      btn.classList.add('stg-wp-mode-btn--active');
      settings.wallpaperMode = btn.dataset.wpMode as 'loop' | 'frame';
      applyWallpaperVideoSettings();
      saveSettings(settings, 'wallpaperMode');
    });
  });
}

export function restoreWallpaper() {
  // Wallpaper
  applyWallpaper(settings.wallpaper, settings.wallpaperName);
  const activeThumb = document.querySelector<HTMLElement>(`[data-wp="${settings.wallpaper}"]`);
  if (activeThumb) {
    document.querySelectorAll('[data-wp]').forEach((t) => t.classList.remove('stg-wp-thumb--active'));
    activeThumb.classList.add('stg-wp-thumb--active');
  }

  // Restore video controls state
  const modeBtns = document.querySelectorAll<HTMLElement>('[data-wp-mode]');
  modeBtns.forEach((b) => {
    b.classList.toggle('stg-wp-mode-btn--active', b.dataset.wpMode === settings.wallpaperMode);
  });

  // Update controls visibility based on category
  updateWallpaperControls();
}
