import Axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

/**
 * Custom Axios instance for REST API (Litestar backend)
 * Uses Vite proxy: /api -> http://localhost:8089
 */
export const axiosInstance = Axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * - Adds authentication token from localStorage (if exists)
 * - Logs requests in development
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authentication token if exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 REST API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        authenticated: !!config.headers.Authorization,
        token: config.headers.Authorization ? `${String(config.headers.Authorization).substring(0, 20)}...` : 'None',
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handles common errors
 * - Logs responses in development
 * - Provides consistent error formatting
 */
axiosInstance.interceptors.response.use(
  response => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ REST API Response:', {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  (error: AxiosError) => {
    // Ignore cancelled requests (normal behavior in React Query)
    if (error.message === 'canceled' || error.code === 'ERR_CANCELED') {
      if (process.env.NODE_ENV === 'development') {
        // console.log('⏹️  Request cancelled (normal behavior)')
      }
      return Promise.reject(error);
    }

    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;

      console.error('❌ API Error:', {
        status,
        message,
        url: error.config?.url,
      });

      // Handle specific error codes
      if (status === 401) {
        console.warn('⚠️  Unauthorized - please login');
      } else if (status === 404) {
        console.warn('⚠️  Resource not found');
      } else if (status >= 500) {
        console.warn('⚠️  Server error');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('❌ Network error:', error.message);
      console.warn('⚠️  Check if the API server is running');
    } else {
      console.error('❌ Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Custom instance for Orval
 * This function is used by Orval-generated code
 */
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance.request<T>(config).then(({ data }) => data);
};

/**
 * Helper functions for token management
 */
export const authHelpers = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  getToken: () => {
    return localStorage.getItem('auth_token');
  },
  removeToken: () => {
    localStorage.removeItem('auth_token');
  },
};

export default customInstance;
