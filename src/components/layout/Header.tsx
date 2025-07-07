import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/api';
import logoSrc from '@/assets/logo.svg';
import { useState, useEffect } from 'react';

interface HeaderProps {
  user?: User;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function Header({ user, onLogout, isLoggingOut = false }: HeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.top = `-${scrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      // Prevent layout shift from disappearing scrollbar
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.classList.add('overflow-hidden');
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('overflow-hidden');
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, Math.abs(parseInt(scrollY)) || 0);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.classList.remove('overflow-hidden');
    };
  }, [menuOpen]);

  return (
    <header className="backdrop-blur-xl bg-white/80 border-b border-white/20 sticky top-0 z-50 shadow-lg/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 relative">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-10 h-10 hover:scale-105 transition-transform duration-300" />
            <span className="text-2xl font-bold gradient-text-animated">
              ToonzyAI
            </span>
          </Link>
          
          {/* Desktop nav for large screens */}
          <nav className="hidden lg:flex space-x-10">
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
            <Link 
              to="/story-generator" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-lg hover:scale-105 relative group"
            >
              <span className="relative z-10">
                Генератор Историй
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
          
          {/* Hamburger for small & medium screens */}
          <button
            className="flex lg:hidden items-center justify-center w-10 h-10 text-gray-700 hover:text-gray-900 focus:outline-none"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Dropdown for small & medium screens */}
          {menuOpen && (
            <nav className="absolute top-full left-0 w-full backdrop-blur-xl bg-white/90 border-t border-white/20 shadow-lg lg:hidden flex flex-col py-4 space-y-2 z-40">
              <Link
                to="/dashboard"
                className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Панель управления
              </Link>
              <Link
                to="/avatars"
                className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Аватары
              </Link>
              <Link
                to="/animations"
                className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Анимации
              </Link>
              <Link
                to="/story-generator"
                className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Генератор Историй
              </Link>
              <div className="border-t border-white/20 my-2"></div>
              {user ? (
                <Button
                  variant="ghost"
                  className="mx-6 justify-start hover:bg-white/50"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  {isLoggingOut ? 'Выход...' : 'Выйти'}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="mx-6 justify-start hover:bg-white/50"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    Войти
                  </Button>
                  <Button
                    className="mx-6 mt-2 bg-gradient-to-r from-primary to-secondary-dark text-white"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/register');
                    }}
                  >
                    Начать бесплатно
                  </Button>
                </>
              )}
            </nav>
          )}

          {/* Auth buttons for large screens */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
              <div className="hidden sm:block text-right">
                  <p className="text-sm text-gray-700">Привет, {user.username}!</p>
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
              {isLoggingOut ? 'Выход...' : 'Выйти'}
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
                  Войти
                </Button>
                <Button 
                  onClick={() => navigate('/register')} 
                  className="bg-gradient-to-r from-primary to-secondary-dark text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 font-medium shadow-md hover:shadow-lg hover:scale-105"
                >
                  Начать бесплатно
            </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 

// Provide default export for environments expecting default module
export default Header; 