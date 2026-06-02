'use client';

import React from 'react';
import { Users, Shield, Lock, CheckSquare, UserPlus, LogOut } from 'lucide-react';

const adminFeatures = [
  {
    icon: UserPlus,
    title: 'Invitation-Based Onboarding',
    description: 'Send secure, personalized invitations to new team members. They set up their own credentials while you control their role and permissions.',
  },
  {
    icon: Users,
    title: 'User Lifecycle Management',
    description: 'Create, modify, deactivate, or remove user accounts. Track user activity and access history with complete audit logs.',
  },
  {
    icon: Shield,
    title: 'Granular Permission Control',
    description: 'Assign specific permissions down to action level. Control who can create, edit, delete, or approve within each module.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access Control',
    description: 'Define custom roles or use system roles. Each role inherits specific permissions to match your organizational structure.',
  },
  {
    icon: CheckSquare,
    title: 'Workflow Configuration',
    description: 'Set up multi-level approval workflows for critical operations like stock requisitions and major orders.',
  },
  {
    icon: LogOut,
    title: 'Session & Security Management',
    description: 'Configure session timeouts, enable 2FA, reset passwords, and remotely revoke access instantly if needed.',
  },
];

export function AdminFeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900">
            Single Admin, Complete Control
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Only one admin manages all users, roles, and permissions. Secure, auditable, and built for enterprise governance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {adminFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="group">
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-8 hover:border-teal-300 hover:shadow-lg transition-all">
                  <div className="p-3 w-fit rounded-lg bg-teal-100 text-teal-600 mb-4 group-hover:bg-teal-200 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Authority Statement */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-8 sm:p-12">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-lg bg-purple-600 text-white flex-shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-3">
                Admin Authority: Sole Control Over Access
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Only the System Admin can add, modify, or remove users and assign roles. This single point of control ensures:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold mt-1">✓</span>
                  <span><strong>No unauthorized access:</strong> Every user addition and permission change goes through the admin</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold mt-1">✓</span>
                  <span><strong>Complete audit trail:</strong> Every user action is logged with timestamp, IP, and changes made</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold mt-1">✓</span>
                  <span><strong>Compliance ready:</strong> Meets regulatory requirements for access control and data governance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold mt-1">✓</span>
                  <span><strong>Security by design:</strong> Centralized user management prevents unauthorized role escalation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
