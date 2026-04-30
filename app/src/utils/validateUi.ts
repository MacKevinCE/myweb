import type { ValidationResult } from './validateData';

/**
 * Validates that UI string data contains the minimum required fields
 * shared across all themes (langSwitch and footer).
 *
 * @param data - The UI data object for a specific theme/lang
 * @param theme - Theme name used for error context
 * @param lang - Language code used for error context
 * @returns Validation result with list of missing/invalid fields
 */
export function validateUiData(
  data: Record<string, unknown>,
  theme: string,
  lang: string,
): ValidationResult {
  const errors: string[] = [];
  const prefix = `[${theme}/${lang}]`;

  const langSwitch = data.langSwitch as Record<string, unknown> | undefined;
  if (!langSwitch || typeof langSwitch !== 'object') {
    errors.push(`${prefix} Missing "langSwitch" section`);
  }

  const footer = data.footer as Record<string, unknown> | undefined;
  if (!footer || typeof footer !== 'object') {
    errors.push(`${prefix} Missing "footer" section`);
  }

  return { valid: errors.length === 0, errors };
}
