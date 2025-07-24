import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  

  return config;
}, error => {
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Non authentifié
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          // Non autorisé
        
          break;
        case 419: // Session expirée
        case 423: // Session verrouillée
          // Rafraîchir la page pour obtenir un nouveau token CSRF
          window.location.reload();
          break;
      }
    }
    return Promise.reject(error);
  }
); 
