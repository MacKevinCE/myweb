import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initTerminalScroll(): void {
  // Reveal terminal lines on scroll (block-level, not per-character)
  const terminalLines = document.querySelectorAll('.terminal-line');

  terminalLines.forEach((line) => {
    gsap.fromTo(
      line,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: line,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  // Skill bars animation
  const skillBars = document.querySelectorAll<HTMLElement>('.skill-bar-fill');

  skillBars.forEach((bar) => {
    const level = bar.getAttribute('data-level') || '0';

    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: parseInt(level) / 100,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: bar,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  // Section headers — typing cursor after reveal
  const prompts = document.querySelectorAll('.terminal-prompt');
  prompts.forEach((prompt) => {
    gsap.from(prompt, {
      opacity: 0,
      x: -20,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: prompt,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });
}
