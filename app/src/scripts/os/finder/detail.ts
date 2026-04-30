import { tagColor } from '../../../utils/tags';
import { uiIcons } from '../../../data/os-apps';
import { getLayoutMode } from '../responsive';
import { escapeHtml } from '../utils';
import { setDetailManuallyHidden } from './state';

/* ---- Mobile detail navigation ---- */

export function showMobileDetail(panel: HTMLElement, detail: HTMLElement) {
  const filelist = panel.querySelector<HTMLElement>('.finder-filelist');
  if (filelist) filelist.style.display = 'none';

  detail.style.display = '';
  detail.classList.add('finder-detail--mobile');
  // Trigger slide-in animation
  requestAnimationFrame(() =>
    detail.classList.add('finder-detail--mobile-visible')
  );
}

export function hideMobileDetail(panel: HTMLElement, onComplete?: () => void) {
  const detail = panel.querySelector<HTMLElement>('.finder-detail');
  const filelist = panel.querySelector<HTMLElement>('.finder-filelist');
  if (!detail) return;

  detail.classList.remove('finder-detail--mobile-visible');

  const onEnd = () => {
    detail.removeEventListener('transitionend', onEnd);
    detail.classList.remove('finder-detail--mobile');
    detail.style.display = 'none';
    detail.innerHTML = '';
    if (filelist) filelist.style.display = '';
    // Clear selection
    panel
      .querySelectorAll<HTMLElement>('.finder-row')
      .forEach((r) => r.classList.remove('finder-row--selected'));
    onComplete?.();
  };

  detail.addEventListener('transitionend', onEnd, { once: true });
}

/* ---- Detail panel rendering ---- */

export function renderDetail(section: string, row: HTMLElement) {
  const detail = document.querySelector<HTMLElement>(
    `[data-finder-detail="${section}"]`
  );
  if (!detail) return;

  const ds = document.getElementById('finder-window')?.dataset;
  const labelBack = ds?.finderBack ?? 'Back';
  const labelOpen = ds?.finderOpen ?? 'Open';
  const labelInfo = ds?.finderInfo ?? 'Information';
  const labelTags = ds?.finderDetailTags ?? 'Tags';

  const isMobile = getLayoutMode() === 'mobile';
  const name = escapeHtml(row.dataset.rowName || '');
  const desc = escapeHtml(row.dataset.rowDesc || '');
  const tags = (row.dataset.rowTags || '').split(',').filter(Boolean);

  const backBtnHtml = isMobile
    ? `<button class="fd-back" aria-label="${labelBack}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${uiIcons.chevronLeft}</svg>
        <span>${labelBack}</span>
      </button>`
    : '';

  const tagsHtml = tags
    .map((t) => {
      const c = tagColor(t.trim()).text;
      return `<div class="fd-tag"><div class="fd-tag-dot" style="background: ${c};"></div><span>${escapeHtml(t.trim())}</span></div>`;
    })
    .join('');

  if (section === 'projects') {
    const image = row.dataset.rowImage || '';
    const repo = row.dataset.rowRepo || '';

    const previewHtml = image
      ? `<div class="fd-preview"><img src="${escapeHtml(image)}" alt="${name}" /></div>`
      : '';

    const openHtml = repo
      ? `<a class="fd-open" href="${repo}" target="_blank" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            ${uiIcons.externalLink}
          </svg>
          <span>${labelOpen}</span>
        </a>`
      : '';

    detail.innerHTML = `
      ${backBtnHtml}
      ${previewHtml}
      <span class="fd-name">${name}</span>
      ${openHtml}
      <div class="fd-divider"></div>
      <div class="fd-info">
        <span class="fd-section-title">${labelInfo}</span>
        <p class="fd-desc">${desc}</p>
      </div>
      <div class="fd-divider"></div>
      <div class="fd-tags-section">
        <span class="fd-section-title">${labelTags}</span>
        <div class="fd-taglist">${tagsHtml}</div>
      </div>
    `;
  } else {
    const role = escapeHtml(row.dataset.rowRole || '');
    const startDate = escapeHtml(row.dataset.rowStartDate || '');
    const endDate = escapeHtml(row.dataset.rowEndDate || '');
    const location = escapeHtml(row.dataset.rowLocation || '');

    detail.innerHTML = `
      ${backBtnHtml}
      <span class="fd-name">${name}</span>
      <span class="fd-role">${role}</span>
      <span class="fd-period">${startDate} — ${endDate}</span>
      <span class="fd-location">${location}</span>
      <div class="fd-divider"></div>
      <div class="fd-info">
        <span class="fd-section-title">${labelInfo}</span>
        <p class="fd-desc">${desc}</p>
      </div>
      <div class="fd-divider"></div>
      <div class="fd-tags-section">
        <span class="fd-section-title">${labelTags}</span>
        <div class="fd-taglist">${tagsHtml}</div>
      </div>
    `;
  }

  // Bind back button
  if (isMobile) {
    const backBtn = detail.querySelector<HTMLElement>('.fd-back');
    const panel = detail.closest<HTMLElement>('[data-finder-panel]');
    if (backBtn && panel) {
      backBtn.addEventListener('click', () => hideMobileDetail(panel));
    }
  }
}

/* ---- Selection helpers ---- */

export function clearSelection(section: string) {
  const panel = document.querySelector<HTMLElement>(
    `[data-finder-panel="${section}"]`
  );
  if (!panel) return;

  panel.querySelectorAll<HTMLElement>('.finder-row').forEach((r) => {
    r.classList.remove('finder-row--selected');
  });

  const detail = panel.querySelector<HTMLElement>('.finder-detail');
  if (detail) {
    detail.classList.remove(
      'finder-detail--mobile',
      'finder-detail--mobile-visible'
    );
    detail.innerHTML = '';
    detail.style.display = 'none';
  }

  // Restore filelist if hidden by mobile detail
  const filelist = panel.querySelector<HTMLElement>('.finder-filelist');
  if (filelist) filelist.style.display = '';

  setDetailManuallyHidden(false);
}
