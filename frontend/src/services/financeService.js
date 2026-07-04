import api from '../api/axios';

const financeService = {
  // Statistiques globales
  getGlobalStats: async () => {
    try {
      const response = await api.get('/finance/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Données du graphique (évolution des revenus)
  getRevenueChart: async (timeframe) => {
    try {
      const response = await api.get(`/finance/revenue-chart?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du graphique:', error);
      throw error;
    }
  },

  // Transactions récentes
  getRecentTransactions: async () => {
    try {
      const response = await api.get('/finance/transactions');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      throw error;
    }
  },

  // Liste des clients (finance)
  getClientsFinance: async () => {
    try {
      const response = await api.get('/finance/clients');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  // Détail d'un client
  getClientDetail: async (clientId) => {
    try {
      const response = await api.get(`/finance/clients/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du détail client:', error);
      throw error;
    }
  },

  // Liste des formateurs (finance)
  getTrainersFinance: async () => {
    try {
      const response = await api.get('/finance/trainers');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des formateurs:', error);
      throw error;
    }
  },

  // Détail d'un formateur
  getTrainerDetail: async (trainerId) => {
    try {
      const response = await api.get(`/finance/trainers/${trainerId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du détail formateur:', error);
      throw error;
    }
  },

  // Générer un rapport PDF global
  generateGlobalReport: async () => {
    try {
      const response = await api.get('/finance/report/global', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw error;
    }
  },

  // Télécharger les factures d'un client
  downloadClientInvoices: async (clientId) => {
    try {
      const response = await api.get(`/finance/clients/${clientId}/invoices`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement des factures:', error);
      throw error;
    }
  },

  // Télécharger les relevés d'un formateur
  downloadTrainerReports: async (trainerId) => {
    try {
      const response = await api.get(`/finance/trainers/${trainerId}/reports`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement des relevés:', error);
      throw error;
    }
  }
};

export default financeService;