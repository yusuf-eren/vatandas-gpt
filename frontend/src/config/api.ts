import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      config.headers.Authorization = `Bearer ${jwt}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Remove JWT token from localStorage
      localStorage.removeItem('jwt');
      
      // Don't redirect to signin page anymore - allow unauthenticated access
      // The components will handle authentication state appropriately
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function for backwards compatibility
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
}; 