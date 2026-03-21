import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/auth';
import { authStorage } from '../storage/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getCurrentUser().then(u => { setUser(u); setLoading(false); });
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    const userData = { userId: data.userId, name: data.name, email: data.email, role: data.role };
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, birthYear) => {
    const data = await authApi.register(name, email, password, birthYear);
    const userData = { userId: data.userId, name: data.name, email: data.email, role: data.role };
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateUser = async (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      authStorage.setUser(next).catch(() => {});
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
