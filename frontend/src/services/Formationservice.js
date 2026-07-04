import api from '../api/axios';

// ── POST /app/formations ─────────────────────────────────────────────
export const createFormation = async (payload) => {
  const user = JSON.parse(localStorage.getItem('brn_user') || '{}');
  const fullPayload = {
    ...payload,
    id_formateur:  payload.id_formateur  || user.id,
    nom_formateur: payload.nom_formateur || user.name || '',
  };
  const response = await api.post('/app/formations', fullPayload);
  return response.data.formation ?? response.data;
};

// ── PUT /app/formations/{id} ─────────────────────────────────────────
export const updateFormation = async (id, payload) => {
  const response = await api.put(`/app/formations/${id}`, payload);
  return response.data.formation ?? response.data;
};

// get formations d'un formateur
export const fetchFormations = async (user_id) => {
    const response = await api.get(`/app/formations/formateur/${user_id}`);
    const data = Array.isArray(response.data) ? response.data : response.data.data ?? [];
    return data;
};

// get stats KPI d'un formateur — GET /app/formations/formateur/{id}/stats
export const fetchFormationStats = async (user_id) => {
    const response = await api.get(`/app/formations/formateur/${user_id}/stats`);
    return response.data;
};

// ── DELETE /app/formations/{id} ──────────────────────────────────────
export const deleteFormation = async (id) => {
  await api.delete(`/app/formations/${id}`);
  return id;
};

// ── GET /app/formations/{id}/candidats ───────────────────────────────
// Laravel retourne : [ { name, email, prenom, created_at }, ... ]
export const fetchCandidats = async (formationId) => {
  const response = await api.get(`/app/formations/${formationId}/candidats`);
  const data = Array.isArray(response.data) ? response.data : response.data.data ?? [];
  return data.map(c => ({
    id: c.id,
    name:      c.name,
    prenom:    c.prenom    ?? '',
    email:     c.email,
    adresse:   c.adresse   ?? '—',
    status:    c.statut    ?? 'Inconnu',
    dateInscription: c.created_at
      ? new Date(c.created_at).toLocaleDateString('fr-FR')
      : '—',
    avatar: `https://i.pravatar.cc/150?u=${c.email}`,
  }));
};

export const fetchTouteFormations = async () => {
    const response = await api.get('/app/formations');
    return response.data;
}

export const fetchFormationsDetaill = async (id) => {
  const response = await api.get(`/app/formations/${id}`);
  return response.data;
};

// ── GET /app/resources/formation/{id} ─────────────────────────────────────
export const fetchResources = async (formationId) => {
  const response = await api.get(`/app/resources/formation/${formationId}`);
  return Array.isArray(response.data) ? response.data : response.data.data ?? [];
};

// ── POST /app/resources (multipart/form-data) ─────────────────────────────
export const uploadResource = async (formationId, title, file) => {
  const formData = new FormData();
  formData.append('formation_id', formationId);
  formData.append('title', title);
  formData.append('file', file);
  const response = await api.post('/app/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ── DELETE /app/resources/delete/{id} ─────────────────────────────────────
export const deleteResource = async (id) => {
  await api.delete(`/app/resources/delete/${id}`);
  return id;
};

// ── GET /app/formations/formateur/{id}/demandes ───────────────────────────
// Toutes les inscriptions (tous statuts) pour les formations du formateur
export const fetchFormateuresDemandes = async (userId) => {
  const response = await api.get(`/app/formations/formateur/${userId}/demandes`);
  return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
};

// ── PATCH /app/inscriptions/candidats/{id}/vue ────────────────────────────
export const markDemandeVue = async (id) => {
  await api.patch(`/app/inscriptions/candidats/${id}/vue`);
};

// ── GET /app/formations/formateur/{id}/export-csv ─────────────────────────
export const exportFormationsCSV = (userId) => {
  const token = localStorage.getItem('token') ||
    (() => { try { return JSON.parse(localStorage.getItem('brn_user') || '{}').token; } catch { return ''; } })();
  const url = `http://localhost/api/app/formations/formateur/${userId}/export-csv`;
  const a = document.createElement('a');
  a.href = token ? `${url}?token=${encodeURIComponent(token)}` : url;
  a.download = `mes-formations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};