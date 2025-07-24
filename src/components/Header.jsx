import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, logout, getCurrentUser } from '../api/authService';
import HamburgerIcon from './icons/HamburgerIcon';
import CloseIcon from './icons/CloseIcon';

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const isAuth = !!currentUser;

  const fetchUser = () => {
    if (isAuthenticated()) {
      getCurrentUser()
        .then(response => setCurrentUser(response.data))
        .catch(() => {
          handleLogout(false);
        });
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const handleAuthChange = () => fetchUser();
    window.addEventListener('authChange', handleAuthChange);
    fetchUser();

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', isMenuOpen);
  }, [isMenuOpen]);

  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  const handleLogout = (shouldNavigate = true) => {
    logout();
    setCurrentUser(null);
    setIsMenuOpen(false);
    if (shouldNavigate) navigate('/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  const NavLinks = ({ onLinkClick }) => (
    <>
      <NavLink to="/" onClick={onLinkClick} className={({ isActive }) => isActive ? 'active' : ''}>{t('header.home')}</NavLink>
      <NavLink to="/prompts" onClick={onLinkClick} className={({ isActive }) => isActive ? 'active' : ''}>{t('header.prompts')}</NavLink>
      <NavLink to="/downloads" onClick={onLinkClick} className={({ isActive }) => isActive ? 'active' : ''}>{t('header.downloads', 'Downloads')}</NavLink>
      {isAuth ? (
        <NavLink to="/account" onClick={onLinkClick} className={({ isActive }) => isActive ? 'active' : ''}>
          {currentUser.username}
        </NavLink>
      ) : (
        <NavLink to="/login" onClick={onLinkClick} className={({ isActive }) => isActive ? 'active' : ''}>{t('header.login')}</NavLink>
      )}
    </>
  );

  const LanguageSwitcher = () => (
    <div className="language-switcher">
      <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
      <span className="lang-separator">|</span>
      <button onClick={() => changeLanguage('ru')} className={i18n.language === 'ru' ? 'active' : ''}>RU</button>
    </div>
  );

  return (
    <>
      <header className="main-header">
        <div className="container header-container">
          <NavLink to="/" className="header-logo">Neuromita</NavLink>
          
          <nav className="desktop-nav">
            <div className="header-nav">
              <NavLinks onLinkClick={() => {}} />
            </div>
            <LanguageSwitcher />
          </nav>

          <button className="hamburger-button" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
             <HamburgerIcon />
          </button>
        </div>
      </header>

      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <NavLink to="/" className="header-logo" onClick={closeMenu}>Neuromita</NavLink>
          <button className="close-menu-button" onClick={closeMenu} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <div className="mobile-menu-content">
          <nav className="mobile-nav-links">
            <NavLinks onLinkClick={closeMenu} />
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