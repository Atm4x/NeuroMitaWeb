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
 * Публикует совершенно новый промпт.
 * @param {FormData} formData - Данные формы, включая .zip файл.
 * @returns {Promise<any>}
 */
export const publishNewPrompt = (formData) => {
  return api.post('/prompts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Публикует новую версию для существующего промпта.
 * @param {number} promptId - ID существующего промпта.
 * @param {FormData} formData - Данные формы с информацией о новой версии.
 * @returns {Promise<any>}
 */
export const publishNewVersion = (promptId, formData) => {
  // Удаляем поля, которые не нужны для создания версии, чтобы избежать потенциальных ошибок валидации
  formData.delete('title');
  formData.delete('character_id');
  formData.delete('type');
  formData.delete('description');
  formData.delete('extended_description');

  return api.post(`/prompts/${promptId}/versions`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};