import React from 'react';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { ProblemSection } from '@/components/landing/problem-section';
import { WorkflowSection } from '@/components/landing/workflow-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { RolesSection } from '@/components/landing/roles-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { UseCasesSection } from '@/components/landing/use-cases-section';
import { FAQSection } from '@/components/landing/faq-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';
import { PWAInstallNudge } from '@/components/landing/pwa-install-nudge';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0F1C2E]">
      <LandingHeader />
      <main>
        <div className="landing-fade-up landing-delay-1">
          <HeroSection />
        </div>
        <div className="landing-fade-up landing-delay-2">
          <ProblemSection />
        </div>
        <div className="landing-fade-up landing-delay-3">
          <WorkflowSection />
        </div>
        <div className="landing-fade-up landing-delay-4">
          <FeaturesSection />
        </div>
        <div className="landing-fade-up landing-delay-5">
          <RolesSection />
        </div>
        <div className="landing-fade-up landing-delay-6">
          <PricingSection />
        </div>
        <div className="landing-fade-up landing-delay-7">
          <UseCasesSection />
        </div>
        <div className="landing-fade-up landing-delay-8">
          <FAQSection />
        </div>
        <div className="landing-fade-up landing-delay-9">
          <CTASection />
        </div>
      </main>

      <div className="landing-fade-up landing-delay-10">
        <Footer />
      </div>

      <PWAInstallNudge delayMs={1200} />
    </div>
  );
}
