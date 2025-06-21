import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../api/authService';
import '../styles/UserPages.css'; // Импортируем новые стили

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        window.dispatchEvent(new Event("authChange"));
        navigate('/my-prompts');
      }
    } catch (err) {
      const serverError = err.response?.data?.detail;
      const clientError = err.message;
      setError(serverError || clientError || t('auth.login.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="auth-container">
          <h1 className="page-title" style={{textAlign: 'center', marginBottom: '40px'}}>{t('auth.login.title')}</h1>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <p className="form-error">{error}</p>}
            <div className="form-group">
              <label htmlFor="email" className="form-label">{t('auth.login.emailLabel')}</label>
              <input 
                id="email"
                type="email" 
                className="form-input"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={loading} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">{t('auth.login.passwordLabel')}</label>
              <input 
                id="password"
                type="password" 
                className="form-input"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={loading} 
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? t('auth.loading', 'Loading...') : t('auth.login.button')}
            </button>
          </form>
          <p className="auth-switch-link">
            {t('auth.login.noAccount', "Don't have an account?")} <Link to="/register">{t('auth.login.registerLink', 'Register here')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;