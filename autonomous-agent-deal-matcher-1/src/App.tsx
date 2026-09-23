/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Shield, Database, RefreshCw, Landmark, CheckCircle, Clock, Zap, Play, Sparkles, Building2, FileText, Flame } from 'lucide-react';
import { BuyerLead, SellerLead, MatchingBubble, ActivityLog, CommunicationStatus, PipelineSignal, AgentIntercom, AppToast, ResearchPipelineStats, AgencyContract } from './types';
import AgentArchitecture from './components/AgentArchitecture';
import BubbleCaptures from './components/BubbleCaptures';
import Workspace from './components/Workspace';
import StreamingFeeds from './components/StreamingFeeds';
import ToastContainer from './components/ToastContainer';
import AgentAuditLog, { cleanupDuplicateAuditLogs } from './components/AgentAuditLog';
import SelfImprovedLedger from './components/SelfImprovedLedger';
import { DebtCommissionTracker } from './components/DebtCommissionTracker';
import { PaymentProofModal } from './components/PaymentProofModal';
import { AgencyContractsManager } from './components/AgencyContractsManager';
import { Language, Currency, translations, formatCurrency, DEFAULT_EXCHANGE_RATE, detectBrowserLanguage } from './lib/i18n';
import { getApiUrl, safeFetchJson } from './lib/api';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => detectBrowserLanguage());
  const [currency, setCurrency] = useState<Currency>('VND');
  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_EXCHANGE_RATE);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('app_language', newLang);
    } catch (e) {
      console.warn('Failed to save language preference', e);
    }
  };

  const [buyersList, setBuyersList] = useState<BuyerLead[]>([]);
  const [sellersList, setSellersList] = useState<SellerLead[]>([]);
  const [matchingBubbles, setMatchingBubbles] = useState<MatchingBubble[]>([]);
  const [dismissedBubbles, setDismissedBubbles] = useState<MatchingBubble[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [communicationStatuses, setCommunicationStatuses] = useState<CommunicationStatus[]>([]);
  const [pipelineSignals, setPipelineSignals] = useState<PipelineSignal[]>([]);
  const [agentIntercoms, setAgentIntercoms] = useState<AgentIntercom[]>([]);
  
  const [commissionRate, setCommissionRate] = useState<number>(1.5);
  const [totalCommissionEarnedVND, setTotalCommissionEarnedVND] = useState<number>(24850000);
  const [successfulDealsCount, setSuccessfulDealsCount] = useState<number>(18);
  
  const [selectedBubble, setSelectedBubble] = useState<MatchingBubble | null>(null);
  const [dealForProofModal, setDealForProofModal] = useState<MatchingBubble | null>(null);
  
  const [isAddingLead, setIsAddingLead] = useState<boolean>(false);
  const [isImprovingOutreach, setIsImprovingOutreach] = useState<boolean>(false);
  const [isMatchingOnline, setIsMatchingOnline] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const t = translations[language];

  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [commissionThreshold, setCommissionThreshold] = useState<number>(5000000);
  const [notifiedDealIds, setNotifiedDealIds] = useState<Set<string>>(new Set());
  const [notifiedStalledDealIds, setNotifiedStalledDealIds] = useState<Set<string>>(new Set());
  const [researchPipelineStats, setResearchPipelineStats] = useState<ResearchPipelineStats | null>(null);
  const [isDrawingResearch, setIsDrawingResearch] = useState<boolean>(false);
  const fetchFailuresRef = useRef<number>(0);

  // 1. Fetch State on mount and regularly poll
  const fetchState = async () => {
    try {
      const data = await safeFetchJson('/api/state');
      
      setBuyersList(data.buyersList || []);
      setSellersList(data.sellersList || []);
      setMatchingBubbles(data.matchingBubbles || []);
      setDismissedBubbles(data.dismissedBubbles || []);
      setActivityLogs(cleanupDuplicateAuditLogs(data.activityLogs || []));
      setCommunicationStatuses(data.communicationStatuses || []);
      setCommissionRate(data.commissionRate ?? 1.5);
      setTotalCommissionEarnedVND(data.totalCommissionEarnedVND ?? 0);
      setSuccessfulDealsCount(data.successfulDealsCount ?? 0);
      setPipelineSignals(data.pipelineSignals || []);
      setAgentIntercoms(data.agentIntercoms || []);
      if (data.researchPipelineStats) {
        setResearchPipelineStats(data.researchPipelineStats);
      }

      // Keep previously selected bubble active if still present, else default to first
      const allAvailable = [...(data.matchingBubbles || []), ...(data.dismissedBubbles || [])];
      if (allAvailable.length > 0) {
        setTimeout(() => {
          setSelectedBubble(prev => {
            if (prev) {
              const matched = allAvailable.find((b: any) => b.id === prev.id);
              if (matched) return matched;
            }
            return (data.matchingBubbles && data.matchingBubbles[0]) || allAvailable[0];
          });
        }, 0);
      } else {
        setSelectedBubble(null);
      }
      
      fetchFailuresRef.current = 0;
      setErrorMessage('');
    } catch (err: any) {
      fetchFailuresRef.current += 1;
      console.warn(`State fetch attempt ${fetchFailuresRef.current} failed:`, err?.message || err);
      // Only display persistent error banner if it fails repeatedly (4+ consecutive attempts)
      if (fetchFailuresRef.current >= 4) {
        const msg = err?.message || 'Reconnecting to multi-agent server...';
        if (!msg.includes('<!doctype') && !msg.includes('<html')) {
          setErrorMessage(msg);
        } else {
          setErrorMessage('Connecting to platform services...');
        }
      }
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('CUSTOM_BACKEND_URL');
    } catch {}
    fetchState();
    // Poll state every 4 seconds to animate live feed logs, simulations, and background scheduler
    const timer = setInterval(fetchState, 4000);
    return () => clearInterval(timer);
  }, []);

  // Toast Alert Engine: Monitors real-time pipeline matching updates and triggers alerts
  useEffect(() => {
    if (matchingBubbles.length === 0) return;

    const isInitialLoad = notifiedDealIds.size === 0;
    const newNotifiedDeals = new Set(notifiedDealIds);
    const newNotifiedStalled = new Set(notifiedStalledDealIds);
    let addedToast = false;

    matchingBubbles.forEach(b => {
      // 1. High-value matching pair check
      if (!newNotifiedDeals.has(b.id)) {
        newNotifiedDeals.add(b.id);
        if (!isInitialLoad && b.commissionFee >= commissionThreshold) {
          const newToast: AppToast = {
            id: `toast-high-${b.id}-${Date.now()}`,
            type: 'high_value',
            title: '🔥 High-Value Deal Identified!',
            message: `Match [${b.id}] for "${b.productName}" offers a lucrative commission of ${b.commissionFee.toLocaleString()} VND (${b.commissionPercent}%).`,
            timestamp: new Date().toLocaleTimeString(),
            meta: {
              dealId: b.id,
              commissionFee: b.commissionFee,
              productName: b.productName
            }
          };
          setToasts(prev => [newToast, ...prev].slice(0, 5));
          addedToast = true;
        }
      }

      // 2. Stalled deal intervention check
      if (b.requiresIntervention && !newNotifiedStalled.has(b.id)) {
        newNotifiedStalled.add(b.id);
        if (!isInitialLoad) {
          const newToast: AppToast = {
            id: `toast-stall-${b.id}-${Date.now()}`,
            type: 'stalled',
            title: '⚠️ Stalled Deal: Intervention Required',
            message: `${b.stalledReason || 'Price discrepancy detected.'} Adjust margins or pricing for "${b.productName}" (Match [${b.id}]) to resume progress.`,
            timestamp: new Date().toLocaleTimeString(),
            meta: {
              dealId: b.id,
              productName: b.productName
            }
          };
          setToasts(prev => [newToast, ...prev].slice(0, 5));
          addedToast = true;
        }
      }
    });

    setNotifiedDealIds(newNotifiedDeals);
    setNotifiedStalledDealIds(newNotifiedStalled);
  }, [matchingBubbles, commissionThreshold]);

  // Action: Select Deal from Toast trigger
  const handleSelectDealFromToast = (dealId: string) => {
    const found = matchingBubbles.find(b => b.id === dealId);
    if (found) {
      setSelectedBubble(found);
      // Clean up the corresponding toast
      setToasts(prev => prev.filter(t => t.meta?.dealId !== dealId));
    }
  };

  // Action: Submit manual intervention
  const handleInterveneBubble = async (pairId: string, priceNudge?: number) => {
    try {
      await safeFetchJson('/api/deal/intervene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId, priceNudge })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Intervention submission failed');
    }
  };

  // 2. Adjust Commission Platform rate
  const handleUpdateCommission = async (rate: number) => {
    try {
      setCommissionRate(rate);
      await safeFetchJson('/api/config/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to configure fee rate');
    }
  };

  // 3. Ingest and Auto-Match Sourcing Lead (using Gemini if active)
  const handleAddLead = async (lead: {
    name: string;
    demand: string;
    targetPrice: number;
    contact: string;
    type: 'buyer' | 'seller';
    source: string;
  }) => {
    setIsAddingLead(true);
    try {
      await safeFetchJson('/api/lead/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Lead ingestion matching errored');
    } finally {
      setIsAddingLead(false);
    }
  };

  const handleIngestSignal = async (signalId: string) => {
    try {
      await safeFetchJson('/api/pipeline/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to ingest social commerce signal');
    }
  };

  const handleDrawResearchData = async (channel?: string, count: number = 2) => {
    setIsDrawingResearch(true);
    try {
      const res = await safeFetchJson('/api/research/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, count })
      });
      if (res.pipelineSignals) setPipelineSignals(res.pipelineSignals);
      if (res.researchPipelineStats) setResearchPipelineStats(res.researchPipelineStats);

      const toastId = `toast-draw-${Date.now()}`;
      setToasts(prev => [
        ...prev,
        {
          id: toastId,
          title: language === 'vi' ? 'Rút Dữ Liệu Thành Công' : 'Research Pipeline Active',
          message: language === 'vi'
            ? `Đã rút và phân tích thành công ${res.addedSignals?.length || count} tín hiệu thương mại mới từ ${channel || 'đa nguồn'} với phân tích ngữ nghĩa Decahose.`
            : `Ingested and analyzed ${res.addedSignals?.length || count} verified trade signals from ${channel || 'all streaming sources'} with Decahose semantics.`,
          type: 'success',
          timestamp: Date.now()
        }
      ]);
      await fetchState();
    } catch (err: any) {
      console.error('Failed to draw research data', err);
      setErrorMessage('Failed to draw research data from firehose');
    } finally {
      setIsDrawingResearch(false);
    }
  };

  // 4. Optimize Outreach sentence with server-side Gemini SDK
  const handleImproveOutreach = async (pairId: string, tone: 'Professional' | 'Friendly' | 'Urgent') => {
    setIsImprovingOutreach(true);
    try {
      await safeFetchJson('/api/outreach/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId, tone })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gemini optimization failed');
    } finally {
      setIsImprovingOutreach(false);
    }
  };

  // 5. Send message in chat thread (triggers realistic manufacturer reply)
  const handleSendMessage = async (pairId: string, sender: 'agent', text: string) => {
    try {
      // Optimistically push message
      setCommunicationStatuses(prev => prev.map(c => {
        if (c.pairId === pairId) {
          return {
            ...c,
            lastMessageSender: sender,
            messages: [...c.messages, { id: `opt-${Date.now()}`, sender, text, timestamp: new Date().toISOString() }]
          };
        }
        return c;
      }));

      await safeFetchJson('/api/outreach/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId, sender, text })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to deliver message');
    }
  };

  // 6. Unlock Bubble contacts (Confirms commission agreement)
  const handleUnlockBubble = async (pairId: string) => {
    try {
      await safeFetchJson('/api/deal/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to unlock contact credentials');
    }
  };

  // 7. Complete Deal and transfer commission fees (Requires Customer Payment Proof)
  const handleCompleteBubble = async (pairId: string) => {
    const target = matchingBubbles.find(b => b.id === pairId) || (selectedBubble?.id === pairId ? selectedBubble : null);
    if (target) {
      setDealForProofModal(target);
    }
  };

  // 8. Dismiss bubble from matching deck
  const handleDismissBubble = async (pairId: string) => {
    try {
      await safeFetchJson('/api/deal/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to dismiss matching bubble');
    }
  };

  // 9. Trigger re-match for dismissed bubble
  const handleRematchBubble = async (pairId: string) => {
    try {
      await safeFetchJson('/api/deal/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId })
      });
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to execute Immediate Re-match');
    }
  };

  // 10. Delete deal permanently from state and database
  const handleDeleteDeal = async (pairId: string) => {
    try {
      await safeFetchJson('/api/deal/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId })
      });
      setMatchingBubbles(prev => prev.filter(b => b.id !== pairId));
      setDismissedBubbles(prev => prev.filter(b => b.id !== pairId));
      if (selectedBubble?.id === pairId) {
        setSelectedBubble(null);
      }
      await fetchState();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(language === 'vi' ? 'Không thể xóa deal này' : 'Failed to delete deal');
    }
  };

  // 11. Match whatever products are running online
  const handleMatchOnlineProducts = async () => {
    setIsMatchingOnline(true);
    try {
      const res = await safeFetchJson('/api/match/online-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      await fetchState();
      if (res && res.matchedCount > 0) {
        setToasts(prev => [
          ...prev,
          {
            id: `toast-match-${Date.now()}`,
            dealId: 'online-products',
            title: language === 'vi' ? '⚡ Khớp Sản Phẩm Online Thành Công' : '⚡ Online Products Matched',
            commissionFee: 0,
            productName: `${res.matchedCount} ${language === 'vi' ? 'sản phẩm online đã được ghép nối' : 'online products paired'}`,
            timestamp: new Date().toISOString(),
            type: 'high_value'
          }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(language === 'vi' ? 'Lỗi khi quét khớp sản phẩm online' : 'Failed to match online products');
    } finally {
      setIsMatchingOnline(false);
    }
  };

  // 12. Bulk operations for Matching Deck
  const handleBulkUnlock = async (pairIds: string[]) => {
    if (!pairIds || pairIds.length === 0) return;
    try {
      const res = await safeFetchJson<{ success: boolean; unlockedCount?: number }>('/api/deal/bulk-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairIds })
      });
      await fetchState();
      const count = res?.unlockedCount || pairIds.length;
      setToasts(prev => [
        ...prev,
        {
          id: `toast-bulk-unlock-${Date.now()}`,
          dealId: 'bulk',
          title: language === 'vi' ? 'Mở Khóa Hàng Loạt Thành Công' : 'Bulk Unlock Complete',
          commissionFee: 0,
          productName: language === 'vi' 
            ? `Đã mở khóa thông tin liên hệ cho ${count} thương vụ trong 1 cú click` 
            : `Unlocked contact credentials for ${count} deals in 1 click`,
          timestamp: new Date().toISOString(),
          type: 'milestone'
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(language === 'vi' ? 'Không thể mở khóa hàng loạt' : 'Failed to execute bulk unlock');
    }
  };

  const handleBulkDismiss = async (pairIds: string[]) => {
    if (!pairIds || pairIds.length === 0) return;
    try {
      const res = await safeFetchJson<{ success: boolean; dismissedCount?: number }>('/api/deal/bulk-dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairIds })
      });
      await fetchState();
      const count = res?.dismissedCount || pairIds.length;
      if (selectedBubble && pairIds.includes(selectedBubble.id)) {
        setSelectedBubble(null);
      }
      setToasts(prev => [
        ...prev,
        {
          id: `toast-bulk-dismiss-${Date.now()}`,
          dealId: 'bulk',
          title: language === 'vi' ? 'Bỏ Qua Hàng Loạt' : 'Bulk Dismiss Complete',
          commissionFee: 0,
          productName: language === 'vi' 
            ? `Đã chuyển ${count} thương vụ sang danh sách đã bỏ qua` 
            : `Dismissed ${count} deals from the active matching deck`,
          timestamp: new Date().toISOString(),
          type: 'high_value'
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(language === 'vi' ? 'Không thể bỏ qua hàng loạt' : 'Failed to execute bulk dismiss');
    }
  };

  const handleBulkDelete = async (pairIds: string[]) => {
    if (!pairIds || pairIds.length === 0) return;
    try {
      const res = await safeFetchJson<{ success: boolean; deletedCount?: number }>('/api/deal/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairIds })
      });
      setMatchingBubbles(prev => prev.filter(b => !pairIds.includes(b.id)));
      setDismissedBubbles(prev => prev.filter(b => !pairIds.includes(b.id)));
      if (selectedBubble && pairIds.includes(selectedBubble.id)) {
        setSelectedBubble(null);
      }
      await fetchState();
      const count = res?.deletedCount || pairIds.length;
      setToasts(prev => [
        ...prev,
        {
          id: `toast-bulk-delete-${Date.now()}`,
          dealId: 'bulk',
          title: language === 'vi' ? 'Xóa Hàng Loạt Thành Công' : 'Bulk Delete Complete',
          commissionFee: 0,
          productName: language === 'vi' 
            ? `Đã xóa vĩnh viễn ${count} thương vụ khỏi hệ thống` 
            : `Permanently deleted ${count} deals from the system`,
          timestamp: new Date().toISOString(),
          type: 'high_value'
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(language === 'vi' ? 'Không thể xóa hàng loạt' : 'Failed to execute bulk delete');
    }
  };

  const handleBulkRematch = async (pairIds: string[]) => {
    if (!pairIds || pairIds.length === 0) return;
    try {
      const res = await safeFetchJson<{ success: boolean; restoredCount?: number }>('/api/deal/bulk-rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairIds })
      });
      await fetchState();
      const count = res?.restoredCount || pairIds.length;
      setToasts(prev => [
        ...prev,
        {
          id: `toast-bulk-restore-${Date.now()}`,
          dealId: 'bulk',
          title: language === 'vi' ? 'Khôi Phục Hàng Loạt' : 'Bulk Restore Complete',
          commissionFee: 0,
          productName: language === 'vi' 
            ? `Đã khôi phục ${count} thương vụ về deck đề xuất chính` 
            : `Restored ${count} deals back to the active matching deck`,
          timestamp: new Date().toISOString(),
          type: 'milestone'
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(language === 'vi' ? 'Không thể khôi phục hàng loạt' : 'Failed to execute bulk restore');
    }
  };

  const handleContractSigned = async (contract: AgencyContract) => {
    await fetchState();
    setToasts(prev => [
      ...prev,
      {
        id: `toast-contract-${Date.now()}`,
        dealId: contract.id,
        title: language === 'vi' ? 'Ký Kết Hợp Đồng Đại Lý Thành Công' : 'Agency Agreement Executed',
        productName: `${contract.manufacturerName} • ${contract.contractNumber}`,
        commissionFee: 0,
        timestamp: new Date().toISOString(),
        type: 'milestone'
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200" id="agent-app-root">
      
      {/* Dynamic Error Notice */}
      {errorMessage && (
        <div className="bg-rose-500/10 text-rose-300 border-b border-rose-500/20 text-xs px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 font-bold" id="app-global-error">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-rose-300">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              ⚠️ {errorMessage}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Re-establishing connection to the live multi-agent backend engine.
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setErrorMessage('');
                fetchState();
              }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] transition-all cursor-pointer font-extrabold uppercase tracking-wider flex items-center gap-1.5"
              id="btn-retry-connection"
            >
              <RefreshCw className="w-3 h-3" /> Retry Connection
            </button>
            <button 
              onClick={() => setErrorMessage('')} 
              className="hover:text-rose-100 font-black cursor-pointer px-1.5 py-0.5 rounded text-sm text-slate-400 hover:bg-rose-500/20"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header Statistics Area */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4 shadow-xl shadow-slate-950/30" id="app-header">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-5">
                
                {/* Logo & Status */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
                    <Cpu className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base font-extrabold text-slate-100 tracking-wider uppercase">{t.appTitle}</h1>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                        {t.activeStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.appSubtitle}</p>
                  </div>
                </div>

                {/* Language & Currency Quick Toggles */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-950/40 border border-slate-800/80 p-1.5 rounded-2xl shadow-inner">
                  {/* Language Toggle */}
                  <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800/50 text-[10px] font-bold">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${language === 'en' ? 'bg-indigo-600 text-white shadow-md font-extrabold' : 'text-slate-500 hover:text-slate-200'}`}
                      id="lang-toggle-en"
                      title="Switch language to English"
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleLanguageChange('vi')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${language === 'vi' ? 'bg-indigo-600 text-white shadow-md font-extrabold' : 'text-slate-500 hover:text-slate-200'}`}
                      id="lang-toggle-vi"
                      title="Chuyển ngôn ngữ sang Tiếng Việt"
                    >
                      VI
                    </button>
                  </div>

                  {/* Currency Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800/50 text-[10px] font-bold">
                      <button
                        onClick={() => setCurrency('VND')}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${currency === 'VND' ? 'bg-indigo-600 text-white shadow-md font-extrabold' : 'text-slate-500 hover:text-slate-200'}`}
                        id="currency-toggle-vnd"
                      >
                        VND
                      </button>
                      <button
                        onClick={() => setCurrency('USD')}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${currency === 'USD' ? 'bg-indigo-600 text-white shadow-md font-extrabold' : 'text-slate-500 hover:text-slate-200'}`}
                        id="currency-toggle-usd"
                      >
                        USD
                      </button>
                    </div>

                    {currency === 'USD' && (
                      <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800/50 text-[10px] animate-fade-in">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rate: 1$ =</span>
                        <input
                          type="number"
                          value={exchangeRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) setExchangeRate(val);
                          }}
                          className="w-16 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-md px-1.5 py-0.5 text-[10px] font-mono text-slate-200 text-center font-bold"
                          title="Configurable Static Exchange Rate"
                          id="exchange-rate-input"
                        />
                        <span className="text-[9px] text-slate-500 font-bold font-mono">đ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Core Target Metrics Banner */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Sacombank clearings */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 shadow-sm flex items-center gap-3">
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none">{t.commissionCleared}</span>
                      <span className="text-xs font-black text-amber-300 font-mono leading-none block mt-1">
                        {formatCurrency(totalCommissionEarnedVND, currency, exchangeRate)}
                      </span>
                    </div>
                  </div>

                  {/* Total Deals */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 shadow-sm flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none">{t.successfulDeals}</span>
                      <span className="text-xs font-black text-slate-100 leading-none block mt-1">{successfulDealsCount} {t.contracts}</span>
                    </div>
                  </div>

                  {/* AI Core State */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 shadow-sm flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none">{t.neuralLogic}</span>
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1 mt-1 leading-none">
                        {t.readyActive}
                      </span>
                    </div>
                  </div>

                  {/* Match Online Products Quick Header Action */}
                  <button
                    onClick={handleMatchOnlineProducts}
                    disabled={isMatchingOnline}
                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white border border-indigo-400/30 rounded-2xl px-3.5 py-2 shadow-sm flex items-center gap-2.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={language === 'vi' ? 'Quét và tự động khớp sản phẩm đang chạy online' : 'Match whatever products are running online'}
                    id="header-match-online-btn"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <div className="text-left">
                      <span className="text-[8px] text-indigo-200 block uppercase font-bold tracking-wider leading-none">
                        {language === 'vi' ? 'Sản phẩm online' : 'Live Online'}
                      </span>
                      <span className="text-xs font-black leading-none block mt-1 whitespace-nowrap">
                        {isMatchingOnline 
                          ? (language === 'vi' ? 'Đang khớp...' : 'Matching...') 
                          : (language === 'vi' ? '⚡ Khớp Online' : '⚡ Match Online')}
                      </span>
                    </div>
                  </button>

                  {/* Agency Contracts Quick Header Action */}
                  <button
                    onClick={() => {
                      const el = document.getElementById('agency-contracts-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl px-3.5 py-2 shadow-sm flex items-center gap-2.5 cursor-pointer transition-all"
                    title={language === 'vi' ? 'Ký kết hợp đồng đại lý với nhà sản xuất' : 'Manufacturer agency agreements'}
                    id="header-agency-contracts-btn"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none">
                        {language === 'vi' ? 'Hợp Đồng Đại Lý' : 'Agency Deals'}
                      </span>
                      <span className="text-xs font-black text-slate-200 leading-none block mt-1 whitespace-nowrap flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        {language === 'vi' ? 'Ký Xưởng Gốc' : 'Direct Factory'}
                      </span>
                    </div>
                  </button>

                </div>

              </div>
            </header>

            {/* Main Grid Layout */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="app-dashboard-grid">
              
              {/* Left Side: Enterprise Architecture Status Map */}
              <section className="lg:col-span-4 flex flex-col gap-6 h-full">
                <AgentArchitecture
                  logs={activityLogs}
                  intercoms={agentIntercoms}
                  language={language}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              </section>

              {/* Center Section: Sourcing Stream & Device Captures */}
              <section className="lg:col-span-4 flex flex-col gap-6 h-full">
                <StreamingFeeds
                  buyersList={buyersList}
                  sellersList={sellersList}
                  pipelineSignals={pipelineSignals}
                  researchPipelineStats={researchPipelineStats}
                  onAddLead={handleAddLead}
                  onIngestSignal={handleIngestSignal}
                  onMatchOnlineProducts={handleMatchOnlineProducts}
                  onDrawResearchData={handleDrawResearchData}
                  isMatchingOnline={isMatchingOnline}
                  isDrawingResearch={isDrawingResearch}
                  isAddingLead={isAddingLead}
                  language={language}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
                
                <BubbleCaptures
                  selectedBubble={selectedBubble}
                  commissionRate={commissionRate}
                  onUnlockBubble={handleUnlockBubble}
                  onCompleteBubble={handleCompleteBubble}
                  language={language}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              </section>

              {/* Right Section: Deal Workspace & Outreach Thread */}
              <section className="lg:col-span-4 flex flex-col gap-6 h-full">
                <Workspace
                  bubbles={matchingBubbles}
                  dismissedBubbles={dismissedBubbles}
                  selectedBubble={selectedBubble}
                  onSelectBubble={setSelectedBubble}
                  communicationStatuses={communicationStatuses}
                  commissionRate={commissionRate}
                  onUpdateCommission={handleUpdateCommission}
                  onUnlockBubble={handleUnlockBubble}
                  onCompleteBubble={handleCompleteBubble}
                  onDismissBubble={handleDismissBubble}
                  onDeleteDeal={handleDeleteDeal}
                  onBulkUnlock={handleBulkUnlock}
                  onBulkDismiss={handleBulkDismiss}
                  onBulkDelete={handleBulkDelete}
                  onBulkRematch={handleBulkRematch}
                  onMatchOnlineProducts={handleMatchOnlineProducts}
                  isMatchingOnline={isMatchingOnline}
                  onRematchBubble={handleRematchBubble}
                  onInterveneBubble={handleInterveneBubble}
                  onImproveOutreach={handleImproveOutreach}
                  onSendMessage={handleSendMessage}
                  isImprovingOutreach={isImprovingOutreach}
                  language={language}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              </section>

              {/* Full Width: Manufacturer Agency Contracts & High-Velocity Products */}
              <section className="lg:col-span-12 mt-2" id="agency-contracts-section">
                <AgencyContractsManager
                  language={language}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  onContractSigned={handleContractSigned}
                />
              </section>

              {/* Full Width: Commission Debt Tracker & Customer Payment Proof Bar */}
              <section className="lg:col-span-12 mt-4" id="debt-commission-tracker-section">
                <DebtCommissionTracker
                  matchingBubbles={matchingBubbles}
                  onDealUpdated={() => {
                    fetchState();
                  }}
                  onRefresh={fetchState}
                  onDeleteDeal={handleDeleteDeal}
                  language={language}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              </section>

              {/* Full Width: Self-Improved Match and Payout Ledger */}
              <section className="lg:col-span-12 mt-4">
                <SelfImprovedLedger 
                  language={language}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  refreshTrigger={successfulDealsCount}
                />
              </section>

              {/* Full Width: Agent Audit Log Area */}
              <section className="lg:col-span-12 mt-4">
                <AgentAuditLog 
                  logs={activityLogs} 
                  language={language} 
                  onCleanLogs={setActivityLogs} 
                />
              </section>

            </main>

      {/* Footer Banner */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-[11px] text-slate-500" id="app-footer-banner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Continuous Evaluation-and-Improvement loop updates automatically after every deal conversion.</span>
          <span className="font-mono text-slate-400 font-bold">
            Vietnam Gateway Recipient: NGUYỄN TẤN SĨ (NGUYEN TAN SI) • Sacombank Acc: 060129073198
          </span>
        </div>
      </footer>

      {/* Floating Modern Toast Alerts */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        onSelectDeal={handleSelectDealFromToast}
        commissionThreshold={commissionThreshold}
        onUpdateThreshold={setCommissionThreshold}
      />

      {/* Payment Proof Verification & Upload Modal */}
      <PaymentProofModal
        deal={dealForProofModal}
        isOpen={Boolean(dealForProofModal)}
        onClose={() => setDealForProofModal(null)}
        onSuccess={async () => {
          setDealForProofModal(null);
          await fetchState();
        }}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />

    </div>
  );
}
