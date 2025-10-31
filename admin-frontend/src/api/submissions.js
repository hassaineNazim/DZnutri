import api from './auth';

export const submissionsAPI = {
  // Get all submissions with optional status filter
  getSubmissions: async (status = 'pending') => {
    const response = await api.get(`/api/admin/submissions?status=${status}`);
    console.log("Fetched submissions:", response.data);
    return response.data;
  },

  // Approve a submission
  approveSubmission: async (submissionId, adminData) => {
    // adminData should be a plain object matching the server's AdminProductApproval schema
    const response = await api.post(`/api/admin/submissions/${submissionId}/approve`, adminData);
    return response.data;
  },

  // Reject a submission
  rejectSubmission: async (submissionId) => {
    const response = await api.post(`/api/admin/submissions/${submissionId}/reject`);
    return response.data;
  },

  // Get submissions by status
  getPendingSubmissions: async () => {
    return await submissionsAPI.getSubmissions('pending');
  },

  getApprovedSubmissions: async () => {
    return await submissionsAPI.getSubmissions('approved');
  },

  getRejectedSubmissions: async () => {
    return await submissionsAPI.getSubmissions('rejected');
  }
}; 