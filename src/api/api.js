import axios from "axios";

// Ulož si URL do premennej, aby si ju mohol použiť
const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

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

export default api;