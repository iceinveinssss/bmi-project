import apiClient from './client';

export const userApi = {
  getMe: async () => (await apiClient.get('/api/users/me')).data,
  updateMe: async (payload) => (await apiClient.put('/api/users/me', payload)).data,
};

