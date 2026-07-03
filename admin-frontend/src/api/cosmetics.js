import api from './auth';

// API admin des cosmétiques. Passe par l'instance partagée `api` (token +
// refresh silencieux + baseURL) — comme les autres modules admin.
export const cosmeticsAPI = {
  getSubmissions: async (status = 'pending') => {
    const response = await api.get(`/api/admin/cosmetic-submissions?status=${status}`);
    return response.data;
  },

  approveSubmission: async (submissionId, adminData) => {
    const response = await api.post(
      `/api/admin/cosmetic-submissions/${submissionId}/approve`,
      adminData,
    );
    return response.data;
  },

  rejectSubmission: async (submissionId) => {
    const response = await api.post(`/api/admin/cosmetic-submissions/${submissionId}/reject`);
    return response.data;
  },
};
