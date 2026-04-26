'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-white">Flowid RBAC</h3>
            <p className="text-sm leading-relaxed">
              Enterprise-grade role-based access control for modern businesses
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#features" className="hover:text-teal-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#roles" className="hover:text-teal-400 transition-colors">
                  Roles & Permissions
                </Link>
              </li>
              <li>
                <Link href="/#workflows" className="hover:text-teal-400 transition-colors">
                  Approval Workflows
                </Link>
              </li>
              <li>
                <Link href="/#use-cases" className="hover:text-teal-400 transition-colors">
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/demo" className="hover:text-teal-400 transition-colors">
                  Live Demo
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; 2024 Ayanshi RBAC System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-500 hover:text-teal-400 transition-colors">
              Twitter
            </Link>
            <Link href="#" className="text-gray-500 hover:text-teal-400 transition-colors">
              LinkedIn
            </Link>
            <Link href="#" className="text-gray-500 hover:text-teal-400 transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
