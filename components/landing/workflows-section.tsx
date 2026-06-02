'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Package, Users, Zap } from 'lucide-react';

const workflows = [
  {
    id: 'stock',
    name: 'Raw Material Stock Requisition',
    description: 'Multi-level approval for raw material procurement with budget control',
    icon: Package,
    steps: [
      {
        role: 'Manager',
        action: 'Submit Requisition',
        detail: 'Operations Manager submits stock requisition: material type (brass, gold plating, etc.), quantity in kg/units, supplier details, and estimated cost',
        status: 'completed',
        time: '2:30 PM',
      },
      {
        role: 'Owner',
        action: 'Review & Approve',
        detail: 'Owner reviews material need, checks budget availability, verifies supplier relationship, and approves or requests modifications',
        status: 'completed',
        time: '3:15 PM',
      },
      {
        role: 'System',
        action: 'Process & Track',
        detail: 'Requisition approved — system creates purchase order, updates stock ledger upon receipt, and records supplier payment terms',
        status: 'current',
        time: 'Processing...',
      },
    ],
  },
  {
    id: 'user',
    name: 'User Invitation & Role Assignment',
    description: 'Secure user onboarding with admin-controlled permission setup and owner verification',
    icon: Users,
    steps: [
      {
        role: 'Admin',
        action: 'Invite New User',
        detail: 'System Admin sends secure invitation email with onboarding link. Admin defines initial role (Manager, Viewer, etc.) and assigns specific permissions',
        status: 'completed',
        time: '9:00 AM',
      },
      {
        role: 'New User',
        action: 'Accept & Setup',
        detail: 'New team member clicks invitation link, creates account credentials, and sets up secure access with 2FA optional',
        status: 'completed',
        time: '9:45 AM',
      },
      {
        role: 'Owner',
        action: 'Verify & Activate',
        detail: 'Owner reviews new user assignment and permissions — can approve, modify role, or reject access before activation',
        status: 'current',
        time: 'Pending...',
      },
      {
        role: 'System',
        action: 'Grant Access',
        detail: 'User account fully activated with assigned role and permissions. Admin can revoke or modify access anytime with audit trail',
        status: 'pending',
        time: 'Awaiting...',
      },
    ],
  },
];

export function WorkflowsSection() {
  const [selectedWorkflow, setSelectedWorkflow] = useState('stock');
  const workflow = workflows.find(w => w.id === selectedWorkflow)!;
  const WorkflowIcon = workflow.icon;

  return (
    <section id="workflows" className="py-24 bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900">Approval Workflows</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automated, transparent approval chains for both inventory and user management
          </p>
        </div>

        {/* Workflow Selector */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          {workflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => setSelectedWorkflow(wf.id)}
              className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all text-left ${
                selectedWorkflow === wf.id
                  ? 'border-teal-500 bg-white shadow-lg'
                  : 'border-gray-200 bg-white hover:border-teal-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedWorkflow === wf.id ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'}`}>
                  <wf.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                  <p className="text-xs text-gray-600">{wf.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Workflow Visualization */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-gray-200">
            <div className="p-3 rounded-lg bg-teal-100 text-teal-600">
              <WorkflowIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">{workflow.name}</h3>
              <p className="text-gray-600">{workflow.description}</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {workflow.steps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Connector Line */}
                {idx < workflow.steps.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-20 bg-gradient-to-b from-teal-300 to-gray-200"></div>
                )}

                <div className="flex gap-6">
                  {/* Step Indicator */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        step.status === 'completed'
                          ? 'bg-teal-600 text-white'
                          : step.status === 'current'
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                          : 'bg-gray-300 text-white'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : step.status === 'current' ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{step.role}</h4>
                          <h5 className="text-lg font-bold text-teal-700 mt-1">{step.action}</h5>
                        </div>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                          step.status === 'completed'
                            ? 'bg-teal-100 text-teal-700'
                            : step.status === 'current'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {step.time}
                        </span>
                      </div>
                      <p className="text-gray-600">{step.detail}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Info */}
          <div className="mt-10 pt-6 border-t border-gray-200 bg-teal-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-teal-900">Smart Routing</p>
                <p className="text-teal-800 text-sm">
                  Each workflow step automatically routes to the appropriate approver based on their role and permissions. Failed approvals trigger notifications and can be resubmitted with modifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
