import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify token is still valid
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          await SecureStore.setItemAsync('user', JSON.stringify(res.data));
        } catch {
          // Token expired, clear
          await logout();
        }
      }
    } catch (e) {
      console.log('Auth load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    await storeAuth(res);
    return res;
  };

  const adminLogin = async (email, password) => {
    const res = await authAPI.adminLogin({ email, password });
    await storeAuth(res);
    return res;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    await storeAuth(res);
    return res;
  };

  const storeAuth = async (res) => {
    setUser(res.data);
    setToken(res.token);
    await SecureStore.setItemAsync('token', res.token);
    await SecureStore.setItemAsync('user', JSON.stringify(res.data));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn: !!token,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
