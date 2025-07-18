import logoSrc from '@/assets/logo.svg';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-transparent text-black py-8 sm:py-12 px-6">
      <div className="max-w-7xl mx-auto text-center space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            <span className="text-xl sm:text-2xl font-black tracking-tight">TOONZYAI</span>
          </Link>
          <p className="text-base sm:text-lg font-bold">Create, animate, inspire.</p>
        </div>
        <p className="text-sm sm:text-base text-gray-600 font-semibold">© {new Date().getFullYear()} ToonzyAI.</p>
      </div>
    </footer>
  );
} 