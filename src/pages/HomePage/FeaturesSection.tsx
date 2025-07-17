import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

// Чекпойнты для слайдера
const checkpoints = [
  { value: 0, label: 'Начало', features: 0 },
  { value: 33, label: 'История', features: 1 },
  { value: 66, label: 'Видео', features: 2 },
  { value: 100, label: 'Результат', features: 3 }
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
    <section ref={ref} className="relative py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Декоративные элементы */}
        <div className="absolute top-10 left-4 sm:left-10 w-16 h-16 sm:w-20 sm:h-20 bg-orange-200/30 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-4 sm:right-10 w-24 h-24 sm:w-32 sm:h-32 bg-orange-300/20 rounded-full blur-2xl" />
        
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2">
            От идеи до{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              видео-истории
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Узнайте, как ToonzyAI превращает ваши идеи в увлекательные видео-истории
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
            {currentCheckpoint.label} ({checkpointIndex + 1}/4 шага) • ({visibleFeatures}/3 функции)
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
              <Card className="relative p-5 sm:p-7 h-full bg-gradient-to-br from-white/90 via-white/95 to-orange-50/60 backdrop-blur-sm border border-orange-200/50 hover:border-orange-300/70 hover:shadow-2xl hover:shadow-orange-500/15 transition-all duration-500 overflow-hidden group hover:-translate-y-1">
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent rounded-bl-3xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-300/30 to-amber-400/30 rounded-full blur-sm group-hover:scale-150 transition-transform duration-500" />
                
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <motion.div 
                    className="p-3 sm:p-4 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-xl text-white shadow-lg group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all duration-300"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.svg 
                      className="w-5 h-5 sm:w-7 sm:h-7" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </motion.svg>
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors duration-300">Создание персонажа</h3>
                </div>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  Создайте своего персонажа с любой внешностью.
                </p>
                
                {/* Hover эффекты */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/8 via-amber-300/5 to-orange-600/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h10M9 7h6m-6 4h6m-6 4h6" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Создание видео</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Превращаем вашу историю в красивые видео с помощью новейших технологий от Google.
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Готовый результат</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Получите готовую анимацию, которую можно сразу смотреть и делиться с друзьями.
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