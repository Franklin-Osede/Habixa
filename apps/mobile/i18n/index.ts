import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import es from './locales/es.json';
import it from './locales/it.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';

import { getStoredItem, setStoredItem } from '../src/services/storage';

export const SUPPORTED_LOCALES = ['es', 'en', 'it', 'fr', 'de', 'pt'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const STORAGE_KEY = 'habixa.locale';

const resources = {
  en: { translation: en },
  es: { translation: es },
  it: { translation: it },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
};

function pickSupported(tag: string | undefined | null): SupportedLocale | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0] as SupportedLocale;
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? base : null;
}

async function resolveInitialLocale(): Promise<SupportedLocale> {
  const stored = pickSupported(await getStoredItem(STORAGE_KEY));
  if (stored) return stored;
  const deviceLocales = Localization.getLocales();
  for (const l of deviceLocales) {
    const match = pickSupported(l.languageTag) ?? pickSupported(l.languageCode);
    if (match) return match;
  }
  return 'es';
}

const initI18n = async () => {
  const lng = await resolveInitialLocale();

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

initI18n();

export async function setLocale(next: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(next);
  await setStoredItem(STORAGE_KEY, next);
}

export default i18n;
