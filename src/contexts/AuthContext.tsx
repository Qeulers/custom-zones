import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const TOKEN_STORAGE_KEY = 'custom_zones_token';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setToken: (token: string) => void;
  logout: () => void;
}

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (storedToken) {
      setState({
        accessToken: storedToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState({
        ...initialState,
        isLoading: false,
      });
    }
  }, []);

  const setToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setState({
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const value: AuthContextType = {
    ...state,
    setToken,
    logout,
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
