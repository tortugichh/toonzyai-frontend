import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Variants for fade-in + slide-up effect
const wordContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.3 } },
};
const wordVariant = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface HeroSectionProps {
  scrollToFeatures: () => void;
}

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
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Create{' '}
          </motion.span>
          <motion.span 
            className="relative inline-block"
            initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "backOut" }}
          >
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              stunning
            </span>
            {/* Highlight under the word */}
            <motion.div
              className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-orange-400/30 via-orange-500/50 to-orange-600/30 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            />
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ 
                x: ['-100%', '100%'],
                opacity: [0, 1, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: "easeInOut" 
              }}
            />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            {' '}AI animations
          </motion.span>
        </motion.h1>
        
        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto px-4"
          variants={wordVariant}
        >
          ToonzyAI turns your ideas into professional animations in minutes. 
          No complicated tools — just the magic of artificial intelligence.
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
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              {/* Button content */}
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Creating
                <motion.svg 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto"
          >
            <Button 
              variant="outline"
              size="lg" 
              className="relative bg-white/80 backdrop-blur-sm border-2 border-orange-200 text-orange-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl hover:bg-orange-50/80 hover:border-orange-300 transition-all duration-300 overflow-hidden group w-full sm:w-auto"
              onClick={scrollToFeatures}
            >
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-orange-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button content */}
              <span className="relative z-10 flex items-center justify-center gap-2">
                Learn More
                <motion.svg 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ y: [0, 3, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </motion.svg>
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};
