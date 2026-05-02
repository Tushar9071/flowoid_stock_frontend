"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AuthService } from "@/lib/services/auth.service";
import { TenantService } from "@/lib/services/tenant.service";
import { useAuth } from "@/lib/auth-context";
import { normalizePhoneForApi } from "@/lib/utils";

type RegisterStep = "account" | "business";

const featurePills = [
  "Worker Management",
  "Inventory Tracking",
  "Party Ledger",
  "Order Dispatch",
  "Reports & Analytics",
  "RBAC & Multi-Tenant",
];

export default function RegisterPage() {
  const router = useRouter();
  const { completeAuth } = useAuth();
  const [step, setStep] = useState<RegisterStep>("account");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    businessCategory: "Imitation Jewellery",
    logoUrl: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const shakeForm = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleRegister = async () => {
    setErrorMsg("");
    if (!formData.name || !formData.phone || !formData.password) {
      shakeForm();
      return;
    }

    const normalizedPhone = normalizePhoneForApi(formData.phone);
    if (normalizedPhone.length < 6) {
      setErrorMsg("Enter a valid phone number");
      shakeForm();
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.register({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: normalizedPhone,
        password: formData.password,
      });

      if (res.success) {
        await completeAuth(res.data.user);
        setBusinessData(prev => ({
          ...prev,
          email: formData.email.trim(),
          phone: normalizedPhone,
        }));
        setStep("business");
      } else {
        setErrorMsg(res.error?.message || "Registration failed");
        shakeForm();
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      shakeForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantCreate = async () => {
    setErrorMsg("");
    if (!businessData.name.trim()) {
      setErrorMsg("Business name is required");
      shakeForm();
      return;
    }

    const normalizedPhone = businessData.phone ? normalizePhoneForApi(businessData.phone) : "";
    if (normalizedPhone && normalizedPhone.length < 6) {
      setErrorMsg("Enter a valid business phone number");
      shakeForm();
      return;
    }

    setIsLoading(true);
    try {
      const res = await TenantService.create({
        name: businessData.name.trim(),
        email: businessData.email.trim() || undefined,
        phone: normalizedPhone || undefined,
        address: businessData.address.trim() || undefined,
        businessCategory: businessData.businessCategory.trim() || undefined,
        logoUrl: businessData.logoUrl.trim() || undefined,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 700);
      } else {
        setErrorMsg(res.error?.message || "Business setup failed");
        shakeForm();
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      shakeForm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FC] font-jakarta">
      <div
        className="relative hidden h-full w-[45%] flex-col justify-between overflow-hidden p-12 md:flex"
        style={{ background: "radial-gradient(circle at top left, #0D3D56 0%, #1B2D4F 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute right-[-80px] top-16 z-10 hidden w-72 rotate-2 rounded-xl border border-white/10 bg-[#0F2235] shadow-[0_0_40px_rgba(0,0,0,0.3)] lg:right-[-20px] lg:block xl:right-10"
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: [0, -5, 0], opacity: 1 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-6 -top-6 flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white p-2.5 shadow-lg"
          >
            <div className="rounded-full bg-[#22C55E]/15 p-1">
              <Check className="h-3 w-3 text-[#22C55E]" />
            </div>
            <span className="text-[10px] font-bold text-[#0F1C2E]">Workspace Ready</span>
          </motion.div>

          <div className="p-4">
            <h4 className="mb-3 text-xs font-semibold text-white/80">
              {step === "account" ? "Account Setup" : "Business Setup"}
            </h4>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-white/5 bg-white/5 p-2.5">
                <div className="mb-1 text-[9px] text-white/50">Step</div>
                <div className="text-sm font-bold text-white">{step === "account" ? "1 of 2" : "2 of 2"}</div>
              </div>
              <div className="rounded-md border border-white/5 bg-white/5 p-2.5">
                <div className="mb-1 text-[9px] text-white/50">Trial</div>
                <div className="text-sm font-bold text-white">14 Days</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-30">
          <Image
            src="/brand/StockFlow_stacked_dark.svg"
            alt="StockFlow"
            width={270}
            height={300}
            className="h-[220px] w-auto object-contain lg:h-[270px]"
            priority
          />
        </div>

        <div className="relative z-20 flex flex-1 flex-col justify-center">
          <div className="mb-8 flex w-fit items-center gap-2 rounded-full border border-[#D4A843]/40 bg-[#D4A843]/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#D4A843]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D4A843]">Multi-Tenant SaaS Platform</span>
          </div>

          <h1 className="mb-6 text-[40px] font-extrabold leading-[1.1]">
            <span className="block text-white">Jewellery Business,</span>
            <span className="block text-[#D4A843]">Managed with Precision</span>
          </h1>

          <p className="max-w-[340px] text-[15px] leading-[1.7] text-[#94A3B8]">
            From raw material to dispatch - track every piece, every worker, every order, every rupee. Built for imitation jewellery manufacturers across India.
          </p>
        </div>

        <div className="relative z-20 mt-auto">
          <div className="mb-10 flex max-w-[420px] flex-wrap gap-2">
            {featurePills.map((pill) => (
              <div key={pill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-[12px] font-medium text-white">{pill}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] font-medium text-[#4B5C72]">
            Copyright 2026 Flowoid Technologies. Platform v1.0
          </div>
        </div>
      </div>

      <div className="relative flex h-full w-full flex-col overflow-y-auto bg-[#F8F9FC] md:w-[55%]">
        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-12 sm:px-12">
          <div className="mb-10 flex justify-center md:hidden">
            <Image
              src="/brand/StockFlow_horizontal_blue.svg"
              alt="StockFlow"
              width={136}
              height={34}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <StepDot active done={step === "business"} label="Account" />
              <div className="h-px flex-1 bg-[#E2E8F0]" />
              <StepDot active={step === "business"} done={success} label="Business" />
            </div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-[#0F1C2E]">
              {step === "account" ? "Create account" : "Business details"}
            </h2>
            <p className="mt-2 text-[15px] text-[#4B5C72]">
              {step === "account" ? "Start your Flowoid workspace" : "Set up your tenant before opening the dashboard"}
            </p>
          </div>

          <motion.form
            onSubmit={(event) => {
              event.preventDefault();
              if (step === "account") {
                handleRegister();
              } else {
                handleTenantCreate();
              }
            }}
            className="mt-10"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {errorMsg && (
              <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200/60 bg-red-50/80 p-3.5">
                <Info className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-[13px] font-medium leading-tight text-red-600">{errorMsg}</p>
              </div>
            )}

            {step === "account" ? (
              <div className="space-y-5">
                <AuthInput label="Full Name" placeholder="Enter your full name" value={formData.name} onChange={value => setFormData({ ...formData, name: value })} />
                <AuthInput label="Email Address" placeholder="name@company.com" value={formData.email} onChange={value => setFormData({ ...formData, email: value })} type="email" />
                <AuthInput label="Phone Number" placeholder="99999 99999" value={formData.phone} onChange={value => setFormData({ ...formData, phone: value })} type="tel" />

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-[#0F1C2E]">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                      placeholder="Minimum 8 characters"
                      className="h-[48px] w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white pl-4 pr-12 text-[14px] text-[#0F1C2E] transition-all placeholder:text-[#94A3B8] focus:border-[#1B2D4F] focus:outline-none focus:ring-[3px] focus:ring-[#1B2D4F]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] transition-colors hover:text-[#4B5C72]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <AuthInput label="Business Name" placeholder="Ayanshi Imitation" value={businessData.name} onChange={value => setBusinessData({ ...businessData, name: value })} />
                <AuthInput label="Business Email" placeholder="contact@company.com" value={businessData.email} onChange={value => setBusinessData({ ...businessData, email: value })} type="email" required={false} />
                <AuthInput label="Business Phone" placeholder="99999 99999" value={businessData.phone} onChange={value => setBusinessData({ ...businessData, phone: value })} type="tel" required={false} />
                <AuthInput label="Business Category" placeholder="Imitation Jewellery" value={businessData.businessCategory} onChange={value => setBusinessData({ ...businessData, businessCategory: value })} required={false} />
                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-[#0F1C2E]">Address</label>
                  <textarea
                    value={businessData.address}
                    onChange={(event) => setBusinessData({ ...businessData, address: event.target.value })}
                    placeholder="Business address"
                    className="h-[86px] w-full resize-none rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white p-4 text-[14px] text-[#0F1C2E] transition-all placeholder:text-[#94A3B8] focus:border-[#1B2D4F] focus:outline-none focus:ring-[3px] focus:ring-[#1B2D4F]/10"
                  />
                </div>
                <AuthInput label="Logo URL" placeholder="https://example.com/logo.png" value={businessData.logoUrl} onChange={value => setBusinessData({ ...businessData, logoUrl: value })} required={false} />
              </div>
            )}

            <div className="mt-8">
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="relative flex h-[52px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#1B2D4F] text-[15px] font-bold tracking-[0.3px] text-white shadow-sm transition-colors hover:bg-[#243D6B] disabled:opacity-90"
                >
                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                        <span>Workspace Ready</span>
                      </motion.div>
                    ) : isLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <span>{step === "account" ? "Create Account" : "Open Dashboard"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>

              <div className="mt-6 text-center">
                <p className="text-[14px] font-medium text-gray-500">
                  {step === "account" ? (
                    <>
                      Already have an account?{" "}
                      <Link href="/login" className="font-bold text-[#1B2D4F] hover:underline">
                        Sign in
                      </Link>
                    </>
                  ) : (
                    "Your business starts on a 14 day trial after setup."
                  )}
                </p>
              </div>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

function AuthInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[14px] font-semibold text-[#0F1C2E]">{label}</label>
      <input
        type={type}
        required={required ?? label !== "Email Address"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[48px] w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white px-4 text-[14px] text-[#0F1C2E] transition-all placeholder:text-[#94A3B8] focus:border-[#1B2D4F] focus:outline-none focus:ring-[3px] focus:ring-[#1B2D4F]/10"
      />
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-black ${
          done
            ? "border-[#22C55E] bg-[#22C55E] text-white"
            : active
              ? "border-[#1B2D4F] bg-[#1B2D4F] text-white"
              : "border-[#CBD5E1] bg-white text-[#94A3B8]"
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : label.charAt(0)}
      </div>
      <span className={`text-xs font-bold ${active ? "text-[#0F1C2E]" : "text-[#94A3B8]"}`}>{label}</span>
    </div>
  );
}
