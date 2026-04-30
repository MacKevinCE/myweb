const DISMISS_KEY = 'lang-suggest-dismissed';

type LangTexts = {
  translateAlert: string;
  translateSwitch: string;
  translateDismiss: string;
};
type TextsByLang = Record<string, LangTexts>;
type Theme = 'terminal' | 'liquid-glass' | 'os';

function detectTheme(): Theme {
  const path = window.location.pathname;
  if (path.startsWith('/os/')) return 'os';
  if (path.startsWith('/liquid-glass/')) return 'liquid-glass';
  return 'terminal';
}

export function initLangSuggest(
  pageLang: string,
  supportedLangs: string[],
  textsByLang: TextsByLang,
  theme?: Theme
) {
  const resolvedTheme = theme ?? detectTheme();
  if (supportedLangs.length <= 1) return;
  if (sessionStorage.getItem(DISMISS_KEY)) return;

  const preferred = detectPreferredLang(supportedLangs);
  if (!preferred || preferred === pageLang) {
    observeTranslation(pageLang, supportedLangs, textsByLang, resolvedTheme);
    return;
  }

  showBanner(preferred, textsByLang[preferred], resolvedTheme);
}

function detectPreferredLang(supported: string[]): string | null {
  const browserLangs = navigator.languages || [navigator.language];
  for (const bl of browserLangs) {
    const code = bl.toLowerCase().split('-')[0];
    if (supported.includes(code)) return code;
  }
  return null;
}

function observeTranslation(
  pageLang: string,
  supported: string[],
  textsByLang: TextsByLang,
  theme: Theme
) {
  const observer = new MutationObserver(() => {
    const htmlLang = document.documentElement.lang;
    const translated =
      document.documentElement.getAttribute('class')?.includes('translated') ||
      document.querySelector('html[translate]') !== null ||
      (htmlLang && htmlLang !== pageLang);

    if (!translated) return;

    const targetCode = htmlLang?.split('-')[0]?.toLowerCase();
    if (
      targetCode &&
      supported.includes(targetCode) &&
      targetCode !== pageLang
    ) {
      observer.disconnect();
      showBanner(targetCode, textsByLang[targetCode], theme);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang', 'class'],
  });
}

function buildHref(theme: Theme, lang: string): string {
  return `/${theme}/${lang}`;
}

function showBanner(targetLang: string, texts: LangTexts, theme: Theme) {
  if (sessionStorage.getItem(DISMISS_KEY)) return;
  if (document.getElementById('lang-suggest-banner')) return;
  if (!texts) return;

  const banner = document.createElement('div');
  banner.id = 'lang-suggest-banner';
  banner.className = 'lang-banner';
  banner.setAttribute('data-theme', theme);

  const href = buildHref(theme, targetLang);

  banner.innerHTML = `
    <span class="lang-banner__badge">${targetLang.toUpperCase()}</span>
    <span class="lang-banner__text">${texts.translateAlert}</span>
    <div class="lang-banner__actions">
      <a href="${href}" class="lang-banner__btn lang-banner__accept">${texts.translateSwitch}</a>
      <button class="lang-banner__btn lang-banner__dismiss" type="button">${texts.translateDismiss}</button>
    </div>
  `;

  const isOS = theme === 'os';
  if (isOS) {
    const desktop = document.querySelector('.os-desktop');
    (desktop || document.body).appendChild(banner);
  } else {
    document.body.prepend(banner);
  }

  requestAnimationFrame(() => banner.classList.add('lang-banner--open'));

  banner
    .querySelector('.lang-banner__dismiss')
    ?.addEventListener('click', () => {
      banner.classList.remove('lang-banner--open');
      sessionStorage.setItem(DISMISS_KEY, '1');
      setTimeout(() => banner.remove(), 300);
    });
}
