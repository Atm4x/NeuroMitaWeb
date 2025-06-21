import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPendingRequests, approveRequest, rejectRequest } from '../api/adminService';
import { getCurrentUser } from '../api/authService';
import '../styles/UserPages.css';
import '../styles/PromptsPage.css';
import api from '../api/api';

const AdminModerationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Защита роута на клиенте
  useEffect(() => {
    getCurrentUser()
      .then(response => {
        if (!response.data.is_superuser) {
          navigate('/account'); // Если не админ, редирект в аккаунт
        }
      })
      .catch(() => {
        navigate('/login'); // Если не залогинен, на страницу входа
      });
  }, [navigate]);

  const handleDownload = async (downloadUrl) => {
    try {
      const response = await api.get(downloadUrl, {
        responseType: 'blob', // Важно для скачивания файлов
      });
      
      // Получаем имя файла из заголовков
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2)
          filename = filenameMatch[1];
      }

      // Создаем временную ссылку для скачивания файла браузером
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      setError("Failed to download file.");
    }
  };

  const fetchRequests = () => {
    setLoading(true);
    getPendingRequests()
      .then(response => {
        setRequests(response.data);
      })
      .catch(err => {
        setError('Failed to load moderation queue.');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(fetchRequests, []);

  const handleAction = async (action, requestId) => {
    try {
      await action(requestId);
      // Обновляем список, убирая обработанную заявку
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      setError(`Failed to process request #${requestId}.`);
      console.error(err);
    }
  };

  if (loading) return <div className="page-container"><div className="container loading-indicator">Loading moderation queue...</div></div>;

  return (
    <div className="page-container">
      <div className="container">
        <h1 className="page-title">{t('admin.title', 'Moderation Queue')}</h1>
        {error && <p className="form-error">{error}</p>}
        
        {requests.length === 0 ? (
          <p>{t('admin.noRequests', 'No pending requests. Great job!')}</p>
        ) : (
          <div className="moderation-list">
            {requests.map(req => (
              <div key={req.id} className="moderation-item">
                <div className="moderation-item-header">
                  <h3>{req.prompt_version.prompt.title} - v{req.prompt_version.version_str}</h3>
                  <span className="moderation-item-date">
                    {new Date(req.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="moderation-item-body">
                  <p><strong>{t('admin.requester', 'Requester')}:</strong> {req.requester.username}</p>
                  <p><strong>{t('admin.notes', 'Notes')}:</strong> {req.prompt_version.notes || 'N/A'}</p>
                </div>
                <div className="moderation-item-actions">
                  <button onClick={() => handleAction(approveRequest, req.id)} className="btn btn-approve">{t('admin.approve', 'Approve')}</button>
                  <button onClick={() => handleAction(rejectRequest, req.id)} className="btn btn-reject">{t('admin.reject', 'Reject')}</button>
                  {/* +++ НОВАЯ КНОПКА СКАЧИВАНИЯ +++ */}
                  {req.prompt_version.download_url && (
                    <a 
                      href={`http://localhost:8000${req.prompt_version.download_url}`} 
                      className="btn btn-secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownload(req.prompt_version.download_url);
                      }}
                    >
                      {t('admin.downloadPrompt', 'Download Prompt')}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModerationPage;