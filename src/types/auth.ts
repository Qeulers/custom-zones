export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  account_id: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiresAt: number | null;
}

export interface StoredAuth {
  user: AuthUser;
  tokens: AuthTokens;
  tokenExpiresAt: number;
}
