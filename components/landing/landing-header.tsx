"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Diamond } from "lucide-react";
import Image from "next/image";

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Modules", href: "#modules" },
    { name: "Workflow", href: "#workflow" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E2E8F0]"
          : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-col">
            <div className="flex items-center gap-2">
              <Image 
                src="/Only_logo.png" 
                alt="Flowoid Logo" 
                width={28} 
                height={28} 
                className="object-contain"
              />
              <span className="text-xl font-bold text-[#1B2D4F] font-jakarta">
                Flowoid Stock
              </span>
            </div>
            <span className="text-[10px] text-[#4B5C72] ml-9 -mt-1 font-medium tracking-wide">
              by Flowoid Technologies
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#4B5C72] hover:text-[#D4A843] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button
                variant="outline"
                className="text-[#1B2D4F] border-[#E2E8F0] hover:bg-[#F8F9FC] font-medium"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#1B2D4F] text-white hover:bg-[#1B2D4F]/90 font-medium">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#0F1C2E]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] absolute w-full shadow-lg">
          <div className="flex flex-col px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-base font-medium text-[#0F1C2E] hover:text-[#D4A843] py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-[#E2E8F0]">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full text-[#1B2D4F] border-[#E2E8F0]"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#1B2D4F] text-white hover:bg-[#1B2D4F]/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
