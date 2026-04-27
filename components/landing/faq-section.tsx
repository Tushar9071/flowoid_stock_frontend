"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const faqs = [
    {
      question: "Is this only for imitation jewellery businesses?",
      answer: "Currently optimised for imitation jewellery manufacturing and wholesale. We plan to expand to other categories soon.",
    },
    {
      question: "Can multiple staff members use the system simultaneously?",
      answer: "Yes. Standard plan includes 2 staff users, Premium includes 10. Each user gets role-based access.",
    },
    {
      question: "Is the data secure?",
      answer: "Data is hosted on a private Oracle VPS with JWT authentication and role-based access control.",
    },
    {
      question: "Can I try it before paying?",
      answer: "Yes. Every plan includes a 14-day free trial. No credit card needed.",
    },
    {
      question: "Do you support GST invoices?",
      answer: "GST-compliant invoice generation is on our roadmap and coming soon in a Premium plan update.",
    },
    {
      question: "What happens if a worker doesn't return all pieces?",
      answer: "The system tracks partial returns. The assignment stays open with the pending quantity visible until fully completed or written off.",
    },
    {
      question: "Can I export data?",
      answer: "Yes. All reports can be exported to PDF and Excel from any plan.",
    },
  ];

  return (
    <section className="py-24 bg-[#F8F9FC] border-t border-[#E2E8F0]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] font-jakarta">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-2">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-[#E2E8F0] last:border-0 px-4">
              <AccordionTrigger className="text-left font-bold text-[#0F1C2E] hover:text-[#D4A843] hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#4B5C72] text-base leading-relaxed pb-5 pr-8">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
