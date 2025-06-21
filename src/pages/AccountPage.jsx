import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, logout } from '../api/authService';
import '../styles/UserPages.css'; // Используем тот же файл стилей

const AccountPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(response => {
        setUser(response.data);
      })
      .catch(() => {
        // Если не удалось получить юзера, редирект на логин
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event("authChange")); // Уведомляем Header
    navigate('/');
  };

  if (loading) {
    return <div className="page-container"><div className="container loading-indicator">Loading...</div></div>;
  }

  if (!user) {
    return null; // или редирект
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="account-container">
          <div className="account-header">
            <img src={user.avatar_url} alt="User Avatar" className="account-avatar" />
            <div className="account-info">
              <h1 className="account-username">{user.username}</h1>
              <p className="account-email">{user.email}</p>
            </div>
          </div>

          <nav className="account-nav">
            <Link to="/my-prompts" className="account-nav-link">{t('account.myPrompts', 'My Prompts')}</Link>
            <Link to="/publish-prompt" className="account-nav-link">{t('account.publishPrompt', 'Publish a Prompt')}</Link>
            {user.is_superuser && (
              <Link to="/admin/moderation" className="account-nav-link admin-link">
                {t('account.adminPanel', 'Admin Panel')}
              </Link>
            )}
          </nav>

          <div className="account-actions">
            <button onClick={handleLogout} className="btn btn-secondary">
              {t('header.logout', 'Logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;