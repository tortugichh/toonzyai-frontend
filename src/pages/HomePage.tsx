import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Header, Footer } from '@/components/layout';

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
    <div className="min-h-screen bg-white">
      {/* Reusable Header Component */}
      <Header onLogout={() => {}} />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20 bg-white">
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 rounded-full text-black font-black text-sm uppercase tracking-wider">
              <span className="text-2xl">⚡</span>
              <span>РЕВОЛЮЦИЯ В СОЗДАНИИ АВАТАРОВ</span>
              </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-black leading-tight">
              СОЗДАВАЙТЕ
              <span className="block text-brand">
                АНИМИРОВАННЫЕ АВАТАРЫ
              </span>
            </h1>
            
            <p className="text-2xl md:text-2xl lg:text-3xl text-black font-bold max-w-4xl mx-auto">
              Используйте мощь ИИ для создания уникальных персонажей за считанные минуты
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button
                size="lg"
                className="w-full sm:w-auto whitespace-normal px-6 sm:px-10 py-6 text-lg"
                onClick={() => navigate('/register')}
              >
                ПОПРОБОВАТЬ БЕСПЛАТНО →
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto whitespace-normal px-6 sm:px-10 py-6 text-lg"
                onClick={scrollToFeatures}
              >
                УЗНАТЬ БОЛЬШЕ
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 px-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black mb-8">
              ВОЗМОЖНОСТИ ПЛАТФОРМЫ
            </h2>
            <p className="text-2xl text-black font-bold max-w-3xl mx-auto">
              Все инструменты для создания профессиональных аватаров
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'ИИ-ГЕНЕРАЦИЯ',
                description: 'Создавайте уникальные аватары с помощью передовых алгоритмов',
                bg: 'bg-red-500',
                border: 'border-red-600'
              },
              {
                icon: '⚡',
                title: 'БЫСТРАЯ ОБРАБОТКА',
                description: 'Получайте готовые аватары за считанные минуты',
                bg: 'bg-blue-500',
                border: 'border-blue-600'
              },
              {
                icon: '🎬',
                title: 'АНИМАЦИЯ',
                description: 'Создавайте живые персонажи с реалистичной мимикой',
                bg: 'bg-purple-500',
                border: 'border-purple-600'
              }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="relative p-8 bg-white rounded-xl border border-neutral-200 shadow-card hover:shadow-none transition"
              >
                <div className={`w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center text-3xl mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-black text-black mb-4">{feature.title}</h3>
                <p className="text-lg text-black font-semibold">{feature.description}</p>
            </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-black mb-6">
              КАК ЭТО РАБОТАЕТ?
          </h2>
            <p className="text-2xl text-black font-bold">
              Всего три простых шага!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { step: 1, title: 'ОПИШИТЕ ИДЕЮ', icon: '💭', color: 'bg-yellow-400' },
              { step: 2, title: 'ИИ ГЕНЕРИРУЕТ', icon: '🤖', color: 'bg-green-400' },
              { step: 3, title: 'СКАЧАЙТЕ РЕЗУЛЬТАТ', icon: '🎉', color: 'bg-blue-400' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className={`w-32 h-32 ${item.color} rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl border-4 border-black`}>
                  {item.icon}
                </div>
                <div className="text-6xl lg:text-8xl font-black text-black mb-4">
                  {item.step}
                </div>
                <h3 className="text-2xl font-black text-black mb-3">{item.title}</h3>
              </div>
            ))}
                </div>
              </div>
      </section>

      {/* Animated Showcase Section */}
      <section className="py-16 bg-neutral-100 overflow-hidden">
        <div className="max-w-none">
          <div className="marquee gap-24 px-6 text-4xl font-black whitespace-nowrap">
            {Array.from({ length: 10 }).map((_, idx) => (
              <span
                key={idx}
                className={
                  [
                    'text-brand',
                    'text-accent',
                    'text-purple-600',
                    'text-blue-600',
                    'text-pink-600',
                  ][idx % 5]
                }
              >
                ToonzyAI
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white text-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8">
            ГОТОВЫ СОЗДАТЬ
            <span className="block text-brand">ЧТО-ТО НЕВЕРОЯТНОЕ?</span>
          </h2>
          <p className="text-2xl font-bold mb-12">
            Присоединяйтесь к революции в создании цифровых аватаров
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              className="px-10 py-6 text-lg"
              onClick={() => navigate('/register')}
            >
              НАЧАТЬ БЕСПЛАТНО 🚀
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-10 py-6 text-lg"
              onClick={() => alert('Функция скоро будет доступна!')}
            >
              СВЯЗАТЬСЯ С НАМИ
            </Button>
          </div>
        </div>
      </section>

      {/* Reusable Footer Component */}
      <Footer />
    </div>
  );
} 