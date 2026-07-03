import api from './auth';

// API des signalements. Passe par l'instance partagée (`api`) qui gère le
// token, le refresh silencieux et la base URL — contrairement aux anciens
// appels axios "nus" qui dupliquaient tout ça.
export const reportsAPI = {
  // Signalements en attente (l'admin ne voit que le travail restant).
  getPending: async () => {
    const response = await api.get('/api/admin/reports');
    return response.data;
  },

  // Clore ou ignorer un signalement.
  updateStatus: async (reportId, status) => {
    const response = await api.put(`/api/admin/reports/${reportId}/status`, { status });
    return response.data;
  },
};
