import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import HamburgerIcon from './icons/HamburgerIcon';
import CloseIcon from './icons/CloseIcon';

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Используем useRef для хранения позиции скролла без вызова ре-рендеров
  const scrollY = useRef(0);

  useEffect(() => {
    if (isMenuOpen) {
      // 1. Запоминаем текущую позицию скролла
      scrollY.current = window.scrollY;
      
      // 2. Применяем стили для блокировки
      document.body.classList.add('no-scroll');
      document.body.style.top = `-${scrollY.current}px`;
    } else {
      // 3. Возвращаем все как было
      document.body.classList.remove('no-scroll');
      document.body.style.top = '';
      
      // 4. Восстанавливаем позицию скролла
      window.scrollTo(0, scrollY.current);
    }
    
    // Очистка на случай размонтирования компонента
    return () => {
      document.body.classList.remove('no-scroll');
      document.body.style.top = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="main-header">
        <div className="container header-container">
          <Link to="/" className="header-logo">
            НейроМита
          </Link>
          
          <div className="desktop-nav">
            <nav className="header-nav">
              <NavLink to="/">{t('header.nav.home')}</NavLink>
              <NavLink to="/prompts">{t('header.nav.prompts')}</NavLink>
            </nav>
            <LanguageSwitcher />
          </div>

          <button 
            className="hamburger-button"
            onClick={toggleMenu}
            aria-label="Открыть меню"
          >
            <HamburgerIcon />
          </button>
        </div>
      </header>

      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="header-logo" onClick={closeMenu}>
            НейроМита
          </Link>
          <button 
            className="close-menu-button" 
            onClick={toggleMenu}
            aria-label="Закрыть меню"
          >
            <CloseIcon />
          </button>
        </div>
        
        <div className="mobile-menu-content">
          <nav className="mobile-nav-links">
            <NavLink to="/" onClick={closeMenu}>{t('header.nav.home')}</NavLink>
            <NavLink to="/prompts" onClick={closeMenu}>{t('header.nav.prompts')}</NavLink>
          </nav>
        </div>
        
        <div className="mobile-menu-footer">
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );
};

export default Header;