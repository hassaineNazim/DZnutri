import api from './auth';

export const monitoringAPI = {
  // Récupère l'agrégat complet du dashboard de monitoring.
  getDashboard: async () => {
    const response = await api.get('/api/admin/monitoring');
    return response.data;
  },
};
