export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that merged profile data contains all required fields
 * for the portfolio to render correctly.
 *
 * @param data - The merged profile object (base + lang-specific)
 * @param lang - Language code used for error context
 * @returns Validation result with list of missing/invalid fields
 */
export function validateProfileData(
  data: Record<string, unknown>,
  lang: string
): ValidationResult {
  const errors: string[] = [];
  const prefix = `[${lang}]`;

  const about = data.about as Record<string, unknown> | undefined;
  if (!about || typeof about !== 'object') {
    errors.push(`${prefix} Missing "about" section`);
  } else {
    if (!about.role || typeof about.role !== 'string') {
      errors.push(`${prefix} Missing "about.role"`);
    }
    if (!about.tagline || typeof about.tagline !== 'string') {
      errors.push(`${prefix} Missing "about.tagline"`);
    }
    if (!Array.isArray(about.bio) || about.bio.length === 0) {
      errors.push(`${prefix} Missing or empty "about.bio"`);
    }
  }

  const skills = data.skills as Record<string, unknown> | undefined;
  if (!skills || typeof skills !== 'object') {
    errors.push(`${prefix} Missing "skills" section`);
  } else {
    if (!Array.isArray(skills.categories) || skills.categories.length === 0) {
      errors.push(`${prefix} Missing or empty "skills.categories"`);
    }
  }

  const experience = data.experience as Record<string, unknown> | undefined;
  if (!experience || typeof experience !== 'object') {
    errors.push(`${prefix} Missing "experience" section`);
  } else {
    if (!Array.isArray(experience.jobs) || experience.jobs.length === 0) {
      errors.push(`${prefix} Missing or empty "experience.jobs"`);
    }
  }

  const education = data.education as Record<string, unknown> | undefined;
  if (!education || typeof education !== 'object') {
    errors.push(`${prefix} Missing "education" section`);
  } else {
    if (!Array.isArray(education.degrees)) {
      errors.push(`${prefix} Missing "education.degrees"`);
    }
  }

  const meta = data.meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') {
    errors.push(`${prefix} Missing "meta" section`);
  } else {
    if (!meta.title || typeof meta.title !== 'string') {
      errors.push(`${prefix} Missing "meta.title"`);
    }
    if (!meta.description || typeof meta.description !== 'string') {
      errors.push(`${prefix} Missing "meta.description"`);
    }
  }

  return { valid: errors.length === 0, errors };
}
