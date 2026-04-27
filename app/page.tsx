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

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0F1C2E]">
      <LandingHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <WorkflowSection />
        <FeaturesSection />
        <RolesSection />
        <PricingSection />
        <UseCasesSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
