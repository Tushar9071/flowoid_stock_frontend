"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Basic",
      monthlyPrice: 999,
      description: "Best for: Small manufacturers getting started",
      features: [
        { name: "Dashboard & Analytics", included: true },
        { name: "Raw Material Management", included: true },
        { name: "Worker Management (up to 20 workers)", included: true },
        { name: "Basic Inventory", included: true },
        { name: "Up to 5 Dealers", included: true },
        { name: "Standard Reports (PDF export)", included: true },
        { name: "Party Management", included: false },
        { name: "Advanced Analytics", included: false },
        { name: "Excel Export", included: false },
      ],
      cta: "Get Started",
      highlight: false,
      style: "border-[#E2E8F0] bg-white text-[#0F1C2E]",
      buttonStyle: "w-full border-[#1B2D4F] text-[#1B2D4F] hover:bg-[#F8F9FC]",
      buttonVariant: "outline" as const,
    },
    {
      name: "Standard",
      monthlyPrice: 1999,
      description: "Best for: Growing wholesale businesses",
      badge: "MOST POPULAR",
      features: [
        { name: "Everything in Basic", included: true },
        { name: "Unlimited Workers & Dealers", included: true },
        { name: "Full Party Management (Suppliers + Dealers)", included: true },
        { name: "Orders & Dispatch Module", included: true },
        { name: "Payment & Ledger Management", included: true },
        { name: "Outstanding Aging Report", included: true },
        { name: "PDF + Excel Export", included: true },
        { name: "2 Staff Users included", included: true },
      ],
      cta: "Get Started — Most Popular",
      highlight: true,
      style: "border-[#D4A843] border-2 bg-[#1B2D4F] text-white shadow-xl shadow-[#1B2D4F]/20 relative transform md:-translate-y-4",
      buttonStyle: "w-full bg-[#D4A843] hover:bg-[#D4A843]/90 text-white border-0 font-bold",
      buttonVariant: "default" as const,
      textColor: "text-white",
      mutedText: "text-[#94A3B8]",
      iconColor: "text-[#D4A843]",
    },
    {
      name: "Premium",
      monthlyPrice: 3499,
      description: "Best for: Established businesses needing full control",
      features: [
        { name: "Everything in Standard", included: true },
        { name: "Up to 10 Staff Users", included: true },
        { name: "Supplementary Materials Module", included: true },
        { name: "Design Catalogue with Images", included: true },
        { name: "Advanced Analytics & Profit Overview", included: true },
        { name: "GST-compliant Invoices (coming soon)", included: true },
        { name: "WhatsApp Notifications (coming soon)", included: true },
        { name: "Priority Support & Custom Onboarding", included: true },
      ],
      cta: "Contact Sales",
      highlight: false,
      style: "border-[#D4A843]/30 bg-gradient-to-b from-[#FFFDF7] to-white text-[#0F1C2E]",
      buttonStyle: "w-full bg-[#1B2D4F] hover:bg-[#1B2D4F]/90 text-white",
      buttonVariant: "default" as const,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] font-jakarta mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-[#4B5C72] mb-8">
            Choose the plan that fits your business. No hidden fees. Cancel anytime.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-semibold ${!isYearly ? 'text-[#1B2D4F]' : 'text-[#4B5C72]'}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-[#1B2D4F]" />
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isYearly ? 'text-[#1B2D4F]' : 'text-[#4B5C72]'}`}>Yearly</span>
              <Badge variant="secondary" className="bg-[#D4A843]/10 text-[#D4A843] hover:bg-[#D4A843]/20 border-0">Save 20%</Badge>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const price = isYearly ? Math.floor(plan.monthlyPrice * 0.8) : plan.monthlyPrice;
            const textColor = plan.textColor || "text-[#0F1C2E]";
            const mutedText = plan.mutedText || "text-[#4B5C72]";
            const iconColor = plan.iconColor || "text-[#22C55E]";
            const crossColor = plan.highlight ? "text-white/40" : "text-[#94A3B8]";

            return (
              <Card key={index} className={`rounded-2xl ${plan.style}`}>
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-[#D4A843] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider shadow-md">
                      {plan.badge}
                    </div>
                  </div>
                )}
                
                <CardHeader className="p-8 pb-4">
                  <CardTitle className={`text-2xl font-bold mb-2 ${textColor}`}>
                    {plan.name}
                  </CardTitle>
                  <div className={`text-sm font-medium h-10 ${mutedText}`}>
                    {plan.description}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${textColor}`}>₹{price.toLocaleString()}</span>
                    <span className={`text-sm font-medium ${mutedText}`}>/month</span>
                  </div>
                  {isYearly && (
                    <div className={`text-xs mt-1 ${plan.highlight ? 'text-[#D4A843]' : 'text-[#22C55E]'}`}>
                      Billed ₹{(price * 12).toLocaleString()} yearly
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-8 pt-4">
                  <Button variant={plan.buttonVariant} className={`mb-8 ${plan.buttonStyle}`}>
                    {plan.cta}
                  </Button>
                  
                  <div className="space-y-4">
                    {plan.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                        ) : (
                          <X className={`w-5 h-5 shrink-0 mt-0.5 ${crossColor}`} />
                        )}
                        <span className={`text-sm leading-snug ${feature.included ? textColor : crossColor}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm font-medium text-[#4B5C72] mt-12">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  );
}
