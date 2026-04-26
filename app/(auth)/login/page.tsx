'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DEMO_CREDENTIALS } from '@/lib/data';
import {
  Eye, EyeOff, Gem, Shield, Users, User, BarChart3,
  ChevronRight, AlertCircle, Sparkles, Copy, Check
} from 'lucide-react';

const ROLE_META = {
  flowoid_admin: { label: 'Flowoid Admin', color: '#7C3AED', bg: 'from-purple-600 to-violet-700', icon: Shield },
  owner:         { label: 'Business Owner', color: '#0D7377', bg: 'from-teal-600 to-emerald-700', icon: User },
  manager:       { label: 'Manager / Staff', color: '#0F2A4A', bg: 'from-blue-700 to-navy-800', icon: Users },
  viewer:        { label: 'Viewer / Auditor', color: '#D97706', bg: 'from-amber-500 to-orange-600', icon: BarChart3 },
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, role, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(role === 'flowoid_admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, isLoading, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    await new Promise(r => setTimeout(r, 600)); // small delay for UX

    const result = login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const fillCredential = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="min-h-screen flex bg-[#F4F6F9]">
      {/* ── Left Panel — Branding ── */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#0F2A4A] via-[#0D3A6A] to-[#0D7377] relative overflow-hidden flex-col">
        {/* Decorative orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#F5A623]/10 blur-3xl" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-[#0D7377]/30 blur-2xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Gem className="w-6 h-6 text-[#F5A623]" />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none">Flowoid Stock</p>
              <p className="text-white/50 text-xs mt-0.5">by Flowoid Technologies</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="mb-auto mt-20">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              <span className="text-white/80 text-xs font-medium">Multi-Tenant SaaS Platform</span>
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Jewellery Business,<br />
              <span className="text-[#F5A623]">Managed with Precision</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-md">
              From raw material to dispatch — track every piece, every worker,
              every order, every rupee. Built for imitation jewellery manufacturers across India.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-3 mt-auto">
            {['Worker Management', 'Inventory Tracking', 'Party Ledger', 'Order Dispatch', 'Reports & Analytics', 'RBAC & Multi-Tenant'].map(f => (
              <span
                key={f}
                className="bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-white/70 text-xs font-medium backdrop-blur"
              >
                {f}
              </span>
            ))}
          </div>

          <p className="text-white/30 text-xs mt-8">
            © 2024 Flowoid Technologies. Platform v1.0 — Demo Environment
          </p>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#0F2A4A] flex items-center justify-center">
            <Gem className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <p className="text-[#0F2A4A] font-bold text-lg leading-none">Flowoid Stock</p>
            <p className="text-gray-400 text-xs mt-0.5">by Flowoid Technologies</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0F2A4A] mb-2">Welcome back</h2>
            <p className="text-gray-500">Sign in to your workspace</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D7377] transition-colors text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D7377] transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#0F2A4A] hover:bg-[#0D3A6A] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F4F6F9] px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
                Demo Credentials
              </span>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="space-y-2">
            {DEMO_CREDENTIALS.map((cred, idx) => {
              const meta = ROLE_META[cred.role as keyof typeof ROLE_META];
              const Icon = meta?.icon || User;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white border-2 border-gray-100 hover:border-[#0D7377]/30 rounded-xl px-4 py-3 cursor-pointer group transition-all"
                  onClick={() => fillCredential(cred)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: meta?.color + '20', color: meta?.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{cred.label}</p>
                    <p className="text-xs text-gray-400 truncate">{cred.email} · {cred.password}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); copyToClipboard(cred.email, idx); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all"
                    title="Copy email"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0D7377] transition-colors flex-shrink-0" />
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Click any credential to auto-fill the form, then press Sign In
          </p>
        </div>
      </div>
    </div>
  );
}
