import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/api';
import logoSrc from '@/assets/logo.svg';

interface HeaderProps {
  user?: User;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function Header({ user, onLogout, isLoggingOut = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-10 h-10 hover:scale-105 transition-transform duration-300" />
            <span className="text-2xl font-bold gradient-text-animated">
              ToonzyAI
            </span>
          </Link>
          
          <nav className="hidden md:flex space-x-10">
            <Link 
              to="/dashboard" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-lg hover:scale-105 relative group"
            >
              <span className="relative z-10">
                Панель управления
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/avatars" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-lg hover:scale-105 relative group"
            >
              <span className="relative z-10">
              Аватары
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/animations" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-lg hover:scale-105 relative group"
            >
              <span className="relative z-10">
                Анимации
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-700">Привет, {user.username}!</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={onLogout}
              disabled={isLoggingOut}
              className="bg-gradient-to-r from-primary to-secondary-dark text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 font-medium shadow-md hover:shadow-lg hover:scale-105 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <span className="relative z-10">
              {isLoggingOut ? 'Выход...' : 'Выйти'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 

// Provide default export for environments expecting default module
export default Header; 