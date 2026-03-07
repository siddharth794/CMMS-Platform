import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles) => {
    const roleObj = user?.role || user?.Role;
    if (!roleObj) return false;
    const userRole = roleObj.name.toLowerCase();
    return roles.map(r => r.toLowerCase()).includes(userRole);
  };

  const isAdmin = () => hasRole(['super_admin', 'org_admin']);
  const isManager = () => hasRole(['super_admin', 'org_admin', 'facility_manager']);
  const isTechnician = () => hasRole(['technician']);
  const isRequester = () => hasRole(['requestor', 'requester']);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, isAdmin, isManager, isTechnician, isRequester }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
