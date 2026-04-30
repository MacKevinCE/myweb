import { track } from '../achievements';
import { getLayoutMode } from '../responsive';
import {
  META,
  activeSection,
  sidebarVisible,
  detailManuallyHidden,
  setActiveSection,
  setSidebarVisible,
  setDetailManuallyHidden,
} from './state';
import { renderDetail, showMobileDetail, hideMobileDetail, clearSelection } from './detail';

/* ---- Favoritos tab switching ---- */

export function initFavTabs() {
  const favs = document.querySelectorAll<HTMLElement>('[data-finder-fav]');
  const panels = document.querySelectorAll<HTMLElement>('[data-finder-panel]');
  const tagGroups = document.querySelectorAll<HTMLElement>('[data-finder-tags]');

  favs.forEach((fav) => {
    fav.addEventListener('click', () => {
      if (fav.classList.contains('finder-sidebar-item--active')) return;
      const key = fav.dataset.finderFav!;
      setActiveSection(key);

      favs.forEach((f) => f.classList.remove('finder-sidebar-item--active'));
      fav.classList.add('finder-sidebar-item--active');

      panels.forEach((p) => {
        p.style.display = p.dataset.finderPanel === key ? 'flex' : 'none';
      });

      tagGroups.forEach((g) => {
        const isActive = g.dataset.finderTags === key;
        g.style.display = isActive ? '' : 'none';
        if (isActive) {
          const tagItems = g.querySelectorAll<HTMLElement>('[data-finder-tag]');
          tagItems.forEach((t) => t.classList.remove('finder-sidebar-item--active'));
          const allTag = g.querySelector<HTMLElement>('[data-finder-tag="All"]');
          if (allTag) allTag.classList.add('finder-sidebar-item--active');
        }
      });

      showAllRows(key);
      clearSelection(key);

      const titleEl = document.querySelector<HTMLElement>('#finder-titlebar .os-window-title');
      const pathEl = document.getElementById('finder-path-text');
      if (titleEl) titleEl.textContent = META[key].title;
      if (pathEl) pathEl.textContent = META[key].path;
      updateFooter(key);
      updateToolbarButtons();
    });
  });
}

/* ---- Tag filter ---- */

export function initTagFilters() {
  const tagGroups = document.querySelectorAll<HTMLElement>('[data-finder-tags]');

  tagGroups.forEach((group) => {
    const section = group.dataset.finderTags!;
    const tagItems = group.querySelectorAll<HTMLElement>('[data-finder-tag]');

    tagItems.forEach((item) => {
      item.addEventListener('click', () => {
        if (item.classList.contains('finder-sidebar-item--active')) return;
        const tag = item.dataset.finderTag!;

        tagItems.forEach((t) => t.classList.remove('finder-sidebar-item--active'));
        item.classList.add('finder-sidebar-item--active');

        filterRows(section, tag);
        clearSelection(section);
        updateFooter(section);
        updateToolbarButtons();
      });
    });
  });
}

function filterRows(section: string, tag: string) {
  const panel = document.querySelector<HTMLElement>(`[data-finder-panel="${section}"]`);
  if (!panel) return;

  const rows = panel.querySelectorAll<HTMLElement>('.finder-row');
  rows.forEach((row) => {
    if (tag === 'All') {
      row.classList.remove('finder-row--hidden');
    } else {
      const rowTags = (row.dataset.rowTags || '').split(',');
      const match = rowTags.some((t) => t.trim().toLowerCase().includes(tag.toLowerCase()));
      row.classList.toggle('finder-row--hidden', !match);
    }
  });
}

export function showAllRows(section: string) {
  const panel = document.querySelector<HTMLElement>(`[data-finder-panel="${section}"]`);
  if (!panel) return;
  panel.querySelectorAll<HTMLElement>('.finder-row').forEach((r) => {
    r.classList.remove('finder-row--hidden');
  });
}

/* ---- Row selection ---- */

export function initRowSelection() {
  const panels = document.querySelectorAll<HTMLElement>('[data-finder-panel]');

  panels.forEach((panel) => {
    const section = panel.dataset.finderPanel!;
    const rows = panel.querySelectorAll<HTMLElement>('.finder-row');

    rows.forEach((row) => {
      row.addEventListener('click', () => selectRow(panel, section, row));

      row.addEventListener('dblclick', () => {
        const repo = row.dataset.rowRepo;
        if (repo) window.open(repo, '_blank', 'noopener,noreferrer');
      });
    });
  });

  // Keyboard navigation: ArrowUp/ArrowDown to move selection
  const finderWin = document.getElementById('finder-window');
  if (finderWin) {
    finderWin.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();

      const panel = document.querySelector<HTMLElement>(`[data-finder-panel="${activeSection}"]`);
      if (!panel) return;

      // Get visible rows only (not hidden by tag filter)
      const visibleRows = Array.from(
        panel.querySelectorAll<HTMLElement>('.finder-row')
      ).filter((r) => r.style.display !== 'none');

      if (visibleRows.length === 0) return;

      const currentIdx = visibleRows.findIndex((r) => r.classList.contains('finder-row--selected'));
      let nextIdx: number;

      if (e.key === 'ArrowDown') {
        nextIdx = currentIdx < visibleRows.length - 1 ? currentIdx + 1 : 0;
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : visibleRows.length - 1;
      }

      selectRow(panel, activeSection, visibleRows[nextIdx]);
      visibleRows[nextIdx].scrollIntoView({ block: 'nearest' });
    });
  }
}

function selectRow(panel: HTMLElement, section: string, row: HTMLElement) {
  const rows = panel.querySelectorAll<HTMLElement>('.finder-row');
  rows.forEach((r) => r.classList.remove('finder-row--selected'));
  row.classList.add('finder-row--selected');
  track('finder-opened', { id: row.dataset.rowName || row.dataset.rowRole || '' });

  const detail = panel.querySelector<HTMLElement>('.finder-detail');
  if (!detail) return;

  renderDetail(section, row);

  if (getLayoutMode() === 'mobile') {
    showMobileDetail(panel, detail);
  } else if (!detailManuallyHidden) {
    detail.style.display = '';
  }

  updateFooter(section);
  updateToolbarButtons();
}

/* ---- Footer ---- */

export function updateFooter(section: string) {
  const panel = document.querySelector<HTMLElement>(`[data-finder-panel="${section}"]`);
  const footerEl = document.getElementById('finder-footer-text');
  if (!panel || !footerEl) return;

  const ds = document.getElementById('finder-window')?.dataset;
  const visible = panel.querySelectorAll('.finder-row:not(.finder-row--hidden)').length;
  const selected = panel.querySelectorAll('.finder-row--selected').length;

  if (selected > 0) {
    const tpl = ds?.finderFooterSelected ?? '{selected} of {visible} selected, 128.5 GB available';
    footerEl.textContent = tpl.replace('{selected}', String(selected)).replace('{visible}', String(visible));
  } else {
    const tpl = ds?.finderFooterItems ?? '{count} items, 128.5 GB available';
    footerEl.textContent = tpl.replace('{count}', String(visible));
  }
}

/* ---- Toolbar buttons ---- */

export function initToolbarButtons() {
  const sidebarBtn = document.getElementById('finder-toggle-sidebar') as HTMLButtonElement | null;
  const openBtn = document.getElementById('finder-open-item') as HTMLButtonElement | null;
  const detailBtn = document.getElementById('finder-toggle-detail') as HTMLButtonElement | null;
  const sidebar = document.querySelector<HTMLElement>('.finder-sidebar');

  // Toggle sidebar
  sidebarBtn?.addEventListener('click', () => {
    setSidebarVisible(!sidebarVisible);
    if (sidebar) {
      sidebar.classList.toggle('finder-sidebar--hidden', !sidebarVisible);
    }
  });

  // Open selected item's repo
  openBtn?.addEventListener('click', () => {
    const selected = getSelectedRow();
    if (!selected) return;
    const repo = selected.dataset.rowRepo;
    if (repo) window.open(repo, '_blank', 'noopener,noreferrer');
  });

  // Toggle detail panel
  detailBtn?.addEventListener('click', () => {
    const panel = document.querySelector<HTMLElement>(`[data-finder-panel="${activeSection}"]`);
    if (!panel) return;
    const detail = panel.querySelector<HTMLElement>('.finder-detail');
    if (!detail) return;

    if (detail.style.display === 'none') {
      detail.style.display = '';
      setDetailManuallyHidden(false);
    } else {
      detail.style.display = 'none';
      setDetailManuallyHidden(true);
    }
  });
}

export function getSelectedRow(): HTMLElement | null {
  const panel = document.querySelector<HTMLElement>(`[data-finder-panel="${activeSection}"]`);
  if (!panel) return null;
  return panel.querySelector<HTMLElement>('.finder-row--selected');
}

export function updateToolbarButtons() {
  const openBtn = document.getElementById('finder-open-item') as HTMLButtonElement | null;
  const detailBtn = document.getElementById('finder-toggle-detail') as HTMLButtonElement | null;

  const selected = getSelectedRow();
  const hasSelection = !!selected;
  const hasRepo = !!(selected?.dataset.rowRepo);

  // Open button: enabled only if selected item has a repo
  if (openBtn) {
    openBtn.disabled = !hasRepo;
    openBtn.classList.toggle('finder-toolbar-btn--disabled', !hasRepo);
  }

  // Detail toggle: enabled only if there's a selection
  if (detailBtn) {
    detailBtn.disabled = !hasSelection;
    detailBtn.classList.toggle('finder-toolbar-btn--disabled', !hasSelection);
  }
}

/**
 * Switch Finder to a specific section programmatically.
 */
export function switchFinderTab(tab: 'projects' | 'experience') {
  const fav = document.querySelector<HTMLElement>(`[data-finder-fav="${tab}"]`);
  if (fav) fav.click();
}
