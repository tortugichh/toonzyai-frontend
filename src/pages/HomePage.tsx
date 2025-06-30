import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => window.location.reload()}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ToonzyAI
              </span>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                className="text-gray-700 hover:text-purple-600"
                onClick={() => navigate('/login')}
              >
                Войти
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                onClick={() => navigate('/register')}
              >
                Регистрация
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Создавайте аватары
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              будущего 🚀
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Превратите ваши идеи в потрясающие анимированные аватары с помощью 
            искусственного интеллекта. Просто опишите — мы создадим!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/register')}
            >
              Начать создание бесплатно ✨
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-purple-300 text-purple-600 hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
              onClick={scrollToFeatures}
            >
              Посмотреть примеры 👀
            </Button>
          </div>
          
          {/* Scroll Indicator */}
          <div 
            className="animate-bounce cursor-pointer mx-auto w-6 h-6"
            onClick={scrollToFeatures}
          >
            <div className="w-6 h-6 border-2 border-purple-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-24 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Возможности платформы
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <Card 
              className="p-8 border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/register')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Создание аватаров</h3>
                <p className="text-gray-600 leading-relaxed">
                  Опишите своего персонажа текстом, и ИИ создаст уникального аватара, 
                  идеально соответствующего вашему видению.
                </p>
              </div>
            </Card>

            {/* Feature Card 2 */}
            <Card 
              className="p-8 border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/register')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-2xl">🎬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Анимация персонажей</h3>
                <p className="text-gray-600 leading-relaxed">
                  Оживите ваших аватаров с помощью продвинутых алгоритмов анимации. 
                  Создавайте говорящих персонажей из статичных изображений.
                </p>
              </div>
            </Card>

            {/* Feature Card 3 */}
            <Card 
              className="p-8 border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/register')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Быстрая обработка</h3>
                <p className="text-gray-600 leading-relaxed">
                  Мощные серверы и оптимизированные алгоритмы обеспечивают 
                  быструю генерацию высококачественных результатов.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Готовы создать что-то невероятное? 🌟
          </h2>
          <p className="text-xl text-purple-100 mb-12">
            Присоединяйтесь к тысячам пользователей, которые уже создают удивительные аватары
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/register')}
            >
              Начать сейчас 🚀
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-white text-white hover:bg-white/10 transform hover:scale-105 transition-all duration-200"
              onClick={() => alert('Функция "Связаться с нами" будет доступна в ближайшее время!')}
            >
              Связаться с нами 💬
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div 
              className="flex items-center justify-center mb-6 cursor-pointer" 
              onClick={scrollToTop}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ToonzyAI
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              Создавайте, анимируйте, вдохновляйте. Будущее цифрового контента уже здесь.
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 ToonzyAI. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 