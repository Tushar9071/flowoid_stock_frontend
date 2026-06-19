import React from 'react';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { ProblemSection } from '@/components/landing/problem-section';
import { WorkflowSection } from '@/components/landing/workflow-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { WhatsappSection } from '@/components/landing/whatsapp-section';
import { UseCasesSection } from '@/components/landing/use-cases-section';
import { FAQSection } from '@/components/landing/faq-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';
import { ScrollReveal } from '@/components/landing/scroll-reveal';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0F1C2E]">
      <LandingHeader />
      <main>
        <ScrollReveal />
        <div className="scroll-animate landing-delay-1">
          <HeroSection />
        </div>
        <div className="scroll-animate landing-delay-2">
          <ProblemSection />
        </div>
        <div className="scroll-animate landing-delay-3">
          <WorkflowSection />
        </div>
        <div className="scroll-animate landing-delay-4">
          <FeaturesSection />
        </div>
        <div className="scroll-animate landing-delay-5">
          <WhatsappSection />
        </div>
        <div className="scroll-animate landing-delay-6">
          <UseCasesSection />
        </div>
        <div className="scroll-animate landing-delay-7">
          <FAQSection />
        </div>
        <div className="scroll-animate landing-delay-8">
          <CTASection />
        </div>
      </main>

      <div className="scroll-animate landing-delay-9">
        <Footer />
      </div>
    </div>
  );
}
