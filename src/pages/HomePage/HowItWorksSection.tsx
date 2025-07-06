import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const steps = [
  {
    step: "01",
    title: "Создайте аватар",
    description: "Загрузите фото или опишите желаемого персонажа. ИИ создаст уникальный аватар за минуты.",
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "from-orange-400 to-orange-600",
    bgColor: "from-orange-50 to-orange-100/50"
  },
  {
    step: "02", 
    title: "Напишите сценарий",
    description: "Опишите что должен делать персонаж. Система автоматически разобьет на сегменты.",
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: "from-purple-400 to-purple-600",
    bgColor: "from-purple-50 to-purple-100/50"
  },
  {
    step: "03",
    title: "Получите анимацию",
    description: "ИИ создаст профессиональную анимацию с естественными движениями и синхронизацией.",
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000-6h-1m4 6V4a3 3 0 000 6m-4 0h6m-6 0v10a1 1 0 001 1h4a1 1 0 001-1V10m-6 0a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v5a1 1 0 001 1z" />
      </svg>
    ),
    color: "from-blue-400 to-blue-600",
    bgColor: "from-blue-50 to-blue-100/50"
  }
];

export const HowItWorksSection = () => {
  return (
    <motion.section
      className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
    >
      {/* Декоративные элементы */}
      <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-orange-400/10 to-purple-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-r from-blue-400/10 to-orange-400/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
            Как это{' '}
            <span className="bg-gradient-to-r from-orange-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              работает
          </span>
        </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Простой процесс создания профессиональных анимаций за 3 шага
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              {/* Соединительная линия */}
              {index < 2 && (
                <div className="hidden md:block absolute top-12 sm:top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
              )}
              
              <Card className={`relative p-6 sm:p-8 h-full bg-gradient-to-br ${step.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group z-10`}>
                {/* Декоративный элемент */}
                <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${step.color} opacity-10 rounded-bl-3xl`} />
                
                {/* Номер шага */}
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${step.color} text-white rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl mb-4 sm:mb-6 shadow-lg`}>
                  {step.step}
                </div>
                
                {/* Иконка */}
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${step.color} text-white rounded-lg sm:rounded-xl mb-3 sm:mb-4 shadow-md`}>
                  {step.icon}
              </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {step.title}
                </h3>
                
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Hover эффект */}
                <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </Card>
            </motion.div>
          ))}
            </div>
            </div>
    </motion.section>
  );
} 