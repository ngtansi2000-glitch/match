/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Laptop, Sparkles, Check, DollarSign, Award, ArrowUpRight, ShieldAlert, ChevronDown, ChevronUp, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MatchingBubble } from '../types';
import { Language, Currency, translations, formatCurrency } from '../lib/i18n';

interface BubbleCapturesProps {
  selectedBubble: MatchingBubble | null;
  commissionRate: number;
  onUnlockBubble: (id: string) => void;
  onCompleteBubble: (id: string) => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export default function BubbleCaptures({
  selectedBubble,
  commissionRate,
  onUnlockBubble,
  onCompleteBubble,
  language = 'en',
  currency = 'VND',
  exchangeRate = 25000
}: BubbleCapturesProps) {
  const t = translations[language];
  const [viewType, setViewType] = useState<'all' | 'desktop' | 'ios' | 'android'>('all');
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);

  if (!selectedBubble) {
    return (
      <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]" id="bubble-captures-empty">
        <div className="w-12 h-12 bg-slate-950/80 rounded-full border border-slate-800 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/5">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <p className="text-sm font-bold text-slate-100">{t.noBubbleSelected}</p>
        <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
          {t.selectPairDesc}
        </p>
      </div>
    );
  }

  const {
    id,
    buyerName,
    sellerName,
    productName,
    price,
    confidenceScore,
    evaluationReason,
    commissionFee,
    buyerContactUnlocked,
    status,
    scoreBreakdown
  } = selectedBubble;

  // Render bubble button markup
  const renderBubbleContent = (isMobile: boolean) => (
    <div className={`flex flex-col bg-slate-950 border-2 ${confidenceScore >= 80 ? 'border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'border-slate-800'} p-4 rounded-2xl shadow-xl relative overflow-hidden`} id={`nested-bubble-${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Commission header badge */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          {t.autonomousMatch}
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-500">ID: {id}</span>
      </div>

      {/* Bubble Data */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{productName}</h4>
        
        {/* Buyer & Seller bubbles */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-xl">
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">{t.buyerClient}</p>
            <p className="text-slate-200 font-semibold truncate mt-0.5">{buyerName.split(' ')[0]}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-xl">
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">{t.manufacturer}</p>
            <p className="text-slate-200 font-semibold truncate mt-0.5">{sellerName.split(' ')[0]}</p>
          </div>
        </div>

        {/* Pricing / Commission Summary */}
        <div className="bg-slate-900/30 rounded-xl p-2.5 border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="font-medium">{t.wholesalePrice}:</span>
            <span className="text-indigo-400 font-bold">{formatCurrency(price, currency, exchangeRate)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{t.commissionLabel} ({commissionRate}%):</span>
            <span className="text-emerald-400 font-bold">~{formatCurrency(commissionFee, currency, exchangeRate)}</span>
          </div>
        </div>

        {/* Confidence check with collapsible toggle */}
        <button
          onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
          className="w-full flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/30 border border-indigo-500/10 text-left transition-all cursor-pointer"
          id={`confidence-toggle-${isMobile ? 'mobile' : 'desktop'}`}
        >
          <Award className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-semibold text-indigo-300">
            {t.confidenceScore}: <strong className="text-xs font-black">{confidenceScore}%</strong>
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            {confidenceScore >= 80 ? (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-bold">{t.passedStatus}</span>
            ) : (
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full font-bold">{t.lowStatus}</span>
            )}
            {isBreakdownOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </span>
        </button>

        {/* Collapsible Deal Confidence Breakdown */}
        {isBreakdownOpen && (
          <div className="p-2.5 bg-slate-950 border border-slate-800/60 rounded-xl space-y-2 text-[10px] animate-fadeIn">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
              Deal Confidence Breakdown
            </span>
            
            {/* Factor 1: Seller Reputation */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>Seller Reputation Weight</span>
                <span className="font-mono text-indigo-400 font-bold">{scoreBreakdown?.volumeCapacity || 85}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${scoreBreakdown?.volumeCapacity || 85}%` }} />
              </div>
            </div>

            {/* Factor 2: Demand-Supply Match Accuracy */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>Demand-Supply Match Accuracy</span>
                <span className="font-mono text-indigo-400 font-bold">{scoreBreakdown?.productAlignment || 90}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${scoreBreakdown?.productAlignment || 90}%` }} />
              </div>
            </div>

            {/* Factor 3: Historical Trend Weight */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>Historical Trend Weight</span>
                <span className="font-mono text-indigo-400 font-bold">{scoreBreakdown?.logisticsFeasibility || 80}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${scoreBreakdown?.logisticsFeasibility || 80}%` }} />
              </div>
            </div>

            {/* Factor 4: Price Alignment Accuracy */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>Price Alignment Accuracy</span>
                <span className="font-mono text-indigo-400 font-bold">{scoreBreakdown?.priceAlignment || 85}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${scoreBreakdown?.priceAlignment || 85}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Reason */}
        <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-2 px-1">
          "{evaluationReason}"
        </p>

        {/* Sacombank Remittance & Payment Proof Status */}
        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[9px] text-slate-300 leading-normal space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Sacombank Gateway:</span>
            <span className="font-mono text-emerald-400 font-bold">060129073198</span>
          </div>

          {/* Payment Proof Status Banner */}
          {selectedBubble.paymentProofUrl && selectedBubble.paymentStatus === 'paid' ? (
            <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{language === 'vi' ? 'Đã có hình ảnh bill khách gởi - Đã quyết toán' : 'Customer receipt verified - Paid'}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] text-rose-300 font-medium bg-rose-950/30 border border-rose-500/30 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                <span>{language === 'vi' ? 'Chưa có ảnh bill - Tính là công nợ' : 'No receipt image - Registered as debt'}</span>
              </div>
              {selectedBubble.dealCompletedAt && (
                <div className="flex items-center justify-between text-[8px] text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                  <span>{language === 'vi' ? 'SLA 48h Nhắc Nợ:' : '48h SLA Status:'}</span>
                  <span>
                    {(Date.now() - new Date(selectedBubble.dealCompletedAt).getTime()) >= 48 * 3600 * 1000 
                      ? (language === 'vi' ? '⚠️ Quá Hạn 48h (Bot đã nhắc)' : '⚠️ Overdue >48h (Reminded)')
                      : (language === 'vi' ? '⏳ Đang đếm ngược 48h' : '⏳ 48h countdown active')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MAIN CLICKABLE BUTTON BUBBLE */}
        <button
          onClick={() => {
            if (!buyerContactUnlocked) {
              onUnlockBubble(id);
            } else if (status !== 'completed') {
              onCompleteBubble(id);
            }
          }}
          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
            !buyerContactUnlocked
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] cursor-pointer'
              : status === 'completed'
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] cursor-pointer'
          }`}
          id={`agree-bubble-btn-${isMobile ? 'mobile' : 'desktop'}`}
        >
          {!buyerContactUnlocked ? (
            <>
              <span>Agree & Unlock Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </>
          ) : status === 'completed' ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Deal Finalized & Closed</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Tải Bill Khách Gởi & Đóng Deal' : 'Upload Proof & Finalize Deal'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl" id="bubble-captures-root">
      {/* Selector and Title */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 tracking-wide uppercase">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            Enclosed Real Data Bubble Captures
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Dynamic renders showing how the matching bubble displays on different viewports.
          </p>
        </div>

        {/* View toggle filters */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewType('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${viewType === 'all' ? 'bg-slate-800 text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All 3
          </button>
          <button
            onClick={() => setViewType('desktop')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${viewType === 'desktop' ? 'bg-slate-800 text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Web
          </button>
          <button
            onClick={() => setViewType('ios')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${viewType === 'ios' ? 'bg-slate-800 text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            iOS
          </button>
          <button
            onClick={() => setViewType('android')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${viewType === 'android' ? 'bg-slate-800 text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Android
          </button>
        </div>
      </div>

      {/* Capture Frames Area */}
      <div className="flex-1 bg-slate-950/20 p-4 overflow-y-auto max-h-[500px]">
        <div className={`grid gap-6 ${viewType === 'all' ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1'}`}>
          
          {/* Capture 1: Desktop Web Browser */}
          {(viewType === 'all' || viewType === 'desktop') && (
            <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-sm" id="capture-desktop-web">
              {/* Browser bar */}
              <div className="bg-slate-950/80 px-3 py-2 border-b border-slate-800/80 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 mx-4 bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5 text-[9px] text-slate-500 truncate text-center select-none font-mono">
                  https://dealmatcher.net/portal/deal-{id}
                </div>
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="p-4 flex-1 bg-slate-950/30 flex flex-col justify-center">
                <p className="text-[9px] font-bold text-indigo-400 mb-1 tracking-widest uppercase">Capture 1: Desktop Web Layout</p>
                <p className="text-[10px] text-slate-400 mb-3">Enclosed bubble floats inside the main user dashboard feed.</p>
                {renderBubbleContent(false)}
              </div>
            </div>
          )}

          {/* Capture 2: iOS iPhone View */}
          {(viewType === 'all' || viewType === 'ios') && (
            <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-sm mx-auto w-full max-w-[320px]" id="capture-ios-phone">
              {/* iOS Status bar */}
              <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[9px] font-semibold text-slate-400">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 bg-slate-500 rounded-xs" />
                  <Smartphone className="w-3 h-3 text-slate-500" />
                </div>
              </div>
              <div className="p-3 flex-1 bg-slate-950/30 flex flex-col justify-center">
                <p className="text-[9px] font-bold text-indigo-400 mb-1 tracking-widest uppercase">Capture 2: iOS Phone View</p>
                <p className="text-[10px] text-slate-400 mb-2">Compact bubble rendering with optimized touch target layout.</p>
                {renderBubbleContent(true)}
              </div>
            </div>
          )}

          {/* Capture 3: Android Phone View */}
          {(viewType === 'all' || viewType === 'android') && (
            <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-sm mx-auto w-full max-w-[320px]" id="capture-android-phone">
              {/* Android Status bar */}
              <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[9px] font-medium text-slate-400">
                <span className="font-mono">09:41</span>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold bg-slate-800 text-slate-400 px-1 rounded-sm">5G</span>
                  <div className="w-3 h-1.5 border border-slate-500 rounded-xs p-0.2"><div className="w-2 h-full bg-slate-500" /></div>
                </div>
              </div>
              <div className="p-3 flex-1 bg-slate-950/30 flex flex-col justify-center">
                <p className="text-[9px] font-bold text-indigo-400 mb-1 tracking-widest uppercase">Capture 3: Android Phone View</p>
                <p className="text-[10px] text-slate-400 mb-2">Responsive alignment rendered directly within Material Design frame.</p>
                {renderBubbleContent(true)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
