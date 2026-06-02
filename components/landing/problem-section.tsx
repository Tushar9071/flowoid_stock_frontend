import React from "react";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProblemSection() {
  const problems = [
    {
      pain: "Lost track of which worker has which material",
      solution: "Worker assignments with lot tracking & status lifecycle",
    },
    {
      pain: "Don't know how much a dealer owes you",
      solution: "Real-time dealer ledger with udhaar & overdue alerts",
    },
    {
      pain: "Can't tell what's in stock without checking physically",
      solution: "Two-stage inventory: unpackaged pieces + packaged dozens",
    },
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] font-jakarta mb-4">
            Running a Jewellery Business on WhatsApp & Paper?
          </h2>
          <p className="text-lg text-[#4B5C72]">
            Most manufacturers still track workers in notebooks, orders on WhatsApp, 
            and payments in memory. That's where things go wrong.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((item, index) => (
            <Card key={index} className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-8 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-6">
                    <XCircle className="w-6 h-6 text-[#ef4444] shrink-0 mt-0.5" />
                    <p className="text-base font-medium text-[#4B5C72] leading-snug">
                      "{item.pain}"
                    </p>
                  </div>
                  
                  <div className="flex justify-center mb-6 opacity-30">
                    <ArrowRight className="w-5 h-5 text-[#4B5C72]" />
                  </div>
                </div>
                
                <div className="flex items-start gap-3 bg-[#F8F9FC] p-4 rounded-lg border border-[#E2E8F0]/50">
                  <CheckCircle2 className="w-6 h-6 text-[#22C55E] shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-[#0F1C2E] leading-snug">
                    {item.solution}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
