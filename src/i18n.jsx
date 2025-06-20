import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationRU from './locales/ru/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  ru: {
    translation: translationRU
  }
};

i18n
  .use(LanguageDetector) // Обнаруживает язык пользователя
  .use(initReactI18next) // Передает i18n в react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Язык по умолчанию, если язык пользователя недоступен
    detection: {
      order: ['localStorage', 'navigator'], // Порядок определения: сначала смотрим в localStorage, потом в навигатор
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false // React уже защищает от XSS
    },
    react: {
      useSuspense: false // Отключаем Suspense для простоты
    }
  });

export default i18n;