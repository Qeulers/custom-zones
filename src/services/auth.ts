import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api';
import { AuthUser, AuthTokens, LoginCredentials, StoredAuth } from '../types/auth';

const AUTH_STORAGE_KEY = 'custom_zones_auth';

// Create axios instance for auth
const authApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SigninResponse {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  account_id: string;
  access_token: string;
  refresh_token: string;
}

export const authService = {
  /**
   * Sign in with email and password
   */
  async signin(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const response: AxiosResponse<SigninResponse> = await authApi.post(
      API_CONFIG.ENDPOINTS.AUTH.SIGNIN,
      credentials
    );

    // Extract tokens from headers (primary) or body (fallback)
    const accessToken = response.headers['access-token'] || response.data.access_token;
    const refreshToken = response.headers['refresh-token'] || response.data.refresh_token;

    const user: AuthUser = {
      user_id: response.data.user_id,
      username: response.data.username,
      first_name: response.data.first_name,
      last_name: response.data.last_name,
      email: response.data.email,
      role: response.data.role,
      account_id: response.data.account_id,
    };

    const tokens: AuthTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };

    return { user, tokens };
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await authApi.put(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH,
      {},
      {
        headers: {
          'Refresh-Token': refreshToken,
        },
      }
    );

    const accessToken = response.headers['access-token'] || response.data.access_token;
    const newRefreshToken = response.headers['refresh-token'] || response.data.refresh_token;

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  },

  /**
   * Store auth data in localStorage
   */
  storeAuth(user: AuthUser, tokens: AuthTokens): void {
    const tokenExpiresAt = Date.now() + API_CONFIG.TOKEN_EXPIRY_MS;
    const storedAuth: StoredAuth = {
      user,
      tokens,
      tokenExpiresAt,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedAuth));
  },

  /**
   * Get stored auth data from localStorage
   */
  getStoredAuth(): StoredAuth | null {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    try {
      const auth: StoredAuth = JSON.parse(stored);
      return auth;
    } catch {
      return null;
    }
  },

  /**
   * Check if stored token is expired
   */
  isTokenExpired(tokenExpiresAt: number): boolean {
    return Date.now() >= tokenExpiresAt;
  },

  /**
   * Check if token should be refreshed (within buffer period)
   */
  shouldRefreshToken(tokenExpiresAt: number): boolean {
    return Date.now() >= tokenExpiresAt - API_CONFIG.TOKEN_REFRESH_BUFFER_MS;
  },

  /**
   * Clear stored auth data
   */
  clearAuth(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * Update stored tokens after refresh
   */
  updateStoredTokens(tokens: AuthTokens): void {
    const stored = this.getStoredAuth();
    if (stored) {
      const tokenExpiresAt = Date.now() + API_CONFIG.TOKEN_EXPIRY_MS;
      const updatedAuth: StoredAuth = {
        ...stored,
        tokens,
        tokenExpiresAt,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedAuth));
    }
  },
};
