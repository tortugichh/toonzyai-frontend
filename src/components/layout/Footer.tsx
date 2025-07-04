import logoSrc from '@/assets/logo.svg';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white text-black py-16 px-6">
      <div className="max-w-7xl mx-auto text-center space-y-8">
        <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logoSrc} alt="ToonzyAI logo" className="w-16 h-16 object-contain" />
          <span className="text-3xl font-black tracking-tight">TOONZYAI</span>
        </Link>
        <p className="text-xl font-bold">Создавайте, анимируйте, вдохновляйте.</p>
        <p className="text-gray-600 font-semibold">© 2025 ToonzyAI. Все права защищены.</p>
      </div>
    </footer>
  );
} 