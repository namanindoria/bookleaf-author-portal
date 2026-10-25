import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [author, setAuthor] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bookleaf_token'));
  const [loading, setLoading] = useState(true);

  // Load user profile on startup if token exists
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('bookleaf_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data.user);
        setAuthor(data.author);
      } catch (err) {
        console.warn('Session expired or invalid, logging out');
        logout();
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('bookleaf_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthor(data.author);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bookleaf_token');
    setToken(null);
    setUser(null);
    setAuthor(null);
  };

  // Switch user seamlessly using demo credentials
  const switchUser = async (email, password) => {
    return login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, author, token, loading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
