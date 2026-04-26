import React from "react";
import { Users, Truck, Banknote, Gem, Layers } from "lucide-react";

export function UseCasesSection() {
  const useCases = [
    {
      icon: Users,
      title: "Manufacturers tracking 30–100 workers",
      description: "Manage large teams of artisans with ease. Track individual assignments, lot distribution, and piece-rate earnings automatically.",
    },
    {
      icon: Truck,
      title: "Wholesalers managing 50–200 dealer accounts",
      description: "Keep track of dealer orders, pending dispatches, and outstanding payments without getting lost in WhatsApp chats.",
    },
    {
      icon: Banknote,
      title: "Udhaar & credit-heavy relationships",
      description: "Most business runs on credit. We built specific tools to track aging ledgers, set credit limits, and alert you on overdue balances.",
    },
    {
      icon: Gem,
      title: "Stone & diamond-based piece rates",
      description: "Calculate accurate payouts for intricate designs by tracking the exact number of stones and supplementary materials used.",
    },
    {
      icon: Layers,
      title: "Multiple parallel designs",
      description: "Run 50+ different design lines simultaneously. Our product catalogue manages SKUs, images, and distinct piece rates seamlessly.",
    },
  ];

  return (
    <section className="py-24 bg-white border-t border-[#E2E8F0]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] font-jakarta mb-4">
            Built for How Jewellery Businesses Actually Work
          </h2>
          <p className="text-lg text-[#4B5C72]">
            We understand the unique challenges of imitation jewellery manufacturing and wholesale distribution in India.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div key={index} className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className="w-12 h-12 rounded-lg bg-[#F8F9FC] border border-[#E2E8F0] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#1B2D4F]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F1C2E] mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-[#4B5C72] leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
