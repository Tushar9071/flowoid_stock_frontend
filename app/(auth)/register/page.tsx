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
import { useAuth } from "@/lib/auth-context";
import { normalizePhoneForApi } from "@/lib/utils";

const featurePills = [
  "Worker Management",
  "Inventory Tracking",
  "Party Ledger",
  "Order Dispatch",
  "Reports & Analytics",
  "Permission Based Access",
];

export default function RegisterPage() {
  const router = useRouter();
  const { completeAuth } = useAuth();
  const [step, setStep] = useState<"details" | "security">("details");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const shakeForm = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else {
      const normalizedPhone = normalizePhoneForApi(formData.phone);
      if (!/^\+?[1-9]\d{9,14}$/.test(normalizedPhone)) {
        newErrors.phone = "Enter a valid mobile number.";
      }
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    setErrors(newErrors);
    setGlobalError("");
    
    if (Object.keys(newErrors).length > 0) {
      shakeForm();
      return false;
    }
    return true;
  };

  const goToSecurityStep = async () => {
    if (validateDetails()) {
      setIsLoading(true);
      try {
        // Attempt a dummy registration to check if owner already exists
        // Since we can't touch backend, this will throw OWNER_ALREADY_EXISTS if an owner is present.
        const response = await AuthService.register({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: normalizePhoneForApi(formData.phone),
          password: "DummyPassword123!@#",
        });

        if (!response.success && (response.error?.code === 'OWNER_ALREADY_EXISTS' || response.error?.message?.includes('already'))) {
          setGlobalError("An active owner account is already registered. Only one owner is allowed.");
          shakeForm();
          return;
        }
      } finally {
        setIsLoading(false);
      }
      setStep("security");
      setErrors({});
      setGlobalError("");
    }
  };

  const handleRegister = async () => {
    if (!validateDetails()) return;
    
    const newErrors: Record<string, string> = {};
    const normalizedPhone = normalizePhoneForApi(formData.phone);

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      shakeForm();
      return;
    }

    setIsLoading(true);
    setGlobalError("");
    try {
      const response = await AuthService.register({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: normalizedPhone,
        password: formData.password,
      });

      if (response.success) {
        const loginResponse = await AuthService.login({
          identifier: normalizedPhone,
          password: formData.password,
        });

        if (!loginResponse.success || !loginResponse.data?.user) {
          setSuccess(true);
          setTimeout(() => router.push("/login"), 900);
          return;
        }

        await completeAuth(loginResponse.data.user);
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 700);
      } else {
        setGlobalError(response.error?.message || "Registration failed");
        shakeForm();
      }
    } catch {
      setGlobalError("An unexpected error occurred. Please try again.");
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
            <span className="text-[10px] font-bold text-[#0F1C2E]">Owner Account</span>
          </motion.div>

          <div className="p-4">
            <h4 className="mb-3 text-xs font-semibold text-white/80">Backend Registration</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-white/5 bg-white/5 p-2.5">
                <div className="mb-1 text-[9px] text-white/50">Step</div>
                <div className="text-sm font-bold text-white">{step === "details" ? "1 of 2" : "2 of 2"}</div>
              </div>
              <div className="rounded-md border border-white/5 bg-white/5 p-2.5">
                <div className="mb-1 text-[9px] text-white/50">Role</div>
                <div className="text-sm font-bold text-white">OWNER</div>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D4A843]">Backend Auth Flow</span>
          </div>

          <h1 className="mb-6 text-[40px] font-extrabold leading-[1.1]">
            <span className="block text-white">Create the Owner,</span>
            <span className="block text-[#D4A843]">Start the Workspace</span>
          </h1>

          <p className="max-w-[340px] text-[15px] leading-[1.7] text-[#94A3B8]">
            Registration now follows the backend contract exactly: name, phone, optional email, and password.
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
          <div className="text-[11px] font-medium text-[#4B5C72]">Copyright 2026 Flowoid Technologies. Platform v1.0</div>
        </div>
      </div>

      <div className="relative flex h-full w-full flex-col overflow-y-auto bg-[#F8F9FC] md:w-[55%]">
        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-12 sm:px-12">
          <div className="mb-6 flex justify-center md:hidden">
            <Image
              src="/Appicon_blue.png"
              alt="StockFlow"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
              priority
            />
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <StepDot active done={step === "security" || success} label="Details" />
              <div className="h-px flex-1 bg-[#E2E8F0]" />
              <StepDot active={step === "security"} done={success} label="Security" />
            </div>
            <h2 className="text-center text-[32px] font-extrabold tracking-tight text-[#0F1C2E]">
              {step === "details" ? "Required details" : "Secure account"}
            </h2>
            <p className="mt-2 text-center text-[15px] text-[#4B5C72]">
              {step === "details" ? "Enter only the fields required by backend registration" : "Create the password for this owner account"}
            </p>
          </div>

          <motion.form
            onSubmit={(event) => {
              event.preventDefault();
              if (step === "details") {
                goToSecurityStep();
              } else {
                handleRegister();
              }
            }}
            className="mt-10"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {globalError && (
              <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200/60 bg-red-50/80 p-3.5">
                <Info className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-[13px] font-medium leading-tight text-red-600">{globalError}</p>
              </div>
            )}

            {step === "details" ? (
              <div className="space-y-5">
                <AuthInput label="Full Name" placeholder="Enter your full name" value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} error={errors.name} />
                <AuthInput label="Phone Number" placeholder="99999 99999" value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} type="tel" error={errors.phone} />
                <AuthInput label="Email Address" placeholder="name@company.com" value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} type="email" required={false} error={errors.email} />
              </div>
            ) : (
              <div className="space-y-5">
                <PasswordInput
                  label="Password"
                  value={formData.password}
                  onChange={(value) => setFormData({ ...formData, password: value })}
                  showPassword={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                  error={errors.password}
                  showStrengthMeter
                />
                <PasswordInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                  showPassword={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                  error={errors.confirmPassword}
                />
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
                        <span>Account Created</span>
                      </motion.div>
                    ) : isLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <span>{step === "details" ? "Continue" : "Create Account"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>

              <div className="mt-6 text-center">
                <p className="text-[14px] font-medium text-gray-500">
                  {step === "security" ? (
                    <button type="button" onClick={() => setStep("details")} className="font-bold text-[#1B2D4F] hover:underline">
                      Back to details
                    </button>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <Link href="/login" className="font-bold text-[#1B2D4F] hover:underline">
                        Sign in
                      </Link>
                    </>
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

function PasswordInput({
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  error,
  showStrengthMeter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: string;
  showStrengthMeter?: boolean;
}) {
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: "None", color: "bg-gray-200" };
    if (pass.length > 7) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z\d]/.test(pass)) score += 1;
    
    if (score <= 1) return { score, label: "Weak", color: "bg-red-400" };
    if (score === 2) return { score, label: "Fair", color: "bg-yellow-400" };
    if (score === 3) return { score, label: "Good", color: "bg-blue-400" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const strength = showStrengthMeter ? getStrength(value) : null;

  return (
    <div className="space-y-1.5">
      <label className="block text-[14px] font-semibold text-[#0F1C2E]">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Minimum 8 characters"
          className={`h-[48px] w-full rounded-[10px] border-[1.5px] bg-white pl-4 pr-12 text-[14px] text-[#0F1C2E] transition-all placeholder:text-[#94A3B8] focus:outline-none focus:ring-[3px] ${
            error 
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" 
              : "border-[#E2E8F0] focus:border-[#1B2D4F] focus:ring-[#1B2D4F]/10"
          }`}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] transition-colors hover:text-[#4B5C72]"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      
      {showStrengthMeter && value.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1.5 h-1.5 w-full">
            {[1, 2, 3, 4].map((level) => (
              <div 
                key={level} 
                className={`flex-1 rounded-full transition-colors duration-300 ${strength!.score >= level ? strength!.color : 'bg-gray-200'}`} 
              />
            ))}
          </div>
          <div className="text-[11px] font-medium text-right" style={{ color: strength!.color.replace('bg-', 'text-').replace('-400', '-500') }}>
            {strength!.label}
          </div>
        </div>
      )}
      
      {error && <p className="text-[12px] font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function AuthInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = true,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[14px] font-semibold text-[#0F1C2E]">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-[48px] w-full rounded-[10px] border-[1.5px] bg-white px-4 text-[14px] text-[#0F1C2E] transition-all placeholder:text-[#94A3B8] focus:outline-none focus:ring-[3px] ${
          error 
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" 
            : "border-[#E2E8F0] focus:border-[#1B2D4F] focus:ring-[#1B2D4F]/10"
        }`}
      />
      {error && <p className="text-[12px] font-medium text-red-500 mt-1">{error}</p>}
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
