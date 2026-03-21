import apiClient from './client';
import { authStorage } from '../storage/authStorage';

export const authApi = {
  register: async (name, email, password, birthYear) => {
    const { data } = await apiClient.post('/api/auth/register', { name, email, password, birthYear });
    await authStorage.setToken(data.token);
    await authStorage.setUser({ userId: data.userId, name: data.name, email: data.email, role: data.role });
    return data;
  },
  login: async (email, password) => {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    await authStorage.setToken(data.token);
    await authStorage.setUser({ userId: data.userId, name: data.name, email: data.email, role: data.role });
    return data;
  },
  logout: async () => { await authStorage.clear(); },
  getCurrentUser: async () => {
    const [token, user] = await Promise.all([authStorage.getToken(), authStorage.getUser()]);
    if (!token || !user) {
      await authStorage.clear();
      return null;
    }
    return user;
  },
};
