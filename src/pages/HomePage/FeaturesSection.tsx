import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

// Чекпойнты для слайдера
const checkpoints = [
  { value: 0, label: 'Начало', features: 0 },
  { value: 33, label: 'ИИ-Генерация', features: 1 },
  { value: 66, label: 'Обработка', features: 2 },
  { value: 100, label: 'Анимация', features: 3 }
];

export const FeaturesSection = forwardRef<HTMLElement>((props, ref) => {
  const [checkpointIndex, setCheckpointIndex] = useState(0);

  // Все чекпойнты доступны на всех экранах
  const availableCheckpoints = checkpoints;
  const currentCheckpoint = availableCheckpoints[checkpointIndex];

  // Функция для обработки изменения слайдера с snap к чекпойнтам
  const handleSliderChange = (value: number) => {
    // Находим ближайший доступный чекпойнт
    let closestIndex = 0;
    let minDistance = Math.abs(value - availableCheckpoints[0].value);
    
    for (let i = 1; i < availableCheckpoints.length; i++) {
      const distance = Math.abs(value - availableCheckpoints[i].value);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    setCheckpointIndex(closestIndex);
  };

  const visibleFeatures = currentCheckpoint.features;

  return (
    <section ref={ref} className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Декоративные элементы */}
        <div className="absolute top-10 left-4 sm:left-10 w-16 h-16 sm:w-20 sm:h-20 bg-orange-200/30 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-4 sm:right-10 w-24 h-24 sm:w-32 sm:h-32 bg-orange-300/20 rounded-full blur-2xl" />
        
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Процесс создания{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              анимации
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Узнайте, как ToonzyAI превращает ваши идеи в потрясающие анимации
          </p>
          
          {/* Прогресс индикатор */}
          <div className="flex items-center justify-center mt-6 sm:mt-8 mb-3 sm:mb-4 space-x-2">
            {availableCheckpoints.map((checkpoint, index) => (
              <motion.div
                key={checkpoint.value}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full cursor-pointer transition-all duration-300 ${
                  index <= checkpointIndex 
                    ? 'bg-gradient-to-r from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30' 
                    : 'bg-gray-300'
                }`}
                onClick={() => setCheckpointIndex(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
          
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 px-2">
            {currentCheckpoint.label} ({checkpointIndex + 1}/4 этапа) • ({visibleFeatures}/3 блока)
          </p>
        </motion.div>

        {/* Slider Container */}
        <div className="relative bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-white/20">
          {/* Навигационные кнопки */}
          <div className="flex justify-between items-center mb-6 sm:mb-8 gap-4">
            <motion.button
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              onClick={() => setCheckpointIndex(Math.max(0, checkpointIndex - 1))}
              disabled={checkpointIndex === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Назад</span>
            </motion.button>
            
            <motion.button
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              onClick={() => setCheckpointIndex(Math.min(availableCheckpoints.length - 1, checkpointIndex + 1))}
              disabled={checkpointIndex === availableCheckpoints.length - 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="hidden sm:inline">Далее</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          {/* Range Slider */}
          <div className="relative mb-6 sm:mb-8">
            <input
              type="range"
              min="0"
              max="100"
              value={currentCheckpoint.value}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="slider w-full h-2 sm:h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            
            {/* Checkpoint labels */}
            <div className="flex justify-between mt-3 sm:mt-4 px-1 sm:px-2">
              {availableCheckpoints.map((checkpoint, index) => (
                <motion.div
                  key={checkpoint.value}
                  className={`text-xs sm:text-sm font-medium cursor-pointer transition-colors duration-200 text-center ${
                    index === checkpointIndex ? 'text-orange-600' : 'text-gray-500'
                  }`}
                  onClick={() => setCheckpointIndex(index)}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="hidden sm:inline">{checkpoint.label}</span>
                  <span className="sm:hidden">{checkpoint.label.slice(0, 4)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-h-[600px] sm:max-h-[800px] overflow-hidden">
            {/* Feature 1 - Always visible when visibleFeatures >= 1 */}
            <motion.div
              className={`transition-all duration-500 ${visibleFeatures >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${visibleFeatures === 1 ? 'sm:col-span-2 lg:col-span-3' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: visibleFeatures >= 1 ? 1 : 0,
                y: visibleFeatures >= 1 ? 0 : 20,
                scale: visibleFeatures >= 1 ? 1 : 0.95
              }}
              transition={{ duration: 0.5 }}
            >
              <Card className="relative p-4 sm:p-6 h-full bg-gradient-to-br from-white to-orange-50/50 border border-orange-100 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 overflow-hidden group">
                {/* Декоративный элемент */}
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400/20 to-transparent rounded-bl-3xl" />
                
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg sm:rounded-xl text-white shadow-lg">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">ИИ-Генерация</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Мощные алгоритмы искусственного интеллекта создают уникальные персонажи и сцены на основе ваших описаний.
                </p>
                
                {/* Hover эффект */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </motion.div>

            {/* Feature 2 - Visible when visibleFeatures >= 2 */}
            <motion.div
              className={`transition-all duration-500 ${visibleFeatures >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${visibleFeatures === 2 ? 'lg:col-span-2' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: visibleFeatures >= 2 ? 1 : 0,
                y: visibleFeatures >= 2 ? 0 : 20,
                scale: visibleFeatures >= 2 ? 1 : 0.95
              }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="relative p-4 sm:p-6 h-full bg-gradient-to-br from-white to-blue-50/50 border border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-3xl" />
                
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg sm:rounded-xl text-white shadow-lg">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Обработка</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Автоматическая обработка и оптимизация контента с применением передовых техник компьютерного зрения.
                </p>
                
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </motion.div>

            {/* Feature 3 - Visible when visibleFeatures >= 3 */}
            <motion.div
              className={`transition-all duration-500 ${visibleFeatures >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: visibleFeatures >= 3 ? 1 : 0,
                y: visibleFeatures >= 3 ? 0 : 20,
                scale: visibleFeatures >= 3 ? 1 : 0.95
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="relative p-4 sm:p-6 h-full bg-gradient-to-br from-white to-purple-50/50 border border-purple-100 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-3xl" />
                
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg sm:rounded-xl text-white shadow-lg">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000-6h-1m4 6V4a3 3 0 000 6m-4 0h6m-6 0v10a1 1 0 001 1h4a1 1 0 001-1V10m-6 0a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v5a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Анимация</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Создание плавных, профессиональных анимаций с естественными движениями и выразительной мимикой.
                </p>
                
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}); 