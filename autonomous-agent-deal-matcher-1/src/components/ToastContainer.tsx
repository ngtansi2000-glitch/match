/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Flame, AlertTriangle, Settings, Coins, Landmark, HelpCircle, Sparkles } from 'lucide-react';
import { AppToast } from '../types';

interface ToastContainerProps {
  toasts: AppToast[];
  onDismiss: (id: string) => void;
  onSelectDeal: (dealId: string) => void;
  commissionThreshold: number;
  onUpdateThreshold: (newVal: number) => void;
}

export default function ToastContainer({
  toasts,
  onDismiss,
  onSelectDeal,
  commissionThreshold,
  onUpdateThreshold
}: ToastContainerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(commissionThreshold.toString());

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(thresholdInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateThreshold(val);
      setShowSettings(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm" id="toast-system-container">
      
      {/* Toast Alert Header / Control Settings Toggle */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-xl shadow-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Autonomous Alerts Desk</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer ${showSettings ? 'text-indigo-400 bg-slate-800' : ''}`}
          title="Alert Settings"
          id="toggle-toast-settings-btn"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Threshold Configurator Settings Panel */}
      {showSettings && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/20 p-4 rounded-2xl shadow-2xl animate-fade-in space-y-3"
          id="toast-settings-form"
        >
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-indigo-400" /> Threshold Matrix
            </h4>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Define the minimum expected commission fee in VND that triggers high-value alert escalations.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={thresholdInput}
                onChange={e => setThresholdInput(e.target.value)}
                placeholder="Commission limit"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                id="toast-threshold-input"
              />
              <span className="absolute right-3 top-2 text-[9px] font-bold text-slate-500">VND</span>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-3.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              id="save-toast-settings-btn"
            >
              Set
            </button>
          </div>
        </form>
      )}

      {/* Render Dynamic Alert Toasts */}
      {toasts.map(toast => {
        const isHighValue = toast.type === 'high_value';
        const isStalled = toast.type === 'stalled';

        return (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl border flex flex-col gap-2.5 shadow-2xl transition-all transform hover:scale-[1.01] animate-slide-in relative ${
              isHighValue
                ? 'bg-slate-900/95 border-emerald-500/30 shadow-emerald-950/10'
                : isStalled
                ? 'bg-slate-900/95 border-amber-500/30 shadow-amber-950/10'
                : 'bg-slate-900/95 border-slate-800'
            }`}
            id={`toast-card-${toast.id}`}
          >
            {/* Close Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="absolute top-3.5 right-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              title="Close Notification"
              id={`dismiss-toast-btn-${toast.id}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header Identity */}
            <div className="flex gap-2.5 items-start">
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                isHighValue ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
              }`}>
                {isHighValue ? <Flame className="w-4 h-4 animate-pulse" /> : <AlertTriangle className="w-4 h-4 animate-bounce" />}
              </div>
              <div className="pr-5">
                <span className={`text-[8.5px] font-black uppercase tracking-widest ${isHighValue ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isHighValue ? 'Escalated Yield alert' : 'Manual Intervention Required'}
                </span>
                <h4 className="text-xs font-black text-slate-100 mt-0.5 leading-snug">{toast.title}</h4>
              </div>
            </div>

            {/* Content description */}
            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
              {toast.message}
            </p>

            {/* Context Stats / Action buttons */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-800/80">
              <span className="text-[9px] text-slate-500 font-bold font-mono">{toast.timestamp}</span>
              {toast.meta?.dealId && (
                <button
                  onClick={() => onSelectDeal(toast.meta!.dealId)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                    isHighValue
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-600/20'
                      : 'bg-amber-600/10 text-amber-400 border border-amber-500/25 hover:bg-amber-600/20'
                  }`}
                  id={`action-toast-btn-${toast.id}`}
                >
                  {isHighValue ? 'Open Workspace' : 'Intervene Now'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
