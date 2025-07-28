import { motion } from 'framer-motion';

const steps = [
  {
    step: "01",
    title: "Create an Avatar",
    description: "Describe the character you want. AI will generate a unique avatar in minutes.",
    color: "from-orange-400 to-orange-600",
    bgColor: "from-orange-50 to-orange-100/50"
  },
  {
    step: "02", 
    title: "Write a Script",
    description: "Describe frame by frame what the character should do.",
    color: "from-purple-400 to-purple-600",
    bgColor: "from-purple-50 to-purple-100/50"
  },
  {
    step: "03",
    title: "Get the Animation",
    description: "AI creates a professional animation with natural movements and synchronization.",
    color: "from-blue-400 to-blue-600",
    bgColor: "from-blue-50 to-blue-100/50"
  }
];

export const HowItWorksSection = () => {
  return (
    <motion.section
      className="relative py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-transparent"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
    >
      {/* Decorative elements */}
      <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-orange-400/10 to-purple-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-r from-blue-400/10 to-orange-400/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2">
            How it{' '}
            <span className="bg-gradient-to-r from-orange-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            A simple 3-step process to create professional animations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              {/* Step number */}
              <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${step.color} text-white rounded-xl font-bold text-lg sm:text-xl mb-4 sm:mb-6 shadow-lg`}>
                {step.step}
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                {step.title}
              </h3>
              
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
