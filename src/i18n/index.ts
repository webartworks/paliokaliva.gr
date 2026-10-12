import { en, type Dictionary } from './en';
import { el } from './el';

export const locales = ['en', 'el'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const dictionaries: Record<Locale, Dictionary> = { en, el };

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

// English lives at the root, Greek under /el/.
export function localePath(locale: Locale, path: string): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'el' : 'en';
}

export const htmlLang: Record<Locale, string> = { en: 'en', el: 'el' };
export const ogLocale: Record<Locale, string> = { en: 'en_GB', el: 'el_GR' };
