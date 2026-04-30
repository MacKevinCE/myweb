export const languages = ['es', 'en', 'pt'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'en';
