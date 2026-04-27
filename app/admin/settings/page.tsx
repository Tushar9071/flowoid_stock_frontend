'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Save, Key, Database, Bell, Shield, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'Ayanshi Imitation',
    systemEmail: 'admin@ayanshi.com',
    allowExternalAuth: true,
    twoFactorRequired: true,
    sessionTimeout: 30,
    enableAuditLogs: true,
    logRetentionDays: 90,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Title removed as it is now handled by AdminLayout */}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* General Settings */}
        <Card className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            General Settings
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">System Email</label>
              <input
                type="email"
                required
                value={settings.systemEmail}
                onChange={e => setSettings({ ...settings, systemEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            Security Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mt-1">Require 2FA for all admin accounts</p>
              </div>
              <input
                type="checkbox"
                checked={settings.twoFactorRequired}
                onChange={e => setSettings({ ...settings, twoFactorRequired: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">External Authentication</h3>
                <p className="text-sm text-gray-600 mt-1">Allow SSO integration</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowExternalAuth}
                onChange={e => setSettings({ ...settings, allowExternalAuth: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                required
                min="1"
                value={settings.sessionTimeout}
                onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Audit Settings */}
        <Card className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Audit & Logging
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Enable Audit Logs</h3>
                <p className="text-sm text-gray-600 mt-1">Track all system activity</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAuditLogs}
                onChange={e => setSettings({ ...settings, enableAuditLogs: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Log Retention (days)</label>
              <input
                type="number"
                required
                min="1"
                value={settings.logRetentionDays}
                onChange={e => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-red-800 text-sm mb-4">These actions cannot be undone</p>
          <button type="button" className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Clear All Sessions
          </button>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <p className="text-green-600 font-medium">Settings saved successfully</p>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
