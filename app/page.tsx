import React from 'react';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { RolesSection } from '@/components/landing/roles-section';
import { AdminFeaturesSection } from '@/components/landing/admin-features-section';
import { WorkflowsSection } from '@/components/landing/workflows-section';
import { UseCasesSection } from '@/components/landing/use-cases-section';
import { CTASection } from '@/components/landing/cta-section';
import { FAQSection } from '@/components/landing/faq-section';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <RolesSection />
      <AdminFeaturesSection />
      <WorkflowsSection />
      <UseCasesSection />
      <CTASection />
      <FAQSection />
      <Footer />
    </div>
  );
}
