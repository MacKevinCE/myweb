import baseProfile from '../data/profile/base.json';

export const themes = ['terminal', 'liquid-glass', 'os'] as const;
export type Theme = (typeof themes)[number];

const profileTheme = (baseProfile as Record<string, unknown>).theme as
  | string
  | undefined;
export const defaultTheme: Theme =
  profileTheme && (themes as readonly string[]).includes(profileTheme)
    ? (profileTheme as Theme)
    : 'terminal';
