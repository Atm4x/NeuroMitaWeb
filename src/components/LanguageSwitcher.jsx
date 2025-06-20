import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  const currentLanguage = i18n.language || 'en';
  const isRu = currentLanguage.startsWith('ru');

  return (
    <div className="language-switcher">
      <button 
        onClick={() => handleLanguageChange('en')}
        className={!isRu ? 'active' : ''}
      >
        EN
      </button>
      <span className="lang-separator">/</span>
      <button 
        onClick={() => handleLanguageChange('ru')}
        className={isRu ? 'active' : ''}
      >
        RU
      </button>
    </div>
  );
};

export default LanguageSwitcher;