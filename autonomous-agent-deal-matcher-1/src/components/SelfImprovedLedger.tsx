/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Landmark, CheckCircle, TrendingUp, HelpCircle, FileSpreadsheet, Sparkles, RefreshCw, Download, Eye, Image as ImageIcon } from 'lucide-react';
import { Language, Currency, translations, formatCurrency } from '../lib/i18n';
import { safeFetchJson } from '../lib/api';
import { PaymentProofViewerModal } from './PaymentProofViewerModal';
import { MatchingBubble } from '../types';

interface VerifiedDeal {
  dealId: string;
  buyerName: string;
  sellerName: string;
  productName: string;
  quantity: number;
  price: number;
  totalBusinessVolume: number;
  commissionFee: number;
  commissionPercent: number;
  status: string;
  sentTo: string;
  bank: string;
  accountNumber: string;
  timestamp: string;
  paymentProofUrl?: string;
  paymentStatus?: 'unpaid' | 'paid' | 'pending_proof';
  paymentTransactionRef?: string;
}

interface SelfImprovedData {
  totalCommissionVND: number;
  successfulDealsCount: number;
  totalBusinessVolumeVND: number;
  payoutDetails: {
    receiverName: string;
    bankName: string;
    accountNumber: string;
  };
  verifiedDeals: VerifiedDeal[];
  selfImprovedPatterns: {
    optimizationModel: string;
    lastImprovedTimestamp: string;
    negotiationStrictness: string;
  };
}

interface SelfImprovedLedgerProps {
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
  refreshTrigger?: number; // state trigger to refresh the ledger
}

export default function SelfImprovedLedger({
  language = 'en',
  currency = 'VND',
  exchangeRate = 25000,
  refreshTrigger = 0
}: SelfImprovedLedgerProps) {
  const [data, setData] = useState<SelfImprovedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingProofDeal, setViewingProofDeal] = useState<MatchingBubble | null>(null);

  const fetchLedger = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const json = await safeFetchJson<SelfImprovedData>('/api/self-improved-data');
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to ledger API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(true);
  }, [refreshTrigger]);

  // Polling fallback when in error state
  useEffect(() => {
    if (!error && data) return;
    
    const interval = setInterval(() => {
      fetchLedger(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [error, data]);

  const exportToCSV = () => {
    if (!data || !data.verifiedDeals || data.verifiedDeals.length === 0) return;
    
    const headers = [
      'Deal ID',
      'Buyer Name',
      'Seller Name',
      'Product Name',
      'Quantity',
      'Price',
      'Total Business Volume',
      'Commission Fee',
      'Commission Percent',
      'Status',
      'Sent To (Beneficiary)',
      'Bank',
      'Account Number',
      'Timestamp'
    ];

    const escapeCSV = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = data.verifiedDeals.map(deal => [
      escapeCSV(deal.dealId),
      escapeCSV(deal.buyerName),
      escapeCSV(deal.sellerName),
      escapeCSV(deal.productName),
      deal.quantity,
      deal.price,
      deal.totalBusinessVolume,
      deal.commissionFee,
      deal.commissionPercent,
      escapeCSV(deal.status),
      escapeCSV(deal.sentTo),
      escapeCSV(deal.bank),
      escapeCSV(deal.accountNumber),
      escapeCSV(deal.timestamp)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sacombank_verified_ledger_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 min-h-[220px]">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="text-xs text-slate-400">Loading self-improved ledger...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[220px] text-center" id="ledger-connection-error">
        <span className="text-xs text-rose-400 font-semibold max-w-md">
          {language === 'vi' 
            ? 'Không thể kết nối hoặc đối soát sổ cái giao dịch với máy chủ Cloud Run.' 
            : 'Could not connect or verify ledger data with the Cloud Run server.'}
        </span>
        <button
          onClick={() => fetchLedger(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          id="retry-ledger-connection-btn"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>{language === 'vi' ? 'Thử Kết Nối Lại' : 'Retry Connection'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl" id="self-improved-ledger">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
              {language === 'vi' ? 'Bản Đồ Giao Dịch & Sổ Cái Đã Đối Soát' : 'Verified Business Match & Payout Ledger'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {language === 'vi' 
                ? 'Lưu trữ tự động các giao dịch thành công và giải ngân hoa hồng' 
                : 'Automated archival of successful matches & commission distribution'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Export Ledger to CSV"
            id="export-ledger-csv-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Xuất Sổ Cái (CSV)' : 'Export Ledger (CSV)'}</span>
          </button>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">Self-Improved Model</span>
          </div>
        </div>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Metric 1 */}
        <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider leading-none">
              {language === 'vi' ? 'Tổng Giao Dịch Đã Khớp Thành Công' : 'Total Matched Business Volume'}
            </span>
            <span className="text-sm font-black text-slate-100 font-mono block mt-1.5 leading-none">
              {formatCurrency(data.totalBusinessVolumeVND, currency, exchangeRate)}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
            <Landmark className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider leading-none">
              {language === 'vi' ? 'Tổng Hoa Hồng Đã Chuyển' : 'Verified Commission Released'}
            </span>
            <span className="text-sm font-black text-amber-400 font-mono block mt-1.5 leading-none animate-pulse">
              {formatCurrency(data.totalCommissionVND, currency, exchangeRate)}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider leading-none">
              {language === 'vi' ? 'Tài Khoản Thụ Hưởng Giao Dịch' : 'Verified Payout Destination'}
            </span>
            <span className="text-[10px] font-black text-emerald-300 block mt-1 hover:underline">
              {data.payoutDetails.receiverName} - Sacombank
            </span>
            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
              Acc: {data.payoutDetails.accountNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Live File Path Notice */}
      <div className="bg-emerald-500/5 border border-emerald-500/15 p-2.5 rounded-xl flex items-center gap-2 mb-4 text-[10px] text-emerald-400/90 font-medium">
        <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
        <span>
          {language === 'vi'
            ? `Tất cả dữ liệu giao dịch thành công đã được lưu vào tệp hệ thống tự cải tiến: /self_improved_data.json`
            : `All verified business matches and payouts are permanently saved to self-improved ledger: /self_improved_data.json`}
        </span>
      </div>

      {/* List of Verified Transactions */}
      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
        <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
          {language === 'vi' ? 'Nhật Ký Chuyển Khoản Đối Soát Gần Đây' : 'Recent Verified Payout Records'}
        </h4>
        {data.verifiedDeals.map((deal) => (
          <div 
            key={deal.dealId}
            className="p-3 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/50 hover:border-slate-800 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5"
          >
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-slate-200">
                  {deal.buyerName.split(' ')[0]} ⇄ {deal.sellerName.split(' ')[0]}
                </span>
                <span className="text-[8px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded font-black">
                  {deal.dealId}
                </span>
                <span className="text-[8px] font-medium text-slate-500">
                  {new Date(deal.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {deal.productName} ({deal.quantity.toLocaleString()} pcs)
              </p>
              <p className="text-[9px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{language === 'vi' ? 'Doanh số:' : 'Business Volume:'} <strong className="text-slate-300 font-mono">{formatCurrency(deal.totalBusinessVolume, currency, exchangeRate)}</strong></span>
                <span className="text-slate-700">|</span>
                <span>{language === 'vi' ? 'Thụ hưởng:' : 'Beneficiary:'} <strong className="text-emerald-400">{deal.sentTo}</strong></span>
              </p>
            </div>
            
            <div className="text-left md:text-right flex-shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-900 pt-2 md:pt-0">
              <span className="text-[8px] text-slate-500 uppercase font-extrabold tracking-wider">
                {language === 'vi' ? 'Hoa Hồng 1.5% Sacombank' : '1.5% Sacombank Commission'}
              </span>
              <span className="text-xs font-black text-amber-300 font-mono mt-0.5">
                +{formatCurrency(deal.commissionFee, currency, exchangeRate)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {language === 'vi' ? 'Đã Quyết Toán' : 'Settled'}
                </span>

                {deal.paymentProofUrl && (
                  <button
                    onClick={() => {
                      setViewingProofDeal({
                        id: deal.dealId,
                        buyerName: deal.buyerName,
                        sellerName: deal.sellerName,
                        productName: deal.productName,
                        price: deal.price,
                        confidenceScore: 95,
                        evaluationReason: 'Deal completed & verified with payment proof.',
                        commissionFee: deal.commissionFee,
                        commissionPercent: deal.commissionPercent,
                        buyerContactUnlocked: true,
                        sellerContactUnlocked: true,
                        status: 'completed',
                        paymentStatus: 'paid',
                        paymentProofUrl: deal.paymentProofUrl,
                        paymentTransactionRef: deal.paymentTransactionRef,
                        paymentProofTimestamp: deal.timestamp
                      });
                    }}
                    className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title={language === 'vi' ? 'Xem biên lai khách hàng chuyển tiền' : 'View customer remittance receipt'}
                  >
                    <Eye className="w-2.5 h-2.5 text-blue-400" />
                    <span>{language === 'vi' ? 'Xem Bill' : 'View Bill'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal to View Payment Proof Receipt */}
      <PaymentProofViewerModal
        deal={viewingProofDeal}
        isOpen={Boolean(viewingProofDeal)}
        onClose={() => setViewingProofDeal(null)}
        language={language}
        currency={currency}
        exchangeRate={exchangeRate}
      />
    </div>
  );
}
