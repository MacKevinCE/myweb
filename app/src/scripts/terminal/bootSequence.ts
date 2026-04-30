export function initBootSequence(): void {
  const overlay = document.getElementById('boot-overlay');
  if (!overlay) return;

  // Skip if already seen this session
  if (sessionStorage.getItem('boot-seen')) {
    overlay.classList.add('hidden');
    return;
  }

  const lines = overlay.querySelectorAll<HTMLElement>('.boot-line');
  let currentLine = 0;
  let timeoutId: ReturnType<typeof setTimeout>;

  function showNextLine(): void {
    if (currentLine < lines.length) {
      lines[currentLine].classList.add('visible');
      currentLine++;
      const delay =
        currentLine === lines.length ? 600 : 150 + Math.random() * 200;
      timeoutId = setTimeout(showNextLine, delay);
    }
  }

  function dismiss(): void {
    clearTimeout(timeoutId);
    sessionStorage.setItem('boot-seen', '1');
    overlay!.classList.add('hidden');
    document.removeEventListener('click', dismiss);
    document.removeEventListener('keydown', dismiss);
  }

  // Start showing lines
  timeoutId = setTimeout(showNextLine, 300);

  // Auto-dismiss after ~2.5s
  setTimeout(() => {
    if (!overlay!.classList.contains('hidden')) {
      dismiss();
    }
  }, 2500);

  // Skip on interaction
  document.addEventListener('click', dismiss);
  document.addEventListener('keydown', dismiss);
}
