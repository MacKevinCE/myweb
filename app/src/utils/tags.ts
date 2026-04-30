export const tagColors = [
  {
    text: 'var(--palette-0)',
    bg: 'color-mix(in srgb, var(--palette-0) 8%, transparent)',
    bgStrong: 'color-mix(in srgb, var(--palette-0) 12%, transparent)',
  },
  {
    text: 'var(--palette-1)',
    bg: 'color-mix(in srgb, var(--palette-1) 8%, transparent)',
    bgStrong: 'color-mix(in srgb, var(--palette-1) 12%, transparent)',
  },
  {
    text: 'var(--palette-2)',
    bg: 'color-mix(in srgb, var(--palette-2) 8%, transparent)',
    bgStrong: 'color-mix(in srgb, var(--palette-2) 12%, transparent)',
  },
  {
    text: 'var(--palette-3)',
    bg: 'color-mix(in srgb, var(--palette-3) 8%, transparent)',
    bgStrong: 'color-mix(in srgb, var(--palette-3) 12%, transparent)',
  },
];

export function hashStr(s: string): number {
  let hash = 0;
  for (const char of s) {
    hash = hash * 31 + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function tagColor(tag: string) {
  return tagColors[hashStr(tag) % tagColors.length];
}
