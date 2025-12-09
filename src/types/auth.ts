export interface User {
  id: string;
  email?: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
}

export interface DeviceInfo {
  os: string;
  browser: string;
  screenResolution: string;
  isMobile: boolean;
  ipAddress: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
}

export interface ServiceStatus {
  serviceName: string;
  updatedAt: string;
  status: 'UP' | 'DOWN';
}

export interface ServiceStatusResponse {
  success: boolean;
  message: string;
  data: ServiceStatus[];
}

