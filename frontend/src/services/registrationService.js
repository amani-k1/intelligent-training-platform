import api from '../api/axios';

const registrationService = {
  // Récupérer toutes les demandes de candidats (admin)
  getAllCandidatRequests: async () => {
    try {
      const response = await api.get('app/demandes/candidats');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération demandes candidats:', error);
      throw error;
    }
  },

  // Récupérer toutes les demandes de formateurs (admin)
  getAllFormateurRequests: async () => {
    try {
      const response = await api.get('app/demandes/formateurs');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération demandes formateurs:', error);
      throw error;
    }
  },

  // Récupérer les candidats d'une formation spécifique
  getCandidatsByFormation: async (formationId) => {
    try {
      const response = await api.get(`app/formations/${formationId}/candidats`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération candidats par formation:', error);
      throw error;
    }
  },

  // Récupérer les candidats par statut
  getCandidatsByStatut: async (statut) => {
    try {
      const response = await api.get(`app/candidats/statut/${statut}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération candidats par statut:', error);
      throw error;
    }
  },

  // Récupérer les formateurs par statut
  getFormateursByStatut: async (statut) => {
    try {
      const response = await api.get(`app/formateurs/statut/${statut}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération formateurs par statut:', error);
      throw error;
    }
  },

  // Accepter un candidat
  accepterCandidat: async (id) => {
    try {
      const response = await api.post(`app/demandes/candidats/accepter/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur acceptation candidat:', error);
      throw error;
    }
  },

  // Refuser un candidat
  refuserCandidat: async (id) => {
    try {
      const response = await api.post(`app/demandes/candidats/refuser/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur refus candidat:', error);
      throw error;
    }
  },

  // Accepter un formateur
  accepterFormateur: async (id) => {
    try {
      const response = await api.post(`app/demandes/formateurs/accepter/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur acceptation formateur:', error);
      throw error;
    }
  },

  // Refuser un formateur
  refuserFormateur: async (id) => {
    try {
      const response = await api.post(`app/demandes/formateurs/refuser/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur refus formateur:', error);
      throw error;
    }
  },

  // Supprimer une demande candidat
  deleteCandidat: async (id) => {
    try {
      const response = await api.delete(`app/inscriptions/candidats/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression candidat:', error);
      throw error;
    }
  },

  // Supprimer une demande formateur
  deleteFormateur: async (id) => {
    try {
      const response = await api.delete(`app/inscriptions/formateurs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression formateur:', error);
      throw error;
    }
  },

  // Télécharger le CV
  telechargerCV: async (id, type = 'candidat') => {
    try {
      const response = await api.get(`app/telecharger-cv/${id}/${type}`, {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cv-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Erreur téléchargement CV:', error);
      throw error;
    }
  },

  // Récupérer les formations pour le filtre
  getFormations: async () => {
    try {
      const response = await api.get('app/formations');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération formations:', error);
      throw error;
    }
  }
};

export default registrationService;