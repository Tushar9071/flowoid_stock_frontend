import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Database, 
  Gem, 
  Palette, 
  Users, 
  BellRing, 
  Building2, 
  Truck, 
  Receipt, 
  LineChart 
} from "lucide-react";

export function FeaturesSection() {
  const modules = [
    {
      icon: BarChart3,
      title: "Real-Time Dashboard",
      description: "Today's sales, low stock alerts, overdue payments, and worker activity — the complete business picture at a glance.",
    },
    {
      icon: Database,
      title: "Raw Material Control",
      description: "Track every gram of gold, silver, and brass purchased. Manage supplier ledgers with purity levels and gross/net weights.",
    },
    {
      icon: Gem,
      title: "Component Tracking",
      description: "Manage stones, diamonds, and fittings with precision. Every supplementary item tied to its lot and worker assignment.",
    },
    {
      icon: Palette,
      title: "Digital Design Library",
      description: "Maintain your complete design catalogue with reference images, Bill of Materials, and specific piece-rate labour costs.",
    },
    {
      icon: Users,
      title: "Worker & Lot Management",
      description: "Issue raw materials securely to workers. Automatically calculate piece-rate wages and track advances in real time.",
    },
    {
      icon: BellRing,
      title: "Smart Stock Alerts",
      description: "Automatic alerts before you run out of raw materials or fast-moving components. Production never halts on your watch.",
    },
    {
      icon: Building2,
      title: "Dealer & Party Directory",
      description: "Centralised dealer information with credit limits, udhaar balances, and overdue alerts — all dealers, one view.",
    },
    {
      icon: Truck,
      title: "Orders & Dispatch",
      description: "Turn orders into delivery challans in one click. Validate stock before dispatch. Track every parcel sent to dealers.",
    },
    {
      icon: Receipt,
      title: "Ledger & Udhaar",
      description: "Manage dealer credit with complete transparency. Every transaction recorded, every outstanding balance visible in real time.",
    },
    {
      icon: LineChart,
      title: "Business Reports",
      description: "Automatic reports on sales performance, top designs, worker output, and full P&L statements. Export to Excel or PDF.",
    }
  ];

  return (
    <section id="modules" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[#1B2D4F]/5 border border-[#1B2D4F]/10 text-[#1B2D4F] text-xs font-bold uppercase tracking-wider mb-6">
            Modules
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] font-jakarta mb-6 leading-tight drop-shadow-sm">
            Ten modules. Fully integrated.
          </h2>
          <p className="text-lg text-[#4B5C72] leading-relaxed">
            Every capability your jewellery manufacturing business needs — purpose-built, not adapted from generic software.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => {
            const ModuleIcon = module.icon;
            return (
              <Card 
                key={index} 
                className="border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#1B2D4F]/30 transition-all duration-300 group"
              >
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F9FC] border border-[#E2E8F0] flex items-center justify-center mb-4 group-hover:bg-[#1B2D4F] transition-colors duration-300">
                    <ModuleIcon className="w-6 h-6 text-[#1B2D4F] group-hover:text-[#D4A843] transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#0F1C2E]">
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#4B5C72] text-base leading-relaxed">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
