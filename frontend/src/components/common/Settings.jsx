
import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      showProfile: true,
      shareData: false
    },
    appearance: {
      theme: 'light',
      language: 'en'
    }
  });

  const handleToggle = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
    toast.success('Settings updated');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </h1>

        {/* Notification Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>
          <div className="space-y-4">
            <SettingToggle
              label="Email Notifications"
              description="Receive updates and alerts via email"
              enabled={settings.notifications.email}
              onToggle={() => handleToggle('notifications', 'email')}
            />
            <SettingToggle
              label="Push Notifications"
              description="Get real-time alerts on your device"
              enabled={settings.notifications.push}
              onToggle={() => handleToggle('notifications', 'push')}
            />
            <SettingToggle
              label="SMS Notifications"
              description="Receive important updates via SMS"
              enabled={settings.notifications.sms}
              onToggle={() => handleToggle('notifications', 'sms')}
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy
          </h2>
          <div className="space-y-4">
            <SettingToggle
              label="Public Profile"
              description="Make your profile visible to other users"
              enabled={settings.privacy.showProfile}
              onToggle={() => handleToggle('privacy', 'showProfile')}
            />
            <SettingToggle
              label="Share Usage Data"
              description="Help us improve by sharing anonymous usage data"
              enabled={settings.privacy.shareData}
              onToggle={() => handleToggle('privacy', 'shareData')}
            />
          </div>
        </div>

        {/* Appearance Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, theme: e.target.value }
                }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.appearance.language}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, language: e.target.value }
                }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SettingToggle({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}