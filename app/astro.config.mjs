// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import compressor from 'astro-compressor';
import { languages, defaultLang } from './src/utils/i18n.ts';
import { validateProfileData } from './src/utils/validateData.ts';
import { validateUiData } from './src/utils/validateUi.ts';
import { readFileSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const baseProfile = JSON.parse(
  readFileSync('./src/data/profile/base.json', 'utf-8')
);
const themes = ['terminal', 'liquid-glass', 'os'];
const defaultTheme = themes.includes(baseProfile.theme)
  ? baseProfile.theme
  : 'terminal';

/** Validate all profile JSON data at build start and warn about missing fields */
function validateDataIntegration() {
  return {
    name: 'validate-data',
    hooks: {
      'astro:build:start': () => {
        const base = JSON.parse(
          readFileSync('./src/data/profile/base.json', 'utf-8')
        );

        for (const lang of languages) {
          const profilePath = `./src/data/profile/${lang}/profile.json`;
          if (!existsSync(profilePath)) {
            console.warn(`[validate-data] Could not read ${profilePath}`);
            continue;
          }
          const profile = JSON.parse(readFileSync(profilePath, 'utf-8'));
          const merged = { ...base, ...profile };
          const result = validateProfileData(merged, lang);
          if (!result.valid) {
            for (const error of result.errors) {
              console.warn(`[validate-data] ${error}`);
            }
          }

          for (const theme of themes) {
            const uiPath = `./src/data/ui/${theme}/${lang}/ui.json`;
            if (!existsSync(uiPath)) continue;
            const ui = JSON.parse(readFileSync(uiPath, 'utf-8'));
            const uiResult = validateUiData(ui, theme, lang);
            if (!uiResult.valid) {
              for (const error of uiResult.errors) {
                console.warn(`[validate-data] ${error}`);
              }
            }
          }
        }

        console.log('[validate-data] Build-time data validation complete');
      },
    },
  };
}

/** Copy /{defaultTheme}/{lang} → /{lang} so the default theme renders at root */
function rootLangPages() {
  return {
    name: 'root-lang-pages',
    hooks: {
      'astro:build:done': (/** @type {{ dir: URL }} */ { dir }) => {
        const dist = fileURLToPath(dir);
        for (const lang of languages) {
          cpSync(join(dist, defaultTheme, lang), join(dist, lang), {
            recursive: true,
          });
        }
        console.log(
          `[root-lang-pages] Copied /${defaultTheme}/{lang} → /{lang}`
        );
      },
    },
  };
}

export default defineConfig({
  integrations: [
    validateDataIntegration(),
    tailwind(),
    sitemap(),
    rootLangPages(),
    compressor(),
  ],
  i18n: {
    defaultLocale: defaultLang,
    locales: [...languages],
  },
});
