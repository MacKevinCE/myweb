import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

let iframe: HTMLIFrameElement | null = null;
let urlText: HTMLElement | null = null;
let startPage: HTMLElement | null = null;
let content: HTMLElement | null = null;
let fallback: HTMLElement | null = null;
let fallbackLink: HTMLAnchorElement | null = null;
let loadingBar: HTMLElement | null = null;
let homeBtn: HTMLButtonElement | null = null;
let reloadBtn: HTMLButtonElement | null = null;
let externalBtn: HTMLButtonElement | null = null;
let currentUrl = '';

export function initBrowser() {
  iframe = document.getElementById('brw-iframe') as HTMLIFrameElement | null;
  urlText = document.getElementById('brw-url-text');
  startPage = document.getElementById('brw-start');
  content = document.getElementById('brw-content');
  fallback = document.getElementById('brw-fallback');
  fallbackLink = document.getElementById(
    'brw-fallback-link'
  ) as HTMLAnchorElement | null;
  loadingBar = document.getElementById('brw-loading');

  homeBtn = document.getElementById('brw-home') as HTMLButtonElement | null;
  reloadBtn = document.getElementById('brw-reload') as HTMLButtonElement | null;
  externalBtn = document.getElementById(
    'brw-external'
  ) as HTMLButtonElement | null;

  // Home button → show start page
  homeBtn?.addEventListener('click', showStartPage);

  // Reload button
  reloadBtn?.addEventListener('click', () => {
    if (currentUrl) navigate(currentUrl);
  });

  // Open external button
  externalBtn?.addEventListener('click', () => {
    if (currentUrl) window.open(currentUrl, '_blank');
  });

  // Bookmark bar + start page tile clicks
  document.querySelectorAll<HTMLElement>('[data-brw-url]').forEach((el) => {
    el.addEventListener('click', () => {
      const url = el.dataset.brwUrl;
      if (url) navigate(url);
    });
  });

  // Iframe load event
  if (iframe) {
    iframe.addEventListener('load', () => {
      if (loadingBar) loadingBar.classList.remove('brw-loading--active');
      try {
        const loc = iframe!.contentWindow?.location.href;
        if (loc && loc !== 'about:blank' && urlText) {
          urlText.textContent = loc;
        }
      } catch {
        // cross-origin — can't read URL
      }
    });
  }

  // Start with start page visible
  showStartPage();

  registerReset(W.BROWSER, resetBrowser);
}

function setToolbarEnabled(enabled: boolean) {
  const btns = [homeBtn, reloadBtn, externalBtn];
  for (const btn of btns) {
    if (!btn) continue;
    btn.disabled = !enabled;
  }
}

function showStartPage() {
  if (startPage) startPage.style.display = '';
  if (content) content.style.display = 'none';
  if (urlText) urlText.textContent = '';
  if (loadingBar) loadingBar.classList.remove('brw-loading--active');
  currentUrl = '';
  setToolbarEnabled(false);
}

function navigate(raw: string) {
  if (!iframe) return;
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  currentUrl = url;

  // Update URL display
  if (urlText) urlText.textContent = url;
  if (fallbackLink) fallbackLink.href = url;

  // Show content, hide start page
  if (startPage) startPage.style.display = 'none';
  if (content) content.style.display = '';
  if (fallback) fallback.style.display = 'none';
  iframe.style.display = '';
  setToolbarEnabled(true);

  // Show loading bar
  if (loadingBar) loadingBar.classList.add('brw-loading--active');

  // Set iframe src
  iframe.src = url;

  // 5s fallback timeout
  const timer = setTimeout(() => {
    if (loadingBar) loadingBar.classList.remove('brw-loading--active');
    iframe!.style.display = 'none';
    if (fallback) fallback.style.display = '';
  }, 5000);

  iframe.addEventListener('load', () => clearTimeout(timer), { once: true });
}

/** Reset browser to initial state (called on window close) */
export function resetBrowser() {
  if (iframe) iframe.src = 'about:blank';
  showStartPage();
}
