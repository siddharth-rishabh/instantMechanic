import axios from 'axios';

export const backendUrl = (import.meta.env.VITE_API_URL || 'http://3.26.174.235:5000')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const api = axios.create({ baseURL: `${backendUrl}/api`, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => { const token = localStorage.getItem('instant-mechanic-token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((response) => response, (error) => { if (error.response?.status === 401) window.dispatchEvent(new Event('auth:expired')); return Promise.reject(error); });
export const getErrorMessage = (error) => error.response?.data?.message || error.message || 'Request failed.';
export default api;
