import React from 'react';
import { useTranslation, Trans } from 'react-i18next'; // Импортируем Trans
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import WaveformIcon from './icons/WaveformIcon';
import SlidersIcon from './icons/SlidersIcon';
import InstallIcon from './icons/InstallIcon';
import UsersIcon from './icons/UsersIcon';
import CodeIcon from './icons/CodeIcon';

const featureIcons = [
  <BrainCircuitIcon className="feature-icon-svg" />,
  <WaveformIcon className="feature-icon-svg" />,
  <SlidersIcon className="feature-icon-svg" />,
  <InstallIcon className="feature-icon-svg" />,
  <UsersIcon className="feature-icon-svg" />,
  <CodeIcon className="feature-icon-svg" />
];

const Features = () => {
  const { t } = useTranslation();
  const featuresData = t('features.items', { returnObjects: true });

  return (
    <section id="features" className="section">
      <div className="container">
        <h2 className="section-title">{t('features.title')}</h2>
        
        <div className="features-container">
          {featuresData.map((feature, index) => (
            <div className="feature-item" key={index}>
              <div className="feature-icon-wrapper">
                {featureIcons[index]}
              </div>
              <div className="feature-text">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="warning-box">
          <Trans i18nKey="features.warning" />
        </div>
      </div>
    </section>
  );
};

export default Features;