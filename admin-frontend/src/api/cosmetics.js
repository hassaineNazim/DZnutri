import api from './auth';

// API admin des cosmétiques. Passe par l'instance partagée `api` (token +
// refresh silencieux + baseURL) — comme les autres modules admin.
export const cosmeticsAPI = {
  getProducts: async (query = '', limit = 100) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (query.trim()) params.set('q', query.trim());
    const response = await api.get(`/api/cosmetics?${params.toString()}`);
    return response.data;
  },

  getProduct: async (barcode) => {
    const response = await api.get(`/api/cosmetic/${encodeURIComponent(barcode)}`);
    return response.data?.product || response.data;
  },

  updateProduct: async (barcode, data) => {
    const response = await api.put(`/api/admin/cosmetic/${encodeURIComponent(barcode)}`, data);
    return response.data;
  },

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
