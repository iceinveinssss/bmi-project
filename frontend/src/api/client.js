import axios from 'axios';
import { NativeModules } from 'react-native';
import { authStorage } from '../storage/authStorage';

const API_PORT = 8082;

function getDevServerHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;

  const match = scriptURL.match(/^https?:\/\/([^:/]+)(?::\d+)?\//i);
  return match?.[1] ?? null;
}

const devServerHost = getDevServerHost();
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (devServerHost ? `http://${devServerHost}:${API_PORT}` : `http://localhost:${API_PORT}`);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response) {
      const { status, data } = error.response;
      const message =
        data?.message ??
        data?.error ??
        (typeof data === 'string' ? data : null) ??
        `HTTP ${status}`;
      return Promise.reject(new Error(message));
    }

    const base = 'Ошибка сети';
    const hint = __DEV__ ? ` (${BASE_URL})` : '';
    return Promise.reject(new Error(base + hint));
  }
);

export default apiClient;
