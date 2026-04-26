'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does the approval workflow system work?',
    answer:
      'Our approval workflow automatically routes requests to the appropriate approvers based on their role and the resource type. Each approval step is logged in the audit trail. You can configure multiple approval levels, set conditions for routing, and even allow conditional approvals.',
  },
  {
    question: 'Can I create custom roles and permissions?',
    answer:
      'Yes! While we provide system roles (Admin, Owner, Manager, Viewer), you can create unlimited custom roles and assign specific permissions to each. Permissions are granular - you can control create, read, update, delete, approve, reject, and export actions per resource.',
  },
  {
    question: 'What happens if an approval is rejected?',
    answer:
      'When an approval is rejected, the requester is notified with the reason provided by the approver. They can then modify the request and resubmit it. The entire rejection history is maintained in the audit logs for compliance.',
  },
  {
    question: 'Is there an audit trail for all activities?',
    answer:
      'Absolutely. Every action - including who performed it, what changed, when it happened, and from where - is recorded in an immutable audit log. These logs are crucial for compliance and can be exported for regulatory requirements.',
  },
  {
    question: 'How secure is the system?',
    answer:
      'We implement enterprise-grade security: role-based access control, secure password hashing, encrypted sessions, audit logging, and compliance with industry standards. The system supports single sign-on and can integrate with your existing authentication providers.',
  },
  {
    question: 'Can different users have different views of the system?',
    answer:
      'Yes! Role-based access extends to UI elements. Users only see the pages, reports, and data they have permission to access. A Viewer might see read-only reports while a Manager sees operational controls.',
  },
  {
    question: 'What workflows does the system support?',
    answer:
      'The system comes with templates for stock requisition, order approval, and user management workflows. You can create custom workflows for any business process using the workflow builder.',
  },
  {
    question: 'How do I integrate with my existing systems?',
    answer:
      'We provide REST APIs and webhooks for integration. The system can authenticate against your existing user directory and can export data in multiple formats (CSV, JSON, XML) for downstream systems.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">
            Answers to common questions about our RBAC system
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden hover:border-teal-300 transition-colors">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 text-left">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-teal-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === idx && (
                <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-t border-teal-100">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
