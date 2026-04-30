import { track } from './achievements';
import { getEl } from './utils';
import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

interface CertData {
  name: string;
  image: string;
  issuer: string;
  verifyUrl: string;
  year: string;
}

let certs: CertData[] = [];
let currentIndex = 0;
let i18n: Record<string, string> = {};

function updateView() {
  if (!certs.length) return;
  const cert = certs[currentIndex];

  // Update image — recreate to reset onerror/fallback state
  const wrap = getEl('pv-image-wrap');
  if (wrap) {
    wrap.innerHTML = '';
    const img = document.createElement('img');
    img.src = cert.image;
    img.alt = cert.name;
    img.className = 'pv-image';
    const fallback = document.createElement('span');
    fallback.className = 'pv-image-fallback';
    fallback.textContent = cert.name[0] || '?';
    fallback.style.display = 'none';
    img.onerror = () => { img.style.display = 'none'; fallback.style.display = ''; };
    wrap.appendChild(img);
    wrap.appendChild(fallback);
  }

  // Update counter
  const counter = getEl('pv-counter');
  if (counter) counter.textContent = `${currentIndex + 1} ${i18n.of || 'of'} ${certs.length}`;

  // Update issuer
  const issuer = getEl('pv-issuer');
  if (issuer) issuer.textContent = `${i18n.issuer || 'Issued by'} ${cert.issuer}`;

  // Update verify button
  const verify = getEl('pv-verify') as HTMLAnchorElement | null;
  if (verify) {
    if (cert.verifyUrl) {
      verify.href = cert.verifyUrl;
      verify.style.display = '';
    } else {
      verify.style.display = 'none';
    }
  }

  // Update sidebar active state
  document.querySelectorAll<HTMLElement>('.pv-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('pv-thumb--active', i === currentIndex);
  });

  // Scroll active thumb into view
  const activeThumb = document.querySelector('.pv-thumb--active');
  if (activeThumb) activeThumb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function goPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    updateView();
    track('certs-viewed', { id: `cert-${currentIndex}` });
  }
}

function goNext() {
  if (currentIndex < certs.length - 1) {
    currentIndex++;
    updateView();
    track('certs-viewed', { id: `cert-${currentIndex}` });
  }
}

export function initPreview() {
  // Load data
  const dataEl = getEl('pv-data');
  const i18nEl = getEl('pv-i18n');
  if (dataEl) {
    try { certs = JSON.parse(dataEl.textContent || '[]'); } catch { /* ignore */ }
  }
  if (i18nEl) {
    try { i18n = JSON.parse(i18nEl.textContent || '{}'); } catch { /* ignore */ }
  }

  // Track first certificate as viewed
  if (certs.length > 0) track('certs-viewed', { id: 'cert-0' });

  // Navigation buttons
  getEl('pv-prev')?.addEventListener('click', goPrev);
  getEl('pv-next')?.addEventListener('click', goNext);

  // Sidebar thumbnails
  document.querySelectorAll<HTMLElement>('.pv-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.pvIndex || '0', 10);
      if (idx === currentIndex) return;
      currentIndex = idx;
      updateView();
      track('certs-viewed', { id: `cert-${currentIndex}` });
    });
  });

  // Keyboard navigation (when preview window is visible)
  document.addEventListener('keydown', (e) => {
    const win = getEl('preview-window');
    if (!win || win.style.display === 'none') return;
    // Only handle if no input is focused
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  });

  registerReset(W.PREVIEW, resetPreview);
}

export function resetPreview() {
  currentIndex = 0;
  updateView();
}
