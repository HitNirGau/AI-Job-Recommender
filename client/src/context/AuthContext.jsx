import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: '' });
    }, 4000);
  };

  // Setup global Axios defaults
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const backendUrl = 'http://localhost:5002/api';

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get(`${backendUrl}/auth/me`);
          setUser(res.data);
        } catch (err) {
          console.error("Error loading user profile:", err);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const sendRegisterOtp = async (userData) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/send-register-otp`, userData);
      return { success: true, msg: res.data.msg, loggedToConsole: res.data.loggedToConsole };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Failed to send OTP';
      return { success: false, error: msg };
    }
  };

  const verifyRegisterOtp = async (email, otp) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/verify-register-otp`, { email, otp });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Verification failed';
      return { success: false, error: msg };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/forgot-password`, { email });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Failed to send reset OTP';
      return { success: false, error: msg };
    }
  };

  const verifyResetOtp = async (email, otp) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/verify-reset-otp`, { email, otp });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Invalid or expired OTP';
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (email, otp, newPassword, confirmPassword) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/reset-password`, { email, otp, newPassword, confirmPassword });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Failed to reset password';
      return { success: false, error: msg };
    }
  };

  const requestEmailUpdate = async (newEmail) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/request-email-update`, { newEmail });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Failed to send OTP';
      return { success: false, error: msg };
    }
  };

  const verifyEmailUpdate = async (otp) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/verify-email-update`, { otp });
      setUser(prev => prev ? { ...prev, email: res.data.email } : prev);
      return { success: true, msg: res.data.msg };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Verification failed';
      return { success: false, error: msg };
    }
  };

  const updatePassword = async (newPassword, confirmPassword) => {
    try {
      const res = await axios.post(`${backendUrl}/auth/update-password`, { newPassword, confirmPassword });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Failed to update password';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await axios.put(`${backendUrl}/auth/me`, profileData);
      setUser(res.data);
      return { success: true, user: res.data };
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to update profile';
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      sendRegisterOtp, 
      verifyRegisterOtp, 
      forgotPassword,
      verifyResetOtp,
      resetPassword,
      requestEmailUpdate,
      verifyEmailUpdate,
      updatePassword,
      logout, 
      updateUserProfile,
      toast,
      showToast
    }}>
      {children}
    </AuthContext.Provider>
  );
};
