import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';
import { authService } from './auth';

// Create axios instance with interceptors
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const storedAuth = authService.getStoredAuth();
    
    if (storedAuth) {
      // Check if token needs refresh
      if (authService.shouldRefreshToken(storedAuth.tokenExpiresAt)) {
        try {
          const newTokens = await authService.refreshToken(storedAuth.tokens.refresh_token);
          authService.updateStoredTokens(newTokens);
          config.headers.Authorization = newTokens.access_token;
        } catch (error) {
          // If refresh fails, clear auth and redirect to login
          authService.clearAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        config.headers.Authorization = storedAuth.tokens.access_token;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const storedAuth = authService.getStoredAuth();
      if (storedAuth) {
        try {
          const newTokens = await authService.refreshToken(storedAuth.tokens.refresh_token);
          authService.updateStoredTokens(newTokens);
          originalRequest.headers.Authorization = newTokens.access_token;
          return api(originalRequest);
        } catch (refreshError) {
          authService.clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
