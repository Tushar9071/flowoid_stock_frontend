import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      pain: "No idea which worker is holding which material or lot right now.",
      solution: "Complete lot tracking with worker assignments, issue dates, expected return dates, and full status lifecycle — Active, Overdue, or Completed.",
    },
    {
      pain: "Dealer balances tracked in a notebook — or worse, only in memory.",
      solution: "Real-time dealer ledger with udhaar tracking, payment history, aging reports, and automated overdue alerts. Every rupee, always accounted for.",
    },
    {
      pain: "I have to physically check every shelf to know what's actually in stock.",
      solution: "Two-stage digital inventory: unpackaged finished pieces and packaged dozens — always reconciled, always accurate, accessible from any device.",
    },
  ];

  return (
    <section className="py-24 bg-[#F8F9FC] border-b border-[#E2E8F0]" id="problem">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-xs font-bold uppercase tracking-wider mb-6">
            The Problem
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] font-jakarta leading-tight mb-6 drop-shadow-sm">
            Most jewellery factories still run on paper and WhatsApp.
          </h2>
          <p className="text-lg text-[#4B5C72] leading-relaxed">
            When your entire operation depends on notebooks, phone calls, and memory — one bad day means lost materials, missed payments, and unhappy dealers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              {/* Pain Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-[#ef4444] font-bold text-sm uppercase tracking-wide mb-3">
                  <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                  The Pain
                </div>
                <p className="text-lg font-medium text-[#0F1C2E] leading-snug italic">
                  "{item.pain}"
                </p>
              </div>

              {/* Decorative Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent my-6 opacity-60"></div>

              {/* Solution Section */}
              <div className="mt-auto">
                <div className="flex items-center gap-2 text-[#22c55e] font-bold text-sm uppercase tracking-wide mb-3">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  StockFlow's Fix
                </div>
                <p className="text-base text-[#4B5C72] leading-relaxed font-medium">
                  {item.solution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
