import React from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, Lock, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative py-24 bg-[#0F1C2E] overflow-hidden" id="contact">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#D4A843]/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#22C55E]/10 to-transparent blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl relative z-10 text-center">
        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#D4A843] text-xs font-bold uppercase tracking-wider mb-6">
          Get Started
        </div>
        
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-[#D4A843] font-jakarta mb-6 leading-tight drop-shadow-sm">
          Ready to move your factory off paper?
        </h2>
        
        <p className="text-xl text-[#94A3B8] leading-relaxed mb-12 max-w-2xl mx-auto">
          Stop losing raw materials and chasing payments manually. Give your entire manufacturing operation a digital backbone — starting today.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button 
            className="w-full sm:w-auto h-14 px-8 bg-gradient-to-r from-[#D4A843] to-[#B38A36] hover:from-[#E5B954] hover:to-[#C49B47] text-[#0F1C2E] font-bold text-base rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Schedule a System Walkthrough
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button 
            variant="outline"
            className="w-full sm:w-auto h-14 px-8 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white font-bold text-base rounded-xl transition-all"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Discuss Your Requirements
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
            <Lock className="w-4 h-4 text-[#D4A843]" />
            Bank-Grade Security
          </div>
          <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#D4A843]" />
            Built in India
          </div>
          <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
            <Clock className="w-4 h-4 text-[#D4A843]" />
            14-Day Free Trial
          </div>
          <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
            <ShieldCheck className="w-4 h-4 text-[#D4A843]" />
            Zero Data Leakage
          </div>
        </div>
        
      </div>
    </section>
  );
}
