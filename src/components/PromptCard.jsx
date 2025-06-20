import React from 'react';
import { useTranslation } from 'react-i18next';
import DownloadIcon from './icons/DownloadIcon';

const PromptCard = ({ prompt, characterName, onOpenModal }) => {
  const { t } = useTranslation();
  
  // Получаем URL для скачивания последней версии
  const latestVersionUrl = prompt.versions && prompt.versions.length > 0 ? prompt.versions[0].downloadUrl : '#';

  return (
    <div className="prompt-card">
      <div className="prompt-badge-character">{characterName}</div>
      <div className={`prompt-badge-type ${prompt.type.toLowerCase()}`}>{prompt.type}</div>
      
      <h3 className="prompt-title">{prompt.title}</h3>
      
      <div className="prompt-meta">
        <span>{t('promptsPage.card.creator')}: <strong>{prompt.creator}</strong></span>
        <span className="prompt-last-updated">{t('promptsPage.card.lastUpdated')}: {new Date(prompt.lastUpdated).toLocaleDateString()}</span>
      </div>

      <p className="prompt-description">{prompt.description}</p>
      
      <div className="prompt-card-actions">
        <button className="btn btn-secondary" onClick={() => onOpenModal(prompt)}>
          {t('promptsPage.card.details')}
        </button>
        <a href={latestVersionUrl} className="btn btn-primary">
          <DownloadIcon />
        </a>
      </div>
    </div>
  );
};

export default PromptCard;