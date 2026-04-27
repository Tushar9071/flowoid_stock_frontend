import React from 'react';
import { LandingHeader } from '@/components/landing/landing-header';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      {children}
    </div>
  );
}
