import api from './api';

/**
 * Получает публичный список одобренных промптов.
 * @param {number} page - Номер страницы.
 * @param {number} pageSize - Количество элементов на странице.
 * @param {string|null} characterId - ID персонажа для фильтрации.
 * @returns {Promise<any>}
 */
export const getPublicPrompts = (page = 1, pageSize = 20, characterId = null) => {
  const params = {
    page,
    page_size: pageSize,
  };
  if (characterId && characterId !== 'all') {
    params.character_id = characterId;
  }
  return api.get('/prompts', { params });
};

/**
 * Получает детальную информацию о конкретном промпте.
 * @param {number} promptId - ID промпта.
 * @returns {Promise<any>}
 */
export const getPromptById = (promptId) => {
  return api.get(`/prompts/${promptId}`);
};

/**
 * Получает список промптов, созданных текущим пользователем (включая неодобренные).
 * @returns {Promise<any>}
 */
export const getUserPrompts = () => {
  return api.get('/prompts/me');
};

/**
 * Публикует новый промпт или новую версию.
 * @param {FormData} formData - Данные формы, включая .zip файл.
 * @returns {Promise<any>}
 */
export const publishPrompt = (formData) => {
  return api.post('/prompts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Сюда же можно добавить функции для обновления промпта, создания новой версии и т.д.