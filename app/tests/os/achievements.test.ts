import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock notifications module to avoid DOM dependency
vi.mock('../../src/scripts/os/notifications', () => ({
  notify: vi.fn(),
  getNotifI18n: vi.fn(() => ({})),
}));

describe('achievements engine', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
  });

  async function loadModule() {
    const mod = await import('../../src/scripts/os/achievements');
    return mod;
  }

  it('initializes with all achievements locked', async () => {
    const { initAchievements, getProgress } = await loadModule();
    initAchievements();
    const progress = getProgress();
    expect(progress.unlocked).toBe(0);
    expect(progress.total).toBeGreaterThan(0);
  });

  it('tracks a one-shot achievement', async () => {
    const { initAchievements, track, getAchievements } = await loadModule();
    initAchievements();
    track('speedtest-run');
    const achievements = getAchievements();
    const speedster = achievements.find((a) => a.id === 'speedster');
    expect(speedster?.unlocked).toBe(true);
  });

  it('tracks progress for multi-step achievements', async () => {
    const { initAchievements, track, getAchievements } = await loadModule();
    initAchievements();
    track('terminal-command');
    track('terminal-command');
    const achievements = getAchievements();
    const hacker = achievements.find((a) => a.id === 'hacker');
    expect(hacker?.progress).toBe(2);
    expect(hacker?.unlocked).toBe(false); // needs 5
  });

  it('tracks unique events without duplicates', async () => {
    const { initAchievements, track, getAchievements } = await loadModule();
    initAchievements();
    track('window-opened', { id: 'about-window' });
    track('window-opened', { id: 'about-window' }); // duplicate
    track('window-opened', { id: 'skills-window' });
    const achievements = getAchievements();
    const explorer = achievements.find((a) => a.id === 'explorer');
    expect(explorer?.progress).toBe(2); // not 3
  });

  it('persists state to localStorage', async () => {
    const { initAchievements, track } = await loadModule();
    initAchievements();
    track('speedtest-run');
    const stored = JSON.parse(localStorage.getItem('os-achievements') || '{}');
    expect(stored.states.speedster.unlocked).toBe(true);
  });
});
