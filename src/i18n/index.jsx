import { createContext, useContext, useMemo } from 'react';
import en from './en';
import ru from './ru';

const BUNDLES = { en, ru };

function resolveLocale(language) {
  if (!language) return 'en';
  const lower = language.toLowerCase();
  if (lower.startsWith('ru')) return 'ru';
  return 'en';
}

function getByPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function format(template, vars) {
  if (!vars || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (m, key) => (vars[key] != null ? String(vars[key]) : m));
}

const I18nContext = createContext({
  locale: 'en',
  t: (key) => key,
});

export function I18nProvider({ language, children }) {
  const value = useMemo(() => {
    const locale = resolveLocale(language);
    const bundle = BUNDLES[locale] || BUNDLES.en;
    const t = (key, vars) => {
      const value = getByPath(bundle, key);
      if (value === undefined) {
        const fallback = getByPath(BUNDLES.en, key);
        return format(fallback !== undefined ? fallback : key, vars);
      }
      return format(value, vars);
    };
    return { locale, t };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
