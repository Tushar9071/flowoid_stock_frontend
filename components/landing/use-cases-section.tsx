'use client';

import React from 'react';
import { Boxes, Users, TrendingUp, AlertCircle } from 'lucide-react';

const useCases = [
  {
    icon: Boxes,
    title: 'Inventory Management',
    description: 'Control stock requisitions, material requests, and inventory adjustments',
    features: [
      'Multi-level approval for stock requests',
      'Real-time inventory tracking with role-based views',
      'Automatic low-stock alerts and approval routing',
      'Complete audit trail for all inventory changes',
    ],
    example: 'When a manager requests 500 units of brass, the system automatically routes to the owner for approval before updating stock levels.',
  },
  {
    icon: Users,
    title: 'User & Role Management',
    description: 'Secure user onboarding with permission control and role assignment',
    features: [
      'Admin-initiated user creation with verification',
      'Owner approval for role assignments',
      'Automatic permission inheritance based on roles',
      'Bulk user import with approval workflows',
    ],
    example: 'Admin creates a new user account. The owner reviews and approves the role assignment. User gains access to their designated resources immediately upon approval.',
  },
  {
    icon: TrendingUp,
    title: 'Order Processing',
    description: 'Streamlined order approval with automatic inventory and payment updates',
    features: [
      'Large order approval workflows',
      'Automatic inventory reservation on approval',
      'Payment status tracking by role',
      'Dispatch authorization and tracking',
    ],
    example: 'A high-value order is submitted. Manager verifies stock availability, owner approves the sale, and inventory is automatically allocated.',
  },
  {
    icon: AlertCircle,
    title: 'Compliance & Auditing',
    description: 'Complete audit trails with regulatory compliance reporting',
    features: [
      'Immutable audit logs for all actions',
      'Role-based report access',
      'Compliance certifications and exports',
      'User activity monitoring and alerts',
    ],
    example: 'Auditors can generate compliance reports showing all approvals, changes, and user actions for regulatory requirements.',
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900">Real-World Applications</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Proven solutions for enterprise operations beyond inventory management
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, idx) => {
            const Icon = useCase.icon;
            return (
              <div key={idx} className="group rounded-2xl border border-gray-200 hover:border-teal-300 bg-white hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg">
                <div className="p-8 space-y-6">
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-gray-900">{useCase.title}</h3>
                    <p className="text-gray-600">{useCase.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Key Features</h4>
                    <ul className="space-y-2">
                      {useCase.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-gray-700 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Example */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Example Scenario</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{useCase.example}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
