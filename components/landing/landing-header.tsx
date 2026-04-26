'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Gem } from 'lucide-react';

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Modules', href: '/#roles' },
    { label: 'Workflow', href: '/#workflows' },
    { label: 'Plans', href: '/#use-cases' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F2A4A] to-[#0D7377] flex items-center justify-center">
              <Gem className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <span className="font-bold text-[#0F2A4A] text-base leading-none block">Flowoid Stock</span>
              <span className="text-gray-400 text-[10px]">by Flowoid Technologies</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-gray-600 hover:text-[#0D7377] transition-colors font-medium text-sm">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-semibold text-[#0F2A4A] border-2 border-[#0F2A4A]/20 rounded-lg hover:border-[#0F2A4A]/50 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-lg bg-[#0F2A4A] text-white text-sm font-semibold hover:bg-[#0D3A6A] shadow-sm hover:shadow-md transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-100">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-gray-600 hover:text-[#0D7377] hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-gray-100">
              <Link
                href="/login"
                className="block px-4 py-2.5 text-center rounded-lg bg-[#0F2A4A] text-white text-sm font-semibold"
                onClick={() => setIsOpen(false)}
              >
                Sign In to Platform
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
