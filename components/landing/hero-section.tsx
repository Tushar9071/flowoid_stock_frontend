import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TimeDisplay } from "@/components/landing/time-display";
import { Sparkles, PlayCircle, BarChart3, Users, Box, ShoppingCart, IndianRupee, PieChart, ShieldCheck, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 overflow-hidden bg-[#F8F9FC]">
      {/* Decorative background shape */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#1B2D4F]/5 to-[#1B2D4F]/10 blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B2D4F]/10 border border-[#1B2D4F]/20 mb-6">
              <Sparkles className="w-4 h-4 text-[#D4A843]" />
              <span className="text-xs font-semibold text-[#1B2D4F] uppercase tracking-wider">
                Multi-Tenant SaaS Platform for Jewellery Businesses
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 font-jakarta leading-[1.15]">
              <span className="block text-[#0F1C2E]">Manage Your</span>
              <span className="block text-[#0F1C2E]">Jewellery Business</span>
              <span className="block text-[#D4A843]">End to End</span>
            </h1>
            
            <p className="text-lg text-[#4B5C72] mb-8 leading-relaxed max-w-xl">
              From raw material purchase to worker assignment, production tracking, 
              order dispatch, and dealer payment collection — all in one platform. 
              Built for imitation jewellery manufacturers across India.
            </p>

            <div className="mb-6">
              <TimeDisplay />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/register">
                <Button className="w-full sm:w-auto h-12 px-8 bg-[#D4A843] hover:bg-[#D4A843]/90 text-white font-bold text-base shadow-lg shadow-[#D4A843]/25 transition-all">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-8 border-[#1B2D4F] text-[#1B2D4F] hover:bg-[#1B2D4F] hover:text-white font-semibold text-base transition-all group">
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:text-[#D4A843] transition-colors" />
                  View Demo
                </Button>
              </Link>
            </div>

            
            <div className="flex flex-wrap gap-y-3 gap-x-4 text-sm font-medium text-[#4B5C72]">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#E2E8F0] shadow-sm"><CheckCircle2 className="w-4 h-4 text-[#D4A843]" /> Raw Material & Lot Tracking</div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#E2E8F0] shadow-sm"><Users className="w-4 h-4 text-[#D4A843]" /> Worker Management & Piece Rate</div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#E2E8F0] shadow-sm"><Box className="w-4 h-4 text-[#D4A843]" /> Unpackaged → Packaged Inventory</div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#E2E8F0] shadow-sm"><ShoppingCart className="w-4 h-4 text-[#D4A843]" /> Orders, Dispatch & Parcels</div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#E2E8F0] shadow-sm"><IndianRupee className="w-4 h-4 text-[#D4A843]" /> Dealer Ledger & Udhaar</div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#E2E8F0] shadow-sm"><BarChart3 className="w-4 h-4 text-[#D4A843]" /> Reports & Analytics</div>
            </div>
          </div>
          
          {/* Right Content - Dashboard Mockup */}
          <div className="relative mx-auto w-full max-w-[600px] xl:max-w-none perspective-1000">
            <div className="rounded-xl overflow-hidden bg-gradient-to-b from-[#1B2D4F] to-[#0F1C2E] shadow-2xl shadow-[#1B2D4F]/30 border border-[#4B5C72]/30 transform rotate-y-[-5deg] rotate-x-[2deg] translate-z-0 transition-transform duration-500 hover:rotate-y-0 hover:rotate-x-0">
              
              {/* Mockup Header */}
              <div className="h-4 bg-[#0F1C2E]/80 border-b border-white/5 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/80"></div>
              </div>
              
              <div className="flex h-[420px]">
                {/* Sidebar */}
                <div className="w-48 border-r border-white/10 p-4 hidden sm:block">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-6 h-6 rounded bg-[#D4A843] flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rotate-45"></div>
                    </div>
                    <span className="text-white font-bold text-sm">Flowoid</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-md text-white text-sm"><PieChart className="w-4 h-4 text-[#D4A843]" /> Dashboard</div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 text-sm"><Box className="w-4 h-4" /> Raw Materials</div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 text-sm"><Users className="w-4 h-4" /> Workers</div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 text-sm"><Box className="w-4 h-4" /> Inventory</div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 text-sm"><ShoppingCart className="w-4 h-4" /> Orders</div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 text-sm"><IndianRupee className="w-4 h-4" /> Payments</div>
                  </div>
                </div>
                
                {/* Main Panel */}
                <div className="flex-1 p-5 relative">
                  <h3 className="text-white font-semibold text-lg mb-4">Today's Overview</h3>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-white/60 text-xs mb-1">Revenue</div>
                      <div className="text-white font-bold text-xl">₹48,960</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-white/60 text-xs mb-1">Orders</div>
                      <div className="text-white font-bold text-xl">12</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-white/60 text-xs mb-1">Active Workers</div>
                      <div className="text-white font-bold text-xl">8</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-8 h-8 bg-[#D4A843]/20 rounded-bl-lg"></div>
                      <div className="text-white/60 text-xs mb-1">Pending Udhaar</div>
                      <div className="text-[#D4A843] font-bold text-xl">₹1.2L</div>
                    </div>
                  </div>
                  
                  {/* Chart Area Mock */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 h-32">
                    <div className="text-white/60 text-xs mb-3">Monthly Sales</div>
                    <div className="flex items-end gap-2 h-16 w-full opacity-70">
                      <div className="w-full bg-[#1B2D4F] rounded-t-sm h-[40%]"></div>
                      <div className="w-full bg-[#1B2D4F] rounded-t-sm h-[60%]"></div>
                      <div className="w-full bg-[#1B2D4F] rounded-t-sm h-[30%]"></div>
                      <div className="w-full bg-[#1B2D4F] rounded-t-sm h-[80%]"></div>
                      <div className="w-full bg-[#D4A843] rounded-t-sm h-[100%] shadow-[0_0_10px_rgba(212,168,67,0.5)]"></div>
                      <div className="w-full bg-[#1B2D4F] rounded-t-sm h-[50%]"></div>
                      <div className="w-full bg-[#1B2D4F] rounded-t-sm h-[70%]"></div>
                    </div>
                  </div>
                  
                  {/* Floating Notification */}
                  <div className="absolute right-[-20px] top-24 bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-3 flex items-center gap-3 animate-bounce-slow">
                    <div className="bg-[#22C55E]/10 rounded-full p-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F1C2E]">Order Dispatched</div>
                      <div className="text-[10px] text-[#4B5C72]">ORD-001 • Sharma Jewellers</div>
                    </div>
                  </div>
                  
                </div>
              </div>
              
              {/* Bottom Strip */}
              <div className="bg-[#22C55E] px-4 py-2 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-semibold tracking-wide">
                  ₹28,080 Collected — Gupta Fashion Store
                </span>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Social Proof Strip */}
      <div className="mt-20 border-y border-[#E2E8F0] bg-[#F1F4F9] py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap justify-center sm:justify-between items-center gap-8 md:gap-12 opacity-70">
            <div className="text-center">
              <div className="text-xl font-bold text-[#1B2D4F]">50+</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Businesses</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-xl font-bold text-[#1B2D4F]">10K+</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Orders Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#1B2D4F]">500+</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Designs Managed</div>
            </div>
            <div className="text-center hidden md:block">
              <div className="text-xl font-bold text-[#1B2D4F]">99.9%</div>
              <div className="text-sm font-semibold text-[#4B5C72] uppercase tracking-wider">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
