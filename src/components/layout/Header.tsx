import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Map, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Map className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Custom Zones</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/zones/create"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
            >
              Create Zone
            </Link>
          </nav>

          {/* Logout Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/zones/create"
                className="text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Zone
              </Link>
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
