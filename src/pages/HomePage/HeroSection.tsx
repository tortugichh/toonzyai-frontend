import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  scrollToFeatures: () => void;
}

const wordContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const wordVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const HeroSection = ({ scrollToFeatures }: HeroSectionProps) => {
  const navigate = useNavigate();

  return (
    <section className="relative text-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-orange-300/20 to-amber-300/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-gradient-to-r from-yellow-300/15 to-orange-400/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <motion.div
        className="max-w-5xl mx-auto relative z-10"
        variants={wordContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 leading-tight px-2"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            delay: 0.2 
          }}
        >
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Create amazing
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="block text-brand"
          >
            AI animations
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {' '}in minutes
          </motion.span>
        </motion.h1>
        
        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto px-4"
          variants={wordVariant}
        >
          ToonzyAI transforms your ideas into professional animations in minutes. 
          No complex tools — just the magic of artificial intelligence.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          variants={wordVariant}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto"
          >
            <Button 
              size="lg"
              className="relative bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 overflow-hidden group border-0 w-full sm:w-auto"
              onClick={() => navigate('/register')}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              
              <span className="relative z-10 flex items-center justify-center">
                <span className="mr-2">🚀</span>
                Start for free
              </span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto"
          >
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 w-full sm:w-auto"
              onClick={scrollToFeatures}
            >
              <span className="mr-2">✨</span>
              See how it works
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Trust indicators */}
        <motion.div 
          className="mt-8 sm:mt-12 flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-sm text-gray-500"
          variants={wordVariant}
        >
          <div className="flex items-center">
            <span className="mr-2">⚡</span>
            <span>Generate in seconds</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🎨</span>
            <span>Professional quality</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🔒</span>
            <span>100% secure</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}; 