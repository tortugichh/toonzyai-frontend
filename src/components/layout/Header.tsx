import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/api';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function Header({ user, onLogout, isLoggingOut = false }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                  ToonzyAI
                </h1>
                <p className="text-xs text-gray-500 -mt-1">AI Animation Studio</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              className="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium"
            >
              Pricing
            </a>
            <a 
              href="#about" 
              className="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium"
            >
              About
            </a>
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop user menu */}
            <div className="hidden lg:flex items-center space-x-4">
              {user ? (
                <>
                <div className="hidden sm:block text-right">
                    <p className="text-sm text-gray-700">Hello, {user.username}!</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              <Button 
                variant="outline" 
                onClick={onLogout}
                disabled={isLoggingOut}
                    className="bg-gradient-to-r from-primary to-secondary-dark text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 font-medium shadow-md hover:shadow-lg hover:scale-105 relative overflow-hidden group"
              >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <span className="relative z-10">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </span>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')} 
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="bg-gradient-to-r from-primary to-secondary-dark text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 font-medium shadow-md hover:shadow-lg hover:scale-105"
                  >
                    Start for free
              </Button>
                </>
              )}
            </div>

            {/* Mobile user menu */}
            <div className="lg:hidden flex items-center space-x-2">
              {user ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="text-sm px-3 py-2"
                  >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')} 
                    className="text-sm px-3 py-2"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="text-sm px-3 py-2"
                  >
                    Start for free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}; 