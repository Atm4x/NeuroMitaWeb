import api from './api';

/**
 * Получает список заявок, ожидающих модерации.
 * (Только для администраторов)
 * @returns {Promise<any>}
 */
export const getPendingRequests = () => {
  return api.get('/admin/requests/pending');
};

/**
 * Одобряет заявку на публикацию.
 * (Только для администраторов)
 * @param {number} requestId - ID заявки.
 * @returns {Promise<any>}
 */
export const approveRequest = (requestId) => {
  return api.post(`/admin/requests/${requestId}/approve`);
};

/**
 * Отклоняет заявку на публикацию.
 * (Только для администраторов)
 * @param {number} requestId - ID заявки.
 * @returns {Promise<any>}
 */
export const rejectRequest = (requestId) => {
  return api.post(`/admin/requests/${requestId}/reject`);
};