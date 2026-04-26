'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-5xl font-bold text-white">
            Ready to Transform Your Access Control?
          </h2>
          <p className="text-xl text-blue-100">
            Join enterprises that trust our RBAC system for secure, scalable operations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-teal-600 font-semibold hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            Start Free Demo
            <Zap className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/20 backdrop-blur-sm border border-white/40 text-white font-semibold hover:bg-white/30 transition-all duration-200"
          >
            Login to Continue
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-8 text-white/90 text-sm">
          <div>
            <div className="font-bold text-2xl text-white mb-1">99.9%</div>
            <div>System Uptime</div>
          </div>
          <div>
            <div className="font-bold text-2xl text-white mb-1">500+</div>
            <div>Active Deployments</div>
          </div>
          <div>
            <div className="font-bold text-2xl text-white mb-1">24/7</div>
            <div>Enterprise Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}
