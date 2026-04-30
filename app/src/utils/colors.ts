const PALETTE_COUNT = 4;

export function cycleColor(index: number): string {
  return `var(--palette-${index % PALETTE_COUNT})`;
}
