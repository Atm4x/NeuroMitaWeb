import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPrompts } from '../api/promptsApi';
import PromptCard from '../components/PromptCard';
import PromptModal from '../components/PromptModal';
import '../styles/PromptsPage.css';

const PromptsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const characters = t('promptsPage.characters', { returnObjects: true });

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      const data = await getPrompts();
      setPrompts(data);
      setIsLoading(false);
    };
    fetchPrompts();
  }, []);

  const handleOpenModal = (prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const filteredPrompts = activeTab === 'all'
    ? prompts
    : prompts.filter(p => p.characterId === activeTab);
    
  const getCharacterNameById = (id) => {
    const character = characters.find(c => c.id === id);
    return character ? character.name : 'Unknown';
  };

  return (
    <>
      <div className="page-container">
        <div className="container">
          <h1 className="page-title">{t('promptsPage.title')}</h1>
          
          <div className="tabs-container">
            {/* ...Кнопки вкладок без изменений... */}
             <button 
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                {t('promptsPage.all')}
              </button>
              {characters.map(char => (
                <button 
                  key={char.id}
                  className={`tab-button ${activeTab === char.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(char.id)}
                >
                  {char.name}
                </button>
              ))}
          </div>

          {isLoading ? (
            <div className="loading-indicator">{t('promptsPage.loading')}</div>
          ) : (
            <div className="prompts-grid">
              {filteredPrompts.map(prompt => (
                <PromptCard 
                  key={prompt.id} 
                  prompt={prompt}
                  characterName={getCharacterNameById(prompt.characterId)}
                  onOpenModal={handleOpenModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <PromptModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        prompt={selectedPrompt}
        characterName={selectedPrompt ? getCharacterNameById(selectedPrompt.characterId) : ''}
      />
    </>
  );
};

export default PromptsPage;