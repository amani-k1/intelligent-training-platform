import api from '../api/axios';



/**
 * Transforme un utilisateur Laravel → format attendu par le composant React
 * Laravel : { id, name, email, role, status, created_at }
 * React   : { id, name, email, role, status, date, avatar }
 */
const mapUser = (u) => ({
  id:     u.id,
  name:   u.name,
  email:  u.email,
  role:   u.role   ?? 'stagiaire',
  status: u.status ?? 'attente',
  date:   u.created_at
    ? new Date(u.created_at).toLocaleDateString('fr-FR')
    : '—',
  avatar: u.name?.charAt(0).toUpperCase() ?? '?',
});

// ── GET /auth/users ─────────────────────────────────────────────────
export const fetchUsers = async () => {
  const response = await api.get('/auth/users');
  // Laravel retourne un tableau direct [ {...}, {...} ]
  return response.data;
};

// ── POST /auth/users ────────────────────────────────────────────────
export const createUser = async (payload) => {
  // payload : { name, email, password, role, status }
  const response = await api.post('/auth/register', payload);
  return mapUser(response.data.user ?? response.data);
};

// ── PUT /auth/users/{id} ────────────────────────────────────────────
export const updateUser = async (id, payload) => {
  // payload : { name?, email?, role?, status? }
  const response = await api.put(`/auth/update-user/${id}`, payload);
  return mapUser(response.data.user ?? response.data);
};

// ── DELETE /auth/delete-user/{id} ───────────────────────────────────
export const deleteUser = async (id) => {
  await api.delete(`/auth/delete-user/${id}`);
  return id;
};

// ── PUT /auth/users/{id} — changer le statut uniquement ─────────────
export const updateUserStatus = async (id, status) => {
  // status : 'actif' | 'inactif' | 'attente'
  const response = await api.put(`/auth/update-user-status/${id}`, { status });
  return mapUser(response.data.user ?? response.data);
};

export const fetchCandidats = async (formateurId) => {
  const response = await api.get(`app/formateurs/${formateurId}/candidats`);
  const data = Array.isArray(response.data) ? response.data : response.data.data ?? [];
  return data.map(c => ({
    id:              c.id,                  // inscription_candidat.id (pour accepter/refuser)
    name:            c.nom      ?? 'Inconnu',
    prenom:          c.prenom   ?? '',
    email:           c.email    ?? '—',
    adresse:         c.adresse  ?? '—',
    telephone:       c.telephone ?? '—',
    etatCivil:       c.état_civil ?? '—',
    situation:       c.situation  ?? '—',
    format:          c.format     ?? '—',
    formationId:     c.formation_id ?? null,
    statut:          c.statut   ?? 'en_attente',
    dateInscription: c.created_at
      ? new Date(c.created_at).toLocaleDateString('fr-FR')
      : '—',
    avatar: `https://i.pravatar.cc/150?u=${c.email}`,
  }));
}