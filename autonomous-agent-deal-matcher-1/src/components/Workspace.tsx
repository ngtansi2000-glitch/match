/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Award, Landmark, Lock, Unlock, MessageSquare, Send, Sparkles, CheckCircle2, Trash2, X, RefreshCw, AlertTriangle, Mic, MicOff, Check, CheckSquare, Square } from 'lucide-react';
import { MatchingBubble, CommunicationStatus } from '../types';
import { Language, Currency, translations, formatCurrency } from '../lib/i18n';

interface WorkspaceProps {
  bubbles: MatchingBubble[];
  dismissedBubbles?: MatchingBubble[];
  selectedBubble: MatchingBubble | null;
  onSelectBubble: (bubble: MatchingBubble) => void;
  communicationStatuses: CommunicationStatus[];
  commissionRate: number;
  onUpdateCommission: (rate: number) => void;
  onUnlockBubble: (id: string) => void;
  onCompleteBubble: (id: string) => void;
  onDismissBubble: (id: string) => void;
  onDeleteDeal?: (id: string) => void;
  onBulkUnlock?: (ids: string[]) => Promise<void> | void;
  onBulkDismiss?: (ids: string[]) => Promise<void> | void;
  onBulkDelete?: (ids: string[]) => Promise<void> | void;
  onBulkRematch?: (ids: string[]) => Promise<void> | void;
  onMatchOnlineProducts?: () => void;
  isMatchingOnline?: boolean;
  onRematchBubble?: (id: string) => void;
  onInterveneBubble?: (id: string, priceNudge?: number) => Promise<void>;
  onImproveOutreach: (pairId: string, tone: 'Professional' | 'Friendly' | 'Urgent') => Promise<void>;
  onSendMessage: (pairId: string, sender: 'agent', text: string) => void;
  isImprovingOutreach: boolean;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export default function Workspace({
  bubbles,
  dismissedBubbles = [],
  selectedBubble,
  onSelectBubble,
  communicationStatuses,
  commissionRate,
  onUpdateCommission,
  onUnlockBubble,
  onCompleteBubble,
  onDismissBubble,
  onDeleteDeal,
  onBulkUnlock,
  onBulkDismiss,
  onBulkDelete,
  onBulkRematch,
  onMatchOnlineProducts,
  isMatchingOnline = false,
  onRematchBubble,
  onInterveneBubble,
  onImproveOutreach,
  onSendMessage,
  isImprovingOutreach,
  language = 'en',
  currency = 'VND',
  exchangeRate = 25000
}: WorkspaceProps) {
  const t = translations[language];
  const [inputText, setInputText] = useState('');
  const [selectedTone, setSelectedTone] = useState<'Professional' | 'Friendly' | 'Urgent'>('Professional');
  const [proposalTab, setProposalTab] = useState<'active' | 'dismissed'>('active');
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [isBulkOperating, setIsBulkOperating] = useState<boolean>(false);
  const [isRematching, setIsRematching] = useState<boolean>(false);
  const [nudgePrice, setNudgePrice] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Stop listening when selected bubble changes
  React.useEffect(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [selectedBubble?.id]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechError(t.speechNotSupported);
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setSpeechError(`${t.speechError} (${event.error})`);
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setSpeechError(t.speechError);
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  React.useEffect(() => {
    if (selectedBubble) {
      setNudgePrice(Math.round(selectedBubble.price * 0.9).toString());
    }
  }, [selectedBubble]);

  const activeComm = selectedBubble
    ? communicationStatuses.find(c => c.pairId === selectedBubble.id)
    : null;

  const isDismissed = dismissedBubbles.some(b => b.id === selectedBubble?.id);

  const displayBubbles = proposalTab === 'active' ? bubbles : dismissedBubbles;

  const handleToggleDealSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDealIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = displayBubbles.length > 0 && selectedDealIds.length === displayBubbles.length;

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedDealIds([]);
    } else {
      setSelectedDealIds(displayBubbles.map(b => b.id));
    }
  };

  const handleBulkUnlockAction = async () => {
    if (selectedDealIds.length === 0 || isBulkOperating) return;
    setIsBulkOperating(true);
    try {
      if (onBulkUnlock) {
        await onBulkUnlock(selectedDealIds);
      } else {
        for (const id of selectedDealIds) {
          onUnlockBubble(id);
        }
      }
      setSelectedDealIds([]);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkDismissAction = async () => {
    if (selectedDealIds.length === 0 || isBulkOperating) return;
    setIsBulkOperating(true);
    try {
      if (onBulkDismiss) {
        await onBulkDismiss(selectedDealIds);
      } else {
        for (const id of selectedDealIds) {
          onDismissBubble(id);
        }
      }
      setSelectedDealIds([]);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkDeleteAction = async () => {
    if (selectedDealIds.length === 0 || isBulkOperating) return;
    const confirmMsg = language === 'vi'
      ? `Bạn có chắc muốn xóa vĩnh viễn ${selectedDealIds.length} thương vụ đã chọn?`
      : `Are you sure you want to permanently delete ${selectedDealIds.length} selected deals?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkOperating(true);
    try {
      if (onBulkDelete) {
        await onBulkDelete(selectedDealIds);
      } else if (onDeleteDeal) {
        for (const id of selectedDealIds) {
          onDeleteDeal(id);
        }
      }
      setSelectedDealIds([]);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkRematchAction = async () => {
    if (selectedDealIds.length === 0 || isBulkOperating) return;
    setIsBulkOperating(true);
    try {
      if (onBulkRematch) {
        await onBulkRematch(selectedDealIds);
      } else if (onRematchBubble) {
        for (const id of selectedDealIds) {
          onRematchBubble(id);
        }
      }
      setSelectedDealIds([]);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedBubble) return;
    onSendMessage(selectedBubble.id, 'agent', inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl" id="deal-workspace-root">
      
      {/* Commission & Bank Banner */}
      <div className="p-4 bg-slate-950/80 text-white border-b border-slate-800">
        <div className="flex items-center gap-2 mb-2.5">
          <Landmark className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-200">Vietnam Sacombank Commission Pipeline</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block font-bold uppercase tracking-wide text-[8px]">Sacombank Beneficiary</span>
            <span className="text-amber-400 font-bold font-mono">NGUYỄN TẤN SĨ</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block font-bold uppercase tracking-wide text-[8px]">Account Number</span>
            <span className="text-amber-400 font-bold font-mono">060129073198</span>
          </div>
        </div>

        {/* Adjustable Slider */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Adjustable Platform Fee Rate:
            </span>
            <span className="text-indigo-400 font-black text-sm">{commissionRate}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={commissionRate}
            onChange={(e) => onUpdateCommission(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            id="commission-rate-slider"
          />
          <div className="flex justify-between text-[9px] text-slate-500 mt-1">
            <span>0.5% (Wholesale Min)</span>
            <span>5.0% (SaaS Max)</span>
          </div>
        </div>
      </div>

      {/* Match List Selector */}
      <div className="p-3 bg-slate-950/30 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
            <button
              onClick={() => {
                setProposalTab('active');
                setSelectedDealIds([]);
              }}
              className={`pb-1 border-b-2 cursor-pointer transition-all ${proposalTab === 'active' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
              id="active-proposals-tab"
            >
              Active ({bubbles.length})
            </button>
            <button
              onClick={() => {
                setProposalTab('dismissed');
                setSelectedDealIds([]);
              }}
              className={`pb-1 border-b-2 cursor-pointer transition-all ${proposalTab === 'dismissed' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
              id="dismissed-proposals-tab"
            >
              {language === 'vi' ? 'Đã bỏ qua' : 'Dismissed'} ({dismissedBubbles.length})
            </button>

            {displayBubbles.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className="ml-1 text-[9px] text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 bg-slate-900/60 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-all"
                id="quick-select-all-deals-btn"
                title={isAllSelected ? t.deselectAll : t.selectAll}
              >
                <CheckSquare className="w-2.5 h-2.5 text-indigo-400" />
                <span>{isAllSelected ? t.deselectAll : t.selectAll}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onMatchOnlineProducts && (
              <button
                onClick={onMatchOnlineProducts}
                disabled={isMatchingOnline}
                className="text-[9px] bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                title={language === 'vi' ? 'Quét và tự động khớp sản phẩm online đang chạy' : 'Match whatever products are running online'}
                id="workspace-match-online-btn"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>{isMatchingOnline ? (language === 'vi' ? 'Đang quét...' : 'Scanning...') : (language === 'vi' ? '⚡ Khớp Online' : '⚡ Match Online')}</span>
              </button>
            )}
            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
              {proposalTab === 'active' ? (language === 'vi' ? 'Đề xuất Đang chạy' : 'Active Decks') : (language === 'vi' ? 'Đề xuất Bỏ qua' : 'Dismissed Decks')}
            </span>
          </div>
        </div>

        {/* Bulk Action Toolbar (Appears when 1 or more deals are selected) */}
        {selectedDealIds.length > 0 && (
          <div className="mb-2.5 p-2 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-lg shadow-indigo-950/50" id="bulk-action-toolbar">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-black">
                {selectedDealIds.length}
              </span>
              <span className="text-[11px] font-bold text-slate-200">
                {selectedDealIds.length} {t.selectedDealsCount}
              </span>
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className="text-[10px] text-indigo-300 hover:text-indigo-200 underline font-semibold cursor-pointer ml-1"
                id="bulk-select-all-toggle-btn"
              >
                {isAllSelected ? t.deselectAll : t.selectAll}
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {proposalTab === 'active' ? (
                <>
                  <button
                    type="button"
                    onClick={handleBulkUnlockAction}
                    disabled={isBulkOperating}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    title={language === 'vi' ? 'Mở khóa thông tin liên hệ cho tất cả deals đã chọn (1 cú click)' : 'Unlock contacts for all selected deals in 1 click'}
                    id="bulk-unlock-btn"
                  >
                    <Unlock className="w-3 h-3 text-amber-400" />
                    <span>{isBulkOperating ? '...' : t.bulkUnlockBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkDismissAction}
                    disabled={isBulkOperating}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    title={language === 'vi' ? 'Bỏ qua tất cả deals đã chọn khỏi deck chính (1 cú click)' : 'Dismiss all selected deals in 1 click'}
                    id="bulk-dismiss-btn"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                    <span>{isBulkOperating ? '...' : t.bulkDismissBtn}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleBulkRematchAction}
                  disabled={isBulkOperating}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  title={language === 'vi' ? 'Khôi phục tất cả deals đã chọn về deck chính (1 cú click)' : 'Restore all selected deals in 1 click'}
                  id="bulk-restore-btn"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-400" />
                  <span>{isBulkOperating ? '...' : t.bulkRestoreBtn}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBulkDeleteAction}
                disabled={isBulkOperating}
                className="px-2 py-1 rounded-xl text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                title={language === 'vi' ? 'Xóa vĩnh viễn các deals đã chọn' : 'Permanently delete selected deals'}
                id="bulk-delete-btn"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>{t.bulkDeleteBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDealIds([])}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                title={t.deselectAll}
                id="bulk-clear-selection-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1.5 max-w-full">
          {displayBubbles.length > 0 ? (
            displayBubbles.map(b => {
              const isSelected = selectedBubble?.id === b.id;
              const isChecked = selectedDealIds.includes(b.id);
              const meetsConfidenceThreshold = b.confidenceScore >= 80;
              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBubble(b)}
                  className={`flex-shrink-0 w-52 p-3 rounded-2xl text-left transition-all border cursor-pointer relative select-none ${
                    isChecked
                      ? 'bg-slate-800/95 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/15'
                      : isSelected
                        ? 'bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/5'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                  id={`bubble-card-${b.id}`}
                >
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleDealSelect(b.id, e)}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                            : 'border-slate-700 bg-slate-900/90 hover:border-indigo-400 text-transparent hover:text-slate-500'
                        }`}
                        title={isChecked ? (language === 'vi' ? 'Bỏ chọn' : 'Deselect') : (language === 'vi' ? 'Chọn deal này' : 'Select deal')}
                        id={`deal-checkbox-${b.id}`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>
                      <span>{language === 'vi' ? 'Cặp khớp' : 'Match'} #{b.id}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {b.buyerContactUnlocked && b.sellerContactUnlocked && (
                        <span className="text-[9px]" title={language === 'vi' ? 'Đã mở khóa thông tin liên hệ' : 'Contacts unlocked'}>
                          🔓
                        </span>
                      )}
                      <span className={`px-1.5 py-0.2 rounded font-bold ${meetsConfidenceThreshold ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                        {b.confidenceScore}% Acc.
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate mt-1.5">{b.productName}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px]">
                    <span className="text-slate-400 font-semibold">{formatCurrency(b.price, currency, exchangeRate)}</span>
                    <span className="text-emerald-400 font-bold">+{formatCurrency(b.commissionFee, currency, exchangeRate)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 w-full text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {language === 'vi' ? 'Không tìm thấy đề xuất khớp nào' : `No ${proposalTab === 'active' ? 'active' : 'dismissed'} match proposals found`}
            </div>
          )}
        </div>
      </div>

      {/* Active Workstation Workspace */}
      {selectedBubble ? (
        <div className="flex-1 flex flex-col overflow-y-auto" id="selected-workspace-container">
          
          {/* Sourcing Pair Identity */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/10">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Matched Trade Pair</span>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">{selectedBubble.productName}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {!isDismissed && (
                  <button
                    onClick={() => onDismissBubble(selectedBubble.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer border border-transparent hover:border-slate-700"
                    title={language === 'vi' ? 'Bỏ qua đề xuất này' : 'Dismiss match bubble'}
                    id="dismiss-bubble-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {onDeleteDeal && (
                  <button
                    onClick={() => {
                      const confirmed = window.confirm(
                        language === 'vi' 
                          ? `Bạn có chắc chắn muốn xóa deal "${selectedBubble.productName}" khỏi hệ thống không?` 
                          : `Are you sure you want to delete deal "${selectedBubble.productName}"?`
                      );
                      if (confirmed) {
                        onDeleteDeal(selectedBubble.id);
                      }
                    }}
                    className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer border border-rose-500/30 flex items-center gap-1"
                    title={language === 'vi' ? 'Xóa deal này' : 'Delete this deal'}
                    id="delete-deal-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold hidden sm:inline">{language === 'vi' ? 'Xóa deal' : 'Delete'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* ----------------- BENTO GRID STARTS HERE ----------------- */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              
              {/* Bento Card 1: Buyer Lead Dossier */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">Sourcing Buyer Dossier</span>
                  <h4 className="text-xs font-black text-slate-100 mt-1 truncate">{selectedBubble.buyerName}</h4>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-bold">Contact Channel</span>
                  <div className="flex items-center gap-1 font-mono">
                    {selectedBubble.buyerContactUnlocked ? (
                      <span className="text-slate-300 font-bold select-all select-none bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                        {selectedBubble.buyerName.includes('Milan') ? 'alena@milanofashion.it' : selectedBubble.buyerName.includes('Minh') ? 'tuan@techgadgetsvn.com' : 'sarah@jenkinsskin.co'}
                      </span>
                    ) : (
                      <button
                        onClick={() => onUnlockBubble(selectedBubble.id)}
                        className="flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 border border-amber-500/25 rounded-md cursor-pointer transition-all uppercase tracking-wider"
                      >
                        <Lock className="w-2.5 h-2.5" /> Unlock
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Supply Manufacturer Dossier */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">Supply Manufacturer</span>
                  <h4 className="text-xs font-black text-slate-100 mt-1 truncate">{selectedBubble.sellerName}</h4>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-bold">Factory Channel</span>
                  <div className="flex items-center gap-1 font-mono">
                    {selectedBubble.sellerContactUnlocked ? (
                      <span className="text-slate-300 font-bold select-all select-none bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                        {selectedBubble.sellerName.includes('Phong') ? 'phong@hadongsilk.vn' : selectedBubble.sellerName.includes('Yiwu') ? 'sales@yiwusmarttrade.cn' : 'aura_beauty@szfactory.com'}
                      </span>
                    ) : (
                      <button
                        onClick={() => onUnlockBubble(selectedBubble.id)}
                        className="flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 border border-amber-500/25 rounded-md cursor-pointer transition-all uppercase tracking-wider"
                      >
                        <Lock className="w-2.5 h-2.5" /> Unlock
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bento Card 3: Extracted Sourcing Mandates (Heuristics Data Extractor) */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl col-span-2 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">AI Parsed Sourcing Mandates</span>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                    Heuristic Extractor L1
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wide">Target Category</span>
                    <p className="font-extrabold text-slate-200">{selectedBubble.extractedBuyerRequirements?.productType || 'Wholesale Sourcing'}</p>
                  </div>
                  <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wide">Quantity Required</span>
                    <p className="font-extrabold text-indigo-400 font-mono">{(selectedBubble.extractedBuyerRequirements?.quantityNeeded || 1500).toLocaleString()} Units</p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Primary Key Criteria</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedBubble.extractedBuyerRequirements?.keyCriteria || []).map((crit, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[9.5px] font-semibold bg-indigo-500/5 text-slate-300 border border-indigo-500/10 rounded-lg">
                        {crit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bento Card 4: Match Compatibility Breakdown (Multi-factor calculation) */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl col-span-2 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">Multi-Factor Score Matrix</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-black text-slate-100 font-mono">{selectedBubble.confidenceScore}%</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${
                        selectedBubble.confidenceScore >= 80 
                          ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' 
                          : 'text-amber-400 bg-amber-500/5 border-amber-500/10'
                      }`}>
                        {selectedBubble.confidenceScore >= 80 ? 'AUTHORIZED DEAL' : 'UNVERIFIED'}
                      </span>
                    </div>
                  </div>
                  <Award className="w-6 h-6 text-indigo-400" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                  {/* Price Alignment */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[10px]">
                      <span className="text-slate-400">Price Discrepancy</span>
                      <span className="text-indigo-400 font-mono">{selectedBubble.scoreBreakdown?.priceAlignment || 85}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${selectedBubble.scoreBreakdown?.priceAlignment || 85}%` }} />
                    </div>
                  </div>

                  {/* Product Alignment */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[10px]">
                      <span className="text-slate-400">Semantic Alignment</span>
                      <span className="text-indigo-400 font-mono">{selectedBubble.scoreBreakdown?.productAlignment || 90}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${selectedBubble.scoreBreakdown?.productAlignment || 90}%` }} />
                    </div>
                  </div>

                  {/* Logistics */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[10px]">
                      <span className="text-slate-400">Logistics Feasibility</span>
                      <span className="text-indigo-400 font-mono">{selectedBubble.scoreBreakdown?.logisticsFeasibility || 80}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${selectedBubble.scoreBreakdown?.logisticsFeasibility || 80}%` }} />
                    </div>
                  </div>

                  {/* Volume Capacity */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[10px]">
                      <span className="text-slate-400">Factory Volume Capacity</span>
                      <span className="text-indigo-400 font-mono">{selectedBubble.scoreBreakdown?.volumeCapacity || 85}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${selectedBubble.scoreBreakdown?.volumeCapacity || 85}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 leading-relaxed italic">
                  "{selectedBubble.evaluationReason}"
                </div>
              </div>

            </div>
          </div>

          {/* Outreach improver or recovery panel */}
          {isDismissed ? (
            <div className="p-6 border-t border-slate-800 bg-slate-950/20 flex flex-col items-center text-center space-y-4 flex-1 justify-center min-h-[300px]" id="dismissed-recovery-panel">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full animate-pulse shadow-md shadow-amber-500/5">
                <RefreshCw className="w-8 h-8 animate-spin-slow" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">Dismissed Proposal Recovery Desk</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This multi-agent trade match proposal was dismissed from the active list. Triggering an <strong>Immediate Re-match</strong> initiates an automatic high-speed trade signal query through our active pipelines.
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-950/40 p-2 border border-slate-800/50 rounded-xl font-mono">
                  The Research and Sales agents will scan real-time global wholesale feeds (TikTok, Instagram, Taobao) for fresh, highly compatible counterparties with improved pricing matrices.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  disabled={isRematching}
                  onClick={async () => {
                    setIsRematching(true);
                    if (onRematchBubble) {
                      await onRematchBubble(selectedBubble.id);
                    }
                    setIsRematching(false);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  id="immediate-rematch-btn"
                >
                  {isRematching ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Querying Pipelines...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Trigger Immediate Re-Match</span>
                    </>
                  )}
                </button>

                {onDeleteDeal && (
                  <button
                    onClick={() => {
                      const confirmed = window.confirm(
                        language === 'vi' 
                          ? `Bạn có chắc chắn muốn xóa vĩnh viễn deal "${selectedBubble.productName}" không?` 
                          : `Are you sure you want to permanently delete deal "${selectedBubble.productName}"?`
                      );
                      if (confirmed) {
                        onDeleteDeal(selectedBubble.id);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    id="dismissed-delete-deal-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Xóa Deal Vĩnh Viễn' : 'Delete Permanently'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : selectedBubble.requiresIntervention ? (
            <div className="p-6 border-t border-slate-800 bg-slate-950/20 flex flex-col space-y-4 flex-1 justify-center min-h-[300px]" id="stalled-intervention-panel">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">{t.managerIntervention}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'vi' ? `Giải quyết tắc nghẽn cho Cặp khớp #${selectedBubble.id}` : `Resolving bottleneck on Match #${selectedBubble.id}`}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="text-xs space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{t.bottleneckDiagnostics}</span>
                  <p className="text-amber-400 font-medium leading-relaxed bg-amber-500/5 p-2.5 border border-amber-500/10 rounded-lg italic font-mono text-[10.5px]">
                    "{selectedBubble.stalledReason || (language === 'vi' ? 'Phát hiện xung đột giá cả giữa hai bên.' : 'Pricing alignment conflict detected between parties.')}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase">{language === 'vi' ? 'Giá Nhà sản xuất' : 'Manufacturer Price'}</span>
                    <p className="font-extrabold text-slate-300 font-mono mt-0.5">{formatCurrency(selectedBubble.price, currency, exchangeRate)}</p>
                  </div>
                  <div className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase">{t.estCommission}</span>
                    <p className="font-extrabold text-emerald-400 font-mono mt-0.5">{formatCurrency(selectedBubble.commissionFee, currency, exchangeRate)}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsRematching(true);
                if (onInterveneBubble) {
                  // If currency is USD, we need to convert back to VND for state storage
                  const rawPriceInput = Number(nudgePrice);
                  const finalVNDPrice = currency === 'USD' ? rawPriceInput * exchangeRate : rawPriceInput;
                  await onInterveneBubble(selectedBubble.id, finalVNDPrice);
                }
                setIsRematching(false);
              }} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    {language === 'vi' ? `Ủy quyền Giá Nhà máy Chiết khấu (${currency})` : `Authorize Discounted Factory Price (${currency})`}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={nudgePrice}
                      onChange={(e) => setNudgePrice(e.target.value)}
                      placeholder={currency === 'USD' ? Math.round((selectedBubble.price * 0.9) / exchangeRate).toString() : Math.round(selectedBubble.price * 0.9).toString()}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100"
                      required
                    />
                    <span className="absolute right-3 top-3 text-[9px] font-bold text-slate-500">{currency}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRematching}
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Thúc đẩy giá & Xóa trạng thái tắc nghẽn' : 'Nudge Price & Clear Stall State'}</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Outreach improver using server-side Gemini API */}
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outreach sentence optimization</span>
                  <span className="text-[9.5px] text-slate-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Powered by Gemini
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
                    {(['Professional', 'Friendly', 'Urgent'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTone(t)}
                        className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${selectedTone === t ? 'bg-slate-800 text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={isImprovingOutreach}
                    onClick={() => onImproveOutreach(selectedBubble.id, selectedTone)}
                    className="ml-auto text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all px-3 py-1.5 rounded-xl flex items-center gap-1.5 disabled:bg-indigo-800/80 disabled:text-slate-400 cursor-pointer"
                    id="improve-outreach-btn"
                  >
                    {isImprovingOutreach ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Optimize Pitch with Gemini</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Current Proposal Output Box */}
                <div className="mt-3 bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed relative">
                  <span className="absolute top-2 right-2 text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wider">Ready outreach</span>
                  {activeComm?.outreachTemplate || 'No outreach template generated yet.'}
                </div>
              </div>

              {/* Real-time communication thread simulator */}
              <div className="p-4 flex-1 flex flex-col h-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    Live Communication Threads
                  </span>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Realtime connection</span>
                </div>

                {/* Chat message bubbles */}
                <div className="flex-1 bg-slate-950/30 border border-slate-800 rounded-2xl p-3 overflow-y-auto space-y-2.5 max-h-[160px] min-h-[120px]">
                  {activeComm?.messages && activeComm.messages.length > 0 ? (
                    activeComm.messages.map(msg => {
                      const isAgent = msg.sender === 'agent';
                      const isBuyer = msg.sender === 'buyer';
                      
                      let senderLabel = 'Agent';
                      let bubbleBg = 'bg-indigo-600 text-white ml-auto border border-indigo-500/30 shadow-md shadow-indigo-950/10';
                      if (isBuyer) {
                        senderLabel = 'Buyer Client';
                        bubbleBg = 'bg-slate-900 text-slate-200 border border-slate-800 mr-auto';
                      } else if (msg.sender === 'seller') {
                        senderLabel = 'Manufacturer';
                        bubbleBg = 'bg-slate-850 text-slate-200 border border-slate-800 mr-auto';
                      }

                      return (
                        <div key={msg.id} className={`max-w-[85%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{senderLabel}</span>
                          <div className={`p-2 rounded-xl text-xs leading-normal ${bubbleBg}`}>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No active messages in thread. Dispatch outreach above to initialize conversation.
                    </div>
                  )}
                </div>

                {/* Chat Form */}
                <form onSubmit={handleSendChat} className="mt-3 flex flex-col gap-1.5">
                  {speechError && (
                    <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{speechError}</span>
                    </div>
                  )}
                  {isListening && (
                    <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{t.listeningStatus}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        placeholder="Negotiate prices, request certifications, write proposals..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full border border-slate-800 bg-slate-950 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-0"
                        id="chat-input"
                      />
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-2 p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                          isListening 
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse border border-emerald-500/30' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        }`}
                        title={t.dictateTooltip}
                        id="voice-dictate-btn"
                      >
                        {isListening ? (
                          <Mic className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                        ) : (
                          <Mic className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
                      id="chat-send-btn"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500" id="selected-workspace-empty">
          <Lock className="w-8 h-8 text-slate-700 mb-2" />
          <p className="text-xs font-bold text-slate-300">Secure matching interface</p>
          <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
            Select any multi-agent match proposal above to initialize trade negotiations, optimize pitches with Gemini AI, and clear commissions.
          </p>
        </div>
      )}

    </div>
  );
}
