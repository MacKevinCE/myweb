/**
 * Terminal Engine — Shared types.
 */

export interface FSNode {
  type: 'file' | 'dir';
  name: string;
  content?: string;
  children?: FSNode[];
}

export interface ProfileData {
  about: {
    role: string;
    tagline: string;
    location: string;
    available: string;
    bio: string[];
    metrics: { value: string; label: string }[];
    languages: { text: string }[];
  };
  skills: {
    categories: {
      title: string;
      items: { name: string; level: number }[];
    }[];
  };
  experience: {
    jobs: {
      company: string;
      role: string;
      startDate: string;
      endDate: string;
      location: string;
      description: string;
      tags: string[];
    }[];
  };
  projects: {
    featured: {
      visible: boolean;
      name: string;
      description: string;
      tags: string[];
      repo: string;
    };
    items: {
      name: string;
      description: string;
      tags: string[];
      repo: string;
    }[];
  };
  education: {
    degrees: {
      badge: string;
      title: string;
      institution: string;
      period: string;
      details: string;
    }[];
    certifications: { name: string; year: string }[];
  };
  contact: {
    links: Record<string, { label: string; url: string; displayText: string }>;
  };
}
