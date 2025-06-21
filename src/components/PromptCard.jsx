// src/components/PromptCard.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import DownloadIcon from './icons/DownloadIcon';

// Функция для создания ссылки для установщика
const createInstallerLink = (prompt, version) => {
  const fakeDownloadUrl = `https://neuromita.test/downloads/${prompt.id}/${version.version}.zip`;
  const params = new URLSearchParams({
    promptId: prompt.id,
    promptTitle: prompt.title,
    version: version.version,
    creator: prompt.creator,
    downloadUrl: fakeDownloadUrl // Используем фейковую ссылку для теста
  });
  return `neuromita-installer://install?${params.toString()}`;
};

const PromptCard = ({ prompt, characterName, onOpenModal }) => {
  const { t } = useTranslation();
  
  // Берем последнюю версию для главной кнопки скачивания
  const latestVersion = prompt.versions && prompt.versions.length > 0 ? prompt.versions[0] : null;
  const installerLink = latestVersion ? createInstallerLink(prompt, latestVersion) : '#';

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
        {/* Изменяем ссылку здесь */}
        <a href={installerLink} className="btn btn-primary">
          <DownloadIcon />
        </a>
      </div>
    </div>
  );
};

export default PromptCard;