import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

export function resetSkills() {
  const tabs = document.querySelectorAll<HTMLElement>('[data-skills-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-skills-panel]');
  const headers = document.querySelectorAll<HTMLElement>(
    '[data-skills-header]'
  );

  const firstTab = tabs[0];
  if (!firstTab) return;
  const firstKey = firstTab.dataset.skillsTab;

  tabs.forEach((t) => t.classList.remove('os-nav--active'));
  firstTab.classList.add('os-nav--active');

  headers.forEach((h) => {
    h.classList.toggle(
      'skills-header-block--active',
      h.dataset.skillsHeader === firstKey
    );
  });

  panels.forEach((p) => {
    p.classList.toggle(
      'skills-panel--active',
      p.dataset.skillsPanel === firstKey
    );
  });
}

export function initSkillsTabs() {
  const tabs = document.querySelectorAll<HTMLElement>('[data-skills-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-skills-panel]');
  const headers = document.querySelectorAll<HTMLElement>(
    '[data-skills-header]'
  );

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.skillsTab;

      tabs.forEach((t) => t.classList.remove('os-nav--active'));
      tab.classList.add('os-nav--active');

      headers.forEach((h) => {
        h.classList.toggle(
          'skills-header-block--active',
          h.dataset.skillsHeader === key
        );
      });

      panels.forEach((p) => {
        p.classList.toggle(
          'skills-panel--active',
          p.dataset.skillsPanel === key
        );
      });
    });
  });

  registerReset(W.SKILLS, resetSkills);
}
