import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TimeDisplay } from "@/components/landing/time-display";
import { Sparkles, PlayCircle, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 overflow-hidden bg-white">
      {/* Decorative background shape */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#1B2D4F]/5 to-[#1B2D4F]/10 blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-4 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-5 max-w-2xl mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B2D4F]/5 border border-[#1B2D4F]/10 mb-8">
              <Sparkles className="w-4 h-4 text-[#D4A843]" />
              <span className="text-xs font-semibold text-[#1B2D4F] uppercase tracking-wider">
                Trusted by 50+ Jewellery Manufacturers in India
              </span>
            </div>
            
            <h1 className="text-[2.75rem] md:text-5xl lg:text-[54px] font-extrabold tracking-tight mb-4 font-jakarta leading-[1.12]">
              <span className="block text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] drop-shadow-sm">Complete Control</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] drop-shadow-sm">Over Your Jewellery</span>
              <span className="block text-[#D4A843]">Manufacturing</span>
            </h1>
            
            <p className="text-lg text-[#4B5C72] mb-8 leading-relaxed max-w-xl">
              Stop losing materials and money. Gain total visibility over worker yield, live inventory, and outstanding dealer udhaar.
            </p>

            <div className="mb-6">
              <TimeDisplay />
            </div>
            
            <p className="text-sm font-medium text-[#1B2D4F] mb-3 opacity-90">
              Designed exclusively for wholesale and manufacturing jewelers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Link href="/register">
                <Button className="w-full sm:w-auto h-12 px-8 bg-[#D4A843] hover:bg-[#D4A843]/90 text-white font-bold text-base shadow-lg shadow-[#D4A843]/25 transition-all">
                  Schedule a Factory Demo
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-8 border-[#1B2D4F] text-[#1B2D4F] hover:bg-[#1B2D4F] hover:text-white font-semibold text-base transition-all group">
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:text-[#D4A843] transition-colors" />
                  Explore Modules
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-[#4B5C72] font-medium mb-10 px-1 opacity-80">
              <span>Bank-Grade Encryption</span>
              <span>•</span>
              <span>Design IP Protected</span>
              <span>•</span>
              <span>Secure Cloud Backups</span>
            </div>
            

          </div>
          
          {/* Right Content - Dashboard Mockup */}
          <div className="lg:col-span-7 relative mx-auto w-full mt-10 lg:mt-0 flex justify-center items-center">
            <Image
              src="/brand/Modern%20SaaS%20dashboard%20for%20jewelry%20business.png"
              alt="StockFlow Dashboard"
              width={1400}
              height={900}
              priority
              className="w-full max-w-[105%] h-auto lg:ml-2"
            />
          </div>
          
        </div>
      </div>
      
      {/* Social Proof Strip */}
      <div className="mt-20 border-y border-[#E2E8F0] bg-[#F1F4F9] py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap justify-center sm:justify-between items-center gap-8 md:gap-12 opacity-70">
            <div className="text-center">
              <div className="text-xl font-bold text-[#1B2D4F]">Raw Material</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Tracking</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-xl font-bold text-[#1B2D4F]">Worker</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Management</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#1B2D4F]">Inventory</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Control</div>
            </div>
            <div className="text-center hidden md:block">
              <div className="text-xl font-bold text-[#1B2D4F]">Dealer Ledger</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Management</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
