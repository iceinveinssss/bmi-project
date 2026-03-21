import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line global-require
    SecureStore = require('expo-secure-store');
  } catch {
    SecureStore = null;
  }
}

async function getItem(key) {
  if (SecureStore?.getItemAsync) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

async function setItem(key, value) {
  if (SecureStore?.setItemAsync) return SecureStore.setItemAsync(key, value);
  return AsyncStorage.setItem(key, value);
}

async function deleteItem(key) {
  if (SecureStore?.deleteItemAsync) return SecureStore.deleteItemAsync(key);
  return AsyncStorage.removeItem(key);
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const authStorage = {
  getToken: () => getItem(TOKEN_KEY),
  setToken: (token) => setItem(TOKEN_KEY, token),
  removeToken: () => deleteItem(TOKEN_KEY),

  getUser: async () => {
    const raw = await getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user) => setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => deleteItem(USER_KEY),

  clear: async () => Promise.all([deleteItem(TOKEN_KEY), deleteItem(USER_KEY)]),
};

