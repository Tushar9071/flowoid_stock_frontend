"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Diamond, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Briefcase,
  Users,
  BarChart3,
  ChevronRight,
  Check,
  Info
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // UI states
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSignIn = () => {
    setErrorMsg("");
    if (!email || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    
    setIsLoading(true);
    
    // Process login
    setTimeout(() => {
      const result = login(email, password);
      
      if (result.success) {
        setIsLoading(false);
        setSuccess(true);
        
        // Redirect after success animation
        setTimeout(() => {
          if (result.redirectTo) {
            router.push(result.redirectTo);
          } else {
            router.push("/dashboard");
          }
        }, 800);
      } else {
        setIsLoading(false);
        setErrorMsg(result.error || "Authentication failed");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }, 800);
  };
  
  const handleDemoClick = (cardId: string, demoEmail: string, demoPass: string) => {
    setActiveCardId(cardId);
    setEmail(demoEmail);
    setPassword(demoPass);
    
    // Remove active state after animation
    setTimeout(() => {
      setActiveCardId(null);
    }, 1500);
  };

  const featurePills = [
    "Worker Management",
    "Inventory Tracking",
    "Party Ledger",
    "Order Dispatch",
    "Reports & Analytics",
    "RBAC & Multi-Tenant"
  ];

  return (
    <div className="flex w-full h-screen overflow-hidden font-jakarta bg-[#F8F9FC]">
      
      {/* LEFT PANEL - Branded Side */}
      <div className="hidden md:flex flex-col w-[45%] h-full relative p-12 overflow-hidden justify-between"
           style={{ background: "radial-gradient(circle at top left, #0D3D56 0%, #1B2D4F 100%)" }}>
        
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
             style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
             
        {/* Abstract Floating Mini Dashboard (Option A) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-16 right-[-80px] lg:right-[-20px] xl:right-10 w-72 bg-[#0F2235] rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] rotate-2 z-10 hidden lg:block"
        >
          {/* Floating notification */}
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: [0, -5, 0], opacity: 1 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -top-6 -left-6 bg-white rounded-lg p-2.5 shadow-lg flex items-center gap-2 border border-[#E2E8F0]"
          >
            <div className="bg-[#22C55E]/15 rounded-full p-1">
              <Check className="w-3 h-3 text-[#22C55E]" />
            </div>
            <span className="text-[#0F1C2E] text-[10px] font-bold">Order Dispatched</span>
          </motion.div>

          <div className="p-4">
            <h4 className="text-white/80 text-xs font-semibold mb-3">Today's Overview</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white/5 rounded-md p-2.5 border border-white/5">
                <div className="text-white/50 text-[9px] mb-1">Revenue</div>
                <div className="text-white font-bold text-sm">₹48,960</div>
              </div>
              <div className="bg-white/5 rounded-md p-2.5 border border-white/5">
                <div className="text-white/50 text-[9px] mb-1">Orders</div>
                <div className="text-white font-bold text-sm">12</div>
              </div>
              <div className="bg-white/5 rounded-md p-2.5 border border-white/5">
                <div className="text-white/50 text-[9px] mb-1">Active Workers</div>
                <div className="text-white font-bold text-sm">8</div>
              </div>
              <div className="bg-[#D4A843]/10 rounded-md p-2.5 border border-[#D4A843]/20">
                <div className="text-white/60 text-[9px] mb-1">Pending</div>
                <div className="text-[#D4A843] font-bold text-sm">₹1.2L</div>
              </div>
            </div>
            
            <div className="flex items-end gap-1.5 h-10 w-full opacity-60">
              <div className="w-full bg-[#1B2D4F] rounded-t-[2px] h-[30%]"></div>
              <div className="w-full bg-[#1B2D4F] rounded-t-[2px] h-[50%]"></div>
              <div className="w-full bg-[#1B2D4F] rounded-t-[2px] h-[40%]"></div>
              <div className="w-full bg-[#D4A843] rounded-t-[2px] h-[80%] shadow-[0_0_10px_rgba(212,168,67,0.4)]"></div>
              <div className="w-full bg-[#1B2D4F] rounded-t-[2px] h-[60%]"></div>
              <div className="w-full bg-[#1B2D4F] rounded-t-[2px] h-[70%]"></div>
            </div>
          </div>
        </motion.div>

        {/* Top: Logo block */}
        <div className="relative z-20">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl bg-[#1B2D4F] flex items-center justify-center shadow-lg border border-white/10">
              <Diamond className="w-6 h-6 text-[#D4A843] fill-[#D4A843]/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-[18px] leading-tight">Flowoid Stock</span>
              <span className="text-[#94A3B8] text-[12px] font-medium tracking-wide">by Flowoid Technologies</span>
            </div>
          </div>
        </div>
        
        {/* Middle: Hero copy */}
        <div className="relative z-20 flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4A843]/40 bg-[#D4A843]/10 w-fit mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A843]" />
            <span className="text-[#D4A843] text-xs font-semibold uppercase tracking-wider">Multi-Tenant SaaS Platform</span>
          </div>
          
          <h1 className="text-[40px] font-extrabold leading-[1.1] mb-6">
            <span className="block text-white">Jewellery Business,</span>
            <span className="block text-[#D4A843]">Managed with Precision</span>
          </h1>
          
          <p className="text-[#94A3B8] text-[15px] leading-[1.7] max-w-[340px]">
            From raw material to dispatch — track every piece, every worker, every order, every rupee. Built for imitation jewellery manufacturers across India.
          </p>
        </div>
        
        {/* Bottom: Feature pills & copyright */}
        <div className="relative z-20 mt-auto">
          <div className="flex flex-wrap gap-2 mb-10 max-w-[420px]">
            {featurePills.map((pill, i) => (
              <div key={i} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                <span className="text-white text-[12px] font-medium">{pill}</span>
              </div>
            ))}
          </div>
          
          <div className="text-[#4B5C72] text-[11px] font-medium">
            © 2025 Flowoid Technologies. Platform v1.0
          </div>
        </div>
      </div>
      
      {/* RIGHT PANEL - Login Form */}
      <div className="w-full md:w-[55%] h-full flex flex-col bg-[#F8F9FC] relative overflow-y-auto">
        
        {/* ========================================================= */}
        {/* REMOVE THIS SECTION FOR PRODUCTION */}
        {/* DEMO CREDENTIALS (Testing Only) */}
        {/* ========================================================= */}
        <div className="w-full p-6 md:p-8 bg-white border-b border-[#E2E8F0] shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-[#D4A843]" />
            <h3 className="text-[#0F1C2E] text-[13px] font-bold uppercase tracking-wider">Demo Credentials (Testing Only)</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1 - Flowoid Admin */}
            <DemoCard 
              id="admin"
              icon={<div className="w-8 h-8 rounded-[6px] bg-[#7C3AED] flex items-center justify-center text-white font-bold text-sm leading-none">F</div>}
              title="Flowoid Admin"
              subtitle="admin@flowoid.com"
              badgeText="Admin"
              badgeColor="bg-[#7C3AED]/10 text-[#7C3AED]"
              isActive={activeCardId === "admin"}
              onClick={() => handleDemoClick("admin", "admin@flowoid.com", "flowoid@2024")}
            />
            
            {/* Card 2 - Business Owner */}
            <DemoCard 
              id="owner"
              icon={<div className="w-8 h-8 rounded-[6px] bg-[#1B2D4F] flex items-center justify-center"><Briefcase className="w-4 h-4 text-[#D4A843]" /></div>}
              title="Business Owner"
              subtitle="owner@ayanshi.com"
              badgeText="Owner"
              badgeColor="bg-[#1B2D4F]/10 text-[#1B2D4F]"
              isActive={activeCardId === "owner"}
              onClick={() => handleDemoClick("owner", "owner@ayanshi.com", "ayanshi@2024")}
            />
            
            {/* Card 3 - Manager */}
            <DemoCard 
              id="manager"
              icon={<div className="w-8 h-8 rounded-[6px] bg-[#0D3D56] flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>}
              title="Manager / Staff"
              subtitle="manager@ayanshi.com"
              badgeText="Manager"
              badgeColor="bg-[#0D3D56]/10 text-[#0D3D56]"
              isActive={activeCardId === "manager"}
              onClick={() => handleDemoClick("manager", "manager@ayanshi.com", "manager@2024")}
            />
            
            {/* Card 4 - Viewer */}
            <DemoCard 
              id="viewer"
              icon={<div className="w-8 h-8 rounded-[6px] bg-[#D4A843]/15 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-[#D4A843]" /></div>}
              title="Viewer / Auditor"
              subtitle="viewer@ayanshi.com"
              badgeText="Viewer"
              badgeColor="bg-[#D4A843]/15 text-[#D4A843]"
              isActive={activeCardId === "viewer"}
              onClick={() => handleDemoClick("viewer", "viewer@ayanshi.com", "viewer@2024")}
            />
          </div>
        </div>
        {/* ========================================================= */}
        {/* END DEMO CREDENTIALS */}
        {/* ========================================================= */}


        {/* Centered Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 pb-12 w-full max-w-[460px] mx-auto min-h-[500px]">
          
          {/* Mobile Logo (hidden on desktop) */}
          <div className="md:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-10 h-10 rounded-lg bg-[#1B2D4F] flex items-center justify-center">
              <Diamond className="w-5 h-5 text-[#D4A843] fill-[#D4A843]/20" />
            </div>
            <span className="text-[#0F1C2E] font-bold text-lg">Flowoid Stock</span>
          </div>
          
          {/* Top greeting */}
          <div>
            <h2 className="text-[#0F1C2E] font-extrabold text-[32px] tracking-tight">Welcome back</h2>
            <p className="text-[#4B5C72] text-[15px] mt-2">Sign in to your Flowoid workspace</p>
          </div>
          
          <motion.form 
            onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}
            className="mt-10"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-red-50/80 border border-red-200/60 rounded-[10px] flex items-center gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-[13px] font-medium leading-tight">{errorMsg}</p>
              </div>
            )}
            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[#0F1C2E] text-[14px] font-semibold">Email Address</label>
                <div className="relative">
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white text-[14px] text-[#0F1C2E] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1B2D4F] focus:ring-[3px] focus:ring-[#1B2D4F]/10 transition-all"
                  />
                </div>
              </div>
              
              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[#0F1C2E] text-[14px] font-semibold">Password</label>
                  <Link href="#" className="text-[#D4A843] text-[13px] font-semibold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full h-[48px] pl-4 pr-12 rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white text-[14px] text-[#0F1C2E] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1B2D4F] focus:ring-[3px] focus:ring-[#1B2D4F]/10 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#4B5C72] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sign In Button */}
            <div className="mt-8">
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
              >
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="w-full h-[52px] bg-[#1B2D4F] hover:bg-[#243D6B] text-white rounded-[10px] font-bold text-[15px] tracking-[0.3px] flex items-center justify-center transition-colors shadow-sm disabled:opacity-90 relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                        <span>Signed In</span>
                      </motion.div>
                    ) : isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </div>
          </motion.form>
          
        </div>
      </div>
      
    </div>
  );
}

// Helper component for Demo Cards
function DemoCard({ 
  id, 
  icon, 
  title, 
  subtitle, 
  badgeText, 
  badgeColor, 
  isActive, 
  onClick 
}: { 
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative w-full bg-[#F8F9FC] border rounded-[8px] p-2.5 flex items-center gap-3 cursor-pointer transition-all duration-200 overflow-hidden ${
        isActive ? "border-[#D4A843] shadow-[0_0_0_1px_#D4A843]" : "border-[#E2E8F0] hover:border-[#1B2D4F]"
      }`}
    >
      {/* Left accent bar on hover/active */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4A843] transition-transform duration-200 origin-left ${
        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
      }`} />
      
      {/* Icon */}
      <div className="shrink-0">
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-[#0F1C2E] text-[13px] font-semibold truncate">{title}</h4>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] shrink-0 ${badgeColor}`}>
            {badgeText}
          </span>
        </div>
        <p className="text-[#94A3B8] text-[11px] truncate">{subtitle}</p>
      </div>
      
      {/* Right chevron / Success mark */}
      <div className="shrink-0 text-[#94A3B8] w-4 flex justify-center">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Check className="w-3.5 h-3.5 text-[#22C55E]" />
            </motion.div>
          ) : (
            <motion.div
              key="chevron"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Hover parent styling helper */}
      <style jsx>{`
        div:hover > div:first-child {
          transform: scaleX(1);
        }
      `}</style>
    </motion.div>
  );
}
