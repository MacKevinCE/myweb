/**
 * Terminal Engine — Virtual filesystem builder and path resolution.
 */

import type { FSNode, ProfileData } from './types';
import { state, slugify } from './state';

// ---------------------------------------------------------------------------
// Filesystem Builder
// ---------------------------------------------------------------------------

export function buildFS(data: ProfileData): FSNode {
  const root: FSNode = { type: 'dir', name: '~', children: [] };
  const about = data.about;
  const contact = data.contact;

  // about.txt
  const bioText = `${about.role}\n${about.location}\n\n${about.bio.join('\n\n')}`;
  root.children!.push({ type: 'file', name: 'about.txt', content: bioText });

  // contact.json
  root.children!.push({
    type: 'file',
    name: 'contact.json',
    content: JSON.stringify(contact.links, null, 2),
  });

  // README.md
  root.children!.push({
    type: 'file',
    name: 'README.md',
    content: `# ${about.tagline}\n\n${about.available}`,
  });

  // projects/
  const projDir: FSNode = { type: 'dir', name: 'projects', children: [] };
  const allProjects = [
    ...(data.projects.featured?.visible ? [data.projects.featured] : []),
    ...data.projects.items,
  ];
  for (const p of allProjects) {
    const content = `# ${p.name}\n\n${p.description}\n\nTags: ${p.tags.join(', ')}${p.repo ? `\nRepo: ${p.repo}` : ''}`;
    projDir.children!.push({ type: 'file', name: `${slugify(p.name)}.md`, content });
  }
  root.children!.push(projDir);

  // experience/
  const expDir: FSNode = { type: 'dir', name: 'experience', children: [] };
  const usedNames = new Set<string>();
  for (const j of data.experience.jobs) {
    const content = `# ${j.company}\n\nRole: ${j.role}\nPeriod: ${j.startDate} — ${j.endDate}\nLocation: ${j.location}\n\n${j.description}\n\nTags: ${j.tags.join(', ')}`;
    let fileName = slugify(j.company);
    // Append role to avoid collisions (e.g., two "Freelancer" jobs)
    if (usedNames.has(fileName)) {
      fileName = `${fileName}-${slugify(j.role)}`;
    }
    usedNames.add(fileName);
    expDir.children!.push({ type: 'file', name: `${fileName}.md`, content });
  }
  root.children!.push(expDir);

  // skills/
  const skillsDir: FSNode = { type: 'dir', name: 'skills', children: [] };
  for (const cat of data.skills.categories) {
    const content = JSON.stringify(cat.items, null, 2);
    skillsDir.children!.push({ type: 'file', name: `${slugify(cat.title)}.json`, content });
  }
  root.children!.push(skillsDir);

  // education/
  const eduDir: FSNode = { type: 'dir', name: 'education', children: [] };
  eduDir.children!.push({
    type: 'file',
    name: 'degrees.json',
    content: JSON.stringify(data.education.degrees, null, 2),
  });
  eduDir.children!.push({
    type: 'file',
    name: 'certifications.json',
    content: JSON.stringify(data.education.certifications, null, 2),
  });
  root.children!.push(eduDir);

  return root;
}

// ---------------------------------------------------------------------------
// Path Resolution
// ---------------------------------------------------------------------------

export function resolvePath(path: string): string {
  // Normalize: / and ~ both mean home
  if (path === '/' || path === '~' || path === '') return '~';
  if (path.startsWith('~/')) return normParts(['~', ...path.slice(2).split('/')]);
  if (path.startsWith('/')) return normParts(['~', ...path.slice(1).split('/')]);

  // Relative path
  const base = state.cwd === '~' ? ['~'] : state.cwd.split('/');
  return normParts([...base, ...path.split('/')]);
}

function normParts(parts: string[]): string {
  const result: string[] = ['~'];
  for (const seg of parts.slice(1)) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') {
      if (result.length > 1) result.pop();
    } else {
      result.push(seg);
    }
  }
  return result.join('/');
}

export function getNode(path: string): FSNode | null {
  const resolved = resolvePath(path);
  if (resolved === '~') return state.fs;

  const parts = resolved.split('/').slice(1); // skip '~'
  let node: FSNode = state.fs;
  for (const part of parts) {
    if (!part) continue;
    if (node.type !== 'dir' || !node.children) return null;
    const child = node.children.find((c) => c.name === part);
    if (!child) return null;
    node = child;
  }
  return node;
}
