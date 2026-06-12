"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is StockFlow only for imitation jewellery businesses?",
      a: "No — StockFlow works for any jewellery manufacturing operation. It handles gold, silver, and brass alongside complex component-heavy designs with the same precision. The BOM-based design library, piece-rate calculations, and lot tracking work equally well across fine and fashion jewellery."
    },
    {
      q: "How is my business data kept secure?",
      a: "StockFlow is hosted on a dedicated Oracle VPS with encrypted storage. All access is protected by JWT-based authentication and role-based access control (RBAC). Your business data is never shared with any third party."
    },
    {
      q: "What happens if a worker doesn't return all pieces?",
      a: "StockFlow fully supports partial returns. When a worker delivers a partial batch, you record what came back — the system tracks the remaining outstanding quantity and flags it on the assignment. Nothing slips through unnoticed."
    },
    {
      q: "Can I export reports and data?",
      a: "Yes. All reports, ledgers, and data can be exported to PDF or Excel. This makes it easy to share with your accountant or import into Tally for tax filing purposes."
    },
    {
      q: "Do you support GST-compliant invoices?",
      a: "GST-compliant invoice generation is currently in development and will be released as a system update. For now, standard invoices and delivery challans are fully supported and ready to use."
    },
    {
      q: "Can I try it before committing?",
      a: "Yes. A full 14-day free trial is available — no payment required upfront. Schedule a system walkthrough to see StockFlow running with your actual business scenarios before you decide."
    }
  ];

  return (
    <section className="py-24 bg-[#F8F9FC]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[#1B2D4F]/5 border border-[#1B2D4F]/10 text-[#1B2D4F] text-xs font-bold uppercase tracking-wider mb-6">
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] font-jakarta mb-4 drop-shadow-sm">
            Questions we hear most often.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-[#D4A843] shadow-md' : 'border-[#E2E8F0] hover:border-[#1B2D4F]/30'
                }`}
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-[#0F1C2E] text-base md:text-lg pr-8">
                    {faq.q}
                  </span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                    isOpen ? 'bg-[#D4A843]/10 rotate-180' : 'bg-[#F8F9FC]'
                  }`}>
                    <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-[#D4A843]' : 'text-[#4B5C72]'}`} />
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 pt-2 text-[#4B5C72] leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
