'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Gem, Package, Users, Boxes, ShoppingCart,
  CreditCard, BarChart3, CheckCircle2, Sparkles
} from 'lucide-react';

const STATS = [
  { label: 'Active Tenants', value: '50+' },
  { label: 'Orders Managed', value: '10K+' },
  { label: 'Workers Tracked', value: '500+' },
  { label: 'Uptime', value: '99.9%' },
];

const FEATURES = [
  { icon: Package, label: 'Raw Material & Lot Tracking' },
  { icon: Users, label: 'Worker Management & Piece Rate' },
  { icon: Boxes, label: 'Unpackaged → Packaged Inventory' },
  { icon: ShoppingCart, label: 'Orders, Dispatch & Parcels' },
  { icon: CreditCard, label: 'Dealer Ledger & Udhaar' },
  { icon: BarChart3, label: 'Reports & Analytics' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F6F9] to-white pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-[#0D7377]/5 rounded-full blur-3xl" />
        <div className="absolute top-[60%] -left-40 w-[500px] h-[500px] bg-[#0F2A4A]/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, #0F2A4A 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0D7377]/10 border border-[#0D7377]/20 text-sm font-semibold text-[#0D7377]">
              <Sparkles className="w-4 h-4" />
              Multi-Tenant SaaS Platform for Jewellery Businesses
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="font-bold text-5xl sm:text-6xl text-[#0F2A4A] leading-tight">
                Manage Your<br />
                Jewellery Business<br />
                <span className="text-[#0D7377]">End to End</span>
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                From raw material purchase to worker assignment, production tracking,
                order dispatch, and dealer payment collection — all in one platform.
                Built for imitation jewellery manufacturers across India.
              </p>
            </div>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <div className="w-7 h-7 rounded-lg bg-[#0D7377]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#0D7377]" />
                  </div>
                  {label}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#0F2A4A] text-white font-semibold text-sm hover:bg-[#0D3A6A] shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#0F2A4A]/20 text-[#0F2A4A] font-semibold text-sm hover:border-[#0F2A4A]/50 bg-white transition-all duration-200"
              >
                Live Demo
              </Link>
            </div>
          </div>

          {/* Right — Dashboard Preview Card */}
          <div className="relative">
            {/* Main card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Sidebar mockup strip */}
              <div className="flex">
                <div className="w-48 bg-[#0F2A4A] p-4 min-h-[360px] flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
                    <Gem className="w-4 h-4 text-[#F5A623]" />
                    <div>
                      <p className="text-white text-xs font-bold leading-none">Flowoid Stock</p>
                      <p className="text-white/40 text-[9px]">Ayanshi Imitation</p>
                    </div>
                  </div>
                  {['Dashboard', 'Raw Materials', 'Workers', 'Inventory', 'Orders', 'Payments', 'Reports'].map((item, i) => (
                    <div
                      key={item}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                        i === 0 ? 'bg-white/15 text-white' : 'text-white/50'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {/* Content area */}
                <div className="flex-1 p-5 bg-[#F4F6F9]">
                  <p className="text-xs font-bold text-[#0F2A4A] mb-3">Today's Overview</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Revenue', value: '₹48,960' },
                      { label: 'Orders', value: '12' },
                      { label: 'Workers', value: '8 active' },
                      { label: 'Pending', value: '₹1.2L' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-xl p-2.5 border border-gray-100">
                        <p className="text-[9px] text-gray-400">{label}</p>
                        <p className="text-xs font-bold text-[#0F2A4A] mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Mini chart bars */}
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-[9px] text-gray-400 mb-2">Monthly Sales</p>
                    <div className="flex items-end gap-1 h-14">
                      {[35, 55, 40, 70, 50, 80, 65, 90, 72, 85, 60, 78].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            background: i === 11 ? '#0D7377' : '#0F2A4A20',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs font-bold text-gray-800">Order Dispatched</p>
                <p className="text-[10px] text-gray-400">ORD-001 • Sharma Jewellers</p>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-[#0F2A4A] rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-[#F5A623]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">₹28,080 Collected</p>
                <p className="text-[10px] text-white/50">Gupta Fashion Store</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-20 pt-10 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-4xl font-bold text-[#0F2A4A]">{value}</p>
                <p className="text-gray-500 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
