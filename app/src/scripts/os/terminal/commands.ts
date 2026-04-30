/**
 * Terminal Engine — All command implementations and easter eggs.
 */

import { escapeHtml } from '../utils';
import { state, tr, slugify, getLocale } from './state';
import { getNode, resolvePath } from './filesystem';
import { APP_VERSION, BUILD_DATE } from '../../../data/version';
import { settings, saveSettings } from '../settings/persist';
import { applyAppearance } from '../settings/appearance';
import { applyAccentColor } from '../settings/accent';
import {
  applyFontSize,
  applyReduceMotion,
  applyHighContrast,
} from '../settings/accessibility';
import { track } from '../achievements';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function highlightJson(jsonStr: string): string {
  return escapeHtml(jsonStr)
    .replace(/"([^"]+)"(\s*:)/g, '<span class="term-cyan">"$1"</span>$2')
    .replace(/:\s*"([^"]*)"/g, ': <span class="term-yellow">"$1"</span>')
    .replace(/:\s*(\d+)/g, ': <span class="term-green">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="term-red">$1</span>');
}

function skillColor(level: number): string {
  if (level >= 85) return 'term-green';
  if (level >= 70) return 'term-cyan';
  if (level >= 50) return 'term-yellow';
  return 'term-red';
}

// ---------------------------------------------------------------------------
// Command Parser
// ---------------------------------------------------------------------------

export function parse(input: string): {
  cmd: string;
  args: string[];
  flags: Record<string, string | boolean>;
} {
  const tokens = input.trim().split(/\s+/);
  const cmd = tokens[0]?.toLowerCase() ?? '';
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('--')) {
      const eqIdx = t.indexOf('=');
      if (eqIdx > -1) {
        flags[t.slice(2, eqIdx)] = t.slice(eqIdx + 1);
      } else {
        flags[t.slice(2)] = true;
      }
    } else if (t.startsWith('-') && t.length > 1 && !t.startsWith('-/')) {
      // short flags like -a, -rf
      for (const ch of t.slice(1)) {
        flags[ch] = true;
      }
    } else {
      args.push(t);
    }
  }

  return { cmd, args, flags };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

// Forward-declared — set by core.ts at init time
let _updatePrompt: () => void = () => {};
export function setUpdatePrompt(fn: () => void) {
  _updatePrompt = fn;
}

export const commands: Record<
  string,
  (args: string[], flags: Record<string, string | boolean>) => string
> = {
  help() {
    const cmds: [string, string][] = [
      ['help', tr('helpDesc')],
      ['ls [path]', tr('lsDesc')],
      ['cat &lt;file&gt;', tr('catDesc')],
      ['cd &lt;dir&gt;', tr('cdDesc')],
      ['pwd', tr('pwdDesc')],
      ['whoami', tr('whoamiDesc')],
      ['clear', tr('clearDesc')],
      ['skills [--top N]', tr('skillsDesc')],
      ['experience', tr('experienceDesc')],
      ['projects', tr('projectsDesc')],
      ['contact', tr('contactDesc')],
      ['open &lt;target&gt;', tr('openDesc')],
      ['launch &lt;app&gt;', tr('launchDesc')],
      ['history', tr('historyDesc')],
      ['echo &lt;text&gt;', tr('echoDesc')],
      ['date', tr('dateDesc')],
      ['uname -a', tr('unameDesc')],
      ['neofetch', tr('neofetchDesc')],
      ['cowsay [text]', tr('cowsayDesc')],
      ['ping &lt;host&gt;', tr('pingDesc')],
      ['matrix', tr('matrixDesc')],
      ['shortcuts', tr('shortcutsDesc')],
      ['set &lt;key&gt; [value]', tr('setDesc')],
      ['version', tr('versionDesc')],
    ];

    // Measure display length (decode HTML entities for accurate padding)
    const displayLen = (s: string) =>
      s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .length;
    const maxLen = Math.max(...cmds.map(([name]) => displayLen(name)));
    const rows = cmds.map(([name, desc]) => {
      const pad = maxLen + 2 - displayLen(name);
      const padded = name + ' '.repeat(Math.max(0, pad));
      return `  <span class="term-green">${padded}</span><span class="term-muted">${desc}</span>`;
    });
    return rows.join('\n');
  },

  ls(args) {
    const target = args[0] || '.';
    const node = target === '.' ? getNode(state.cwd) : getNode(target);
    if (!node)
      return `<span class="term-red">${escapeHtml(tr('noSuchFile', { cmd: 'ls', path: target }))}</span>`;
    if (node.type === 'file') return node.name;
    if (!node.children || node.children.length === 0) return '';

    return node.children
      .map((c) =>
        c.type === 'dir'
          ? `<span class="term-blue">${escapeHtml(c.name)}/</span>`
          : escapeHtml(c.name)
      )
      .join('  ');
  },

  cat(args) {
    if (!args[0])
      return `<span class="term-red">${escapeHtml(tr('missingOperand', { cmd: 'cat' }))}</span>`;
    const node = getNode(args[0]);
    if (!node)
      return `<span class="term-red">${escapeHtml(tr('noSuchFile', { cmd: 'cat', path: args[0] }))}</span>`;
    if (node.type === 'dir')
      return `<span class="term-red">${escapeHtml(tr('isDirectory', { cmd: 'cat', path: args[0] }))}</span>`;
    if (!node.content) return '';

    if (node.name.endsWith('.json')) {
      return highlightJson(node.content);
    }
    return escapeHtml(node.content);
  },

  cd(args) {
    const target = args[0] || '~';
    const resolved = resolvePath(target);
    const node = getNode(resolved);
    if (!node)
      return `<span class="term-red">${escapeHtml(tr('noSuchFile', { cmd: 'cd', path: target }))}</span>`;
    if (node.type !== 'dir')
      return `<span class="term-red">${escapeHtml(tr('notADirectory', { cmd: 'cd', path: target }))}</span>`;
    state.cwd = resolved;
    _updatePrompt();
    return '';
  },

  pwd() {
    return state.cwd;
  },

  whoami() {
    const displayName = tr('displayName') || 'Mac Kevin';
    const name = state.profileData.about.role
      ? `${displayName} — ${state.profileData.about.role}`
      : displayName;
    return `<span class="term-green term-bold">${escapeHtml(name)}</span>`;
  },

  clear() {
    state.outputEl.innerHTML = '';
    return '';
  },

  skills(_args, flags) {
    const allSkills: { name: string; level: number }[] = [];
    for (const cat of state.profileData.skills.categories) {
      for (const s of cat.items) {
        allSkills.push(s);
      }
    }
    allSkills.sort((a, b) => b.level - a.level);

    const topN = typeof flags.top === 'string' ? parseInt(flags.top, 10) : 0;
    const display = topN > 0 ? allSkills.slice(0, topN) : allSkills;
    const maxNameLen = Math.max(...display.map((s) => s.name.length));
    const barWidth = 20;

    return display
      .map((s) => {
        const filled = Math.round((s.level / 100) * barWidth);
        const empty = barWidth - filled;
        const name = escapeHtml(s.name).padEnd(maxNameLen + 2);
        const color = skillColor(s.level);
        const bar = `<span class="${color}">${'█'.repeat(filled)}</span><span class="term-skill-empty">${'░'.repeat(empty)}</span>`;
        return `  ${name}${bar} ${s.level}%`;
      })
      .join('\n');
  },

  experience() {
    return state.profileData.experience.jobs
      .map((j) => {
        const header = `<span class="term-green term-bold">● ${escapeHtml(j.company)}</span> <span class="term-muted">(${escapeHtml(j.role)})</span>`;
        const period = `  <span class="term-yellow">${escapeHtml(j.startDate)} — ${escapeHtml(j.endDate)}</span> | ${escapeHtml(j.location)}`;
        const desc = `  ${escapeHtml(j.description.slice(0, 120))}${j.description.length > 120 ? '...' : ''}`;
        return `${header}\n${period}\n${desc}`;
      })
      .join('\n\n');
  },

  projects() {
    const all = [
      ...(state.profileData.projects.featured?.visible
        ? [state.profileData.projects.featured]
        : []),
      ...state.profileData.projects.items,
    ];
    return all
      .map((p) => {
        const name = `<span class="term-green term-bold">${escapeHtml(p.name)}</span>`;
        const tags = `<span class="term-muted">[${escapeHtml(p.tags.join(', '))}]</span>`;
        const desc = `  ${escapeHtml(p.description.slice(0, 100))}${p.description.length > 100 ? '...' : ''}`;
        const repo = `  <a href="${escapeHtml(p.repo)}" target="_blank" rel="noopener">${escapeHtml(p.repo)}</a>`;
        return `${name} ${tags}\n${desc}\n${repo}`;
      })
      .join('\n\n');
  },

  contact() {
    const links = state.profileData.contact.links;
    return Object.values(links)
      .map((l) => {
        const label = `<span class="term-green">${escapeHtml(l.label).padEnd(10)}</span>`;
        const link =
          l.url.startsWith('mailto:') || l.url === '#'
            ? `<span class="term-blue">${escapeHtml(l.displayText)}</span>`
            : `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.displayText)}</a>`;
        return `  ${label}${link}`;
      })
      .join('\n');
  },

  open(args) {
    if (!args[0])
      return `<span class="term-red">${escapeHtml(tr('openMissing'))}</span>`;
    const target = args[0].toLowerCase();
    const links = state.profileData.contact.links;

    // Check contact links
    if (links[target]) {
      window.open(links[target].url, '_blank');
      return `<span class="term-muted">${escapeHtml(tr('opening', { target: links[target].label }))}</span>`;
    }

    // Check projects
    const allProjects = [
      ...(state.profileData.projects.featured?.visible
        ? [state.profileData.projects.featured]
        : []),
      ...state.profileData.projects.items,
    ];
    const proj = allProjects.find(
      (p) =>
        slugify(p.name) === slugify(target) || p.name.toLowerCase() === target
    );
    if (proj) {
      window.open(proj.repo, '_blank');
      return `<span class="term-muted">${escapeHtml(tr('openingRepo', { name: proj.name }))}</span>`;
    }

    return `<span class="term-red">${escapeHtml(tr('openNotFound', { target, options: Object.keys(links).join(', ') }))}</span>`;
  },

  launch(args) {
    const appMap: Record<string, string> = {
      about: 'about-window',
      skills: 'skills-window',
      education: 'education-window',
      preview: 'preview-window',
      contact: 'contact-window',
      finder: 'finder-window',
      browser: 'browser-window',
      settings: 'settings-window',
      appstore: 'app-store-window',
      speedtest: 'speed-test-window',
      terminal: 'terminal-window',
      notes: 'notes-window',
      playgrounds: 'playground-window',
      stickies: 'stickies-window',
      gamecenter: 'achievements-window',
    };
    if (!args[0]) {
      const list = Object.keys(appMap)
        .map((name) => `  <span class="term-green">${name}</span>`)
        .join('\n');
      return `${escapeHtml(tr('launchAvailable'))}\n${list}`;
    }
    const name = args[0].toLowerCase();
    const windowId = appMap[name];
    if (!windowId) {
      return `<span class="term-red">${escapeHtml(tr('launchNotFound', { app: name }))}</span>`;
    }
    const win = document.getElementById(windowId);
    if (win) {
      document.dispatchEvent(
        new CustomEvent('open-window', { detail: { el: win } })
      );
      return `<span class="term-muted">${escapeHtml(tr('launching', { app: name }))}</span>`;
    }
    return `<span class="term-red">${escapeHtml(tr('launchNotFound', { app: name }))}</span>`;
  },

  history() {
    return state.history
      .map(
        (cmd, i) =>
          `  <span class="term-muted">${String(i + 1).padStart(4)}</span>  ${escapeHtml(cmd)}`
      )
      .join('\n');
  },

  echo(args) {
    return escapeHtml(args.join(' '));
  },

  date() {
    const now = new Date();
    return now.toLocaleString(getLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },

  uname(_args, flags) {
    if (flags.a) {
      return tr('unameAll') || 'MacKevinOS 1.0.0 Portfolio x86_64';
    }
    return tr('osName') || 'MacKevinOS';
  },

  neofetch() {
    const logo = [
      '    ╔══════════╗',
      '    ║  ┌──┐    ║',
      '    ║  │MK│    ║',
      '    ║  └──┘    ║',
      '    ║          ║',
      '    ╚══════════╝',
    ].join('\n');

    const totalSkills = state.profileData.skills.categories.reduce(
      (sum, c) => sum + c.items.length,
      0
    );
    const totalProjects =
      (state.profileData.projects.featured?.visible ? 1 : 0) +
      state.profileData.projects.items.length;
    const firstJob =
      state.profileData.experience.jobs[
        state.profileData.experience.jobs.length - 1
      ];
    const startYear = parseInt(
      firstJob?.startDate?.match(/\d{4}/)?.[0] ?? '2019',
      10
    );
    const yearsExp = new Date().getFullYear() - startYear;
    const langs =
      state.profileData.about.languages?.map((l) => l.text).join(', ') ?? '';

    const info = [
      `<span class="term-green term-bold">${escapeHtml(tr('userName') || 'kevin')}</span>@<span class="term-green term-bold">${escapeHtml(tr('hostName') || 'portfolio')}</span>`,
      `<span class="term-muted">─────────────────────</span>`,
      `<span class="term-blue">${escapeHtml(tr('nfName'))}</span>    ${escapeHtml(tr('displayName') || 'Mac Kevin')}`,
      `<span class="term-blue">${escapeHtml(tr('nfRole'))}</span>    ${escapeHtml(state.profileData.about.role)}`,
      `<span class="term-blue">${escapeHtml(tr('nfOS'))}</span>      ${escapeHtml((tr('osName') || 'MacKevinOS') + ' ' + (tr('osVersion') || '1.0.0'))}`,
      `<span class="term-blue">${escapeHtml(tr('nfShell'))}</span>   ${escapeHtml(tr('shellName') || 'mksh 1.0')}`,
      `<span class="term-blue">${escapeHtml(tr('nfSkills'))}</span>  ${escapeHtml(tr('nfTechnologies', { count: String(totalSkills) }))}`,
      `<span class="term-blue">${escapeHtml(tr('nfProjects'))}</span> ${escapeHtml(tr('nfShipped', { count: String(totalProjects) }))}`,
      `<span class="term-blue">${escapeHtml(tr('nfExp'))}</span>     ${escapeHtml(tr('nfYears', { count: String(yearsExp) }))}`,
      `<span class="term-blue">${escapeHtml(tr('nfLanguages'))}</span> ${escapeHtml(langs)}`,
    ].join('\n');

    return `<div class="term-neofetch"><div class="term-neofetch-logo">${logo}</div><div class="term-neofetch-info">${info}</div></div>`;
  },

  cowsay(args) {
    const text = args.length > 0 ? args.join(' ') : tr('eggCowDefault');
    const escaped = escapeHtml(text);
    const border = '─'.repeat(escaped.length + 2);
    return [
      ` ${border}`,
      `< ${escaped} >`,
      ` ${border}`,
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ].join('\n');
  },

  ping(args) {
    const host = args[0] || 'localhost';
    const lines: string[] = [
      `PING ${escapeHtml(host)} (127.0.0.1): 56 data bytes`,
    ];
    let totalMs = 0;
    let minMs = Infinity;
    let maxMs = 0;
    for (let i = 0; i < 4; i++) {
      const ms = (Math.random() * 40 + 10).toFixed(3);
      const msNum = parseFloat(ms);
      totalMs += msNum;
      if (msNum < minMs) minMs = msNum;
      if (msNum > maxMs) maxMs = msNum;
      lines.push(`64 bytes from 127.0.0.1: icmp_seq=${i} ttl=64 time=${ms} ms`);
    }
    lines.push('');
    lines.push(`--- ${escapeHtml(host)} ping statistics ---`);
    lines.push(`4 packets transmitted, 4 packets received, 0.0% packet loss`);
    lines.push(
      `round-trip min/avg/max = ${minMs.toFixed(3)}/${(totalMs / 4).toFixed(3)}/${maxMs.toFixed(3)} ms`
    );
    return lines.join('\n');
  },

  matrix() {
    const container = document.createElement('div');
    container.className = 'term-matrix';
    const chars =
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const colCount = Math.floor(state.bodyEl.offsetWidth / 16);

    for (let c = 0; c < colCount; c++) {
      const charCount = Math.floor(Math.random() * 8) + 5;
      for (let r = 0; r < charCount; r++) {
        const span = document.createElement('span');
        span.className = 'term-matrix-char';
        span.textContent = chars[Math.floor(Math.random() * chars.length)];
        span.style.left = `${c * 16}px`;
        span.style.top = `${-20 - r * 20}px`;
        span.style.animationDuration = `${Math.random() * 2 + 1}s`;
        span.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(span);
      }
    }

    state.bodyEl.style.position = 'relative';
    state.bodyEl.appendChild(container);

    setTimeout(() => {
      container.remove();
    }, 3000);

    return `<span class="term-green">${escapeHtml(tr('eggMatrix'))}</span>`;
  },

  shortcuts() {
    const shortcuts: [string, string][] = [
      ['⌘ + ,', tr('shortcutSettings') || 'Open Settings'],
      ['Alt + Space', tr('shortcutLaunchpad') || 'Toggle Launchpad'],
      ['Alt + N', tr('shortcutNotifCenter') || 'Notification Center'],
      ['Alt + Tab', tr('shortcutSwitcher') || 'Switch between windows'],
      ['?', tr('shortcutHelp') || 'Keyboard Shortcuts'],
      ['Esc', tr('shortcutEsc') || 'Close panel / overlay'],
    ];

    const maxLen = Math.max(...shortcuts.map(([key]) => key.length));
    const rows = shortcuts.map(([key, desc]) => {
      const padded = key.padEnd(maxLen + 2);
      return `  <span class="term-cyan">${padded}</span><span class="term-muted">${desc}</span>`;
    });
    return `<span class="term-bold">${escapeHtml(tr('shortcutsHeader') || 'Keyboard Shortcuts')}</span>\n${rows.join('\n')}`;
  },

  set(args) {
    const ACCENT_MAP: Record<string, string> = {
      blue: 'var(--os-stg-blue)',
      purple: 'var(--os-stg-purple)',
      pink: 'var(--os-stg-pink)',
      red: 'var(--os-stg-red)',
      amber: 'var(--os-stg-amber)',
      green: 'var(--os-stg-green)',
    };

    const settingsDefs: Record<
      string,
      {
        values?: string[];
        desc: string;
        get: () => string;
        apply: (v: string) => string;
      }
    > = {
      language: {
        values: ['en', 'es', 'pt'],
        desc: tr('setLangDesc') || 'Change interface language',
        get: () => getLocale(),
        apply(v) {
          track('lang-changed');
          const prefix = window.location.pathname.startsWith('/os/')
            ? '/os/'
            : '/';
          setTimeout(() => {
            window.location.href = `${prefix}${v}`;
          }, 300);
          return `<span class="term-green">${escapeHtml((tr('setLangChanging') || 'Switching to {lang}...').replace('{lang}', v.toUpperCase()))}</span>`;
        },
      },
      appearance: {
        values: ['light', 'dark', 'auto'],
        desc: tr('setAppearanceDesc') || 'Change theme appearance',
        get: () => settings.appearance,
        apply(v) {
          settings.appearance = v as 'light' | 'dark' | 'auto';
          applyAppearance(settings.appearance);
          saveSettings(settings, 'appearance');
          return `<span class="term-green">${escapeHtml((tr('setChanged') || '{key} → {value}').replace('{key}', 'appearance').replace('{value}', v))}</span>`;
        },
      },
      accent: {
        values: Object.keys(ACCENT_MAP),
        desc: tr('setAccentDesc') || 'Change accent color',
        get: () =>
          Object.entries(ACCENT_MAP).find(
            ([, css]) => css === settings.accentColor
          )?.[0] || 'blue',
        apply(v) {
          const css = ACCENT_MAP[v];
          if (!css)
            return `<span class="term-red">set: accent '${escapeHtml(v)}' invalid. ${escapeHtml((tr('setOptions') || 'Options: {opts}').replace('{opts}', Object.keys(ACCENT_MAP).join(', ')))}</span>`;
          settings.accentColor = css;
          applyAccentColor(css);
          saveSettings(settings, 'accentColor');
          return `<span class="term-green">${escapeHtml((tr('setChanged') || '{key} → {value}').replace('{key}', 'accent').replace('{value}', v))}</span>`;
        },
      },
      clock24h: {
        values: ['on', 'off'],
        desc: tr('setClock24hDesc') || 'Toggle 24-hour clock',
        get: () => (settings.clock24h ? 'on' : 'off'),
        apply(v) {
          settings.clock24h = v === 'on';
          saveSettings(settings, 'clock24h');
          return `<span class="term-green">${escapeHtml((tr('setChanged') || '{key} → {value}').replace('{key}', 'clock24h').replace('{value}', v))}</span>`;
        },
      },
      'reduce-motion': {
        values: ['on', 'off'],
        desc: tr('setReduceMotionDesc') || 'Toggle reduce motion',
        get: () => (settings.reduceMotion ? 'on' : 'off'),
        apply(v) {
          settings.reduceMotion = v === 'on';
          applyReduceMotion(settings.reduceMotion);
          saveSettings(settings, 'reduceMotion');
          return `<span class="term-green">${escapeHtml((tr('setChanged') || '{key} → {value}').replace('{key}', 'reduce-motion').replace('{value}', v))}</span>`;
        },
      },
      'font-size': {
        values: ['small', 'default', 'large', 'largest'],
        desc: tr('setFontSizeDesc') || 'Change font size',
        get: () =>
          ['small', 'default', 'large', 'largest'][settings.fontSize + 1] ||
          'default',
        apply(v) {
          const map: Record<string, number> = {
            small: -1,
            default: 0,
            large: 1,
            largest: 2,
          };
          if (!(v in map))
            return `<span class="term-red">set: font-size '${escapeHtml(v)}' invalid. ${escapeHtml((tr('setOptions') || 'Options: {opts}').replace('{opts}', 'small, default, large, largest'))}</span>`;
          settings.fontSize = map[v];
          applyFontSize(settings.fontSize);
          saveSettings(settings, 'fontSize');
          return `<span class="term-green">${escapeHtml((tr('setChanged') || '{key} → {value}').replace('{key}', 'font-size').replace('{value}', v))}</span>`;
        },
      },
      'high-contrast': {
        values: ['on', 'off'],
        desc: tr('setHighContrastDesc') || 'Toggle high contrast',
        get: () => (settings.highContrast ? 'on' : 'off'),
        apply(v) {
          settings.highContrast = v === 'on';
          applyHighContrast(settings.highContrast);
          saveSettings(settings, 'highContrast');
          return `<span class="term-green">${escapeHtml((tr('setChanged') || '{key} → {value}').replace('{key}', 'high-contrast').replace('{value}', v))}</span>`;
        },
      },
    };

    // No args: show all settings
    if (args.length === 0) {
      const maxKey = Math.max(
        ...Object.keys(settingsDefs).map((k) => k.length)
      );
      const rows = Object.entries(settingsDefs).map(([key, def]) => {
        const current = def.get();
        const vals = def.values ? `[${def.values.join('|')}]` : '';
        return `  <span class="term-cyan">${key.padEnd(maxKey + 2)}</span><span class="term-green">${escapeHtml(current).padEnd(10)}</span><span class="term-muted">${escapeHtml(vals)}</span>`;
      });
      return `<span class="term-bold">${escapeHtml(tr('setHeader') || 'Settings')}</span>\n${rows.join('\n')}`;
    }

    const key = args[0].toLowerCase();
    const value = args[1]?.toLowerCase();
    const def = settingsDefs[key];

    if (!def) {
      return `<span class="term-red">set: '${escapeHtml(key)}' ${escapeHtml(tr('setUnknown') || 'unknown setting')}. ${escapeHtml(tr('setAvailable') || 'Available')}: ${Object.keys(settingsDefs).join(', ')}</span>`;
    }

    // No value: show current
    if (!value) {
      const current = def.get();
      const vals = def.values ? ` [${def.values.join('|')}]` : '';
      return `  <span class="term-cyan">${escapeHtml(key)}</span> = <span class="term-green">${escapeHtml(current)}</span><span class="term-muted">${escapeHtml(vals)}</span>`;
    }

    // Validate value
    if (def.values && !def.values.includes(value)) {
      return `<span class="term-red">set: '${escapeHtml(value)}' invalid. ${escapeHtml((tr('setOptions') || 'Options: {opts}').replace('{opts}', def.values.join(', ')))}</span>`;
    }

    return def.apply(value);
  },

  version() {
    const os = tr('osName') || 'MacKevinOS';
    return [
      `<span class="term-green term-bold">${escapeHtml(os)}</span> <span class="term-cyan">v${escapeHtml(APP_VERSION)}</span>`,
      `  <span class="term-blue">${escapeHtml(tr('versionBuild'))}</span>  ${escapeHtml(BUILD_DATE)}`,
      `  <span class="term-blue">${escapeHtml(tr('versionShell'))}</span>  ${escapeHtml(tr('shellName') || 'mksh 1.0')}`,
      `  <span class="term-blue">${escapeHtml(tr('versionArch'))}</span>   x86_64`,
    ].join('\n');
  },
};

// ---------------------------------------------------------------------------
// Easter Eggs
// ---------------------------------------------------------------------------

export function handleEasterEgg(raw: string): string | null {
  const lower = raw.trim().toLowerCase();

  if (lower === 'sudo hire-me') {
    const links = state.profileData.contact.links;
    const email = links.email?.displayText ?? 'hello@mackevin.dev';
    const github = links.github?.displayText ?? 'github.com/mackevin';
    const linkedin = links.linkedin?.displayText ?? 'linkedin.com/in/mackevin';
    const githubUrl = links.github?.url ?? '#';
    const linkedinUrl = links.linkedin?.url ?? '#';

    return [
      '',
      `<span class="term-green term-bold">${escapeHtml(tr('eggHireMe'))}</span>`,
      '',
      `  <span class="term-blue">Email:</span>     ${escapeHtml(email)}`,
      `  <span class="term-blue">GitHub:</span>    <a href="${escapeHtml(githubUrl)}" target="_blank" rel="noopener">${escapeHtml(github)}</a>`,
      `  <span class="term-blue">LinkedIn:</span>  <a href="${escapeHtml(linkedinUrl)}" target="_blank" rel="noopener">${escapeHtml(linkedin)}</a>`,
      '',
      `<span class="term-yellow">${escapeHtml(tr('eggHireMeAvailable'))}</span>`,
      '',
    ].join('\n');
  }

  if (lower === 'rm -rf doubts/' || lower === 'rm -rf doubts') {
    return `<span class="term-green">${escapeHtml(tr('eggRmDoubt'))}</span>`;
  }

  if (lower === 'vim' || lower === 'nano' || lower === 'vi') {
    return `<span class="term-yellow">${escapeHtml(tr('eggVim'))}</span>`;
  }

  if (lower === 'exit' || lower === 'logout') {
    return `<span class="term-yellow">${escapeHtml(tr('eggExit'))}</span>`;
  }

  if (lower === 'sudo rm -rf /' || lower === 'sudo rm -rf /*') {
    return `<span class="term-red">${escapeHtml(tr('eggSudoRm'))}</span>`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Command Execution (dispatcher)
// ---------------------------------------------------------------------------

export function execute(input: string): string {
  const raw = input.trim();
  if (!raw) return '';

  // Check easter eggs first (they bypass normal parsing)
  const egg = handleEasterEgg(raw);
  if (egg !== null) return egg;

  const { cmd, args, flags } = parse(raw);

  // Handle sudo prefix (pass through to the actual command)
  if (cmd === 'sudo' && args.length > 0) {
    const subCmd = args[0];
    const subArgs = args.slice(1);
    if (commands[subCmd]) {
      return commands[subCmd](subArgs, flags);
    }
    return `<span class="term-red">${escapeHtml(tr('sudoCmdNotFound', { cmd: subCmd }))}</span>`;
  }

  if (commands[cmd]) {
    return commands[cmd](args, flags);
  }

  return `<span class="term-red">${escapeHtml(tr('cmdNotFound', { cmd }))}</span>`;
}
