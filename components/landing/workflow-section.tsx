import React from "react";

export function WorkflowSection() {
  const steps = [
    {
      num: "01",
      title: "System Setup & Configuration",
      desc: "Configure your business profile, design catalogue with BOM and piece-rate labour costs, pricing rules, and user roles. Everything flows from this foundation.",
    },
    {
      num: "02",
      title: "Raw Material Purchase",
      desc: "Log purchases from suppliers with weight, purity, and cost. Supplier ledgers update automatically — cash or credit, every rupee tracked.",
    },
    {
      num: "03",
      title: "Lot Distribution to Workers",
      desc: "Create material lots from your central vault. Issue each lot to a specific worker along with supplementary items (stones, fittings). Print job slips with barcodes for physical handover.",
    },
    {
      num: "04",
      title: "Manufacturing & Assignment Tracking",
      desc: "Monitor active assignments in real time. Filter by Active, Overdue, or Completed. Track complex designs across multiple stages — Casting, Filing, Polishing, Setting.",
    },
    {
      num: "05",
      title: "Finished Goods Collection & Payouts",
      desc: "Record returned pieces, net weight, and scrap (kachra). Worker earnings calculate automatically from predefined piece rates. Advances deducted instantly from worker ledgers.",
    },
    {
      num: "06",
      title: "Packaging & Final Inventory",
      desc: "Move finished pieces from unpackaged to packaged inventory. Bundle into sellable dozens. Run digital stock reconciliations to verify against physical counts anytime.",
    },
    {
      num: "07",
      title: "Order & Dispatch",
      desc: "Generate dealer orders from live inventory. Apply dealer-specific discounts. Create invoices and delivery challans in one click. Dispatch with full parcel tracking.",
    },
    {
      num: "08",
      title: "WhatsApp Billing",
      badge: "✦ Integrated",
      desc: "The moment an invoice is approved, the system sends a direct WhatsApp message to your dealer — order summary, total due, payment date, and a secure PDF invoice link. No manual follow-ups needed.",
      highlight: true,
    },
    {
      num: "09",
      title: "Payment Collection & Udhaar",
      desc: "Record cash, UPI, NEFT, or RTGS payments against specific invoices. Dealer outstanding balances update instantly. Aging reports always reflect the current state.",
    },
  ];

  return (
    <section className="py-24 bg-[#F8F9FC] overflow-hidden" id="workflow">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
        <div className="text-center max-w-3xl mx-auto mb-20 scroll-animate">
          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[#1B2D4F]/5 border border-[#1B2D4F]/10 text-[#1B2D4F] text-xs font-bold uppercase tracking-wider mb-6">
            The System
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] font-jakarta mb-6 leading-tight drop-shadow-sm">
            Nine steps. One connected operation.
          </h2>
          <p className="text-lg text-[#4B5C72] leading-relaxed">
            Every stage of your manufacturing and sales cycle — digitised, tracked, and linked end to end.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#CBD5E1] to-transparent hidden md:block"></div>
          
          {/* Mobile vertical line */}
          <div className="absolute left-8 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#CBD5E1] to-transparent md:hidden"></div>

          <div className="space-y-8 relative z-10">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              // Add scrolling animation delay based on index
              const delayClass = `landing-delay-${(index % 5) + 1}`;
              
              return (
                <div 
                  key={index} 
                  className={`flex flex-col md:flex-row items-center justify-between w-full group relative scroll-animate ${delayClass} ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  
                  {/* Node Container */}
                  <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 flex justify-center w-12 md:w-16 shrink-0 z-20">
                    <div className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-4 shadow-sm transition-all duration-500 transform group-hover:scale-110 ${
                      step.highlight 
                        ? 'bg-white border-[#22C55E] text-[#15803D] shadow-[#22C55E]/20' 
                        : 'bg-white border-[#E2E8F0] text-[#64748B] group-hover:border-[#1B2D4F] group-hover:text-[#1B2D4F]'
                    }`}>
                      <span className="font-bold text-sm md:text-base font-jakarta tracking-tight">{step.num}</span>
                    </div>
                  </div>

                  {/* Empty space for the opposite side on desktop */}
                  <div className="hidden md:block w-[45%]"></div>

                  {/* Content Box */}
                  <div className="w-full md:w-[45%] pl-20 md:pl-0">
                    <div className={`p-6 md:p-8 rounded-2xl transition-all duration-500 transform group-hover:-translate-y-1 relative ${
                      step.highlight 
                        ? 'bg-white border-2 border-[#22C55E]/30 shadow-lg shadow-[#22C55E]/5' 
                        : 'bg-white border border-[#E2E8F0] shadow-sm group-hover:shadow-md group-hover:border-[#CBD5E1]'
                    }`}>
                      
                      {/* Connection arrow pointing to the node (Desktop only) */}
                      <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[#E2E8F0] transform rotate-45 transition-colors duration-500 ${
                        isEven ? 'left-[-8px] border-b border-l' : 'right-[-8px] border-t border-r'
                      } ${step.highlight ? 'border-[#22C55E]/30 bg-white' : 'group-hover:border-[#CBD5E1]'}`}></div>

                      <div className="flex flex-wrap items-center gap-3 mb-3 md:mb-4 relative z-10">
                        <h3 className={`text-lg md:text-xl font-bold transition-colors duration-300 ${
                          step.highlight ? 'text-[#15803D]' : 'text-[#0F1C2E] group-hover:text-[#1B2D4F]'
                        }`}>
                          {step.title}
                        </h3>
                        {step.badge && (
                          <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#15803D] text-[10px] md:text-[11px] font-bold uppercase tracking-wider animate-pulse">
                            {step.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm md:text-base text-[#4B5C72] leading-relaxed relative z-10">
                        {step.desc}
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
