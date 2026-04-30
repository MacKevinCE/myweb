import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies that zIndex.ts imports
vi.mock('../../../src/data/os-apps', () => ({
  appNames: {} as Record<string, string>,
}));
vi.mock('../../../src/scripts/os/window/state', () => ({
  windowStates: new Map(),
}));

import { bringToFront } from '../../../src/scripts/os/window/zIndex';

describe('zIndex management', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('assigns incrementing z-index values', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    document.body.append(el1, el2);

    bringToFront(el1);
    const z1 = parseInt(el1.style.zIndex);

    bringToFront(el2);
    const z2 = parseInt(el2.style.zIndex);

    expect(z2).toBeGreaterThan(z1);
  });

  it('sets a valid numeric z-index on the element', () => {
    const el = document.createElement('div');
    document.body.append(el);

    bringToFront(el);

    expect(parseInt(el.style.zIndex)).toBeGreaterThan(0);
  });

  it('updates the same element to a higher z-index on repeated calls', () => {
    const el = document.createElement('div');
    document.body.append(el);

    bringToFront(el);
    const first = parseInt(el.style.zIndex);

    bringToFront(el);
    const second = parseInt(el.style.zIndex);

    expect(second).toBeGreaterThan(first);
  });
});
