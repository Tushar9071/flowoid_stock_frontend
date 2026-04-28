import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex flex-col mb-4 w-40 md:w-48 shrink-0">
              <Image
                src="/brand/StockFlow_horizontal_light.svg"
                alt="StockFlow"
                width={2400}
                height={600}
                className="w-full h-auto object-contain object-left"
              />
              <span className="text-[11px] text-[#4B5C72] mt-1.5 font-medium tracking-wide">
                Powered by Flowoid Technologies
              </span>
            </Link>
            <p className="text-[#4B5C72] mb-6 max-w-xs leading-relaxed text-sm">
              Business Management for Jewellery Manufacturers. 
              Track workers, orders, inventory, and payments in one platform.
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="font-bold text-[#0F1C2E] mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Features</Link></li>
              <li><Link href="#modules" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Modules</Link></li>
              <li><Link href="#pricing" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Pricing</Link></li>
              <li><Link href="/changelog" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Changelog</Link></li>
            </ul>
          </div>
          
          {/* Company Links */}
          <div>
            <h4 className="font-bold text-[#0F1C2E] mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">About Flowoid</Link></li>
              <li><Link href="/contact" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Terms</Link></li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-bold text-[#0F1C2E] mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/docs" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">Documentation</Link></li>
              <li><Link href="#faq" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">FAQs</Link></li>
              <li><a href="https://wa.me/910000000000" className="text-[#4B5C72] hover:text-[#D4A843] text-sm transition-colors">WhatsApp Support</a></li>
            </ul>
            
            <h4 className="font-bold text-[#0F1C2E] mb-4 mt-8 text-sm uppercase tracking-wider">Social</h4>
            <div className="flex gap-4">
              <a href="#" aria-label="LinkedIn" title="LinkedIn" className="w-8 h-8 rounded-full bg-[#F8F9FC] flex items-center justify-center text-[#4B5C72] hover:bg-[#1B2D4F] hover:text-[#D4A843] transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Twitter" title="Twitter" className="w-8 h-8 rounded-full bg-[#F8F9FC] flex items-center justify-center text-[#4B5C72] hover:bg-[#1B2D4F] hover:text-[#D4A843] transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
          
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#4B5C72] text-sm">
            © 2025 Flowoid Technologies. All rights reserved.
          </p>
          <p className="text-[#4B5C72] text-sm font-medium bg-[#F8F9FC] px-3 py-1 rounded-full border border-[#E2E8F0]">
            Built in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
