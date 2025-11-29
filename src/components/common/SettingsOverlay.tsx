'use client';

import React from 'react';
import { X, Settings, LogOut, Moon, Sun } from 'lucide-react';

interface SettingsOverlayProps {
  theme: 'light' | 'dark';
  onClose: () => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  theme,
  onClose,
  onThemeChange,
  onLogout,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
          <h2 className="font-bold text-xl flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Toggle */}
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Appearance</span>
              <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange('light')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  theme === 'light' 
                    ? 'bg-white shadow-md border-2 border-indigo-500 text-indigo-600' 
                    : 'hover:bg-gray-200/50 text-gray-500'
                }`}
              >
                <Sun size={18} />
                <span className="font-medium">Light</span>
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-700 shadow-md border-2 border-indigo-400 text-indigo-300' 
                    : 'hover:bg-gray-200/50 text-gray-500'
                }`}
              >
                <Moon size={18} />
                <span className="font-medium">Dark</span>
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="space-y-3">
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Account
            </h3>
            <button
              onClick={onLogout}
              className="w-full py-3.5 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center gap-2 font-semibold group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              Log Out
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`p-4 text-center text-xs ${theme === 'dark' ? 'text-gray-500 bg-gray-900/30' : 'text-gray-400 bg-gray-50'}`}>
          HamsterWorld v1.0.0
        </div>
      </div>
    </div>
  );
};

