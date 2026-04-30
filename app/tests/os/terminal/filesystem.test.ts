import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildFS,
  resolvePath,
  getNode,
} from '../../../src/scripts/os/terminal/filesystem';
import { state } from '../../../src/scripts/os/terminal/state';
import type {
  FSNode,
  ProfileData,
} from '../../../src/scripts/os/terminal/types';

// Minimal mock profile data for building a filesystem
const mockProfile: ProfileData = {
  about: {
    role: 'Developer',
    tagline: 'Hello World',
    location: 'Buenos Aires',
    available: 'Available for hire',
    bio: ['Bio paragraph one'],
    metrics: [],
    languages: [{ text: 'English' }],
  },
  skills: {
    categories: [
      { title: 'Frontend', items: [{ name: 'TypeScript', level: 90 }] },
    ],
  },
  experience: {
    jobs: [
      {
        company: 'Acme Corp',
        role: 'Lead Dev',
        startDate: '2020',
        endDate: 'Present',
        location: 'Remote',
        description: 'Building things',
        tags: ['typescript'],
      },
    ],
  },
  projects: {
    featured: {
      visible: true,
      name: 'My Project',
      description: 'A cool project',
      tags: ['astro'],
      repo: 'https://github.com/example/my-project',
    },
    items: [],
  },
  education: {
    degrees: [
      {
        badge: '🎓',
        title: 'CS',
        institution: 'MIT',
        period: '2016-2020',
        details: '',
      },
    ],
    certifications: [{ name: 'AWS', year: '2023' }],
  },
  contact: {
    links: {
      email: {
        label: 'Email',
        url: 'mailto:test@test.com',
        displayText: 'test@test.com',
      },
    },
  },
};

describe('buildFS', () => {
  it('creates root directory with expected children', () => {
    const fs = buildFS(mockProfile);
    expect(fs.type).toBe('dir');
    expect(fs.name).toBe('~');
    const names = fs.children!.map((c) => c.name);
    expect(names).toContain('about.txt');
    expect(names).toContain('contact.json');
    expect(names).toContain('README.md');
    expect(names).toContain('projects');
    expect(names).toContain('experience');
    expect(names).toContain('skills');
    expect(names).toContain('education');
  });

  it('creates project files from profile data', () => {
    const fs = buildFS(mockProfile);
    const projDir = fs.children!.find((c) => c.name === 'projects');
    expect(projDir?.type).toBe('dir');
    expect(projDir?.children?.length).toBe(1);
    expect(projDir?.children?.[0].name).toBe('my-project.md');
  });
});

describe('resolvePath', () => {
  it('resolves empty string to home', () => {
    expect(resolvePath('')).toBe('~');
  });

  it('resolves / to home', () => {
    expect(resolvePath('/')).toBe('~');
  });

  it('resolves ~ to home', () => {
    expect(resolvePath('~')).toBe('~');
  });

  it('resolves absolute paths', () => {
    expect(resolvePath('~/projects')).toBe('~/projects');
  });

  it('normalizes .. in paths', () => {
    expect(resolvePath('~/projects/../skills')).toBe('~/skills');
  });

  it('does not go above root with ..', () => {
    expect(resolvePath('~/../../..')).toBe('~');
  });
});

describe('getNode', () => {
  beforeEach(() => {
    state.fs = buildFS(mockProfile);
    state.cwd = '~';
  });

  it('returns root for ~', () => {
    const node = getNode('~');
    expect(node?.name).toBe('~');
    expect(node?.type).toBe('dir');
  });

  it('resolves nested path', () => {
    const node = getNode('~/projects');
    expect(node?.name).toBe('projects');
    expect(node?.type).toBe('dir');
  });

  it('returns null for non-existent path', () => {
    expect(getNode('~/nonexistent')).toBeNull();
  });

  it('resolves file inside directory', () => {
    const node = getNode('~/about.txt');
    expect(node?.type).toBe('file');
    expect(node?.content).toContain('Developer');
  });
});
