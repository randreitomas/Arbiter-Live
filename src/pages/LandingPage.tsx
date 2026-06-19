import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNav } from '@/components/landing/LandingNav';

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-bg text-body">
      <LandingNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
      </main>
      <LandingFooter />
    </div>
  );
}
