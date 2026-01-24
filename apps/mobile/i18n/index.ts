import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';


import en from './locales/en.json';
import es from './locales/es.json';
import it from './locales/it.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  it: { translation: it },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
};

const initI18n = async () => {


  await i18n.use(initReactI18next).init({
    resources,
    lng: 'es', // default language to use
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false, // for react-native
    },
  });
};

initI18n();

export default i18n;
