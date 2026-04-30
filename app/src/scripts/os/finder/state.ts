export const META: Record<string, { title: string; path: string }> = {
  projects: { title: '~/projects/ — Finder', path: '~/projects/' },
  experience: { title: '~/experience/ — Finder', path: '~/experience/' },
};

export let activeSection = 'projects';
export let sidebarVisible = true;
export let detailManuallyHidden = false;

export function setActiveSection(val: string) { activeSection = val; }
export function setSidebarVisible(val: boolean) { sidebarVisible = val; }
export function setDetailManuallyHidden(val: boolean) { detailManuallyHidden = val; }
