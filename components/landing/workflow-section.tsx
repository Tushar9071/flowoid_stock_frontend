import React from "react";
import { Factory, Pickaxe, Cog, CheckSquare, Package, Truck, HandCoins } from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      icon: Factory,
      title: "Raw Material Purchase",
      description: "Record purchases from suppliers with quantity and cost. Track outstanding supplier balance automatically.",
    },
    {
      icon: Pickaxe,
      title: "Lot Distribution to Workers",
      description: "Split raw material into lots. Issue each lot to a specific worker with supplementary items — stones, diamonds, coatings.",
    },
    {
      icon: Cog,
      title: "Manufacturing & Assignment Tracking",
      description: "Workers hold one or multiple active design assignments. Track issue date and expected return per assignment.",
    },
    {
      icon: CheckSquare,
      title: "Finished Goods Collection",
      description: "Record pieces received. Support partial deliveries. Auto-calculate worker earnings: pieces × rate per design.",
    },
    {
      icon: Package,
      title: "Packaging",
      description: "Convert loose finished pieces into packaged dozens — the sellable unit ready for dispatch.",
    },
    {
      icon: Truck,
      title: "Order & Dispatch",
      description: "Create dealer orders, validate stock, generate invoice, dispatch parcels with tracking.",
    },
    {
      icon: HandCoins,
      title: "Payment Collection",
      description: "Record cash or credit (udhaar). Auto-track due dates, outstanding balances, and aging.",
    },
  ];

  return (
    <section id="workflow" className="py-24 bg-[#F8F9FC] border-y border-[#E2E8F0]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] font-jakarta mb-4">
            One Platform. The Entire Manufacturing Cycle.
          </h2>
          <p className="text-lg text-[#4B5C72]">
            Seven steps, fully connected.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[28px] md:left-1/2 top-4 bottom-4 w-0.5 bg-[#E2E8F0] transform md:-translate-x-1/2"></div>

          <div className="space-y-12">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              const StepIcon = step.icon;

              return (
                <div key={index} className={`relative flex items-center md:justify-between flex-col md:flex-row ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Timeline Node */}
                  <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full bg-white border-4 border-[#F8F9FC] shadow-sm z-10">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1B2D4F]">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                  </div>

                  {/* Content Box */}
                  <div className={`ml-20 md:ml-0 md:w-[45%] ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative">
                      {/* Triangle pointer for desktop */}
                      <div className={`hidden md:block absolute top-6 w-4 h-4 bg-white border-[#E2E8F0] transform rotate-45 ${
                        isEven ? 'right-[-8px] border-t border-r' : 'left-[-8px] border-b border-l'
                      }`}></div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#D4A843]/10 rounded-md">
                          <StepIcon className="w-5 h-5 text-[#D4A843]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#0F1C2E]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-[#4B5C72] text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
