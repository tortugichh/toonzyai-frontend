import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toastSuccess } from '@/utils/toast';

export const FinalCtaSection = () => {
  const navigate = useNavigate();

  return (
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
            НАЧАТЬ БЕСПЛАТНО
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="px-10 py-6 text-lg"
            onClick={() => toastSuccess('Функция скоро будет доступна!')}
          >
            СВЯЗАТЬСЯ С НАМИ
          </Button>
        </div>
      </div>
    </section>
  );
} 