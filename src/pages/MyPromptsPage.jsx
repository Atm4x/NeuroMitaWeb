import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserPrompts } from '../api/promptService';
import '../styles/UserPages.css'; // Импортируем стили
import '../styles/PromptsPage.css'; // Для loading-indicator

// Вспомогательная функция для форматирования статуса
const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').toLowerCase();
};

const MyPromptsPage = () => {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUserPrompts()
      .then(response => {
        // Сортировка, чтобы новые промпты были сверху
        const sortedPrompts = response.data.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
        setPrompts(sortedPrompts);
      })
      .catch(err => {
        console.error("Failed to fetch user prompts", err);
        setError(t('myPrompts.errors.loadFailed', 'Failed to load prompts.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  if (loading) return <div className="page-container"><div className="container loading-indicator">{t('myPrompts.loading', 'Loading your prompts...')}</div></div>;
  if (error) return <div className="page-container"><div className="container form-error">{error}</div></div>;

  return (
    <div className="page-container">
      <div className="container">
        <div className="myprompts-header">
            <h1 className="page-title">{t('myPrompts.title', 'My Prompts')}</h1>
            <Link to="/publish-prompt" className="btn btn-primary">
                {t('myPrompts.publishButton', 'Publish New Prompt')}
            </Link>
        </div>
        
        {prompts.length === 0 ? (
            <p>{t('myPrompts.noPrompts', "You haven't published any prompts yet.")}</p>
        ) : (
            <div className="prompt-list-user">
            {prompts.map(prompt => (
                <div key={prompt.id} className="myprompts-item">
                    <div className="myprompts-item-header">
                        <h2>{prompt.title}</h2>
                        {/* Показываем статус последней версии */}
                        {prompt.versions.length > 0 && (
                            <div className={`status-badge status-${prompt.versions[0].status}`}>
                                {formatStatus(prompt.versions[0].status)}
                            </div>
                        )}
                    </div>
                    <div className="myprompts-item-body">
                        <p>{prompt.description}</p>
                        <h3>{t('myPrompts.versionsTitle', 'Versions')}:</h3>
                        <ul className="versions-list-user">
                        {prompt.versions.map(v => (
                            <li key={v.id} className="version-item-user">
                                <strong>v{v.version_str}</strong> - <span style={{ textTransform: 'capitalize' }}>{formatStatus(v.status)}</span> - <span>{new Date(v.created_at).toLocaleDateString()}</span>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default MyPromptsPage;