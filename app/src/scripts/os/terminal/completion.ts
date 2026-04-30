/**
 * Terminal Engine — Tab completion logic.
 */

import { state, slugify } from './state';
import { getNode } from './filesystem';
import { commands } from './commands';

// ---------------------------------------------------------------------------
// Open Targets
// ---------------------------------------------------------------------------

function getOpenTargets(): string[] {
  const targets: string[] = [];
  // Contact links
  if (state.profileData.contact?.links) {
    targets.push(...Object.keys(state.profileData.contact.links));
  }
  // Project names (slugified)
  const allProjects = [
    ...(state.profileData.projects?.featured?.visible
      ? [state.profileData.projects.featured]
      : []),
    ...(state.profileData.projects?.items ?? []),
  ];
  allProjects.forEach((p) => targets.push(slugify(p.name)));
  return targets;
}

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

export function getCompletions(partial: string): string[] {
  const tokens = partial.split(/\s+/);

  // If only one token, complete command names
  if (tokens.length <= 1) {
    const prefix = tokens[0]?.toLowerCase() ?? '';
    return Object.keys(commands).filter((c) => c.startsWith(prefix));
  }

  const cmd = tokens[0].toLowerCase();
  const argPart = (tokens[tokens.length - 1] || '').toLowerCase();

  // Command-specific completions
  if (cmd === 'open') {
    return getOpenTargets().filter((t) => t.startsWith(argPart));
  }
  if (cmd === 'launch') {
    const apps = [
      'about',
      'skills',
      'education',
      'preview',
      'contact',
      'finder',
      'browser',
      'settings',
      'appstore',
      'speedtest',
      'terminal',
      'notes',
      'playgrounds',
      'stickies',
      'gamecenter',
    ];
    return apps.filter((a) => a.startsWith(argPart));
  }
  if (cmd === 'set') {
    const setKeys = [
      'language',
      'appearance',
      'accent',
      'clock24h',
      'reduce-motion',
      'font-size',
      'high-contrast',
    ];
    const setValues: Record<string, string[]> = {
      language: ['en', 'es', 'pt'],
      appearance: ['light', 'dark', 'auto'],
      accent: ['blue', 'purple', 'pink', 'red', 'amber', 'green'],
      clock24h: ['on', 'off'],
      'reduce-motion': ['on', 'off'],
      'font-size': ['small', 'default', 'large', 'largest'],
      'high-contrast': ['on', 'off'],
    };
    // Second token: complete setting keys
    if (tokens.length === 2) {
      return setKeys.filter((k) => k.startsWith(argPart));
    }
    // Third token: complete setting values
    if (tokens.length === 3) {
      const key = tokens[1].toLowerCase();
      const vals = setValues[key];
      if (vals) return vals.filter((v) => v.startsWith(argPart));
    }
    return [];
  }

  // Default: complete paths
  const pathPart = tokens[tokens.length - 1] || '';
  const lastSlash = pathPart.lastIndexOf('/');
  let dirPath: string;
  let prefix: string;

  if (lastSlash === -1) {
    dirPath = state.cwd;
    prefix = pathPart;
  } else {
    dirPath =
      pathPart.slice(0, lastSlash) ||
      (pathPart.startsWith('~') ? '~' : state.cwd);
    prefix = pathPart.slice(lastSlash + 1);
  }

  const dirNode = getNode(dirPath);
  if (!dirNode || dirNode.type !== 'dir' || !dirNode.children) return [];

  return dirNode.children
    .filter((c) => c.name.startsWith(prefix))
    .map((c) => {
      const basePath = lastSlash === -1 ? '' : pathPart.slice(0, lastSlash + 1);
      return basePath + c.name + (c.type === 'dir' ? '/' : '');
    });
}
