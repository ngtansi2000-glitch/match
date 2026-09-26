/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Landmark, AlertTriangle, CheckCircle2, Search, Filter, 
  Upload, Eye, Clock, ShieldAlert, ArrowUpRight, DollarSign,
  FileCheck, Sparkles, RefreshCw, ChevronRight, HelpCircle,
  Bell, BellRing, Send, Bot, ToggleLeft, ToggleRight, Radio,
  ChevronDown, ChevronUp, X, Check, Download, Trash2,
  FolderArchive, HeartHandshake, ShieldCheck
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble, AutoReminderSettings, DealExecutionConfirmation } from '../types';
import { PaymentProofModal } from './PaymentProofModal';
import { PaymentProofViewerModal } from './PaymentProofViewerModal';
import { DebtReminderModal } from './DebtReminderModal';
import { PaymentProofFileUpload } from './PaymentProofFileUpload';
import { BulkDebtReminderModal } from './BulkDebtReminderModal';
import { DealExecutionFolderModal } from './DealExecutionFolderModal';
import { FriendlyCounterpartInquiryModal } from './FriendlyCounterpartInquiryModal';
import { BulkCounterpartInquiryModal } from './BulkCounterpartInquiryModal';
import { safeFetchJson } from '../lib/api';

interface DebtCommissionTrackerProps {
  matchingBubbles: MatchingBubble[];
  onDealUpdated?: (updatedBubble: MatchingBubble) => void;
  onRefresh?: () => void;
  onDeleteDeal?: (pairId: string) => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const DebtCommissionTracker: React.FC<DebtCommissionTrackerProps> = ({
  matchingBubbles,
  onDealUpdated,
  onRefresh,
  onDeleteDeal,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  const isVi = language === 'vi';

  const [activeFilter, setActiveFilter] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDealForUpload, setSelectedDealForUpload] = useState<MatchingBubble | null>(null);
  const [selectedDealForView, setSelectedDealForView] = useState<MatchingBubble | null>(null);
  const [selectedDealForReminder, setSelectedDealForReminder] = useState<MatchingBubble | null>(null);

  // New Deal Verification & Bulk Reminders modals state
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState<boolean>(false);
  const [isBulkInquiryOpen, setIsBulkInquiryOpen] = useState<boolean>(false);
  const [isFolderOpen, setIsFolderOpen] = useState<boolean>(false);
  const [selectedDealForInquiry, setSelectedDealForInquiry] = useState<MatchingBubble | null>(null);

  // Quick Upload Proof Panel State
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState<boolean>(false);
  const [quickUploadDealId, setQuickUploadDealId] = useState<string>('');
  const [quickUploadImageUrl, setQuickUploadImageUrl] = useState<string>('');
  const [quickUploadTransactionRef, setQuickUploadTransactionRef] = useState<string>('');
  const [quickUploadCustomerNote, setQuickUploadCustomerNote] = useState<string>('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState<boolean>(false);
  const [quickUploadError, setQuickUploadError] = useState<string | null>(null);
  const [quickUploadSuccess, setQuickUploadSuccess] = useState<string | null>(null);

  // Automated 48-Hour Reminder Bot state
  const [autoReminderEnabled, setAutoReminderEnabled] = useState<boolean>(true);
  const [thresholdHours, setThresholdHours] = useState<number>(48);
  const [isTogglingBot, setIsTogglingBot] = useState<boolean>(false);

  // Fetch reminder settings
  useEffect(() => {
    let isMounted = true;
    safeFetchJson<AutoReminderSettings>('/api/debt/reminder/settings')
      .then((settings) => {
        if (isMounted && settings) {
          if (typeof settings.enabled === 'boolean') setAutoReminderEnabled(settings.enabled);
          if (typeof settings.thresholdHours === 'number') setThresholdHours(settings.thresholdHours);
        }
      })
      .catch((err) => console.error('Failed to load auto reminder settings', err));
    return () => { isMounted = false; };
  }, []);

  const handleToggleAutoReminder = async () => {
    setIsTogglingBot(true);
    try {
      const res = await safeFetchJson<{ success: boolean; settings: AutoReminderSettings }>('/api/debt/reminder/toggle-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !autoReminderEnabled })
      });
      if (res.success && res.settings) {
        setAutoReminderEnabled(res.settings.enabled);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle auto reminder bot', err);
    } finally {
      setIsTogglingBot(false);
    }
  };

  // Helper to compute hours elapsed since completion
  const getElapsedHours = (deal: MatchingBubble): number => {
    const ts = deal.dealCompletedAt || deal.paymentProofTimestamp;
    if (!ts) return 48;
    const diff = (Date.now() - new Date(ts).getTime()) / (3600 * 1000);
    return Math.max(0, Math.round(diff));
  };

  // Calculate Debt & Commission Statistics
  const stats = useMemo(() => {
    let totalCommissionAll = 0;
    let totalDebtUnpaidVND = 0;
    let totalVerifiedPaidVND = 0;
    let unpaidCount = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let pendingCountdownCount = 0;
    let totalRemindersSent = 0;
    let totalBusinessVolumeVND = 0;

    matchingBubbles.forEach((bubble) => {
      const commission = bubble.commissionFee || 0;
      totalCommissionAll += commission;

      const quantity = bubble.extractedBuyerRequirements?.quantityNeeded || 1000;
      totalBusinessVolumeVND += quantity * (bubble.price || 0);

      const hasValidProof = Boolean(bubble.paymentProofUrl && bubble.paymentStatus === 'paid');
      const hours = getElapsedHours(bubble);

      totalRemindersSent += bubble.reminderCount || 0;

      if (hasValidProof) {
        totalVerifiedPaidVND += commission;
        paidCount++;
      } else {
        totalDebtUnpaidVND += commission;
        unpaidCount++;

        if (hours >= thresholdHours) {
          overdueCount++;
        } else {
          pendingCountdownCount++;
        }
      }
    });

    const collectionRate = totalCommissionAll > 0 
      ? Math.round((totalVerifiedPaidVND / totalCommissionAll) * 100) 
      : 0;

    const verifiedDealsCount = matchingBubbles.filter(b => b.dealExecutionVerified).length;
    const unverifiedDealsCount = matchingBubbles.filter(b => !b.dealExecutionVerified).length;
    const verifiedOverdueDebtorsCount = matchingBubbles.filter(
      b => (b.paymentStatus !== 'paid' || !b.paymentProofUrl) && b.dealExecutionVerified
    ).length;

    return {
      totalCommissionAll,
      totalDebtUnpaidVND,
      totalVerifiedPaidVND,
      unpaidCount,
      paidCount,
      overdueCount,
      pendingCountdownCount,
      totalRemindersSent,
      totalDeals: matchingBubbles.length,
      collectionRate,
      totalBusinessVolumeVND,
      verifiedDealsCount,
      unverifiedDealsCount,
      verifiedOverdueDebtorsCount
    };
  }, [matchingBubbles, thresholdHours]);

  // Filter deals based on tab and search
  const filteredDeals = useMemo(() => {
    return matchingBubbles.filter((bubble) => {
      const hasValidProof = Boolean(bubble.paymentProofUrl && bubble.paymentStatus === 'paid');
      const hours = getElapsedHours(bubble);
      const isOverdue = !hasValidProof && hours >= thresholdHours;

      if (activeFilter === 'unpaid' && hasValidProof) return false;
      if (activeFilter === 'overdue' && !isOverdue) return false;
      if (activeFilter === 'paid' && !hasValidProof) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = 
          bubble.buyerName.toLowerCase().includes(query) ||
          bubble.sellerName.toLowerCase().includes(query) ||
          bubble.productName.toLowerCase().includes(query) ||
          bubble.id.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      return true;
    });
  }, [matchingBubbles, activeFilter, searchQuery, thresholdHours]);

  // Unpaid deals list for quick proof upload selector
  const unpaidDeals = useMemo(() => {
    return matchingBubbles.filter(b => b.paymentStatus !== 'paid' || !b.paymentProofUrl);
  }, [matchingBubbles]);

  // Selected deal in the quick proof upload panel
  const selectedQuickDeal = useMemo(() => {
    if (quickUploadDealId) {
      const found = matchingBubbles.find(b => b.id === quickUploadDealId);
      if (found) return found;
    }
    return unpaidDeals[0] || null;
  }, [matchingBubbles, quickUploadDealId, unpaidDeals]);

  // Direct Submission from the Quick Upload Panel
  const handleDirectQuickSubmit = async () => {
    if (!selectedQuickDeal) {
      setQuickUploadError(isVi ? 'Vui lòng chọn thương vụ cần đóng' : 'Please select a deal to settle');
      return;
    }
    if (!quickUploadImageUrl) {
      setQuickUploadError(
        isVi 
          ? 'Bắt buộc: Khách hàng phải gởi hình ảnh biên lai đã chuyển tiền Hoa Hồng để đóng thương vụ. Nếu chưa có hình ảnh, xem như chưa nhận được thanh toán!'
          : 'Mandatory: Customer transfer proof image is required to close the deal.'
      );
      return;
    }

    setIsSubmittingQuick(true);
    setQuickUploadError(null);

    try {
      const response = await safeFetchJson<{
        success: boolean;
        bubble: MatchingBubble;
        error?: string;
      }>('/api/deal/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairId: selectedQuickDeal.id,
          paymentProofUrl: quickUploadImageUrl,
          paymentTransactionRef: quickUploadTransactionRef || `SCB${Math.floor(100000000 + Math.random() * 900000000)}`,
          paymentCustomerNote: quickUploadCustomerNote || `${selectedQuickDeal.buyerName} đã chuyển khoản hoa hồng deal ${selectedQuickDeal.id}`
        })
      });

      if (response && response.success && response.bubble) {
        setQuickUploadSuccess(
          isVi 
            ? `Thành công! Đã xác minh hình ảnh biên lai và quyết toán thương vụ #${selectedQuickDeal.id} (${selectedQuickDeal.buyerName}).` 
            : `Success! Remittance proof verified and deal #${selectedQuickDeal.id} settled.`
        );
        setQuickUploadImageUrl('');
        setQuickUploadTransactionRef('');
        setQuickUploadCustomerNote('');
        if (onDealUpdated) onDealUpdated(response.bubble);
        if (onRefresh) onRefresh();
        setTimeout(() => setQuickUploadSuccess(null), 4000);
      } else {
        setQuickUploadError(response?.error || (isVi ? 'Không thể cập nhật thương vụ' : 'Failed to finalize deal'));
      }
    } catch (err: any) {
      setQuickUploadError(err.message || (isVi ? 'Lỗi kết nối máy chủ' : 'Server connection error'));
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const handleUploadSuccess = (updatedBubble: MatchingBubble) => {
    if (onDealUpdated) {
      onDealUpdated(updatedBubble);
    }
  };

  const handleReminderSuccess = (updatedBubble: MatchingBubble) => {
    if (onDealUpdated) {
      onDealUpdated(updatedBubble);
    }
  };

  const handleExportSuccessfulDealsCsv = () => {
    // Collect successful and verified deals (or all deals with paid status/proof)
    const successfulDeals = matchingBubbles.filter(
      b => b.status === 'completed' || b.paymentStatus === 'paid' || !!b.paymentProofUrl
    );

    const dealsToExport = successfulDeals.length > 0 ? successfulDeals : matchingBubbles;

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Deal ID',
      'Status',
      'Payment Status',
      'Buyer Name',
      'Seller / Supplier Name',
      'Product Name',
      'Unit Price (VND)',
      'Estimated Quantity (Units)',
      'Total Deal Volume (VND)',
      'Commission Rate (%)',
      'Commission Fee (VND)',
      'Beneficiary Bank',
      'Beneficiary Account Number',
      'Beneficiary Account Name',
      'Payment Transaction Ref / FT Code',
      'Payment Customer Note',
      'Payment Proof Timestamp',
      'Payment Proof Image URL'
    ];

    const rows = dealsToExport.map(deal => {
      const quantity = deal.extractedBuyerRequirements?.quantityNeeded || 1500;
      const totalVolume = quantity * deal.price;
      const proofUrl = deal.paymentProofUrl || '';

      return [
        escapeCsv(deal.id),
        escapeCsv(deal.status),
        escapeCsv(deal.paymentStatus || 'unpaid'),
        escapeCsv(deal.buyerName),
        escapeCsv(deal.sellerName),
        escapeCsv(deal.productName),
        escapeCsv(deal.price),
        escapeCsv(quantity),
        escapeCsv(totalVolume),
        escapeCsv(deal.commissionPercent || 1.5),
        escapeCsv(deal.commissionFee),
        escapeCsv('Sacombank Vietnam'),
        escapeCsv('060129073198'),
        escapeCsv('NGUYỄN TẤN SĨ (NGUYEN TAN SI)'),
        escapeCsv(deal.paymentTransactionRef || ''),
        escapeCsv(deal.paymentCustomerNote || ''),
        escapeCsv(deal.paymentProofTimestamp || deal.dealCompletedAt || ''),
        escapeCsv(proofUrl)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    // Prepend UTF-8 BOM to prevent character encoding issues in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `successful_deals_commission_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mt-6">
      {/* Header Bar */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border-b border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/30">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {isVi 
                    ? 'Thanh Theo Dõi Công Nợ & Bằng Chứng Chuyển Tiền Hoa Hồng' 
                    : 'Commission Debt Tracker & Customer Payment Proofs'}
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>{isVi ? 'Nhắc Nợ Tự Động 48H' : '48H Auto-Reminder'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {isVi 
                  ? 'Quy tắc đối soát: Khi thương vụ kết thúc, yêu cầu khách hàng gởi hình ảnh đã chuyển tiền Hoa Hồng để đóng thương vụ. Nếu quá 48 giờ chưa có hình ảnh biên lai, hệ thống tự động gửi thông báo theo dõi (Follow-up) nhắc nhở khách chuyển khoản.' 
                  : 'Settlement rule: Buyers must upload payment proof of commission. If no receipt is uploaded within 48 hours, the system automatically sends automated follow-up reminders to the buyer.'}
              </p>
            </div>
          </div>

          {/* Quick Refresh & Bank Tag */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">{isVi ? 'Tài khoản nhận:' : 'Beneficiary:'}</span>
              <span className="font-bold text-white font-mono">Sacombank 060129073198 (NGUYỄN TẤN SĨ)</span>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                title={isVi ? 'Làm mới danh sách' : 'Refresh list'}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Unpaid Debt Card */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 relative overflow-hidden group hover:border-rose-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300">
                {isVi ? 'Công Nợ Chờ Khách Chuyển' : 'Outstanding Commission Debt'}
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 mt-2 tracking-tight">
              {formatCurrency(stats.totalDebtUnpaidVND, currency, exchangeRate)}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-1 flex items-center justify-between">
              <span>{stats.unpaidCount} {isVi ? 'deal chưa có bill' : 'deals without proof'}</span>
              <span className="font-semibold text-rose-400">{isVi ? 'Chưa nhận thanh toán' : 'Unsettled'}</span>
            </div>
          </div>

          {/* Paid / Verified Card */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">
                {isVi ? 'Hoa Hồng Đã Có Chứng Từ' : 'Verified Cleared Commission'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-2 tracking-tight">
              {formatCurrency(stats.totalVerifiedPaidVND, currency, exchangeRate)}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1 flex items-center justify-between">
              <span>{stats.paidCount} {isVi ? 'deal đã có ảnh bill' : 'deals with receipt proof'}</span>
              <span className="font-semibold text-emerald-400">{isVi ? 'Đã đối soát 100%' : '100% Cleared'}</span>
            </div>
          </div>

          {/* 48-Hour SLA Status Card */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">
                {isVi ? 'Cảnh Báo SLA Quá Hạn 48H' : '48H SLA Overdue Alerts'}
              </span>
              <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-2 tracking-tight">
              {stats.overdueCount} {isVi ? 'Deal Quá Hạn' : 'Overdue Deals'}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1 flex items-center justify-between">
              <span>{stats.pendingCountdownCount} {isVi ? 'deal đang đếm ngược' : 'in countdown'}</span>
              <span className="font-semibold text-amber-400">{stats.totalRemindersSent} {isVi ? 'lần đã nhắc' : 'reminders'}</span>
            </div>
          </div>

          {/* Collection Progress Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {isVi ? 'Tỷ Lệ Thu Hồi Công Nợ' : 'Debt Clearance Velocity'}
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-2 tracking-tight">
              {stats.collectionRate}%
            </div>
            <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 48-HOUR AUTOMATED REMINDER ENGINE CONTROL & SLA BANNER */}
        <div className="mt-4 p-3.5 bg-slate-950/80 border border-indigo-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              autoReminderEnabled 
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-xs">
                  {isVi ? 'Bot Tự Động Nhắc Nợ 48 Giờ' : '48-Hour Automated Reminder Engine'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  autoReminderEnabled 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {autoReminderEnabled 
                    ? (isVi ? 'Đang Hoạt Động (Active)' : 'Active') 
                    : (isVi ? 'Tạm Dừng (Paused)' : 'Paused')}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {isVi 
                  ? 'Quét liên tục các deal kết thúc quá 48h chưa gửi bill CK Sacombank để phát lệnh thông báo qua Email, Zalo & SMS.' 
                  : 'Continuously dispatches follow-up notifications to buyers if payment proof is missing after 48h.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={handleToggleAutoReminder}
              disabled={isTogglingBot}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                autoReminderEnabled
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200 hover:bg-indigo-600/40'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              id="toggle-auto-reminder-bot-btn"
            >
              {autoReminderEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                  <span>{isVi ? 'Bật Tự Động (48h SLA)' : 'Auto Bot Enabled'}</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>{isVi ? 'Đã Tắt (Bật Lại)' : 'Turn On Bot'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/70 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{isVi ? 'Tất Cả Deal Đã Match' : 'All Matched'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300 font-mono">
              {stats.totalDeals}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('unpaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'unpaid'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isVi ? 'Chưa Có Ảnh - Công Nợ' : 'Missing Proof (Debt)'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 font-mono border border-rose-500/30">
              {stats.unpaidCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'overdue'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/20'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isVi ? 'Quá Hạn 48h (Cần/Đã Nhắc)' : 'Overdue >48h'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 font-mono border border-amber-500/30">
              {stats.overdueCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isVi ? 'Đã Có Ảnh Chuyển Tiền' : 'Verified Paid'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-500/30">
              {stats.paidCount}
            </span>
          </button>
        </div>

        {/* Action and Search Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Folder of Deal Execution Proofs Button */}
          <button
            onClick={() => setIsFolderOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
            title={isVi ? 'Mở Thư mục lưu các tin nhắn xác thực thương vụ từ buyer/seller' : 'Open folder of deal execution confirmation proofs'}
            id="open-confirmations-folder-btn"
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>{isVi ? 'Thư Mục Lưu Tin Xác Thực' : 'Execution Proofs Folder'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              {stats.verifiedDealsCount}/{stats.totalDeals}
            </span>
          </button>

          {/* Bulk Send Official Debt Reminders (Verified Only) */}
          <button
            onClick={() => setIsBulkReminderOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-amber-950/40 active:scale-95"
            title={isVi ? 'Dùng mẫu nhắc nợ ghi Mã Deal trên đầu gửi cho tất cả khách chậm thanh toán (Chỉ gửi khi đã xác minh)' : 'Send official template to all verified overdue debtors'}
            id="bulk-send-verified-reminders-btn"
          >
            <BellRing className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
            <span>{isVi ? 'Gởi Nhắc Nợ Hàng Loạt' : 'Bulk Send Reminders'}</span>
            {stats.verifiedOverdueDebtorsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 font-mono font-extrabold">
                {stats.verifiedOverdueDebtorsCount}
              </span>
            )}
          </button>

          {/* Bulk Send Friendly Inquiry To All Unverified Counterparts */}
          <button
            onClick={() => setIsBulkInquiryOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-teal-950/40 active:scale-95"
            title={isVi ? 'Dùng thư mẫu của Si Nguyen gửi tới toàn bộ khách chưa xác thực (Xác thực chỉ lưu khi có phản hồi)' : 'Send official inquiry template to all unverified clients'}
            id="bulk-send-unverified-inquiry-btn"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-slate-950" />
            <span>{isVi ? 'Gởi Thư Xác Thực Toàn Bộ' : 'Bulk Inquire All'}</span>
            {stats.unverifiedDealsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-teal-300 font-mono font-extrabold">
                {stats.unverifiedDealsCount}
              </span>
            )}
          </button>

          {/* Quick Upload Dropzone Toggle Button */}
          <button
            onClick={() => {
              setIsQuickUploadOpen(!isQuickUploadOpen);
              setQuickUploadError(null);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
              isQuickUploadOpen 
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-amber-950/40' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isVi ? 'Mở khu vực tải lên bằng chứng thanh toán nhanh' : 'Open quick file upload dropzone'}
            id="toggle-quick-upload-panel-btn"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>{isVi ? 'Tải Lên Bằng Chứng' : 'Upload Proof'}</span>
            {stats.unpaidCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 font-mono border border-rose-500/40 font-extrabold">
                {stats.unpaidCount}
              </span>
            )}
            {isQuickUploadOpen ? <ChevronUp className="w-3 h-3 text-amber-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>

          {/* Export Successful Deals Summary CSV Report */}
          <button
            onClick={handleExportSuccessfulDealsCsv}
            className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
            title={isVi ? 'Xuất báo cáo CSV các thương vụ thành công kèm URL hình ảnh chứng từ thanh toán' : 'Export summary CSV report of all successful deals including payment proof image URLs'}
            id="export-successful-deals-csv-btn"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isVi ? 'Xuất Báo Cáo CSV' : 'Export CSV Report'}</span>
          </button>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isVi ? 'Tìm khách, sản phẩm, deal...' : 'Search deals, buyers...'}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              id="debt-tracker-search-input"
            />
          </div>
        </div>
      </div>

      {/* EXPANDABLE QUICK PROOF UPLOAD PANEL COMPONENT */}
      {isQuickUploadOpen && (
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-200" id="quick-proof-upload-panel">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Header of Quick Upload */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
                    <span>{isVi ? 'Tải Lên Bằng Chứng Chuyển Tiền Hoa Hồng Trực Tiếp' : 'Direct Commission Payment Proof Upload'}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold font-mono">
                      Sacombank 060129073198 (NGUYỄN TẤN SĨ)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isVi 
                      ? 'Kéo & thả biên lai ngân hàng, chọn tệp từ máy, chụp từ camera hoặc nhấn Ctrl+V để dán ảnh chụp màn hình chuyển khoản.' 
                      : 'Drag & drop bank transfer receipt, select local file, take camera photo or press Ctrl+V to paste screenshot.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickUploadOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                id="close-quick-upload-panel-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success or Error feedback */}
            {quickUploadSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{quickUploadSuccess}</span>
              </div>
            )}
            {quickUploadError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-semibold animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{quickUploadError}</span>
              </div>
            )}

            {/* Deal Selector Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  {isVi ? '1. Chọn Thương Vụ Cần Đóng / Xác Thực:' : '1. Select Deal to Settle / Verify:'}
                </label>
                {unpaidDeals.length > 0 ? (
                  <select
                    value={selectedQuickDeal?.id || ''}
                    onChange={(e) => {
                      setQuickUploadDealId(e.target.value);
                      setQuickUploadError(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
                    id="quick-upload-deal-select"
                  >
                    {unpaidDeals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        #{deal.id} • {deal.buyerName} — {formatCurrency(deal.commissionFee, currency, exchangeRate)} ({deal.productName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-emerald-400 font-semibold p-2 bg-emerald-950/30 rounded border border-emerald-500/30">
                    {isVi ? 'Tất cả các thương vụ hiện đã được xác minh bằng chứng thanh toán!' : 'All deals currently have verified payment proof!'}
                  </div>
                )}
              </div>

              {/* Commission Fee display for selected deal */}
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 block">{isVi ? 'Phí hoa hồng phải thu (1.5%):' : 'Commission due:'}</span>
                <span className="text-sm font-extrabold text-amber-400 font-mono">
                  {selectedQuickDeal ? formatCurrency(selectedQuickDeal.commissionFee, currency, exchangeRate) : '0 ₫'}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {isVi ? 'Thụ hưởng: NGUYEN TAN SI' : 'Beneficiary: NGUYEN TAN SI'}
                </span>
              </div>
            </div>

            {/* THE FILE UPLOAD COMPONENT INSTANCE */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">
                {isVi ? '2. Hình Ảnh Chứng Từ Khách Gởi (Kéo Thả / Duyệt Tệp / Ctrl+V):' : '2. Remittance Receipt Image (Drag & Drop / Browse / Ctrl+V):'}
              </label>

              <PaymentProofFileUpload
                deal={selectedQuickDeal}
                value={quickUploadImageUrl}
                onChange={(imgUrl, meta) => {
                  setQuickUploadImageUrl(imgUrl);
                  setQuickUploadError(null);
                  if (meta?.name && !quickUploadCustomerNote && selectedQuickDeal) {
                    setQuickUploadCustomerNote(`${selectedQuickDeal.buyerName} đã chuyển phí hoa hồng (${meta.name})`);
                  }
                }}
                onClear={() => setQuickUploadImageUrl('')}
                allowSampleGeneration={true}
                language={language}
                currency={currency}
                exchangeRate={exchangeRate}
              />
            </div>

            {/* Additional Fields: FT Code and Confirmation Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  {isVi ? 'Mã Tham Chiếu / FT Code Giao Dịch:' : 'Transaction FT / Ref Code:'}
                </label>
                <input
                  type="text"
                  value={quickUploadTransactionRef}
                  onChange={(e) => setQuickUploadTransactionRef(e.target.value)}
                  placeholder="VD: SCB98234129841"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  id="quick-upload-ft-input"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  {isVi ? 'Ghi Chú Đóng Thương Vụ:' : 'Customer Remittance Note:'}
                </label>
                <input
                  type="text"
                  value={quickUploadCustomerNote}
                  onChange={(e) => setQuickUploadCustomerNote(e.target.value)}
                  placeholder={isVi ? 'Khách đã thanh toán đủ tiền vào Sacombank' : 'Customer confirmed 1.5% transfer'}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
                  id="quick-upload-note-input"
                />
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-amber-400 font-medium">
                {isVi 
                  ? '⚠️ Bắt buộc phải có hình ảnh chuyển tiền để chuyển từ Công Nợ sang Đã Quyết Toán.' 
                  : '⚠️ Proof image is required to convert Debt into Cleared/Paid status.'}
              </span>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setQuickUploadImageUrl('');
                    setQuickUploadTransactionRef('');
                    setQuickUploadCustomerNote('');
                    setQuickUploadError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  id="quick-upload-reset-btn"
                >
                  {isVi ? 'Làm Mới' : 'Reset'}
                </button>

                <button
                  type="button"
                  onClick={handleDirectQuickSubmit}
                  disabled={isSubmittingQuick || !selectedQuickDeal || !quickUploadImageUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  id="quick-upload-submit-btn"
                >
                  {isSubmittingQuick ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isVi ? 'Đang Xác Thực...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>{isVi ? 'Xác Nhận & Đóng Thương Vụ Ngay' : 'Verify & Close Deal'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Bar Table / List of Matched Deals */}
      <div className="divide-y divide-slate-800">
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold text-slate-400">
              {isVi ? 'Không tìm thấy thương vụ nào phù hợp với bộ lọc' : 'No deals match the selected criteria'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isVi ? 'Thử chọn bộ lọc khác hoặc tìm kiếm với từ khóa khác' : 'Try switching filter tabs or clearing search query'}
            </p>
          </div>
        ) : (
          filteredDeals.map((deal) => {
            const hasProof = Boolean(deal.paymentProofUrl && deal.paymentStatus === 'paid');
            const quantity = deal.extractedBuyerRequirements?.quantityNeeded || 1000;
            const businessVolume = quantity * (deal.price || 0);

            const hoursElapsed = getElapsedHours(deal);
            const isOverdue48h = !hasProof && hoursElapsed >= thresholdHours;
            const hoursRemaining = Math.max(0, thresholdHours - hoursElapsed);
            const progressPercent = Math.min(100, Math.round((hoursElapsed / thresholdHours) * 100));

            return (
              <div 
                key={deal.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  hasProof 
                    ? 'hover:bg-slate-800/30' 
                    : isOverdue48h
                      ? 'bg-amber-950/15 hover:bg-amber-950/25 border-l-4 border-l-amber-500'
                      : 'bg-rose-950/10 hover:bg-rose-950/20 border-l-4 border-l-rose-500'
                }`}
                id={`debt-deal-row-${deal.id}`}
              >
                {/* Left: Product, Partners & Status Badges */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      #{deal.id}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                      {deal.productName}
                    </h3>
                    
                    {/* Primary Proof Status Badge */}
                    {hasProof ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{isVi ? 'ĐÃ QUYẾT TOÁN (CÓ ẢNH BILL)' : 'CLEARED (VERIFIED PROOF)'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{isVi ? 'CHƯA NHẬN THANH TOÁN (CÔNG NỢ)' : 'UNPAID COMMISSION DEBT'}</span>
                      </span>
                    )}

                    {/* Deal Execution Verification Badge */}
                    {deal.dealExecutionVerified ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold border border-teal-500/40 flex items-center gap-1" title={isVi ? 'Đã có tin nhắn xác thực thương vụ trong Thư mục' : 'Deal execution verified'}>
                        <ShieldCheck className="w-3 h-3 text-teal-400" />
                        <span>{isVi ? `ĐÃ XÁC MINH DEAL (${deal.confirmationsFolder?.length || 1} TIN)` : 'DEAL VERIFIED'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1" title={isVi ? 'Chưa có tin xác thực từ buyer hoặc seller' : 'No confirmation message in folder'}>
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>{isVi ? 'CHƯA XÁC MINH DEAL' : 'UNVERIFIED DEAL'}</span>
                      </span>
                    )}

                    {/* 48-Hour SLA Status Badge */}
                    {!hasProof && (
                      isOverdue48h ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <BellRing className="w-3 h-3 text-amber-400" />
                          <span>{isVi ? `QUÁ HẠN 48H (${hoursElapsed}h)` : `OVERDUE >48H (${hoursElapsed}h)`}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>{isVi ? `Đang đếm ngược 48h (Còn ${hoursRemaining}h)` : `SLA Countdown (${hoursRemaining}h left)`}</span>
                        </span>
                      )
                    )}

                    {/* Reminder Count Badge if reminders have been sent */}
                    {(deal.reminderCount || 0) > 0 && !hasProof && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                        <Send className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{isVi ? `Đã nhắc nợ: ${deal.reminderCount} lần` : `Reminded: ${deal.reminderCount}x`}</span>
                      </span>
                    )}
                  </div>

                  {/* Buyer & Seller Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500">{isVi ? 'Khách Mua: ' : 'Buyer: '}</span>
                      <span className="text-slate-200 font-medium">{deal.buyerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{isVi ? 'Xưởng SX: ' : 'Manufacturer: '}</span>
                      <span className="text-slate-200 font-medium">{deal.sellerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{isVi ? 'Quy mô: ' : 'Volume: '}</span>
                      <span className="text-slate-300 font-mono">
                        {quantity.toLocaleString()} {isVi ? 'sp' : 'units'} • {formatCurrency(businessVolume, currency, exchangeRate)}
                      </span>
                    </div>
                  </div>

                  {/* 48h SLA Status Explanatory Bar */}
                  {!hasProof && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-medium">
                          {isVi ? 'Tiến trình 48h:' : '48h SLA Progress:'}
                        </span>
                        <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/60">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOverdue48h ? 'bg-amber-400' : 'bg-blue-400'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-300">
                          {hoursElapsed}h / {thresholdHours}h
                        </span>
                      </div>

                      {deal.lastReminderSentAt && (
                        <span className="text-[10px] text-slate-400 italic">
                          • {isVi ? 'Nhắc nợ gần nhất:' : 'Last notified:'} {new Date(deal.lastReminderSentAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Unpaid Warning Subtext */}
                  {!hasProof && (
                    <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                      <span>⚠️ {isVi ? 'Chưa có hình ảnh chuyển tiền của khách gởi — Xem như chưa nhận được thanh toán!' : 'No remittance image sent by customer — Payment considered not yet received!'}</span>
                    </p>
                  )}
                </div>

                {/* Center: Commission Amount Display */}
                <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl flex items-center justify-between sm:justify-start gap-4 shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                      {isVi ? 'Số Tiền Hoa Hồng' : 'Commission Fee'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-amber-400 tracking-tight">
                      {formatCurrency(deal.commissionFee, currency, exchangeRate)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {deal.commissionPercent}% {isVi ? 'phí môi giới thành công' : 'success fee'}
                    </span>
                  </div>

                  <div className="text-right border-l border-slate-700/80 pl-3">
                    <span className="text-[10px] text-slate-400 block">
                      {isVi ? 'Thụ Hưởng' : 'Target Account'}
                    </span>
                    <span className="text-xs font-bold text-white block">
                      NGUYỄN TẤN SĨ
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Sacombank 060129073198</span>
                  </div>
                </div>

                {/* Right: Actions & Proof Management */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                  {/* Friendly Counterpart Inquiry Button if unverified */}
                  {!hasProof && !deal.dealExecutionVerified && (
                    <button
                      onClick={() => setSelectedDealForInquiry(deal)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                        deal.counterpartInquiryStatus === 'sent'
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40'
                      }`}
                      title={isVi 
                        ? (deal.counterpartInquiryStatus === 'sent' 
                            ? 'Đã gửi thư theo mẫu Si Nguyen • Đang chờ khách phản hồi để lưu xác thực' 
                            : 'Gởi thư hỏi thăm thân thiện mẫu Si Nguyen để xin xác thực deal') 
                        : 'Inquire with counterpart to verify deal'}
                      id={`inquire-btn-${deal.id}`}
                    >
                      {deal.counterpartInquiryStatus === 'sent' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-spin" />
                          <span>{isVi ? 'Chờ Khách Phản Hồi' : 'Awaiting Reply'}</span>
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                          <span>{isVi ? 'Gởi Thư Xác Thực' : 'Inquire Counterpart'}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Automated / Manual Follow-up Reminder Button for Unpaid Deals */}
                  {!hasProof && (
                    <button
                      onClick={() => setSelectedDealForReminder(deal)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                        !deal.dealExecutionVerified
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          : isOverdue48h
                            ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black shadow-amber-950/40 animate-pulse'
                            : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40'
                      }`}
                      title={isVi ? 'Gửi thông báo nhắc nhở khách chuyển tiền hoa hồng' : 'Send payment follow-up notification'}
                      id={`remind-btn-${deal.id}`}
                    >
                      <Bell className="w-3.5 h-3.5 shrink-0" />
                      <span>{isVi ? 'Gửi Mẫu Nhắc Nợ' : 'Send Reminder'}</span>
                    </button>
                  )}

                  {/* Thumbnail / Image Preview */}
                  {hasProof ? (
                    <div className="flex items-center gap-2.5">
                      <div 
                        onClick={() => setSelectedDealForView(deal)}
                        className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-950 cursor-pointer group shadow-md shrink-0"
                        title={isVi ? 'Nhấn để xem phóng to biên lai khách gởi' : 'Click to inspect customer receipt'}
                      >
                        <img 
                          src={deal.paymentProofUrl} 
                          alt="Customer proof thumbnail" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedDealForView(deal)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>{isVi ? 'Xem Bill Khách Gởi' : 'View Proof'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedDealForUpload(deal)}
                          className="text-[11px] text-slate-400 hover:text-slate-300 block text-left underline cursor-pointer"
                        >
                          {isVi ? 'Cập nhật lại ảnh' : 'Replace photo'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDealForUpload(deal)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer"
                        id={`upload-proof-btn-${deal.id}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isVi ? 'Tải Lên Bill Khách Gởi' : 'Upload Proof'}</span>
                      </button>
                    </div>
                  )}

                  {/* Finalize Action Button if deal is not completed yet */}
                  {deal.status !== 'completed' && !hasProof && (
                    <button
                      onClick={() => setSelectedDealForUpload(deal)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
                      title={isVi ? 'Yêu cầu khách gởi hình ảnh chuyển tiền để đóng thương vụ' : 'Customer must submit remittance image to close deal'}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Đóng Deal' : 'Close'}</span>
                    </button>
                  )}

                  {/* Nút Xóa Deal */}
                  {onDeleteDeal && (
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(
                          isVi 
                            ? `Bạn có chắc chắn muốn xóa thương vụ "${deal.productName}" (${deal.buyerName}) khỏi hệ thống không?`
                            : `Are you sure you want to permanently delete deal "${deal.productName}" (${deal.buyerName})?`
                        );
                        if (confirmed) {
                          onDeleteDeal(deal.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 transition-all cursor-pointer shadow-xs"
                      title={isVi ? 'Xóa thương vụ này (Add nút xóa deal)' : 'Delete deal'}
                      id={`delete-deal-btn-${deal.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Payment Proof Modal */}
      <PaymentProofModal
        deal={selectedDealForUpload}
        isOpen={Boolean(selectedDealForUpload)}
        onClose={() => setSelectedDealForUpload(null)}
        onSuccess={handleUploadSuccess}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* View Payment Proof Lightbox Modal */}
      <PaymentProofViewerModal
        deal={selectedDealForView}
        isOpen={Boolean(selectedDealForView)}
        onClose={() => setSelectedDealForView(null)}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* Automated / Manual Follow-up Reminder Modal */}
      <DebtReminderModal
        deal={selectedDealForReminder}
        isOpen={Boolean(selectedDealForReminder)}
        onClose={() => setSelectedDealForReminder(null)}
        onSuccess={handleReminderSuccess}
        onOpenFriendlyInquiry={(d) => setSelectedDealForInquiry(d)}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* Bulk Debt Reminder Modal for all verified overdue debtors */}
      <BulkDebtReminderModal
        isOpen={isBulkReminderOpen}
        onClose={() => setIsBulkReminderOpen(false)}
        matchingBubbles={matchingBubbles}
        onSuccess={(updatedBubbles) => {
          if (onRefresh) onRefresh();
        }}
        onOpenFriendlyInquiry={(d) => setSelectedDealForInquiry(d)}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* Deal Execution Confirmation Messages Evidence Folder Modal */}
      <DealExecutionFolderModal
        isOpen={isFolderOpen}
        onClose={() => setIsFolderOpen(false)}
        matchingBubbles={matchingBubbles}
        onDealUpdated={(updated) => {
          if (onDealUpdated) onDealUpdated(updated);
          if (onRefresh) onRefresh();
        }}
        onOpenFriendlyInquiry={(d) => setSelectedDealForInquiry(d)}
        onOpenBulkInquiry={() => setIsBulkInquiryOpen(true)}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* Friendly Counterpart Inquiry Modal */}
      <FriendlyCounterpartInquiryModal
        deal={selectedDealForInquiry}
        isOpen={Boolean(selectedDealForInquiry)}
        onClose={() => setSelectedDealForInquiry(null)}
        onSuccess={(updatedDeal) => {
          if (onDealUpdated) onDealUpdated(updatedDeal);
          if (onRefresh) onRefresh();
        }}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* Bulk Friendly Inquiry To All Unverified Modal */}
      <BulkCounterpartInquiryModal
        isOpen={isBulkInquiryOpen}
        onClose={() => setIsBulkInquiryOpen(false)}
        matchingBubbles={matchingBubbles}
        onSuccess={(updatedBubbles) => {
          if (onRefresh) onRefresh();
        }}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />
    </div>
  );
};

// Aliases for flexible integration
export { DebtCommissionTracker as CommissionDebtTracker };
export default DebtCommissionTracker;
