import axios from 'axios';
import { User, LoginForm, RegisterForm, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const response = await api.post<ApiResponse<{ user: User; access_token: string; refresh_token: string }>>('/auth/login', {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      const { user, access_token, refresh_token } = response.data.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, access_token, refresh_token };
    }

    throw new Error(response.data.message || 'Login failed');
  },

  async register(userData: RegisterForm): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const response = await api.post<ApiResponse<{ user: User; access_token: string; refresh_token: string }>>('/auth/register', userData);

    if (response.data.success && response.data.data) {
      const { user, access_token, refresh_token } = response.data.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, access_token, refresh_token };
    }

    throw new Error(response.data.message || 'Registration failed');
  },

  async refreshToken(): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<ApiResponse<{ user: User; access_token: string; refresh_token: string }>>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (response.data.success && response.data.data) {
      const { user, access_token, refresh_token } = response.data.data;
      
      // Update stored tokens and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, access_token, refresh_token };
    }

    throw new Error(response.data.message || 'Token refresh failed');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get user data');
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/users/${userData.id}`, userData);

    if (response.data.success && response.data.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data.data;
    }

    throw new Error(response.data.message || 'Profile update failed');
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },
};


