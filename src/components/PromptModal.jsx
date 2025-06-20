import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DownloadIcon from './icons/DownloadIcon';

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

  return (
    <div className="prompt-modal-overlay" onClick={onClose}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2 className="modal-title">{prompt.title}</h2>
          <div className="modal-character-badge">{characterName}</div>
        </div>

        <div className="modal-main-content">
          <div className="modal-description-block">
            <h4 className="modal-block-title">{t('promptsPage.modal.aboutTitle')}</h4>
            <p>{prompt.extendedDescription}</p>
          </div>
          <div className="modal-meta-block">
            <h4 className="modal-block-title">{t('promptsPage.modal.metaTitle')}</h4>
            <ul>
              <li><strong>{t('promptsPage.card.creator')}:</strong> {prompt.creator}</li>
              <li><strong>{t('promptsPage.card.size')}:</strong> {prompt.tokens} {t('promptsPage.card.tokens')}</li>
              <li><strong>{t('promptsPage.modal.uploaded')}:</strong> {new Date(prompt.initialUpload).toLocaleDateString()}</li>
              <li><strong>{t('promptsPage.card.lastUpdated')}:</strong> {new Date(prompt.lastUpdated).toLocaleDateString()}</li>
            </ul>
          </div>
        </div>

        <div className="modal-versions-section">
          <h3 className="modal-section-title">{t('promptsPage.modal.versionHistory')}</h3>
          <ul className="versions-list">
            {prompt.versions.map((version) => (
              <li key={version.version} className="version-item">
                <div className="version-info">
                  <span className="version-number">{t('promptsPage.modal.version')} {version.version}</span>
                  <span className="version-date">({new Date(version.date).toLocaleDateString()})</span>
                </div>
                <p className="version-notes">{version.notes}</p>
                <a href={version.downloadUrl} className="btn btn-primary btn-small">
                  <DownloadIcon width="16" height="16" />
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default PromptModal;