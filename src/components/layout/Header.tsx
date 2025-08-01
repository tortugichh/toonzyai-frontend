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

  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.top = `-${scrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
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
      if (scrollY) {
        window.scrollTo(0, Math.abs(parseInt(scrollY)) || 0);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.classList.remove('overflow-hidden');
    };
  }, [menuOpen]);

  return (
    <header className="backdrop-blur-xl bg-white/80 border-b border-white/20 sticky top-0 z-50 shadow-lg/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-8 h-8 hover:scale-105 transition-transform duration-300" />
            <span className="text-lg sm:text-xl font-bold gradient-text-animated">
              ToonzyAI
            </span>
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden lg:flex space-x-6">
            <Link 
              to="/dashboard" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-base hover:scale-105 relative group"
            >
              <span className="relative z-10">Dashboard</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/avatars" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-base hover:scale-105 relative group"
            >
              <span className="relative z-10">Avatars</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/animations" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-base hover:scale-105 relative group"
            >
              <span className="relative z-10">Animations</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/stories" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium text-base hover:scale-105 relative group"
            >
              <span className="relative z-10">Stories</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-light to-secondary-light group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
          
          {/* Hamburger menu */}
          <button
            className="flex lg:hidden items-center justify-center w-10 h-10 text-gray-700 hover:text-gray-900 focus:outline-none"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <nav className="absolute top-full left-0 w-full backdrop-blur-xl bg-white/90 border-t border-white/20 shadow-lg lg:hidden flex flex-col py-4 space-y-2 z-40">
              <Link to="/dashboard" className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/avatars" className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium" onClick={() => setMenuOpen(false)}>Avatars</Link>
              <Link to="/animations" className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium" onClick={() => setMenuOpen(false)}>Animations</Link>
              <Link to="/stories" className="px-6 py-2 text-gray-700 hover:bg-white/50 font-medium" onClick={() => setMenuOpen(false)}>Stories</Link>
              <div className="border-t border-white/20 my-2"></div>
              {user ? (
                <Button variant="ghost" className="mx-6 justify-start hover:bg-white/50" onClick={() => { setMenuOpen(false); onLogout(); }}>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="mx-6 justify-start hover:bg-white/50" onClick={() => { setMenuOpen(false); navigate('/login'); }}>
                    Login
                  </Button>
                  <Button className="mx-6 mt-2 bg-gradient-to-r from-primary to-secondary-dark text-white" onClick={() => { setMenuOpen(false); navigate('/register'); }}>
                    Start for free
                  </Button>
                </>
              )}
            </nav>
          )}

          {/* Auth buttons (desktop) */}
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
                  <span className="relative z-10">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-700 hover:text-gray-900 font-medium">
                  Login
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-primary to-secondary-dark text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 font-medium shadow-md hover:shadow-lg hover:scale-105">
                  Start for free
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
