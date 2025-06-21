import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // URL вашего backend'а
});

// Interceptor для добавления JWT токена в заголовки
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;