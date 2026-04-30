import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

export function resetEducation() {
  const tabs = document.querySelectorAll<HTMLElement>('[data-edu-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-edu-panel]');
  const headers = document.querySelectorAll<HTMLElement>('[data-edu-header]');

  const firstTab = tabs[0];
  if (!firstTab) return;
  const firstKey = firstTab.dataset.eduTab;

  tabs.forEach((t) => t.classList.remove('os-nav--active'));
  firstTab.classList.add('os-nav--active');

  headers.forEach((h) => {
    h.classList.toggle(
      'edu-header-block--active',
      h.dataset.eduHeader === firstKey
    );
  });

  panels.forEach((p) => {
    p.classList.toggle('edu-panel--active', p.dataset.eduPanel === firstKey);
  });
}

export function initEducationTabs() {
  const tabs = document.querySelectorAll<HTMLElement>('[data-edu-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-edu-panel]');
  const headers = document.querySelectorAll<HTMLElement>('[data-edu-header]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.eduTab;

      tabs.forEach((t) => t.classList.remove('os-nav--active'));
      tab.classList.add('os-nav--active');

      headers.forEach((h) => {
        h.classList.toggle(
          'edu-header-block--active',
          h.dataset.eduHeader === key
        );
      });

      panels.forEach((p) => {
        p.classList.toggle('edu-panel--active', p.dataset.eduPanel === key);
      });
    });
  });

  registerReset(W.EDUCATION, resetEducation);
}
