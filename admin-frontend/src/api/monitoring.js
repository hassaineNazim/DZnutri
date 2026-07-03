import api from './auth';

export const monitoringAPI = {
  // Récupère l'agrégat complet du dashboard de monitoring (+ analytics).
  getDashboard: async () => {
    const response = await api.get('/api/admin/monitoring');
    return response.data;
  },

  // Lance le rescoring de toute la base (après un changement d'algorithme).
  startRescore: async () => {
    const response = await api.post('/api/admin/rescore');
    return response.data;
  },

  // Progression du rescoring en cours (ou résultat du dernier).
  getRescoreStatus: async () => {
    const response = await api.get('/api/admin/rescore/status');
    return response.data;
  },
};
