/**
 * Terminal Engine — Shell I/O, event loop, init/reset.
 */

import { notify, getNotifI18n } from '../notifications';
import { track } from '../achievements';
import { escapeHtml } from '../utils';
import { registerReset } from '../window/lifecycle';
import { W } from '../../../data/os-apps';

import { state, tr, getLocale } from './state';
import { buildFS } from './filesystem';
import { execute, setUpdatePrompt } from './commands';
import { getCompletions } from './completion';

// ---------------------------------------------------------------------------
// Output Rendering
// ---------------------------------------------------------------------------

function appendOutput(html: string) {
  if (!html) return;
  const block = document.createElement('div');
  block.className = 'term-block';
  block.innerHTML = html;
  state.outputEl.appendChild(block);
}

function appendCommandLine(input: string) {
  const line = document.createElement('div');
  line.className = 'term-history-line';
  line.innerHTML = `<span class="term-prompt">${state.promptEl.textContent}</span><span>${escapeHtml(input)}</span>`;
  state.outputEl.appendChild(line);
}

function scrollToBottom() {
  state.outputEl.scrollTop = state.outputEl.scrollHeight;
}

export function updatePrompt() {
  const display = state.cwd === '~' ? '~' : state.cwd.replace(/^~\//, '');
  const user = tr('userName') || 'kevin';
  const host = tr('hostName') || 'portfolio';
  state.promptEl.textContent = `${user}@${host}:${display}$`;
}

// ---------------------------------------------------------------------------
// Welcome Message
// ---------------------------------------------------------------------------

function showWelcome() {
  const now = new Date();
  const dateStr = now.toLocaleString(getLocale(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const lastLoginText = tr('lastLogin', { date: dateStr });
  const welcomeText = tr('welcome');
  // Split welcome into lines for styling: first line gets bold green for "MacKevinOS 1.0"
  const welcomeLines = welcomeText.split('\n').map((line) => {
    return line.replace(/MacKevinOS \d+\.\d+/g, '<span class="term-green term-bold">$&</span>')
               .replace(/'help'/g, '\'<span class="term-green">help</span>\'');
  });
  appendOutput(
    `<span class="term-muted">${escapeHtml(lastLoginText)}</span>\n` +
    welcomeLines.join('\n') + '\n'
  );
}

// ---------------------------------------------------------------------------
// Command Execution (shell-level)
// ---------------------------------------------------------------------------

function executeCommand(input: string) {
  if (input.trim()) {
    state.history.push(input.trim());
  }
  state.historyIndex = -1;
  appendCommandLine(input);

  if (input.trim().toLowerCase() === 'clear') {
    state.outputEl.innerHTML = '';
  } else {
    const output = execute(input);
    appendOutput(output);
  }
  track('terminal-command');
  scrollToBottom();
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

function handleKeyDown(e: KeyboardEvent) {
  // Ctrl+C — cancel input
  if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    appendCommandLine(state.inputEl.value + '^C');
    state.inputEl.value = '';
    state.historyIndex = -1;
    scrollToBottom();
    return;
  }

  // Ctrl+L — clear
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault();
    state.outputEl.innerHTML = '';
    return;
  }

  // Enter — execute
  if (e.key === 'Enter') {
    e.preventDefault();
    const input = state.inputEl.value;
    state.inputEl.value = '';
    executeCommand(input);
    return;
  }

  // Up arrow — previous history
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (state.history.length === 0) return;
    if (state.historyIndex === -1) {
      state.historyIndex = state.history.length - 1;
    } else if (state.historyIndex > 0) {
      state.historyIndex--;
    }
    state.inputEl.value = state.history[state.historyIndex];
    // Move cursor to end
    setTimeout(() => state.inputEl.setSelectionRange(state.inputEl.value.length, state.inputEl.value.length), 0);
    return;
  }

  // Down arrow — next history
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (state.historyIndex === -1) return;
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.inputEl.value = state.history[state.historyIndex];
    } else {
      state.historyIndex = -1;
      state.inputEl.value = '';
    }
    return;
  }

  // Tab — auto-complete
  if (e.key === 'Tab') {
    e.preventDefault();
    const val = state.inputEl.value;
    const completions = getCompletions(val);

    if (completions.length === 1) {
      const tokens = val.split(/\s+/);
      if (tokens.length <= 1) {
        state.inputEl.value = completions[0] + ' ';
      } else {
        tokens[tokens.length - 1] = completions[0];
        state.inputEl.value = tokens.join(' ');
      }
    } else if (completions.length > 1) {
      appendCommandLine(val);
      appendOutput(completions.map((c) => escapeHtml(c)).join('  '));
      scrollToBottom();
    }
    return;
  }
}

function handleBodyClick(e: Event) {
  // Don't steal focus from links
  if ((e.target as HTMLElement).tagName === 'A') return;
  state.inputEl.focus();
}

function handleChipClick(e: Event) {
  const chip = (e.target as HTMLElement).closest('.term-chip') as HTMLElement | null;
  if (!chip) return;
  const cmd = chip.dataset.cmd;
  if (!cmd) return;

  executeCommand(cmd);
  state.inputEl.focus();
}

// ---------------------------------------------------------------------------
// Visibility Observer — auto-focus when terminal window is shown
// ---------------------------------------------------------------------------

let visibilityObserver: MutationObserver | null = null;

function observeVisibility() {
  const windowEl = document.getElementById('terminal-window');
  if (!windowEl) return;

  // Disconnect any previous observer before creating a new one
  visibilityObserver?.disconnect();

  // Auto-focus input when terminal becomes visible (opened/restored)
  visibilityObserver = new MutationObserver(() => {
    if (windowEl.style.display !== 'none') {
      if (document.activeElement !== state.inputEl) {
        state.inputEl.focus();
      }
    }
  });
  visibilityObserver.observe(windowEl, { attributes: true, attributeFilter: ['style'] });

  // Auto-focus input when terminal window receives focus (e.g. brought to front)
  windowEl.addEventListener('focus', () => {
    if (windowEl.style.display !== 'none') {
      state.inputEl.focus();
    }
  }, true); // capture phase to catch focus on the window itself
}

// ---------------------------------------------------------------------------
// Init & Reset
// ---------------------------------------------------------------------------

export function initTerminal() {
  const dataEl = document.getElementById('term-data');
  if (!dataEl) return;

  try {
    state.profileData = JSON.parse(dataEl.textContent || '{}');
  } catch {
    return;
  }

  const i18nEl = document.getElementById('term-i18n');
  if (i18nEl) {
    try { state.t = JSON.parse(i18nEl.textContent || '{}'); } catch { /* use defaults */ }
  }

  const _output = document.getElementById('term-output');
  const _input = document.getElementById('term-input') as HTMLInputElement | null;
  const _prompt = document.getElementById('term-prompt');
  const _body = document.getElementById('term-body');
  const _suggestions = document.getElementById('term-suggestions');

  if (!_output || !_input || !_prompt || !_body || !_suggestions) return;

  state.outputEl = _output;
  state.inputEl = _input;
  state.promptEl = _prompt;
  state.bodyEl = _body;
  state.suggestionsEl = _suggestions;

  // Wire up the updatePrompt callback for commands
  setUpdatePrompt(updatePrompt);

  // Build filesystem
  state.fs = buildFS(state.profileData);

  // Reset state
  state.cwd = '~';
  state.history = [];
  state.historyIndex = -1;
  updatePrompt();

  // Welcome message
  showWelcome();

  // Event listeners
  state.inputEl.addEventListener('keydown', handleKeyDown);
  state.bodyEl.addEventListener('click', handleBodyClick);

  // Mobile chip handlers
  if (state.suggestionsEl) {
    state.suggestionsEl.addEventListener('click', handleChipClick);
  }

  // Auto-focus on window visibility
  observeVisibility();

  // One-time terminal hint notification
  let terminalNotified = false;
  const termWin = document.getElementById('terminal-window');
  if (termWin) {
    const termObserver = new MutationObserver(() => {
      if (!terminalNotified && termWin.style.display !== 'none' && termWin.style.visibility !== 'hidden') {
        terminalNotified = true;
        termObserver.disconnect();
        setTimeout(() => {
          const nt = getNotifI18n();
          if (nt.terminalTitle) notify(nt.terminalTitle, nt.terminalBody || '', undefined, 'terminal-window');
        }, 500);
      }
    });
    termObserver.observe(termWin, { attributes: true, attributeFilter: ['style'] });
  }

  registerReset(W.TERMINAL, resetTerminal);
}

export function resetTerminal() {
  if (!state.outputEl) return;
  state.outputEl.innerHTML = '';
  state.cwd = '~';
  state.history = [];
  state.historyIndex = -1;
  updatePrompt();
  showWelcome();
  state.inputEl?.focus();
  // Reconnect visibility observer for next open
  observeVisibility();
}
