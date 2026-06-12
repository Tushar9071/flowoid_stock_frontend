import React from "react";
import { Users, Handshake, CreditCard, Gem, Layers } from "lucide-react";

export function UseCasesSection() {
  const useCases = [
    {
      icon: Users,
      title: "Factories with 30–100 workers",
      description: "Track every karigaar, every lot, every piece rate",
    },
    {
      icon: Handshake,
      title: "Wholesalers managing 50–200 dealer accounts",
      description: "Centralised ledgers, udhaar tracking, overdue alerts",
    },
    {
      icon: CreditCard,
      title: "Credit-heavy B2B relationships",
      description: "Udhaar, aging reports, and payment history in one place",
    },
    {
      icon: Gem,
      title: "Stone & diamond-based piece rates",
      description: "Precise component tracking with BOM-level detail",
    },
    {
      icon: Layers,
      title: "Multiple parallel design runs",
      description: "Simultaneous worker assignments without confusion",
    },
  ];

  return (
    <section className="py-24 bg-white border-y border-[#E2E8F0]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B2D4F]/5 border border-[#1B2D4F]/10 text-[#1B2D4F] text-xs font-bold uppercase tracking-wider mb-6">
              Built For
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] font-jakarta mb-6 leading-tight drop-shadow-sm">
              Built for how jewellery businesses actually work.
            </h2>
            <p className="text-lg text-[#4B5C72] leading-relaxed mb-8">
              We understand the specific challenges of imitation and fine jewellery manufacturing in India — the kind of detail that generic inventory software always misses.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-4">
              {useCases.map((item, index) => {
                const Icon = item.icon;
                // Make the last item span 2 columns on small screens if it's an odd number
                const isLastAndOdd = index === useCases.length - 1 && useCases.length % 2 !== 0;
                
                return (
                  <div 
                    key={index} 
                    className={`bg-[#F8F9FC] border border-[#E2E8F0] p-6 rounded-2xl hover:border-[#D4A843]/50 hover:shadow-md transition-all duration-300 group ${
                      isLastAndOdd ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 group-hover:border-[#D4A843] transition-colors">
                        <Icon className="w-5 h-5 text-[#1B2D4F] group-hover:text-[#D4A843] transition-colors" />
                      </div>
                      <h3 className="font-bold text-[#0F1C2E] text-base leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[#4B5C72] text-sm leading-relaxed pl-14">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
