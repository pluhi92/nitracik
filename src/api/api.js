import axios from "axios";

// Ulož si URL do premennej, aby si ju mohol použiť
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ✅ EXTENDOVANIE: Pridáme vlastnú metódu pre obrázky
api.makeImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Ak je to externý link
  return `${BASE_URL}${path}`;              // Ak je to lokálna cesta
};

// Endpointy kde 401 je očakávané a nemá spôsobiť redirect
const NON_CRITICAL_ENDPOINTS = [
  '/api/gift-cards/user/',
];

// ✅ INTERCEPTOR PRE 401 RESPONSE (SESSION EXPIRATION)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isNonCritical = NON_CRITICAL_ENDPOINTS.some(endpoint => url.includes(endpoint));
      
      if (!isNonCritical) {
        console.log('[API Interceptor] Session expired, redirecting to login');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
