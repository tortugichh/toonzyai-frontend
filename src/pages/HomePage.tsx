import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import logoSrc from '@/assets/logo.svg';

export default function HomePage() {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLElement>(null);

  const scrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-brand-start via-brand-mid to-brand-end shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => window.location.reload()}>
            <img src={logoSrc} alt="ToonzyAI logo" className="w-8 h-8 mr-2" />
            <span className="text-2xl font-bold text-white">ToonzyAI</span>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" className="text-white hover:text-brand-light transition-colors" onClick={() => navigate('/login')}>
              Войти
            </Button>
            <Button className="bg-gradient-to-br from-brand-light via-brand-mid to-brand-end text-white px-4 py-2 rounded-full hover:opacity-90 transition" onClick={() => navigate('/register')}>
              Регистрация
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between min-h-[80vh] px-8 py-16 bg-gradient-to-r from-brand-start via-brand-mid to-brand-end animate-gradient-xy text-white overflow-hidden">
        <div className="w-full lg:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">Unlock the Magic of ToonzyAI</h1>
          <p className="text-lg md:text-xl text-white/80">Создавайте анимированные аватары за один клик с помощью ИИ.</p>
          <Button size="lg" className="bg-black bg-opacity-30 backdrop-blur-sm px-6 py-4 rounded-full hover:bg-opacity-50 transition" onClick={() => navigate('/register')}>
            Начать прямо сейчас ➔
          </Button>
        </div>
        <div className="w-full lg:w-1/2 flex justify-center items-center mt-12 lg:mt-0">
          <div className="relative w-64 h-64 spin-slow">
            <span className="absolute inset-0 w-full h-full border border-white opacity-20 rounded-full"></span>
            <span className="absolute inset-[12.5%] w-[75%] h-[75%] border border-white opacity-10 rounded-full"></span>
            <span className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <span className="block w-12 h-12 bg-white rounded-full opacity-90 shadow-md"></span>
            </span>
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <span className="block w-10 h-10 bg-white opacity-80 rounded-full shadow-md"></span>
            </span>
            <span className="absolute top-1/2 left-0 transform -translate-y-1/2">
              <span className="block w-8 h-8 bg-white opacity-80 rounded-full shadow-md"></span>
            </span>
            <span className="absolute top-1/2 right-0 transform -translate-y-1/2">
              <span className="block w-8 h-8 bg-white opacity-80 rounded-full shadow-md"></span>
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 px-8 bg-gradient-to-r from-brand-light via-brand-mid to-brand-end animate-gradient-xy text-white">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white font-medium mb-6">⚡ Возможности платформы</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Безграничные возможности</h2>
          <p className="text-xl leading-relaxed max-w-4xl mx-auto">Наша платформа предоставляет все инструменты для создания профессиональных аватаров</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {['🎨', '⚡', '🎬'].map((icon, idx) => (
            <div key={idx} className="p-8 bg-white/20 backdrop-blur-md rounded-panel shadow-panel-md hover:scale-105 transition transform text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">{icon}</div>
              <h3 className="text-2xl font-bold mb-3">Feature {idx+1}</h3>
              <p className="text-white/80">Описание возможности {idx+1}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-8 bg-neutral-muted">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Как это работает?</h2>
          <p className="text-lg text-neutral-background max-w-3xl mx-auto">Всего три простых шага — и ваш уникальный анимированный аватар готов!</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[1,2,3].map((step,i) => (
            <div key={i} className="p-8 bg-white/20 backdrop-blur-md rounded-panel shadow-panel-md transform hover:-translate-y-2 hover:shadow-lg transition-all duration-500">
              <div className="w-16 h-16 mb-6 mx-auto bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold text-white">{step}</div>
              <h3 className="text-xl text-white font-semibold mb-3">Шаг {step}</h3>
              <p className="text-white/80">Описание шага {step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 px-8 bg-neutral-muted/50">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-neutral-background text-lg">Нам доверяют разработчики и дизайнеры из ведущих компаний</p>
          <div className="flex justify-center gap-12 text-4xl text-neutral-background">
            <span>🚀</span><span>🎮</span><span>📺</span><span>🛍️</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 bg-gradient-to-r from-brand-start via-brand-mid to-brand-end animate-gradient-xy text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Готовы начать?</h2>
          <Button size="lg" className="px-10 py-4 bg-white text-brand-start font-semibold rounded-full shadow-lg hover:scale-105 transition">
            Начать бесплатно 🚀
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="cursor-pointer flex items-center justify-center gap-2" onClick={scrollToTop}>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">T</div>
            <span className="text-xl font-bold">ToonzyAI</span>
          </div>
          <p className="text-white/75">Создавайте, анимируйте, вдохновляйте.</p>
          <p className="text-white/50 text-sm">© 2024 ToonzyAI. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}