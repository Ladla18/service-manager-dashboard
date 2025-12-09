import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User, LoginResponse } from '../types/auth';
import { api } from '../api/client';
import { getDeviceInfo } from '../utils/device';

interface AuthStore extends AuthState {
  login: (userid: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
  debugAuthState: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      isAuthenticated: false,
      accessToken: null,

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user && !!get().accessToken });
      },

      setAccessToken: (token: string | null) => {
        set({ accessToken: token, isAuthenticated: !!token && !!get().user });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      login: async (userid: string): Promise<LoginResponse> => {
        set({ loading: true });

        try {
          // Step 1: Collect device information
          const deviceInfo = await getDeviceInfo();

          // Step 2: Attempt login
          let response;
          try {
            response = await api.post(
              '/v2/users/login',
              {
                device: deviceInfo,
              },
              {
                params: { userId: userid },
              }
            );
          } catch (loginError: unknown) {
            // Step 3: Auto-register if user doesn't exist
            const axiosError = loginError as { response?: { status?: number } };
            if (
              axiosError.response?.status === 404 ||
              axiosError.response?.status === 400
            ) {
              response = await api.post(
                '/v2/users/register',
                {
                  name: userid,
                  email: `${userid}@auto-registered.local`,
                  device: deviceInfo,
                },
                {
                  params: { userId: userid },
                }
              );
            } else {
              throw loginError;
            }
          }

          // Step 4: Extract and store access token
          const apiResponse = response.data;
          const accessToken =
            apiResponse.data?.access_token || apiResponse.access_token;

          if (accessToken) {
            get().setAccessToken(accessToken);
          }

          // Step 5: Fetch complete user details
          try {
            const userDetailsResponse = await api.get('/v2/users/details');
            const userDetails = userDetailsResponse.data;

            if (userDetails.success && userDetails.data) {
              get().setUser({
                id: userDetails.data.id || userid,
                email: userDetails.data.email,
                name: userDetails.data.name || userid,
              });
            }
          } catch {
            // Fallback to login response data
            get().setUser({
              id: apiResponse.data?.user?.id || userid,
              email: apiResponse.data?.user?.email,
              name: apiResponse.data?.user?.name || userid,
            });
          }

          set({ loading: false });
          return { success: true };
        } catch (error: unknown) {
          get().setAccessToken(null);
          set({ loading: false });
          const axiosError = error as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          return {
            success: false,
            error:
              axiosError.response?.data?.message ||
              axiosError.message ||
              'Authentication failed',
          };
        }
      },

      logout: async () => {
        try {
          const token = get().accessToken;
          if (token) {
            await api.post('/v2/users/logout');
          }
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      },

      initializeAuth: () => {
        const state = get();
        const hasToken = !!state.accessToken;
        const hasUser = !!state.user;
        set({ isAuthenticated: hasToken && hasUser });
      },

      debugAuthState: () => {
        const state = get();
        const tokenPreview = state.accessToken
          ? `${state.accessToken.substring(0, 20)}...`
          : 'null';
        console.log('Auth State:', {
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          loading: state.loading,
          accessToken: tokenPreview,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);

// Expose store to window for API interceptor access
if (typeof window !== 'undefined') {
  interface WindowWithAuthStore extends Window {
    __authStore?: typeof useAuthStore;
  }
  (window as WindowWithAuthStore).__authStore = useAuthStore;
}

