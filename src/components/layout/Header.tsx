import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/api';

interface HeaderProps {
  user?: User;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function Header({ user, onLogout, isLoggingOut = false }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ToonzyAI
            </span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Главная
            </Link>
            <Link to="/avatars" className="text-gray-600 hover:text-gray-900">
              Аватары
            </Link>
            <Link to="/studio" className="text-gray-600 hover:text-gray-900 font-medium">
              🎬 Студия
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-600">Привет, {user.username}!</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={onLogout}
              disabled={isLoggingOut}
              className="text-gray-600 hover:text-gray-900"
            >
              {isLoggingOut ? 'Выход...' : 'Выйти'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 