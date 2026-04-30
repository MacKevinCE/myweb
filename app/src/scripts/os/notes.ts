import { track } from './achievements';
import { escapeHtml, getEl } from './utils';
import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

interface ArticleData {
  title: string;
  date: string;
  tags: string[];
  summary: string;
  content: string;
}

let articles: ArticleData[] = [];
let currentIndex = 0;
let i18n: Record<string, string> = {};
let notesReady = false;

function readTime(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(i18n.lang || 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Simple markdown-like renderer.
 * Supports: ## headings, **bold**, `code`, \n\n paragraphs, - bullet lists
 */
function renderContent(text: string): string {
  const blocks = text.split('\n\n');
  return blocks
    .map((block) => {
      block = block.trim();
      if (!block) return '';

      // Heading
      if (block.startsWith('## ')) {
        return `<h2 class="nt-h2">${escapeHtml(block.slice(3))}</h2>`;
      }

      // Bullet list
      if (
        block.split('\n').every((line) => line.trimStart().startsWith('- '))
      ) {
        const items = block
          .split('\n')
          .map((line) => {
            const text = line.trimStart().slice(2);
            return `<li>${formatInline(text)}</li>`;
          })
          .join('');
        return `<ul class="nt-list-ul">${items}</ul>`;
      }

      // Numbered list
      if (
        block.split('\n').every((line) => /^\d+\.\s/.test(line.trimStart()))
      ) {
        const items = block
          .split('\n')
          .map((line) => {
            const text = line.trimStart().replace(/^\d+\.\s/, '');
            return `<li>${formatInline(text)}</li>`;
          })
          .join('');
        return `<ol class="nt-list-ol">${items}</ol>`;
      }

      // Paragraph
      return `<p class="nt-p">${formatInline(block)}</p>`;
    })
    .join('');
}

function formatInline(text: string): string {
  // Escape HTML first to prevent XSS
  text = escapeHtml(text);
  // Bold **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Code `text`
  text = text.replace(/`(.+?)`/g, '<code class="nt-code">$1</code>');
  // Line breaks within block
  text = text.replace(/\n/g, '<br>');
  return text;
}

function showArticle(index: number) {
  if (index < 0 || index >= articles.length) return;
  currentIndex = index;
  const article = articles[index];

  const titleEl = getEl('nt-article-title');
  const metaEl = getEl('nt-article-meta');
  const tagsEl = getEl('nt-article-tags');
  const bodyEl = getEl('nt-article-body');

  if (titleEl) titleEl.textContent = article.title;
  if (metaEl) {
    const rt = (i18n.readTime || '{min} min').replace(
      '{min}',
      String(readTime(article.content))
    );
    metaEl.innerHTML = `<span>${formatDate(article.date)}</span><span>&middot;</span><span>${rt}</span>`;
  }
  if (tagsEl) {
    tagsEl.innerHTML = article.tags
      .map((tag) => `<span class="nt-tag">${escapeHtml(tag)}</span>`)
      .join('');
  }
  if (bodyEl) {
    bodyEl.innerHTML = renderContent(article.content);
  }

  // Update sidebar active state
  document.querySelectorAll<HTMLElement>('.nt-item').forEach((item, i) => {
    item.classList.toggle('nt-item--active', i === index);
  });

  if (notesReady) track('article-read', { id: article.title });

  // Scroll content to top
  const content = getEl('nt-content');
  if (content) content.scrollTop = 0;

  // Scroll active item into view
  const activeItem = document.querySelector('.nt-item--active');
  if (activeItem)
    activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function filterArticles(query: string) {
  const q = query.toLowerCase();
  const items = document.querySelectorAll<HTMLElement>('.nt-item');
  let firstVisible = -1;

  items.forEach((item, i) => {
    const article = articles[i];
    const match =
      !q ||
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q) ||
      article.tags.some((tag) => tag.toLowerCase().includes(q));

    item.style.display = match ? '' : 'none';
    if (match && firstVisible === -1) firstVisible = i;
  });

  // Show first matching article
  if (firstVisible !== -1 && firstVisible !== currentIndex) {
    showArticle(firstVisible);
  }
}

export function initNotes() {
  const dataEl = getEl('nt-data');
  const i18nEl = getEl('nt-i18n');
  if (dataEl) {
    try {
      articles = JSON.parse(dataEl.textContent || '[]');
    } catch {
      /* ignore */
    }
  }
  if (i18nEl) {
    try {
      i18n = JSON.parse(i18nEl.textContent || '{}');
    } catch {
      /* ignore */
    }
  }

  // Show first article
  if (articles.length > 0) {
    showArticle(0);
  }

  notesReady = true;

  // Sidebar item clicks
  document.querySelectorAll<HTMLElement>('.nt-item').forEach((item) => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.ntIndex || '0', 10);
      if (idx === currentIndex) return;
      showArticle(idx);
    });
  });

  // Search
  const searchInput = getEl('nt-search') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterArticles(searchInput.value);
    });
  }

  registerReset(W.NOTES, resetNotes);
}

export function resetNotes() {
  currentIndex = 0;
  if (articles.length > 0) showArticle(0);

  const searchInput = getEl('nt-search') as HTMLInputElement | null;
  if (searchInput) searchInput.value = '';

  // Show all items
  document.querySelectorAll<HTMLElement>('.nt-item').forEach((item) => {
    item.style.display = '';
  });

  // Reset scroll
  const content = getEl('nt-content');
  if (content) content.scrollTop = 0;
  const list = document.querySelector<HTMLElement>('.nt-list');
  if (list) list.scrollTop = 0;
}
