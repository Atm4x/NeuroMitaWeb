import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer>
      <div className="container">
        <p>{t('footer.copyright')}</p>
        <p style={{ marginTop: '10px' }}>
          <a href={t('config.links.github')} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            {t('footer.docsLink')}
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;