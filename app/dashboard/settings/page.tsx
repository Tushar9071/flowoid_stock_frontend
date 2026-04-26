'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Shield, Building2, CreditCard, Package, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { role } = useAuth();

  if (role !== 'owner') {
    return (
      <DashboardLayout title="Settings">
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-12 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-[#fff0f0] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-[#cc2200]" />
          </div>
          <p className="text-[#0F2A4A] font-bold text-[18px] mb-1">Access Denied</p>
          <p className="text-sm text-[#6b7280]">You must be an owner to view and manage system settings.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="System Settings" subtitle="Manage your company profile, financial preferences, and system defaults">
      <div className="max-w-4xl space-y-8 pb-8">
        {/* Company Settings */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#e5e7eb] flex items-center gap-3">
            <div className="p-2 bg-[#f9fafb] rounded-lg">
              <Building2 className="w-5 h-5 text-[#0F2A4A]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#0F2A4A]">Company Information</h3>
              <p className="text-sm text-[#6b7280]">Basic details about your business used in invoices</p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={e => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Company Name</label>
                <input required defaultValue="Ayanshi Imitation" className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Business Type</label>
                <input required defaultValue="Jewellery Manufacturing" className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Email Address</label>
                <input required type="email" defaultValue="info@ayanshi.com" className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Phone Number</label>
                <input required defaultValue="+91 9876543210" className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Registered Address</label>
                <input required defaultValue="Jaipur, Rajasthan" className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all" />
              </div>
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0F2A4A] text-white text-sm font-semibold hover:bg-[#0A1E38] transition-colors">
                  Save Information
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#e5e7eb] flex items-center gap-3">
            <div className="p-2 bg-[#f9fafb] rounded-lg">
              <CreditCard className="w-5 h-5 text-[#0F2A4A]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#0F2A4A]">Financial Configuration</h3>
              <p className="text-sm text-[#6b7280]">Currency, fiscal year, and ledger defaults</p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={e => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Base Currency</label>
                <input defaultValue="Indian Rupee (INR)" disabled className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280] cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Financial Year Start</label>
                <input required defaultValue="April 1" className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Default Credit Period (Days)</label>
                <input required defaultValue="30" type="number" min="0" className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] text-sm bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all" />
              </div>
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="px-5 py-2.5 rounded-lg border border-[#e5e7eb] bg-white text-[#374151] text-sm font-semibold hover:bg-[#f9fafb] transition-colors">
                  Update Financials
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#e5e7eb] flex items-center gap-3">
            <div className="p-2 bg-[#f9fafb] rounded-lg">
              <Settings className="w-5 h-5 text-[#0F2A4A]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#0F2A4A]">System Preferences</h3>
              <p className="text-sm text-[#6b7280]">App behaviors, notifications, and backups</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-[#0F2A4A]">Email Notifications</p>
                  <p className="text-sm text-[#6b7280] mt-0.5">Send alerts for low stock and overdue payments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#e5e7eb] rounded-full peer peer-focus:ring-4 peer-focus:ring-[#0F2A4A]/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F2A4A]"></div>
                </label>
              </div>
              <div className="border-t border-[#f3f4f6]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-[#0F2A4A]">Automated Backups</p>
                  <p className="text-sm text-[#6b7280] mt-0.5">Perform daily backups of all system databases</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#e5e7eb] rounded-full peer peer-focus:ring-4 peer-focus:ring-[#0F2A4A]/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F2A4A]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#fff0f0] rounded-2xl border border-[#cc2200]/20 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#cc2200]/10 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <AlertTriangle className="w-5 h-5 text-[#cc2200]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#cc2200]">Danger Zone</h3>
              <p className="text-sm text-[#cc2200]/70">Destructive and irreversible actions</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-bold text-[#0F2A4A]">Factory Reset System</p>
                <p className="text-sm text-[#6b7280] mt-0.5">Delete all records, transactions, and users. Cannot be undone.</p>
              </div>
              <button className="shrink-0 px-5 py-2.5 rounded-lg bg-white border border-[#cc2200]/30 text-[#cc2200] text-sm font-bold hover:bg-[#cc2200] hover:text-white transition-colors">
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
