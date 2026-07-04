import api from '../api/axios';

const notificationService = {
  // Récupérer toutes les notifications (actives)
  getAllNotifications: async () => {
    try {
      const response = await api.get('app/notifications');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw error;
    }
  },

  // Récupérer les notifications archivées
  getArchivedNotifications: async () => {
    try {
      const response = await api.get('app/notifications/archived');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération notifications archivées:', error);
      throw error;
    }
  },

  // Récupérer une notification spécifique
  getNotification: async (id) => {
    try {
      const response = await api.get(`app/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération notification:', error);
      throw error;
    }
  },

  // Marquer comme lue
  markAsRead: async (id) => {
    try {
      const response = await api.put(`app/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Erreur marquage lecture:', error);
      throw error;
    }
  },

  // Marquer toutes comme lues
  markAllAsRead: async () => {
    try {
      const response = await api.put('app/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Erreur marquage global:', error);
      throw error;
    }
  },

  // Archiver une notification
  archiveNotification: async (id) => {
    try {
      const response = await api.put(`app/notifications/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Erreur archivage:', error);
      throw error;
    }
  },

  // Restaurer une notification
  restoreNotification: async (id) => {
    try {
      const response = await api.put(`app/notifications/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error('Erreur restauration:', error);
      throw error;
    }
  },

  // Supprimer une notification
  deleteNotification: async (id) => {
    try {
      const response = await api.delete(`app/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }
  },

  // Générer un rapport PDF pour une notification
  generatePDF: async (id) => {
    try {
      const response = await api.get(`app/notifications/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `notification-${id}-rapport.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  },

  // Créer une notification (admin/formateur)
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('app/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  },

  // Récupérer les notifications par rôle
  getNotificationsByRole: async (role) => {
    try {
      const response = await api.get(`app/notifications/role/${role}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération par rôle:', error);
      throw error;
    }
  },

  // Récupérer les notifications par type
  getNotificationsByType: async (type) => {
    try {
      const response = await api.get(`app/notifications/type/${type}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération par type:', error);
      throw error;
    }
  }
};

export default notificationService;