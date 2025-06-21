import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// +++ ИСПРАВЛЕНИЕ ЗДЕСЬ: ДОБАВЛЯЕМ getPromptById В ИМПОРТ +++
import { getPublicPrompts, getPromptById } from '../api/promptService';
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
  const [detailedPrompt, setDetailedPrompt] = useState(null);

  const characters = t('promptsPage.characters', { returnObjects: true });

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        const response = await getPublicPrompts(1, 20, activeTab);
        setPrompts(response.data);
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
        setPrompts([]);
      }
      setIsLoading(false);
    };
    fetchPrompts();
  }, [activeTab]);

  const handleOpenModal = async (promptFromCard) => {
    setSelectedPrompt(promptFromCard);
    setIsModalOpen(true);
    setDetailedPrompt(null);
    try {
        const response = await getPromptById(promptFromCard.id);
        setDetailedPrompt(response.data);
    } catch (error) {
        console.error("Failed to fetch prompt details:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
    setDetailedPrompt(null);
  };
    
  const getCharacterNameById = (id) => {
    const character = characters.find(c => c.id === id);
    return character ? character.name : 'Unknown';
  };

  const filteredPrompts = prompts;

  return (
    <>
      <div className="page-container">
        <div className="container">
          <h1 className="page-title">{t('promptsPage.title')}</h1>
          
          <div className="tabs-container">
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
              {filteredPrompts.length > 0 ? filteredPrompts.map(prompt => (
                <PromptCard 
                  key={prompt.id} 
                  prompt={prompt}
                  characterName={getCharacterNameById(prompt.character_id)}
                  onOpenModal={handleOpenModal}
                />
              )) : <p>No prompts found for this character.</p>}
            </div>
          )}
        </div>
      </div>
      <PromptModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        prompt={detailedPrompt || selectedPrompt}
        characterName={selectedPrompt ? getCharacterNameById(selectedPrompt.character_id || selectedPrompt.characterId) : ''}
      />
    </>
  );
};

export default PromptsPage;