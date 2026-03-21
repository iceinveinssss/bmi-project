import apiClient from './client';

export const bmiApi = {
  calculate: async (weight, height) => (await apiClient.post('/api/bmi/calculate', { weight, height })).data,
  getHistory: async () => (await apiClient.get('/api/bmi/history')).data,
  getStats: async () => (await apiClient.get('/api/bmi/stats')).data,
  getRecord: async (id) => (await apiClient.get(`/api/bmi/${id}`)).data,
  updateRecord: async (id, weight, height) => (await apiClient.put(`/api/bmi/${id}`, { weight, height })).data,
  deleteRecord: async (id) => apiClient.delete(`/api/bmi/${id}`),
  searchByCategory: async (category) => (await apiClient.get(`/api/bmi/search?category=${encodeURIComponent(category)}`)).data,
};
