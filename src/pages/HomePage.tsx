import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Header, Footer } from '@/components/layout';
import { AnimatedBackground } from './HomePage/AnimatedBackground';
import { HeroSection } from './HomePage/HeroSection';
import { FeaturesSection } from './HomePage/FeaturesSection';
import { HowItWorksSection } from './HomePage/HowItWorksSection';
import { ShowcaseSection } from './HomePage/ShowcaseSection';
import { FinalCtaSection } from './HomePage/FinalCtaSection';

export default function HomePage() {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLElement>(null);
  
  const scrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Reusable Header Component */}
      <Header user={null} onLogout={() => {}} />

      {/* Hero Section */}
      <HeroSection scrollToFeatures={scrollToFeatures} />

      {/* Interactive Slider Section */}
      <FeaturesSection ref={featuresRef} />

      {/* How It Works Section with scroll animation */}
      <HowItWorksSection />

      {/* Animated Showcase Section */}
      <ShowcaseSection />

      {/* CTA Section */}
      <FinalCtaSection />

      {/* Footer Component */}
      <Footer />
    </div>
  );
} 