import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toastSuccess } from '@/utils/toast';

export const FinalCtaSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-6 bg-transparent text-black">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
          ГОТОВЫ СОЗДАТЬ
          <span className="block text-brand">ЧТО-ТО НЕВЕРОЯТНОЕ?</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl font-semibold mb-6 sm:mb-8 md:mb-10">
          Присоединяйтесь к революции в создании цифровых аватаров
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
            onClick={() => navigate('/register')}
          >
            НАЧАТЬ БЕСПЛАТНО 🚀
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
            onClick={() => toastSuccess('Функция скоро будет доступна!')}
          >
            СВЯЗАТЬСЯ С НАМИ
          </Button>
        </div>
      </div>
    </section>
  );
} 