import { AgentsSection } from '@/components/landing/AgentsSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNav } from '@/components/landing/LandingNav';
import { OutputSection } from '@/components/landing/OutputSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { Track3Section } from '@/components/landing/Track3Section';

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-bg text-landing-body">
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <AgentsSection />
        <OutputSection />
        <Track3Section />
      </main>
      <LandingFooter />
    </div>
  );
}
