import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    if (token && role) {
      setUser({ email, role });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, role } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    setUser({ email, role });
    return role; // caller uses this to redirect
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { accessToken, role, email } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    setUser({ email, role });
    return role;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // ignore — clear local state regardless
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
