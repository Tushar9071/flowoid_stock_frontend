'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Clock, Zap } from 'lucide-react';
import { mockApprovals } from '@/lib/data';

export default function DemoPage() {
  const pendingApprovals = mockApprovals.filter(a => a.status === 'pending' || a.status === 'approved');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="font-serif text-5xl font-bold text-gray-900">Live Approval Workflow Demo</h1>
          <p className="text-xl text-gray-600">See real-time approval workflows in action</p>
          <Link href="/" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Landing
          </Link>
        </div>

        {/* Demo Approvals */}
        <div className="space-y-6">
          {pendingApprovals.map(approval => (
            <Card key={approval.id} className="rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-lg transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="font-serif text-2xl font-bold text-gray-900">{approval.resourceName}</h3>
                  <p className="text-gray-600 mt-2">Requested by: {approval.requester.name}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ${
                    approval.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {approval.status === 'approved' ? 'Approved' : 'Pending'}
                </span>
              </div>

              {/* Approval Chain Visualization */}
              <div className="space-y-4 my-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Approval Chain</h4>
                <div className="space-y-3">
                  {approval.approvalChain.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {step.status === 'approved' ? (
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 capitalize">{step.role}</span>
                          {step.approver && <span className="text-gray-600">- {step.approver.name}</span>}
                        </div>
                        {step.status === 'approved' && step.actionDate && (
                          <p className="text-sm text-gray-600 mt-1">
                            Approved on {new Date(step.actionDate).toLocaleDateString()} {step.comments && `• ${step.comments}`}
                          </p>
                        )}
                        {step.status === 'pending' && (
                          <p className="text-sm text-amber-600 mt-1">Awaiting approval...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              {approval.metadata && (
                <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                  {Object.entries(approval.metadata).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {typeof value === 'number'
                          ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
                          : value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action */}
              {approval.status === 'pending' && approval.currentApprover && (
                <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-teal-600" />
                    <span className="text-teal-900 font-medium">
                      Awaiting approval from {approval.currentApprover.role}
                    </span>
                  </div>
                  <button className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
                    Review
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">Ready to implement this in your system?</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Login to Explore Full System
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
