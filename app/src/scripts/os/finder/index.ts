import { W } from '../../../data/os-apps';
import { registerReset } from '../window/lifecycle';
import {
  META,
  setActiveSection,
  setSidebarVisible,
  setDetailManuallyHidden,
} from './state';
import {
  applyDefaultWidths,
  userResized,
  initColumnSizing,
  initColumnResize,
} from './columns';
import { sortState, sortRows, initColumnSort } from './sort';
import { clearSelection } from './detail';
import {
  initFavTabs,
  initTagFilters,
  initRowSelection,
  initToolbarButtons,
  showAllRows,
  updateFooter,
  updateToolbarButtons,
  switchFinderTab,
} from './navigation';

export { switchFinderTab };

export function initFinderTabs() {
  initFavTabs();
  initTagFilters();
  initRowSelection();
  initToolbarButtons();
  initColumnSizing();
  initColumnResize();
  initColumnSort();

  // Initial state: no selection, detail hidden
  clearSelection('projects');
  clearSelection('experience');
  updateFooter('projects');
  updateToolbarButtons();

  registerReset(W.FINDER, resetFinder);
}

/**
 * Full reset -- back to initial state as if opened for the first time.
 */
export function resetFinder() {
  setActiveSection('projects');
  setSidebarVisible(true);
  setDetailManuallyHidden(false);

  // Restore sidebar visibility
  const sidebar = document.querySelector<HTMLElement>('.finder-sidebar');
  if (sidebar) sidebar.classList.remove('finder-sidebar--hidden');

  // Reset favs to Projects
  const favs = document.querySelectorAll<HTMLElement>('[data-finder-fav]');
  favs.forEach((f) => f.classList.remove('finder-sidebar-item--active'));
  const projFav = document.querySelector<HTMLElement>('[data-finder-fav="projects"]');
  if (projFav) projFav.classList.add('finder-sidebar-item--active');

  // Show projects panel, hide experience
  document.querySelectorAll<HTMLElement>('[data-finder-panel]').forEach((p) => {
    p.style.display = p.dataset.finderPanel === 'projects' ? 'flex' : 'none';
  });

  // Reset tag groups
  document.querySelectorAll<HTMLElement>('[data-finder-tags]').forEach((g) => {
    const isProj = g.dataset.finderTags === 'projects';
    g.style.display = isProj ? '' : 'none';
    const tagItems = g.querySelectorAll<HTMLElement>('[data-finder-tag]');
    tagItems.forEach((t) => t.classList.remove('finder-sidebar-item--active'));
    const allTag = g.querySelector<HTMLElement>('[data-finder-tag="All"]');
    if (allTag) allTag.classList.add('finder-sidebar-item--active');
  });

  // Reset column widths and sort state
  document.querySelectorAll<HTMLElement>('.finder-filelist').forEach((filelist) => {
    // Recalculate column widths from content
    userResized.delete(filelist);
    applyDefaultWidths(filelist);

    // Reset sort to ascending by name
    sortState.set(filelist, { col: 'name', asc: true });
    filelist.querySelectorAll<HTMLElement>('.finder-col-name svg, .finder-col-date svg, .finder-col-second svg').forEach((svg) => {
      (svg as HTMLElement).style.transition = '';
      (svg as HTMLElement).style.transform = '';
    });
    sortRows(filelist, 'name', true);
  });

  // Show all rows, clear selection in both panels
  ['projects', 'experience'].forEach((s) => {
    showAllRows(s);
    clearSelection(s);
    updateFooter(s);
  });

  // Reset title & path
  const titleEl = document.querySelector<HTMLElement>('#finder-titlebar .os-window-title');
  const pathEl = document.getElementById('finder-path-text');
  if (titleEl) titleEl.textContent = META.projects.title;
  if (pathEl) pathEl.textContent = META.projects.path;
  updateToolbarButtons();
}
