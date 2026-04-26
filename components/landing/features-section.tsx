'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Zap,
  BarChart3,
  Users,
  GitBranch,
  Database,
  Bell,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Fine-Grained Permissions',
    description: 'Control access down to the action level. Define who can create, read, update, delete, approve, or export resources.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Industry-standard authentication, secure session management, and encryption for sensitive operations.',
  },
  {
    icon: Zap,
    title: 'Automated Workflows',
    description: 'Rules-based approval routing that adapts to your business logic. No coding required.',
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Auditing',
    description: 'Complete audit trails for every action, including who did what, when, and from where.',
  },
  {
    icon: Users,
    title: 'Role Management',
    description: 'Create custom roles with specific permission sets. System and custom roles coexist seamlessly.',
  },
  {
    icon: GitBranch,
    title: 'Workflow Templates',
    description: 'Pre-built workflow templates for common scenarios, fully customizable to your needs.',
  },
  {
    icon: Database,
    title: 'Real-Time Data',
    description: 'Instant updates across the system. Changes propagate immediately to all authorized users.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Intelligent alerts notify users of pending approvals and actions requiring their attention.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900">Platform Capabilities</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features built for enterprise reliability and ease of use
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="rounded-xl border border-gray-200 bg-white hover:border-teal-300 hover:shadow-lg transition-all duration-300 p-6 space-y-4 group">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
