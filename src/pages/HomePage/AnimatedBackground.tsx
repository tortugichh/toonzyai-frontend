import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <motion.div
        className="absolute inset-0 opacity-100"
        animate={{
          background: [
            "radial-gradient(600px circle at 0% 0%, rgba(255, 166, 87, 0.5) 0%, transparent 50%), radial-gradient(400px circle at 100% 100%, rgba(255, 136, 0, 0.4) 0%, transparent 50%), radial-gradient(800px circle at 50% 50%, rgba(204, 110, 0, 0.2) 0%, transparent 50%)",
            "radial-gradient(600px circle at 100% 0%, rgba(255, 166, 87, 0.5) 0%, transparent 50%), radial-gradient(400px circle at 0% 100%, rgba(255, 136, 0, 0.4) 0%, transparent 50%), radial-gradient(800px circle at 50% 50%, rgba(204, 110, 0, 0.2) 0%, transparent 50%)",
            "radial-gradient(600px circle at 50% 100%, rgba(255, 166, 87, 0.5) 0%, transparent 50%), radial-gradient(400px circle at 50% 0%, rgba(255, 136, 0, 0.4) 0%, transparent 50%), radial-gradient(800px circle at 50% 50%, rgba(204, 110, 0, 0.2) 0%, transparent 50%)",
            "radial-gradient(600px circle at 0% 0%, rgba(255, 166, 87, 0.5) 0%, transparent 50%), radial-gradient(400px circle at 100% 100%, rgba(255, 136, 0, 0.4) 0%, transparent 50%), radial-gradient(800px circle at 50% 50%, rgba(204, 110, 0, 0.2) 0%, transparent 50%)"
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Дополнительный слой с floating элементами */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-orange-200 rounded-full opacity-40"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}; 