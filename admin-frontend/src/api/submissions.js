import api from './auth';

export const submissionsAPI = {
  // Get all submissions with optional status filter
  getSubmissions: async (status = 'pending') => {
    const response = await api.get(`/api/admin/submissions?status=${status}`);
    console.log("Fetched submissions:", response.data);
    return response.data;
  },

  // Approve a submission
  approveSubmission: async (submissionId, adminData, submitted_by_user_id) => {
    const response = await api.post(`/api/admin/submissions/${submissionId}/approve`, { adminData, submitted_by_user_id });
    console.log("Approved submission:", response.data);
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