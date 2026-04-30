import { track } from './achievements';
import { escapeHtml, getEl } from './utils';
import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

interface SnippetData {
  title: string;
  language: string;
  description: string;
  code: string;
  output: string;
}

let snippets: SnippetData[] = [];
let currentIndex = 0;
let i18n: Record<string, string> = {};
let typewriterTimer: number | null = null;

// Simple syntax highlighter
function highlightCode(code: string): string {
  const lines = code.split('\n');
  return lines.map(line => highlightLine(line)).join('\n');
}

function highlightLine(line: string): string {
  // Comments
  if (line.trimStart().startsWith('//')) {
    return `<span class="pg-comment">${escapeHtml(line)}</span>`;
  }

  let result = '';
  let i = 0;
  const src = line;

  while (i < src.length) {
    // String literals
    if (src[i] === '"') {
      let end = i + 1;
      while (end < src.length && src[end] !== '"') {
        if (src[end] === '\\') end++; // skip escaped
        end++;
      }
      end++; // include closing quote
      result += `<span class="pg-string">${escapeHtml(src.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // Numbers
    if (/\d/.test(src[i]) && (i === 0 || /[\s(,=:<\[{+\-*/]/.test(src[i-1]))) {
      let end = i;
      while (end < src.length && /[\d.]/.test(src[end])) end++;
      result += `<span class="pg-number">${escapeHtml(src.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // Words (keywords, types, identifiers, @attributes)
    if (/[a-zA-Z_@]/.test(src[i])) {
      let end = i;
      if (src[i] === '@') end++; // consume the @ prefix
      while (end < src.length && /[a-zA-Z0-9_]/.test(src[end])) end++;
      const word = src.slice(i, end);

      if (SWIFT_KEYWORDS.has(word)) {
        result += `<span class="pg-keyword">${word}</span>`;
      } else if (SWIFT_TYPES.has(word) || /^[A-Z]/.test(word)) {
        result += `<span class="pg-type">${word}</span>`;
      } else if (word.startsWith('@')) {
        result += `<span class="pg-attr">${word}</span>`;
      } else {
        result += escapeHtml(word);
      }
      i = end;
      continue;
    }

    // Operators and punctuation
    result += escapeHtml(src[i]);
    i++;
  }

  return result;
}

const SWIFT_KEYWORDS = new Set([
  'func', 'var', 'let', 'class', 'struct', 'enum', 'protocol', 'extension',
  'import', 'return', 'if', 'else', 'guard', 'switch', 'case', 'for', 'in',
  'while', 'do', 'try', 'catch', 'throw', 'throws', 'async', 'await',
  'private', 'public', 'internal', 'fileprivate', 'open', 'static', 'final',
  'override', 'init', 'deinit', 'self', 'super', 'true', 'false', 'nil',
  'weak', 'unowned', 'lazy', 'where', 'as', 'is', 'typealias', 'associatedtype',
]);

const SWIFT_TYPES = new Set([
  'String', 'Int', 'Double', 'Float', 'Bool', 'Array', 'Dictionary', 'Set',
  'Optional', 'Result', 'Void', 'Any', 'AnyObject', 'Error',
  'UIViewController', 'UIView', 'URLSession', 'JSONDecoder', 'Data',
  'URLRequest', 'HTTPURLResponse', 'AnyCancellable', 'Published',
  'ObservableObject', 'XCTestCase',
]);

function showSnippet(index: number) {
  if (index < 0 || index >= snippets.length) return;

  // Stop any running typewriter
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }

  currentIndex = index;
  const snippet = snippets[index];

  // Update code
  const codeEl = getEl('pg-code-inner');
  if (codeEl) codeEl.innerHTML = highlightCode(snippet.code);

  // Update lang badge
  const langEl = getEl('pg-lang');
  if (langEl) langEl.textContent = snippet.language;

  // Update description
  const descEl = getEl('pg-desc');
  if (descEl) descEl.textContent = snippet.description;

  // Hide output
  const outputArea = getEl('pg-output-area');
  if (outputArea) outputArea.style.display = 'none';
  const outputEl = getEl('pg-output');
  if (outputEl) outputEl.textContent = '';

  // Update sidebar
  document.querySelectorAll<HTMLElement>('.pg-item').forEach((item, i) => {
    item.classList.toggle('pg-item--active', i === index);
  });

  // Scroll active into view
  const activeItem = document.querySelector('.pg-item--active');
  if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function runCode() {
  const snippet = snippets[currentIndex];
  if (!snippet) return;
  track('playground-run');

  const outputArea = getEl('pg-output-area');
  const outputEl = getEl('pg-output');
  if (!outputArea || !outputEl) return;

  outputArea.style.display = '';
  outputEl.textContent = '';

  // Typewriter effect for output
  const lines = snippet.output.split('\n');
  let lineIndex = 0;

  if (typewriterTimer) clearInterval(typewriterTimer);

  typewriterTimer = window.setInterval(() => {
    if (lineIndex >= lines.length) {
      clearInterval(typewriterTimer!);
      typewriterTimer = null;
      return;
    }
    outputEl.textContent += (lineIndex > 0 ? '\n' : '') + lines[lineIndex];
    lineIndex++;
    // Auto-scroll output
    outputEl.scrollTop = outputEl.scrollHeight;
  }, 80);
}

function copyCode() {
  const snippet = snippets[currentIndex];
  if (!snippet) return;

  navigator.clipboard.writeText(snippet.code).then(() => {
    const btn = getEl('pg-copy');
    if (!btn) return;
    btn.classList.add('pg-action-btn--copied');
    btn.setAttribute('title', i18n.copied || 'Copied!');
    setTimeout(() => {
      btn.classList.remove('pg-action-btn--copied');
      btn.setAttribute('title', i18n.copy || 'Copy');
    }, 2000);
  });
}

export function initPlayground() {
  const dataEl = getEl('pg-data');
  const i18nEl = getEl('pg-i18n');
  if (dataEl) try { snippets = JSON.parse(dataEl.textContent || '[]'); } catch {}
  if (i18nEl) try { i18n = JSON.parse(i18nEl.textContent || '{}'); } catch {}

  if (snippets.length > 0) showSnippet(0);

  // Sidebar clicks
  document.querySelectorAll<HTMLElement>('.pg-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.pgIndex || '0', 10);
      if (idx === currentIndex) return;
      showSnippet(idx);
    });
  });

  // Run button
  getEl('pg-run')?.addEventListener('click', runCode);

  // Copy button
  getEl('pg-copy')?.addEventListener('click', copyCode);

  registerReset(W.PLAYGROUND, resetPlayground);
}

export function resetPlayground() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
  currentIndex = 0;
  if (snippets.length > 0) showSnippet(0);
}
