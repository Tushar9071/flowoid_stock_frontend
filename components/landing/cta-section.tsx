import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 bg-[#0F1C2E] relative overflow-hidden">
      {/* Decorative abstract elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#1B2D4F] blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#D4A843]/10 blur-3xl opacity-30"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl relative z-10">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white font-jakarta mb-6 leading-tight">
            Ready to Take Control of <br className="hidden md:block" />
            <span className="text-[#D4A843]">Your Business?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-[#94A3B8] mb-10 max-w-2xl mx-auto">
            Join jewellery businesses across India who manage their entire operation end-to-end with Flowoid Stock.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <Link href="/register">
              <Button className="w-full sm:w-auto h-14 px-8 bg-[#D4A843] hover:bg-[#D4A843]/90 text-[#0F1C2E] font-bold text-lg shadow-lg shadow-[#D4A843]/20 transition-all">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full sm:w-auto h-14 px-8 border-white/20 text-white hover:bg-white/10 hover:text-white font-semibold text-lg transition-all bg-white/5 backdrop-blur-sm">
                Schedule a Demo
              </Button>
            </Link>
          </div>
          
          <p className="text-sm font-medium text-[#94A3B8]">
            No credit card required <span className="mx-2">•</span> Setup in minutes <span className="mx-2">•</span> Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
