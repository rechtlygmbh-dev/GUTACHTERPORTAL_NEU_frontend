import axios from 'axios';

// API-Basis-URL - Updated for Render deployment
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gutachterportal-neu-backend-9e0y.onrender.com/api' 
  : 'http://127.0.0.1:5000/api';

// Axios-Instanz erstellen
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 seconds timeout for Render (sometimes slow on free tier)
});

// Request-Interceptor für Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response-Interceptor für Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nur weiterleiten, wenn ein Token existiert (User ist eingeloggt)
    if (
      error.response &&
      error.response.status === 401 &&
      localStorage.getItem('token')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth-Service
export const authService = {
  // Benutzer registrieren
  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      // Nur speichern, wenn ein Benutzer-Objekt existiert (z.B. bei Login, nicht bei Registrierung)
      // if (response.data.erfolg && response.data.benutzer) {
      //   localStorage.setItem('token', response.data.benutzer.token);
      //   localStorage.setItem('user', JSON.stringify(response.data.benutzer));
      // }
      return response.data;
    } catch (error) {
      // Fehler-Response weiterreichen, damit das Frontend sie anzeigen kann
      throw error;
    }
  },

  // Benutzer anmelden
  login: async (email, passwort) => {
    const response = await api.post('/users/login', { email, passwort });
    if (response.data.erfolg) {
      localStorage.setItem('token', response.data.benutzer.token);
      localStorage.setItem('user', JSON.stringify(response.data.benutzer));
    }
    return response.data;
  },

  // Konto aktivieren
  activateAccount: async (token) => {
    const response = await api.post('/users/activate', { token });
    return response.data;
  },

  // Passwort zurücksetzen
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/users/reset-password', { 
      token, 
      newPassword 
    });
    return response.data;
  },

  // Konto aktivieren
  activateAccount: async (token) => {
    const response = await api.post('/users/activate', { token });
    return response.data;
  },

  // Passwort zurücksetzen
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/users/reset-password', { 
      token, 
      newPassword 
    });
    return response.data;
  },

  // Benutzer abmelden
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Benutzerprofil abrufen
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Benutzerprofil aktualisieren
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    if (response.data.erfolg) {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...currentUser, ...response.data.benutzer };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return response.data;
  },

  // Passwort-Reset-Link anfordern
  requestPasswordReset: async (email) => {
    const response = await api.post('/users/reset-password-request', { email });
    return response.data;
  },

  // Eigenes Konto löschen
  deleteOwnAccount: async () => {
    const response = await api.delete('/users/me');
    return response.data;
  }
};

// Fall-Service
export const caseService = {
  // Neuen Fall erstellen
  createCase: async (caseData) => {
    const response = await api.post('/cases', caseData);
    return response.data;
  },

  // Alle Fälle abrufen
  getCases: async (filter = {}) => {
    const response = await api.get('/cases', { params: filter });
    return response.data;
  },

  // Fall nach ID abrufen
  getCaseById: async (id) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  // Fall aktualisieren
  updateCase: async (id, caseData) => {
    const response = await api.put(`/cases/${id}`, caseData);
    return response.data;
  },

  // Fall löschen
  deleteCase: async (id) => {
    const response = await api.delete(`/cases/${id}`);
    return response.data;
  },

  // Notiz zu einem Fall hinzufügen
  addCaseNote: async (id, text) => {
    const response = await api.post(`/cases/${id}/notes`, { text });
    return response.data;
  }
};

// Dokument-Service
export const documentService = {
  // Dokument hochladen
  uploadDocument: async (formData) => {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Alle Dokumente abrufen
  getAllDocuments: async (filter = {}) => {
    const response = await api.get('/documents', { params: filter });
    return response.data;
  },

  // Dokumente eines Falls abrufen
  getDocumentsByCase: async (caseId) => {
    const response = await api.get(`/documents/case/${caseId}`);
    return response.data;
  },

  // Dokument nach ID abrufen
  getDocumentById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Dokument löschen
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Download-URL für ein Dokument erstellen
  getDownloadUrl: (id) => {
    return `${API_URL}/documents/${id}/download`;
  }
};

export default api;