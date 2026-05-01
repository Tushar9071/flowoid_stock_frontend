"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Info, Loader2, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg("");
    setMessage("");
    if (!identifier.trim()) {
      setErrorMsg("Enter your email or phone number.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMessage("Password reset API is not enabled on the backend yet. Please contact your administrator to reset your password.");
    }, 500);
  };

  return (
    <div className="flex w-full h-screen overflow-hidden font-jakarta bg-[#F8F9FC]">
      <div
        className="hidden md:flex flex-col w-[45%] h-full relative p-12 overflow-hidden justify-between"
        style={{ background: "radial-gradient(circle at top left, #0D3D56 0%, #1B2D4F 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <div className="relative z-30">
          <Image
            src="/brand/StockFlow_stacked_dark.svg"
            alt="StockFlow"
            width={270}
            height={300}
            className="h-[220px] lg:h-[270px] w-auto object-contain"
            priority
          />
        </div>

        <div className="relative z-20 flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4A843]/40 bg-[#D4A843]/10 w-fit mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A843]" />
            <span className="text-[#D4A843] text-xs font-semibold uppercase tracking-wider">Secure Account Recovery</span>
          </div>

          <h1 className="text-[40px] font-extrabold leading-[1.1] mb-6">
            <span className="block text-white">Jewellery Business,</span>
            <span className="block text-[#D4A843]">Managed with Precision</span>
          </h1>

          <p className="text-[#94A3B8] text-[15px] leading-[1.7] max-w-[340px]">
            Keep access controlled while your team continues managing stock, payments, workers, and dispatches.
          </p>
        </div>

        <div className="relative z-20 mt-auto text-[#4B5C72] text-[11px] font-medium">
          © 2025 Flowoid Technologies. Platform v1.0
        </div>
      </div>

      <div className="w-full md:w-[55%] h-full flex flex-col bg-[#F8F9FC] relative overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-12 w-full max-w-[460px] mx-auto">
          <div className="md:hidden flex items-center mb-10 justify-center">
            <Image
              src="/brand/StockFlow_horizontal_blue.svg"
              alt="StockFlow"
              width={136}
              height={34}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>

          <Link href="/login" className="inline-flex items-center gap-2 text-[#4B5C72] text-[13px] font-semibold hover:text-[#1B2D4F] mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <div>
            <h2 className="text-[#0F1C2E] font-extrabold text-[32px] tracking-tight">Reset password</h2>
            <p className="text-[#4B5C72] text-[15px] mt-2">Enter your email or phone number</p>
          </div>

          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
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

            {message && (
              <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-[10px] flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-700 text-[13px] font-medium leading-relaxed">{message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[#0F1C2E] text-[14px] font-semibold">Email or Phone Number</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or phone number"
                className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white text-[14px] text-[#0F1C2E] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1B2D4F] focus:ring-[3px] focus:ring-[#1B2D4F]/10 transition-all"
              />
            </div>

            <div className="mt-8">
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-[#1B2D4F] hover:bg-[#243D6B] text-white rounded-[10px] font-bold text-[15px] tracking-[0.3px] flex items-center justify-center transition-colors shadow-sm disabled:opacity-90 relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <span>Continue</span>
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
