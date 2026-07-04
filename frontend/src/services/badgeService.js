import api from '../api/axios';

const badgeService = {
  // Récupérer tous les badges
  getAllBadges: async () => {
    try {
      const response = await api.get('app/badges');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des badges:', error);
      throw error;
    }
  },

  // Récupérer un badge par ID
  getBadgeById: async (id) => {
    try {
      const response = await api.get(`app/badges/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du badge:', error);
      throw error;
    }
  },

  // Créer un nouveau badge
  createBadge: async (badgeData) => {
    try {
      const response = await api.post('app/badges', badgeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du badge:', error);
      throw error;
    }
  },

  // Mettre à jour un badge
  updateBadge: async (id, badgeData) => {
    try {
      const response = await api.put(`app/badges/${id}`, badgeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du badge:', error);
      throw error;
    }
  },

  // Supprimer un badge
  deleteBadge: async (id) => {
    try {
      const response = await api.delete(`app/badges/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du badge:', error);
      throw error;
    }
  },

  // Récupérer l'historique des attributions pour un badge
  getBadgeLearners: async (badgeId) => {
    try {
      const response = await api.get(`app/badges/${badgeId}/learners`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des apprenants:', error);
      throw error;
    }
  },

  // Attribuer un badge à un utilisateur
  assignBadge: async (badgeId, { user_id, user_name, user_role, note }) => {
    try {
      const response = await api.post(`app/badges/${badgeId}/assign`, {
        user_id, user_name, user_role, note
      });
      return response.data;
    } catch (error) {
      console.error('Erreur attribution badge:', error);
      throw error;
    }
  },

  // Révoquer une attribution
  revokeBadge: async (badgeId, assignmentId) => {
    try {
      const response = await api.delete(`app/badges/${badgeId}/assign/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur révocation badge:', error);
      throw error;
    }
  }
};

export default badgeService;