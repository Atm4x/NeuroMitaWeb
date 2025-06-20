import React from 'react';
import { useTranslation } from 'react-i18next';

const cryptoData = [
    { label: 'ETH', address: '0xd1b91ff711f1315053f3C89EB9256eABF3Ee0377' },
    { label: 'USDT', address: '0xd1b91ff711f1315053f3C89EB9256eABF3Ee0377' },
    { label: 'BTC', address: 'bc1q3df4zlv40dhkhuq2asmh4we9jvqlnemey5u4cw' },
    { label: 'TRX', address: 'THi7QcfNyEmnaRzzoCpM6wyhhxvPBb5mJg' }
];

const Support = () => {
  const { t } = useTranslation();

  return (
    <section className="support-section">
      <div className="container">
        <h2 className="section-title">{t('support.title')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.2rem' }}>
          {t('support.subtitle')}
        </p>
        
        <a href={t('config.links.boosty')} className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '20px 40px' }}>
          {t('support.boostyButton')}
        </a>

        <div className="crypto-addresses">
          <h3 style={{ color: 'var(--accent)', marginBottom: '20px' }}>{t('support.cryptoTitle')}</h3>
          {cryptoData.map((crypto, index) => (
            <div className="crypto-item" key={index}>
              <span className="crypto-label">{crypto.label}:</span>
              <span>{crypto.address}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Support;