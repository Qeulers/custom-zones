import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthState, LoginCredentials } from '../types/auth';
import { authService } from '../services/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  tokenExpiresAt: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedAuth = authService.getStoredAuth();
      
      if (storedAuth) {
        // Check if token is expired
        if (authService.isTokenExpired(storedAuth.tokenExpiresAt)) {
          // Try to refresh
          try {
            const newTokens = await authService.refreshToken(storedAuth.tokens.refresh_token);
            authService.updateStoredTokens(newTokens);
            const updatedAuth = authService.getStoredAuth();
            
            if (updatedAuth) {
              setState({
                user: updatedAuth.user,
                tokens: updatedAuth.tokens,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                tokenExpiresAt: updatedAuth.tokenExpiresAt,
              });
              return;
            }
          } catch {
            // Refresh failed, clear auth
            authService.clearAuth();
          }
        } else {
          // Token is still valid
          setState({
            user: storedAuth.user,
            tokens: storedAuth.tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            tokenExpiresAt: storedAuth.tokenExpiresAt,
          });
          return;
        }
      }
      
      // No valid auth found
      setState({
        ...initialState,
        isLoading: false,
      });
    };

    initAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokenExpiresAt) return;

    const checkAndRefresh = async () => {
      if (state.tokenExpiresAt && authService.shouldRefreshToken(state.tokenExpiresAt)) {
        try {
          await refreshAuth();
        } catch {
          // Refresh failed, will be handled by next check or API call
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkAndRefresh, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.tokenExpiresAt]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, tokens } = await authService.signin(credentials);
      authService.storeAuth(user, tokens);
      const storedAuth = authService.getStoredAuth();
      
      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tokenExpiresAt: storedAuth?.tokenExpiresAt || null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.clearAuth();
    setState({
      ...initialState,
      isLoading: false,
    });
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!state.tokens?.refresh_token) return;
    
    try {
      const newTokens = await authService.refreshToken(state.tokens.refresh_token);
      authService.updateStoredTokens(newTokens);
      const storedAuth = authService.getStoredAuth();
      
      setState(prev => ({
        ...prev,
        tokens: newTokens,
        tokenExpiresAt: storedAuth?.tokenExpiresAt || null,
      }));
    } catch (error) {
      logout();
      throw error;
    }
  }, [state.tokens?.refresh_token, logout]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
