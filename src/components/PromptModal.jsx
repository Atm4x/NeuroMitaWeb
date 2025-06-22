import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DownloadIcon from './icons/DownloadIcon';
import CharacterModelViewer from './CharacterModelViewer';
import api from '../api/api';

const handleDownload = async (downloadUrl, filename) => {
  try {
    const response = await api.get(downloadUrl, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

const PromptModal = ({ isOpen, onClose, prompt, characterName }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !prompt) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '...'; // Показываем многоточие во время загрузки
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  };

  // +++ ИСПРАВЛЕНИЕ ЗДЕСЬ +++
  // Определяем, какие данные использовать: детальные или базовые с карточки
  const displayData = prompt.creator?.username ? prompt : null;
  const baseData = prompt; // Данные с карточки всегда есть

  const latestVersion = displayData?.versions?.at(-1) || { tokens: baseData.tokens };

  return (
    <div className="prompt-modal-overlay" onClick={onClose}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2 className="modal-title">{baseData.title}</h2>
          <div className="modal-character-badge">{characterName}</div>
        </div>

        <div className="modal-layout-container">
          <div className="modal-model-column">
            <CharacterModelViewer characterId={baseData.character_id || baseData.characterId} />
          </div>

          <div className="modal-info-column">
            <div className="modal-main-content">
              <div className="modal-description-block">
                <h4 className="modal-block-title">{t('promptsPage.modal.aboutTitle')}</h4>
                {/* Показываем полное описание, если загрузилось, иначе краткое */}
                <p>{displayData?.extended_description || baseData.description}</p>
              </div>
              <div className="modal-meta-block">
                <h4 className="modal-block-title">{t('promptsPage.modal.metaTitle')}</h4>
                <ul>
                  {/* Показываем детальные данные, если есть, иначе базовые */}
                  <li><strong>{t('promptsPage.card.creator')}:</strong> {displayData?.creator?.username || baseData.creator}</li>
                  <li><strong>{t('promptsPage.card.size')}:</strong> {latestVersion.tokens} {t('promptsPage.card.tokens')}</li>
                  <li><strong>{t('promptsPage.modal.uploaded')}:</strong> {formatDate(displayData?.initial_upload)}</li>
                  <li><strong>{t('promptsPage.card.lastUpdated')}:</strong> {formatDate(displayData?.last_updated || baseData.last_updated || baseData.updated_at)}</li>
                </ul>
              </div>
            </div>

            <div className="modal-versions-section">
              <h3 className="modal-section-title">{t('promptsPage.modal.versionHistory')}</h3>
              <ul className="versions-list">
                {/* Рендерим только если детальные данные загружены */}
                {displayData && Array.isArray(displayData.versions) ? (
                  displayData.versions.toReversed().map((version) => (
                    // Используем `version.id` как ключ, он должен быть уникальным
                    <li key={version.id} className="version-item">
                      <div className="version-info">
                        <span className="version-number">{t('promptsPage.modal.version')} {version.version_str}</span>
                        <span className="version-date">({formatDate(version.date)})</span>
                      </div>
                      <p className="version-notes">{version.notes}</p>
                      
                      <button 
                        onClick={() => handleDownload(version.download_url, `${baseData.title}_v${version.version_str}.zip`)}
                        className="btn btn-primary btn-small"
                        disabled={!version.download_url}
                      >
                        <DownloadIcon width="16" height="16" />
                      </button>
                    </li>
                  ))
                ) : (
                  // Показываем заглушку во время загрузки
                  <li>{t('promptsPage.loading', 'Loading...')}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;