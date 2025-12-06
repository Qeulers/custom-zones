import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Map, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Alert } from '../components/ui';

export function LoginPage() {
  const { setToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = accessToken.trim();
    if (!token) {
      setError('Please enter an access token');
      return;
    }

    setToken(token);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-xl">
                <Map className="h-10 w-10 text-primary-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Custom Zones</h2>
            <p className="text-gray-500 mt-2">Enter your access token to continue</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" className="mb-6" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Token Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <textarea
                id="token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Paste your access token here..."
                rows={4}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-mono"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Get your access token from the Pole Star API authentication endpoint
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              leftIcon={<Key className="h-5 w-5" />}
            >
              Continue
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Pole Star Global - Zone & Port Insights
          </p>
        </div>
      </div>
    </div>
  );
}
