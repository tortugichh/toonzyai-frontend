import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white via-orange-50/30 to-white">
      {/* Основной мягкий градиентный фон */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(800px circle at 20% 20%, rgba(251, 146, 60, 0.1) 0%, transparent 70%), radial-gradient(600px circle at 80% 80%, rgba(249, 115, 22, 0.08) 0%, transparent 70%), radial-gradient(1000px circle at 50% 50%, rgba(255, 237, 213, 0.3) 0%, transparent 50%)",
            "radial-gradient(800px circle at 80% 20%, rgba(251, 146, 60, 0.1) 0%, transparent 70%), radial-gradient(600px circle at 20% 80%, rgba(249, 115, 22, 0.08) 0%, transparent 70%), radial-gradient(1000px circle at 50% 50%, rgba(255, 237, 213, 0.3) 0%, transparent 50%)",
            "radial-gradient(800px circle at 50% 80%, rgba(251, 146, 60, 0.1) 0%, transparent 70%), radial-gradient(600px circle at 50% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 70%), radial-gradient(1000px circle at 50% 50%, rgba(255, 237, 213, 0.3) 0%, transparent 50%)",
            "radial-gradient(800px circle at 20% 20%, rgba(251, 146, 60, 0.1) 0%, transparent 70%), radial-gradient(600px circle at 80% 80%, rgba(249, 115, 22, 0.08) 0%, transparent 70%), radial-gradient(1000px circle at 50% 50%, rgba(255, 237, 213, 0.3) 0%, transparent 50%)"
          ]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Плавающие элементы с улучшенным дизайном */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full opacity-20 ${
              i % 3 === 0 ? 'bg-orange-300' : 
              i % 3 === 1 ? 'bg-amber-300' : 'bg-yellow-300'
            }`}
            animate={{
              x: [0, 50 + i * 20, 0],
              y: [0, -80 - i * 15, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1.5,
            }}
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + i * 8}%`,
              width: `${8 + i * 2}px`,
              height: `${8 + i * 2}px`,
            }}
          />
        ))}
      </div>

      {/* Добавляем subtle grain текстуру */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px'
        }}
      />
    </div>
  );
}; 