import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, logout } from '../api/authService';
import { getUserPrompts, publishNewPrompt, publishNewVersion } from '../api/promptService';
import '../styles/UserPages.css';
import DownloadIcon from '../components/icons/DownloadIcon';

// --- Компонент формы для создания/обновления промпта ---
const PromptForm = ({ promptToUpdate, onFormSubmit, onCancel, characters, loading }) => {
    const { t } = useTranslation();
    const isUpdate = !!promptToUpdate;

    const [formData, setFormData] = useState({
        title: '', character_id: 'crazy', type: 'FAN', description: '',
        extended_description: '', version_str: '1.0', notes: '',
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isUpdate) {
            const latestVersionNumber = parseFloat(promptToUpdate.versions[0]?.version_str || '1.0');
            setFormData({
                title: promptToUpdate.title,
                character_id: promptToUpdate.character_id,
                type: promptToUpdate.type,
                description: promptToUpdate.description,
                extended_description: promptToUpdate.extended_description,
                version_str: (latestVersionNumber + 0.1).toFixed(1),
                notes: ''
            });
        } else {
            setFormData({
                title: '', character_id: 'crazy', type: 'FAN', description: '', extended_description: '', version_str: '1.0', notes: ''
            });
        }
    }, [promptToUpdate, isUpdate]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleTypeChange = (e) => setFormData({ ...formData, type: e.target.checked ? 'LORE' : 'FAN' });
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile?.name.endsWith('.zip')) {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError(t('publishPrompt.errors.zipOnly'));
        }
    };

    const isFormValid = useMemo(() => (
        formData.title.trim() && formData.description.trim() && formData.extended_description.trim() && file
    ), [formData, file]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!isFormValid) return;

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('file', file);

        try {
            await onFormSubmit(data);
        } catch (err) {
            setError(err.response?.data?.detail || t('publishPrompt.errors.publishFailed'));
        }
    };

    return (
        <div className="publish-form-container">
            <div className="publish-form-header">
                <h3>{isUpdate ? `${t('account.updatePromptTitle')} "${promptToUpdate.title}"` : t('account.publishNewPromptTitle')}</h3>
                <button onClick={onCancel} className="btn btn-secondary btn-small">{t('account.backToList')}</button>
            </div>
            <form onSubmit={handleSubmit}>
                {error && <p className="form-error">{error}</p>}
                
                <div className="form-row">
                    <div className="form-row-label">{t('publishPrompt.labels.title')}</div>
                    <div className="form-row-control">
                        <input name="title" className="form-input" value={formData.title} onChange={handleChange} required disabled={loading || isUpdate} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-row-label">{t('publishPrompt.labels.character')}</div>
                    <div className="form-row-control">
                        <select name="character_id" className="form-select" value={formData.character_id} onChange={handleChange} disabled={loading || isUpdate}>
                            {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                     <div className="form-row-label">{t('publishPrompt.labels.promptType')}</div>
                     <div className="form-row-control">
                        <div className="toggle-switch-container">
                            <span>{t('publishPrompt.types.fan')}</span>
                            <div className="toggle-switch">
                                <input type="checkbox" id="promptTypeSwitch" checked={formData.type === 'LORE'} onChange={handleTypeChange} disabled={loading || isUpdate} />
                                <label htmlFor="promptTypeSwitch"></label>
                            </div>
                            <span>{t('publishPrompt.types.lore')}</span>
                        </div>
                     </div>
                </div>

                <div className="form-row">
                    <div className="form-row-label">{t('publishPrompt.labels.description')}</div>
                    <div className="form-row-control">
                        <textarea name="description" className="form-textarea" value={formData.description} onChange={handleChange} required disabled={loading || isUpdate} maxLength="200" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-row-label">{t('publishPrompt.labels.extendedDescription')}</div>
                    <div className="form-row-control">
                        <textarea name="extended_description" className="form-textarea" value={formData.extended_description} style={{minHeight: '150px'}} onChange={handleChange} required disabled={loading || isUpdate} />
                    </div>
                </div>
                
                <hr className="form-divider" />
                
                <div className="form-row">
                    <div className="form-row-label">{t('publishPrompt.labels.version')}</div>
                    <div className="form-row-control">
                        <input name="version_str" className="form-input" value={formData.version_str} onChange={handleChange} required disabled={loading} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-row-label">{t('publishPrompt.labels.notes')}</div>
                    <div className="form-row-control">
                        <input name="notes" className="form-input" value={formData.notes} onChange={handleChange} disabled={loading} />
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-row-label">{t('publishPrompt.labels.file')}</div>
                    <div className="form-row-control">
                        <div className="file-input-wrapper">
                            <input type="file" id="file" accept=".zip" onChange={handleFileChange} required className="file-input-hidden" disabled={loading} />
                            <label htmlFor="file" className="file-input-label"><DownloadIcon /><span>{file ? file.name : t('publishPrompt.placeholders.file')}</span></label>
                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-row-label"></div>
                    <div className="form-row-control">
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={!isFormValid || loading}>
                            {loading ? t('auth.loading') : (isUpdate ? t('account.submitUpdate') : t('publishPrompt.button'))}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};


// --- Компонент списка промптов ---
const MyPromptsList = ({ prompts, onUpdateClick, onPublishNewClick }) => {
    const { t } = useTranslation();
    const formatStatus = (status) => status ? status.replace(/_/g, ' ') : 'unknown';

    return (
        <div>
            <div className="account-content-header">
                <h2>{t('myPrompts.title')}</h2>
                <button onClick={onPublishNewClick} className="btn btn-primary">{t('myPrompts.publishButton')}</button>
            </div>
            {prompts.length === 0 ? (
                <div className="no-prompts-container">
                    <p>{t('myPrompts.noPrompts')}</p>
                </div>
            ) : (
                <div className="prompt-list-user">
                    {prompts.map(prompt => (
                        <div key={prompt.id} className="myprompts-item">
                            <div className="myprompts-item-header">
                                <h3>{prompt.title}</h3>
                                <button onClick={() => onUpdateClick(prompt)} className="btn btn-secondary btn-small">{t('account.addNewVersion')}</button>
                            </div>
                            <p className="myprompts-item-description">{prompt.description}</p>
                            <div className="myprompts-item-body">
                                <h4>{t('myPrompts.versionsTitle')}:</h4>
                                <ul className="versions-list-user">
                                    {[...prompt.versions]
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map(v => (
                                        <li key={v.id} className={`version-item-user status-item-${v.status}`}>
                                            <strong>v{v.version_str}</strong>
                                            <span className="version-separator">-</span>
                                            <span className={`status-text status-${v.status}`}>{formatStatus(v.status)}</span>
                                            <span className="version-separator">-</span>
                                            <span>{new Date(v.created_at).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Основной компонент страницы ---
const AccountPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    
    const [activeTab, setActiveTab] = useState('prompts');
    const [promptView, setPromptView] = useState('list');
    const [promptToUpdate, setPromptToUpdate] = useState(null);
    
    const characters = t('promptsPage.characters', { returnObjects: true });

    const fetchData = () => {
        setLoading(true);
        Promise.all([getCurrentUser(), getUserPrompts()])
            .then(([userResponse, promptsResponse]) => {
                setUser(userResponse.data);
                setPrompts(promptsResponse.data.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated)));
            })
            .catch(() => navigate('/login'))
            .finally(() => setLoading(false));
    };

    useEffect(fetchData, [navigate]);

    const handleLogout = () => {
        logout();
        window.dispatchEvent(new Event("authChange"));
        navigate('/');
    };

    const handleUpdateClick = (prompt) => {
        setPromptToUpdate(prompt);
        setPromptView('form');
    };

    const handlePublishNewClick = () => {
        setPromptToUpdate(null);
        setPromptView('form');
    };

    const handleBackToList = () => {
        setPromptView('list');
        setPromptToUpdate(null);
    };

    const handleFormSubmit = async (formData) => {
        setFormLoading(true);
        try {
            if (promptToUpdate) {
                await publishNewVersion(promptToUpdate.id, formData);
            } else {
                await publishNewPrompt(formData);
            }
            setPromptView('list');
            fetchData();
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return <div className="page-container"><div className="container loading-indicator">{t('auth.loading')}</div></div>;
    }
    if (!user) return null;

    return (
        <div className="account-page-wrapper">
            <div className="account-banner">
                <div className="container">
                    <div className="account-user-info">
                        <img src={user.avatar_url || '/vite.svg'} alt="User Avatar" className="account-avatar-banner" />
                        <div className="account-user-text">
                            <h1>{user.username}</h1>
                            <p>{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="account-nav-horizontal">
                <div className="container">
                    <button onClick={() => setActiveTab('prompts')} className={activeTab === 'prompts' ? 'active' : ''}>
                        {t('account.tabs.prompts')}
                    </button>
                    {user.is_superuser && (
                        <button onClick={() => navigate('/admin/moderation')} className="admin-link">
                            {t('account.adminPanel')}
                        </button>
                    )}
                    <button onClick={handleLogout} className="logout-button">{t('header.logout')}</button>
                </div>
            </div>

            <main className="account-content-area">
                <div className="container">
                    {activeTab === 'prompts' && (
                        promptView === 'list' ? (
                            <MyPromptsList
                                prompts={prompts}
                                onUpdateClick={handleUpdateClick}
                                onPublishNewClick={handlePublishNewClick}
                            />
                        ) : (
                            <PromptForm
                                promptToUpdate={promptToUpdate}
                                onFormSubmit={handleFormSubmit}
                                onCancel={handleBackToList}
                                characters={characters}
                                loading={formLoading}
                            />
                        )
                    )}
                </div>
            </main>
        </div>
    );
};

export default AccountPage;