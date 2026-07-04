import api from '../api/axios';

// GET /auth/profile — récupère le profil complet de l'utilisateur connecté
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// PUT /auth/update-profile — met à jour les infos personnelles / professionnelles
export const updateProfile = async (data) => {
  const response = await api.put('/auth/update-profile', data);
  return response.data;
};

// POST /auth/update-password — change le mot de passe (current + new + confirm)
export const updatePassword = async ({ current_password, new_password, new_password_confirmation }) => {
  const response = await api.post('/auth/update-password', {
    current_password,
    new_password,
    new_password_confirmation,
  });
  return response.data;
};

// POST /auth/update-avatar — upload la photo de profil (multipart/form-data)
export const updateAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/auth/update-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
