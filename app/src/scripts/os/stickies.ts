import { track } from './achievements';
import { notify, getNotifI18n } from './notifications';
import { confirm as osConfirm } from './dialog';
import { escapeHtml, getEl } from './utils';
import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

interface StickyNote {
  id: string;
  color: string;
  text: string;
  expanded: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'os-stickies';
const COLOR_COUNTER_KEY = 'os-stickies-color-counter';
const COLORS = [
  '#fef08a',
  '#bef264',
  '#93c5fd',
  '#f9a8d4',
  '#fdba74',
  '#c4b5fd',
];

let notes: StickyNote[] = [];
let i18n: Record<string, string> = {};

function getNextColor(): string {
  let counter = 0;
  try {
    counter = parseInt(localStorage.getItem(COLOR_COUNTER_KEY) || '0', 10);
    if (isNaN(counter)) counter = 0;
  } catch {
    /* ignore */
  }
  const color = COLORS[counter % COLORS.length];
  try {
    localStorage.setItem(COLOR_COUNTER_KEY, String(counter + 1));
  } catch {
    /* ignore */
  }
  return color;
}

function loadNotes(): StickyNote[] {
  try {
    const raw: StickyNote[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );
    return raw.map((n) => ({ ...n, expanded: n.expanded ?? false }));
  } catch {
    return [];
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* ignore */
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function createNoteElement(note: StickyNote): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sk-note';
  el.dataset.skId = note.id;
  el.style.setProperty('--sk-color', note.color);

  const colorDots = COLORS.map(
    (c) =>
      `<button class="sk-color-dot${c === note.color ? ' sk-color-dot--active' : ''}" data-color="${c}" style="background:${c}" title="${c}"></button>`
  ).join('');

  if (note.expanded) el.classList.add('sk-note--expanded');

  const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;
  const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>`;

  el.innerHTML = `
    <div class="sk-note-header">
      <div class="sk-color-picker">${colorDots}</div>
      <div class="sk-note-actions">
        <button class="sk-note-expand" title="${escapeHtml(note.expanded ? i18n.collapseNote || 'Collapse' : i18n.expandNote || 'Expand')}">${note.expanded ? collapseIcon : expandIcon}</button>
        <button class="sk-note-delete" title="${escapeHtml(i18n.deleteNote || 'Delete')}">×</button>
      </div>
    </div>
    <textarea class="sk-note-text" placeholder="${escapeHtml(i18n.placeholder || 'Type here...')}">${escapeHtml(note.text)}</textarea>
  `;

  // Delete button
  el.querySelector('.sk-note-delete')?.addEventListener('click', async () => {
    // Confirm before deleting notes with content
    if (note.text.trim()) {
      const confirmed = await osConfirm(
        i18n.confirmDelete || 'Delete this note?',
        i18n.deleteNote || 'Delete',
        i18n.cancel || 'Cancel'
      );
      if (!confirmed) return;
    }

    notes = notes.filter((n) => n.id !== note.id);
    saveNotes();
    const nt = getNotifI18n();
    notify(
      nt.stickiesTitle || 'Stickies',
      nt.stickyDeleted || 'Note deleted',
      undefined,
      'stickies-window'
    );
    el.classList.add('sk-note--removing');
    el.addEventListener(
      'animationend',
      () => {
        el.remove();
        updateEmptyState();
      },
      { once: true }
    );
  });

  // Color picker
  el.querySelectorAll('.sk-color-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const newColor = (dot as HTMLElement).dataset.color!;
      note.color = newColor;
      el.style.setProperty('--sk-color', newColor);
      // Update active state on dots
      el.querySelectorAll('.sk-color-dot').forEach((d) =>
        d.classList.remove('sk-color-dot--active')
      );
      dot.classList.add('sk-color-dot--active');
      saveNotes();
    });
  });

  // Expand/collapse toggle
  el.querySelector('.sk-note-expand')?.addEventListener('click', () => {
    note.expanded = !note.expanded;
    el.classList.toggle('sk-note--expanded', note.expanded);
    const btn = el.querySelector('.sk-note-expand')!;
    const expandSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;
    const collapseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>`;
    btn.innerHTML = note.expanded ? collapseSvg : expandSvg;
    btn.setAttribute(
      'title',
      note.expanded
        ? i18n.collapseNote || 'Collapse'
        : i18n.expandNote || 'Expand'
    );
    saveNotes();
  });

  // Text editing — save on input (debounced)
  const textarea = el.querySelector('.sk-note-text') as HTMLTextAreaElement;
  if (textarea) {
    let saveTimer: ReturnType<typeof setTimeout>;
    textarea.addEventListener('input', () => {
      const n = notes.find((n) => n.id === note.id);
      if (n) {
        n.text = textarea.value;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveNotes(), 500);
      }
    });
  }

  return el;
}

function addNote() {
  const note: StickyNote = {
    id: generateId(),
    color: getNextColor(),
    text: '',
    expanded: false,
    createdAt: Date.now(),
  };
  notes.push(note);
  saveNotes();
  track('sticky-created');

  const grid = getEl('sk-grid');
  if (grid) {
    grid.appendChild(createNoteElement(note));
    // Focus the new note's textarea
    const textarea = grid.lastElementChild?.querySelector(
      '.sk-note-text'
    ) as HTMLTextAreaElement | null;
    if (textarea) textarea.focus();
  }
  updateEmptyState();
}

function updateEmptyState() {
  const empty = getEl('sk-empty');
  if (empty) {
    empty.style.display = notes.length === 0 ? '' : 'none';
  }
}

function renderAll() {
  const grid = getEl('sk-grid');
  if (!grid) return;

  // Remove existing notes (keep empty state)
  grid.querySelectorAll('.sk-note').forEach((el) => el.remove());

  // Render notes
  notes.forEach((note) => {
    grid.appendChild(createNoteElement(note));
  });

  updateEmptyState();
}

export function initStickies() {
  // Load i18n
  const i18nEl = getEl('sk-i18n');
  if (i18nEl) {
    try {
      i18n = JSON.parse(i18nEl.textContent || '{}');
    } catch {
      /* ignore */
    }
  }

  // Load saved notes
  notes = loadNotes();
  renderAll();

  // Add button
  getEl('sk-add')?.addEventListener('click', addNote);

  registerReset(W.STICKIES, resetStickies);
}

export function resetStickies() {
  // Don't clear notes on window close — they persist!
  // Just re-render in case something changed
  renderAll();
}
