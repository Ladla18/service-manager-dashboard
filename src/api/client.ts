import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface QueuedRequest {
  resolve: (value: string | null | PromiseLike<string | null>) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: Inject access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    interface WindowWithAuthStore extends Window {
      __authStore?: {
        getState: () => { accessToken: string | null };
      };
    }
    const authStore = (window as WindowWithAuthStore).__authStore;
    const token = authStore?.getState()?.accessToken;
    
    if (token) {
      const url = config.url || '';
      const isAuthEndpoint = 
        url.includes('/v2/users/login') ||
        url.includes('/v2/users/register') ||
        url.includes('/v2/users/logout') ||
        url.includes('/v2/users/refresh_token');
      
      if (!isAuthEndpoint) {
        config.headers = config.headers || {};
        config.headers.Authorization = token;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if response is HTML (should be JSON)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('Received HTML response instead of JSON:', response.data);
      return Promise.reject(new Error('Invalid response format'));
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    const url = originalRequest.url || '';
    const isAuthEndpoint = 
      url.includes('/v2/users/login') ||
      url.includes('/v2/users/register') ||
      url.includes('/v2/users/logout') ||
      url.includes('/v2/users/refresh_token');
    
    // Skip refresh for auth endpoints
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }
    
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      interface WindowWithAuthStore extends Window {
        __authStore?: {
          getState: () => {
            logout: () => Promise<void>;
            setAccessToken: (token: string | null) => void;
          };
        };
      }
      
      if (originalRequest._retry) {
        // Already retried, redirect to login
        const authStore = (window as WindowWithAuthStore).__authStore;
        if (authStore) {
          authStore.getState().logout();
        }
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = token;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const authStore = (window as WindowWithAuthStore).__authStore;
        const refreshResponse = await api.post('/v2/users/refresh_token', {});
        const newToken = 
          refreshResponse.data.data?.access_token || 
          refreshResponse.data.access_token;
        
        if (newToken && authStore) {
          authStore.getState().setAccessToken(newToken);
        }
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = newToken;
        }
        
        processQueue(null, newToken);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
        
        const authStore = (window as WindowWithAuthStore).__authStore;
        if (authStore) {
          authStore.getState().logout();
        }
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

