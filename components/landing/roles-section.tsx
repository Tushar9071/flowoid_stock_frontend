import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Key, UserCog, Eye, CheckCircle2 } from "lucide-react";

export function RolesSection() {
  const roles = [
    {
      icon: Key,
      title: "Owner (Super Admin)",
      description: "Full access to every module. Manage users, configure pricing tiers, override credit limits, view all financials.",
      permissions: ["Full Financial Access", "User Management", "System Configuration"],
      color: "text-[#D4A843]",
      bg: "bg-[#D4A843]/10"
    },
    {
      icon: UserCog,
      title: "Manager / Staff",
      description: "Day-to-day operations: issue materials, collect goods, create orders, record payments. No financial config access.",
      permissions: ["Daily Operations", "Order Processing", "Worker Management"],
      color: "text-[#1B2D4F]",
      bg: "bg-[#1B2D4F]/10"
    },
    {
      icon: Eye,
      title: "Viewer / Auditor",
      description: "Read-only access for accountants or silent partners. View and export all reports without modifying data.",
      permissions: ["Read-Only Access", "Report Generation", "Data Export"],
      color: "text-[#4B5C72]",
      bg: "bg-[#4B5C72]/10"
    }
  ];

  return (
    <section className="py-24 bg-[#F8F9FC]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] font-jakarta mb-4">
            Built for Your Whole Team
          </h2>
          <p className="text-lg text-[#4B5C72]">
            Granular role-based access — every person sees only what they need
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => {
            const RoleIcon = role.icon;
            return (
              <Card key={index} className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-full ${role.bg} flex items-center justify-center mb-6`}>
                    <RoleIcon className={`w-7 h-7 ${role.color}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#0F1C2E] mb-3">
                    {role.title}
                  </h3>
                  
                  <p className="text-[#4B5C72] text-sm leading-relaxed mb-6 h-20">
                    {role.description}
                  </p>
                  
                  <div className="space-y-3 pt-6 border-t border-[#E2E8F0]">
                    {role.permissions.map((perm, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                        <span className="text-sm font-medium text-[#0F1C2E]">{perm}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
