import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { register } from '../api/authService';
import '../styles/UserPages.css'; // Импортируем новые стили

const RegisterPage = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
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
      await register(username, email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || t('auth.register.fail', 'An error occurred during registration.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="auth-container">
          <h1 className="page-title" style={{textAlign: 'center', marginBottom: '40px'}}>{t('auth.register.title', 'Register')}</h1>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <p className="form-error">{error}</p>}
            <div className="form-group">
              <label htmlFor="username" className="form-label">{t('auth.register.usernameLabel', 'Username')}</label>
              <input 
                id="username"
                type="text" 
                className="form-input"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">{t('auth.register.emailLabel', 'Email')}</label>
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
              <label htmlFor="password" className="form-label">{t('auth.register.passwordLabel', 'Password')}</label>
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
              {loading ? t('auth.loading', 'Loading...') : t('auth.register.button', 'Register')}
            </button>
          </form>
          <p className="auth-switch-link">
            {t('auth.register.haveAccount', 'Already have an account?')} <Link to="/login">{t('auth.register.loginLink', 'Login here')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;