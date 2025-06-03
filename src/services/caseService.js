import api from './api';

// Alle Fälle laden
export const getCases = async () => {
  const res = await api.get('/cases');
  return res.data;
};

// Neuen Fall anlegen
export const createCase = async (caseData) => {
  const res = await api.post('/cases', caseData);
  return res.data;
};

// Fall aktualisieren (optional)
export const updateCase = async (id, caseData) => {
  const res = await api.put(`/cases/${id}`, caseData);
  return res.data;
};

// Fall nach ID abrufen
export const getCaseById = async (id) => {
  const res = await api.get(`/cases/${id}`);
  return res.data;
};

// Fall löschen
export const deleteCase = async (id) => {
  const res = await api.delete(`/cases/${id}`);
  return res.data;
};

// Datenschutzerklärung-Status aktualisieren
export const patchDatenschutz = async (id, datenschutzAngenommen) => {
  const res = await api.patch(`/cases/${id}/datenschutz`, { datenschutzAngenommen });
  return res.data;
}; 