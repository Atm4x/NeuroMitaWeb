import React, { useState, useMemo } from 'react'; // +++ useMemo
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publishPrompt } from '../api/promptService';
import '../styles/UserPages.css';
import DownloadIcon from '../components/icons/DownloadIcon';

const PublishPromptPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        character_id: 'crazy',
        type: 'FAN', // Значение по умолчанию
        description: '',
        extended_description: '',
        version_str: '1.0',
        notes: '',
        tokens: 1000,
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const characters = t('promptsPage.characters', { returnObjects: true });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleTypeChange = (e) => {
        setFormData({ ...formData, type: e.target.checked ? 'LORE' : 'FAN' });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.zip')) {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError(t('publishPrompt.errors.zipOnly'));
        }
    };

    // +++ ЛОГИКА ВАЛИДАЦИИ ФОРМЫ +++
    const isFormValid = useMemo(() => {
        return (
            formData.title.trim() !== '' &&
            formData.description.trim() !== '' &&
            formData.extended_description.trim() !== '' &&
            file !== null
        );
    }, [formData, file]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            // Эта проверка на случай, если кнопка была разблокирована с помощью инспектора кода
            setError(t('publishPrompt.errors.fillAllFields', 'Please fill all required fields and select a file.'));
            return;
        }
        
        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('file', file);

        try {
            await publishPrompt(data);
            navigate('/my-prompts');
        } catch (err) {
            setError(err.response?.data?.detail || t('publishPrompt.errors.publishFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="container">
                <div className="publish-form-container">
                    <h1 className="page-title" style={{textAlign: 'center', marginBottom: '40px'}}>{t('publishPrompt.title')}</h1>
                    <form onSubmit={handleSubmit}>
                        {error && <p className="form-error">{error}</p>}
                        
                        <div className="form-group">
                            <label className="form-label" htmlFor="title">{t('publishPrompt.labels.title')}</label>
                            <input id="title" name="title" className="form-input" placeholder={t('publishPrompt.placeholders.title')} onChange={handleChange} required disabled={loading} />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="character_id">{t('publishPrompt.labels.character')}</label>
                            <select id="character_id" name="character_id" className="form-select" value={formData.character_id} onChange={handleChange} disabled={loading}>
                                {characters.map(char => (
                                    <option key={char.id} value={char.id}>{char.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* +++ НОВЫЙ ПЕРЕКЛЮЧАТЕЛЬ LORE/FAN +++ */}
                        <div className="form-group">
                            <label className="form-label">{t('publishPrompt.labels.promptType', 'Prompt Type')}</label>
                            <div className="toggle-switch-container">
                                <span>{t('publishPrompt.types.fan', 'Fan')}</span>
                                <div className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        id="promptTypeSwitch" 
                                        checked={formData.type === 'LORE'}
                                        onChange={handleTypeChange}
                                        disabled={loading}
                                    />
                                    <label htmlFor="promptTypeSwitch"></label>
                                </div>
                                <span>{t('publishPrompt.types.lore', 'Lore')}</span>
                            </div>
                            <p 
                                className="form-explanation"
                                dangerouslySetInnerHTML={{ __html: t('publishPrompt.explanations.type') }}
                            ></p>
                        </div>


                        <div className="form-group">
                            <label className="form-label" htmlFor="description">{t('publishPrompt.labels.description')}</label>
                            <textarea id="description" name="description" className="form-textarea" placeholder={t('publishPrompt.placeholders.description')} onChange={handleChange} required disabled={loading} maxLength="200" />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label" htmlFor="extended_description">{t('publishPrompt.labels.extendedDescription')}</label>
                            <textarea id="extended_description" name="extended_description" className="form-textarea" style={{minHeight: '200px'}} placeholder={t('publishPrompt.placeholders.extendedDescription')} onChange={handleChange} required disabled={loading} />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="version_str">{t('publishPrompt.labels.version')}</label>
                            <input id="version_str" name="version_str" className="form-input" value={formData.version_str} onChange={handleChange} required disabled={loading} />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="notes">{t('publishPrompt.labels.notes')}</label>
                            <textarea id="notes" name="notes" className="form-textarea" placeholder={t('publishPrompt.placeholders.notes')} onChange={handleChange} disabled={loading} />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="file">{t('publishPrompt.labels.file')}</label>
                            <div className="file-input-wrapper">
                                <input type="file" id="file" name="file" accept=".zip" onChange={handleFileChange} required className="file-input-hidden" disabled={loading} />
                                <label htmlFor="file" className="file-input-label">
                                    <DownloadIcon />
                                    <span>{file ? file.name : t('publishPrompt.placeholders.file')}</span>
                                </label>
                            </div>
                        </div>

                        {/* +++ КНОПКА ТЕПЕРЬ БЛОКИРУЕТСЯ +++ */}
                        <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '10px'}} disabled={!isFormValid || loading}>
                            {loading ? t('auth.loading') : t('publishPrompt.button')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PublishPromptPage;