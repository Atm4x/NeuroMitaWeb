import React from 'react';
import { useTranslation } from 'react-i18next';
import DownloadIcon from './icons/DownloadIcon';
import DiscordIcon from './icons/DiscordIcon';
import GithubIcon from './icons/GithubIcon';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="hero">
      <div className="hero-bg"></div>
      <div className="hero-content">
        <div className="title-wrapper">
          <span className="title-accent">{t('hero.accentTitle')}</span>
          <h1>{t('hero.title')}</h1>
          <span className="version-badge">{t('config.version')}</span>
        </div>
        <p className="subtitle">{t('hero.subtitle')}</p>
        
        <div className="hero-buttons">
          <a href={t('config.links.download')} className="btn btn-primary">
            <DownloadIcon /> {t('hero.buttons.download')}
          </a>
          <a href={t('config.links.discord')} className="btn">
            <DiscordIcon /> {t('hero.buttons.discord')}
          </a>
          <a href={t('config.links.github')} className="btn">
            <GithubIcon /> {t('hero.buttons.github')}
          </a>
        </div>
      </div>
      <div className="scroll-indicator"></div>
    </section>
  );
};

export default Hero;