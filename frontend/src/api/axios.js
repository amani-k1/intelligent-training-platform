import axios from 'axios';

// Fonction de redirection dynamique pour l'environnement de développement local (sans Nginx port 80)
const rewriteUrl = (config) => {
  let url = config.url;

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    // Si l'URL relative ne commence pas par /api ou api, on uniformise
    if (!url.startsWith('/api') && !url.startsWith('api')) {
      url = '/api/' + url.replace(/^\/+/, '');
    }

    // Extraction de la partie après "/api"
    const cleanPath = url.replace(/^\/?api\/?/, '');

    if (cleanPath.startsWith('auth/')) {
      // AUTH SERVICE -> via Nginx gateway (/api/auth/... → service-1)
      config.url = 'http://localhost/api/' + cleanPath;
    } else if (cleanPath.startsWith('inscriptions')) {
      // INSCRIPTIONS SERVICE
      // Route via gateway to avoid CORS / direct port access from browser
      if (config.method?.toLowerCase() === 'post') {
        // for inscription creation POST -> gateway will forward to service-2
        config.url = 'http://localhost/api/inscriptions';
      } else {
        // Otherwise admin actions -> go through gateway to service-1/service-2 as configured
        config.url = 'http://localhost/api/' + cleanPath;
      }
    } else if (cleanPath.startsWith('app/')) {
      // APP (admin) routes -> go through gateway and keep 'app/' prefix so nginx routes to service-2
      config.url = 'http://localhost/api/' + cleanPath;
    } else {
      // FALLBACK -> via Nginx gateway
      config.url = 'http://localhost/api/' + cleanPath;
    }
    
  }

  // Auto-injection du token pour soigner les requêtes
  let token = localStorage.getItem('token');
  if (!token) {
    try {
      const user = JSON.parse(localStorage.getItem('brn_user') || '{}');
      token = user.token || user.token_access;
    } catch (e) {}
  }
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

// 1. Configurer l'instance personnalisée 'api' utilisée dans les services
// NOTE: keep baseURL empty so rewriteUrl produces a single `/api/...` path
const api = axios.create({
  baseURL: '',
});

api.interceptors.request.use(rewriteUrl);

// 2. Configurer également l'instance globale 'axios' importée directement dans les composants
axios.interceptors.request.use(rewriteUrl);

export default api;

