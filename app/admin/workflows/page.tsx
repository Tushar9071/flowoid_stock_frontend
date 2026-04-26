'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Package, Users, GitBranch } from 'lucide-react';
import { mockWorkflowTemplates, mockApprovals } from '@/lib/data';

export default function WorkflowsPage() {
  const icons: Record<string, React.ComponentType<{ className: string }>> = {
    'workflow-stock-request': Package,
    'workflow-user-creation': Users,
    'workflow-order-approval': GitBranch,
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Workflows</h1>
          <p className="text-gray-600 mt-1">Create and manage multi-step approval workflows</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          <Plus className="w-5 h-5" />
          Create Workflow
        </button>
      </div>

      <div className="space-y-6">
        {mockWorkflowTemplates.map(workflow => {
          const Icon = icons[workflow.id] || GitBranch;
          const instances = mockApprovals.filter(a => a.workflowId === workflow.id);

          return (
            <Card key={workflow.id} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-teal-100 text-teal-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                    <p className="text-gray-600 mt-1">{workflow.description}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Trigger: <span className="font-medium capitalize">{workflow.trigger}</span>
                      </span>
                      <span className="text-sm text-gray-600">
                        Active Instances: <span className="font-medium">{instances.length}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Approval Chain</h4>
                <div className="flex items-center gap-4">
                  {workflow.approvers.map((approver, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                        {approver.role}
                      </div>
                      {idx < workflow.approvers.length - 1 && (
                        <span className="text-gray-400 text-xl">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
