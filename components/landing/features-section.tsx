import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Database, 
  Gem, 
  Palette, 
  Users, 
  Boxes, 
  Building2, 
  ShoppingCart, 
  CreditCard, 
  FileText 
} from "lucide-react";

export function FeaturesSection() {
  const modules = [
    {
      icon: BarChart3,
      title: "Dashboard & Analytics",
      description: "Today's sales, low stock alerts, overdue payments, worker activity — all on one screen.",
    },
    {
      icon: Database,
      title: "Raw Material Management",
      description: "Track purchases by supplier, material type, quantity and cost. Supplier ledger with outstanding balance.",
    },
    {
      icon: Gem,
      title: "Supplementary Materials",
      description: "Manage stones, diamonds, fittings, coatings. Track issuance per assignment and consumption per design.",
    },
    {
      icon: Palette,
      title: "Product Design Catalogue",
      description: "Maintain your full design library with SKU, diamond count, piece rate, sale price per dozen, and reference images.",
    },
    {
      icon: Users,
      title: "Worker Management",
      description: "Register workers, issue lots, collect finished goods, calculate earnings, settle payments with advance support.",
    },
    {
      icon: Boxes,
      title: "Inventory Management",
      description: "Two-stage stock: unpackaged pieces → packaged dozens. Low stock alerts, packaging batch records.",
    },
    {
      icon: Building2,
      title: "Party Management",
      description: "Manage dealers and suppliers in one place. Credit limits, credit periods, full ledger, overdue alerts.",
    },
    {
      icon: ShoppingCart,
      title: "Orders & Dispatch",
      description: "Create orders, validate stock, generate invoices, record dispatch. Partial dispatch supported.",
    },
    {
      icon: CreditCard,
      title: "Payment & Ledger",
      description: "Cash, UPI, bank transfer. Aging report: 0–30, 31–60, 61–90, 90+ days. Daily cash flow summary.",
    },
    {
      icon: FileText,
      title: "Reports & Analytics",
      description: "Sales, stock, worker, outstanding, purchase, profit reports. Export to PDF and Excel.",
    }
  ];

  return (
    <section id="modules" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] font-jakarta mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-lg text-[#4B5C72]">
            10 integrated modules, purpose-built for jewellery manufacturing
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
                  <div className="w-12 h-12 rounded-lg bg-[#F8F9FC] border border-[#E2E8F0] flex items-center justify-center mb-4 group-hover:bg-[#1B2D4F] transition-colors">
                    <ModuleIcon className="w-6 h-6 text-[#1B2D4F] group-hover:text-[#D4A843] transition-colors" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#0F1C2E]">
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#4B5C72] text-sm leading-relaxed">
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
