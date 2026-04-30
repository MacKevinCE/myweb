import type { Theme } from '../utils/themes';

/* ---- Code block (base.json) ---- */

export interface CodeBlockToken {
  t: string;
  c?: string;
}

export type CodeBlockLine = CodeBlockToken[];

/* ---- Contact links (base.json) ---- */

export interface ContactLink {
  label: string;
  url: string;
  displayText?: string;
}

export interface ContactLinks {
  github: ContactLink;
  linkedin: ContactLink;
  email: ContactLink;
}

/* ---- Profile base (from profile/base.json) ---- */

export interface ProfileBaseAbout {
  avatar: string;
  avatarUrl: string;
  avatarName: string;
}

export interface ProfileBaseFooter {
  tagline: string;
}

export interface ProfileBaseBrowser {
  bookmarks: Array<{ name: string; url: string }>;
}

export interface ProfileBase {
  theme: Theme;
  about: ProfileBaseAbout;
  codeBlock: CodeBlockLine[];
  contact: { links: ContactLinks };
  browser: ProfileBaseBrowser;
  footer: ProfileBaseFooter;
}

/* ---- Profile content (from profile/{lang}/profile.json) ---- */

export interface Meta {
  title: string;
  description: string;
}

export interface Metric {
  value: string;
  label: string;
}

export interface Language {
  text: string;
}

export interface StatusBarItem {
  key: string;
  value: string;
}

export interface About {
  role: string;
  tagline: string;
  location: string;
  available: string;
  avatarRole: string;
  bio: string[];
  metrics: Metric[];
  languages: Language[];
  statusBar: StatusBarItem[];
}

export interface Skill {
  name: string;
  level: number;
}

export interface SkillCategory {
  title: string;
  items: Skill[];
}

export interface Skills {
  categories: SkillCategory[];
}

export interface Job {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location?: string;
  description: string;
  tags: string[];
}

export interface Experience {
  jobs: Job[];
}

export interface FeaturedProject {
  visible: boolean;
  name: string;
  shortDesc: string;
  category: string;
  description: string;
  tags: string[];
  image: string;
  repo: string;
}

export interface ProjectItem {
  name: string;
  shortDesc: string;
  category: string;
  description: string;
  tags: string[];
  image?: string;
  repo: string;
  url?: string;
}

export interface Projects {
  featured: FeaturedProject;
  items: ProjectItem[];
}

export interface Degree {
  extra: string;
  badge: string;
  title: string;
  institution: string;
  period: string;
  details: string;
}

export interface Certification {
  name: string;
  year: string;
  issuer: string;
  image: string;
  verifyUrl?: string;
}

export interface Education {
  degrees: Degree[];
  certifications: Certification[];
}

export interface Article {
  title: string;
  date: string;
  tags: string[];
  summary: string;
  content: string;
}

export interface CodeSnippet {
  title: string;
  language: string;
  description: string;
  code: string;
  output: string;
}

export interface ProfileContentFooter {
  copyright: string;
}

export interface ProfileContent {
  meta: Meta;
  about: About;
  skills: Skills;
  experience: Experience;
  projects: Projects;
  education: Education;
  articles: Article[];
  codeSnippets?: CodeSnippet[];
  footer: ProfileContentFooter;
}
