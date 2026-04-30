import { escapeHtml } from './utils';
import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

interface AppProject {
  name: string;
  shortDesc: string;
  category: string;
  description: string;
  tags: string[];
  image?: string;
  repo: string;
}

interface AsI18n {
  open: string;
  share: string;
  noAppsFound: string;
  navAll: string;
  navFinance: string;
  navHealth: string;
  navLifestyle: string;
  description: string;
}

/* ---- Gradient / shadow by category ---- */
const categoryStyles: Record<string, { gradient: string }> = {
  finance:   { gradient: 'os-gradient-blue' },
  health:    { gradient: 'os-gradient-green' },
  lifestyle: { gradient: 'os-gradient-purple' },
};

function getGradientClass(category: string): string {
  return categoryStyles[category]?.gradient ?? 'os-gradient-slate';
}

export function resetAppStore() {
  const categoryView = document.getElementById('as-category-view');
  const detailView   = document.getElementById('as-detail-view');
  const searchInput  = document.getElementById('as-search-input') as HTMLInputElement | null;
  const navItems     = document.querySelectorAll<HTMLElement>('[data-as-category].os-nav');
  const cards        = document.querySelectorAll<HTMLElement>('.as-card');
  const catTitle     = document.getElementById('as-category-title');
  const gridEmpty    = document.getElementById('as-grid-empty');

  // Clear search
  if (searchInput) searchInput.value = '';

  // Reset nav to first item (All)
  navItems.forEach((btn) => {
    btn.classList.toggle('os-nav--active', btn.dataset.asCategory === 'all');
  });

  // Show all cards
  cards.forEach((card) => { card.style.display = ''; });
  if (gridEmpty) gridEmpty.style.display = 'none';

  // Reset title
  const i18n: AsI18n = JSON.parse(
    document.getElementById('as-i18n')?.textContent || '{}'
  );
  if (catTitle) catTitle.textContent = i18n.navAll || 'All';

  // Hide detail, show category
  if (detailView) detailView.style.display = 'none';
  if (categoryView) categoryView.style.display = '';

  // Reset scroll positions
  categoryView?.scrollTo(0, 0);
  detailView?.scrollTo(0, 0);
}

export function initAppStore() {
  const categoryView = document.getElementById('as-category-view');
  const detailView   = document.getElementById('as-detail-view');
  const grid         = document.getElementById('as-grid');
  const gridEmpty    = document.getElementById('as-grid-empty');
  const catTitle     = document.getElementById('as-category-title');
  const searchInput  = document.getElementById('as-search-input') as HTMLInputElement | null;
  const backBtn      = document.getElementById('as-back-btn');
  const shareBtn     = document.getElementById('as-share-btn');
  const navItems     = document.querySelectorAll<HTMLElement>('[data-as-category].os-nav');
  const cards        = document.querySelectorAll<HTMLElement>('.as-card');

  // Detail elements
  const detailIcon       = document.getElementById('as-detail-icon');
  const detailName       = document.getElementById('as-detail-name');
  const detailDesc       = document.getElementById('as-detail-desc');
  const detailBtn        = document.getElementById('as-detail-btn');
  const detailFullDesc   = document.getElementById('as-detail-full-desc');
  const detailStats      = document.getElementById('as-detail-stats');
  const detailPreview    = document.getElementById('as-detail-preview');
  const detailScreenshots = document.getElementById('as-detail-screenshots');
  const detailTags       = document.getElementById('as-detail-tags');

  if (!categoryView || !detailView || !grid) return;

  const projects: AppProject[] = JSON.parse(
    document.getElementById('as-projects')?.textContent || '[]'
  );
  const i18n: AsI18n = JSON.parse(
    document.getElementById('as-i18n')?.textContent || '{}'
  );

  let activeNav = 'all';
  let currentProject: AppProject | null = null;

  /* ---- Nav labels for title ---- */
  const navTitles: Record<string, string> = {
    all:       i18n.navAll || 'All',
    finance:   i18n.navFinance || 'Finance',
    health:    i18n.navHealth || 'Health',
    lifestyle: i18n.navLifestyle || 'Lifestyle',
  };

  function setActiveNav(key: string) {
    activeNav = key;
    if (searchInput) searchInput.value = '';
    navItems.forEach((btn) => {
      btn.classList.toggle('os-nav--active', btn.dataset.asCategory === key);
    });
    if (catTitle) catTitle.textContent = navTitles[key] || key;
    filterCards();
  }

  function onSearch() {
    const query = searchInput?.value.trim() || '';
    if (query) {
      activeNav = '';
      navItems.forEach((btn) => btn.classList.remove('os-nav--active'));
      if (catTitle) catTitle.textContent = `"${query}"`;
    } else {
      setActiveNav('all');
      return;
    }
    filterCards();
  }

  function filterCards() {
    const query = searchInput?.value.toLowerCase().trim() || '';
    let visible = 0;

    cards.forEach((card) => {
      const cat  = card.dataset.asCategory || '';
      const name = (card.querySelector('.as-card-name')?.textContent || '').toLowerCase();

      const matchCat    = !activeNav || activeNav === 'all' || cat === activeNav;
      const matchSearch = !query || name.includes(query);
      const show = matchCat && matchSearch;

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (gridEmpty) gridEmpty.style.display = visible === 0 ? '' : 'none';
  }

  function showDetail(index: number) {
    const project = projects[index];
    if (!project || !detailIcon || !detailName || !detailDesc || !detailBtn) return;

    currentProject = project;

    // Icon
    const gradientClass = getGradientClass(project.category);
    detailIcon.className = `as-app-icon ${gradientClass}`;
    if (project.image) {
      const letter = escapeHtml(project.name[0]);
      detailIcon.innerHTML = `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.name)}" class="as-card-img" onerror="this.style.display='none';this.nextElementSibling.style.display=''" /><span class="as-card-letter" style="display:none;font-size:32px;">${letter}</span>`;
    } else {
      detailIcon.innerHTML = `<span class="as-card-letter" style="font-size:32px;">${escapeHtml(project.name[0])}</span>`;
    }

    // Info
    detailName.textContent = project.name;
    detailDesc.textContent = project.shortDesc;
    detailBtn.textContent = i18n.open || 'Open';
    detailBtn.className = 'as-get-btn';

    // Description
    if (detailFullDesc) {
      detailFullDesc.textContent = project.description;
    }

    // Stats — hide since projects don't have stats data
    if (detailStats) {
      detailStats.style.display = 'none';
    }

    // Screenshots — hide since projects don't have screenshots data
    if (detailPreview) {
      detailPreview.style.display = 'none';
    }
    if (detailScreenshots) {
      detailScreenshots.innerHTML = '';
    }

    // Tags
    if (detailTags && project.tags.length > 0) {
      detailTags.innerHTML = project.tags
        .map((tag) => `<span class="as-tag">${escapeHtml(tag)}</span>`)
        .join('');
      detailTags.style.display = '';
    } else if (detailTags) {
      detailTags.style.display = 'none';
    }

    if (!categoryView || !detailView) return;
    categoryView.style.display = 'none';
    detailView.style.display = '';
    detailView.scrollTop = 0;
  }

  function showCategory() {
    if (!detailView || !categoryView) return;
    detailView.style.display = 'none';
    categoryView.style.display = '';
    currentProject = null;
  }

  // Nav clicks
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveNav(btn.dataset.asCategory || 'all');
      showCategory();
    });
  });

  // Search
  searchInput?.addEventListener('input', () => {
    onSearch();
    showCategory();
  });

  // Card clicks → detail
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // If the open button was clicked, don't show detail
      if ((e.target as HTMLElement).closest('.as-card-open-btn')) return;
      const idx = parseInt(card.dataset.asIndex || '0', 10);
      showDetail(idx);
    });
  });

  // Card open button → open repo
  cards.forEach((card) => {
    const openBtn = card.querySelector('.as-card-open-btn');
    openBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(card.dataset.asIndex || '0', 10);
      const project = projects[idx];
      if (project?.repo) window.open(project.repo, '_blank');
    });
  });

  // Detail open button → open repo
  detailBtn?.addEventListener('click', () => {
    if (currentProject?.repo) window.open(currentProject.repo, '_blank');
  });

  // Share button → open repo
  shareBtn?.addEventListener('click', () => {
    if (currentProject?.repo) window.open(currentProject.repo, '_blank');
  });

  // Back to grid
  backBtn?.addEventListener('click', showCategory);

  // Initialize
  setActiveNav('all');

  registerReset(W.APP_STORE, resetAppStore);
}
