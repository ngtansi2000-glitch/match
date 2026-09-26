/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, Send, BellRing, CheckCircle2, AlertTriangle, ShieldCheck, 
  Clock, Users, Mail, Smartphone, MessageSquare, Landmark,
  FolderArchive, HeartHandshake, Eye, Sparkles
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble } from '../types';
import { buildOfficialDebtReminderTemplate } from '../lib/debtReminderTemplate';
import { safeFetchJson } from '../lib/api';

interface BulkDebtReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchingBubbles: MatchingBubble[];
  onSuccess: (updatedBubbles: MatchingBubble[], dispatchedCount: number) => void;
  onOpenFriendlyInquiry?: (deal: MatchingBubble) => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const BulkDebtReminderModal: React.FC<BulkDebtReminderModalProps> = ({
  isOpen,
  onClose,
  matchingBubbles,
  onSuccess,
  onOpenFriendlyInquiry,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  const isVi = language === 'vi';
  const [channel, setChannel] = useState<'Email & Zalo / SMS' | 'SMS Direct' | 'WhatsApp B2B'>('Email & Zalo / SMS');
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsInfo, setResultsInfo] = useState<{
    dispatchedCount: number;
    skippedCount: number;
  } | null>(null);

  // Split overdue / unpaid deals into verified vs unverified
  const { verifiedDebtors, unverifiedDebtors, totalDebtAmount } = useMemo(() => {
    const unpaid = matchingBubbles.filter(b => b.paymentStatus !== 'paid' || !b.paymentProofUrl);
    const verified = unpaid.filter(b => b.dealExecutionVerified === true);
    const unverified = unpaid.filter(b => !b.dealExecutionVerified);
    const totalDebt = verified.reduce((sum, b) => sum + (b.commissionFee || 0), 0);

    return {
      verifiedDebtors: verified,
      unverifiedDebtors: unverified,
      totalDebtAmount: totalDebt
    };
  }, [matchingBubbles]);

  if (!isOpen) return null;

  // Sample template preview using the first verified deal or generic
  const sampleDeal = verifiedDebtors[0] || matchingBubbles[0];
  const templatePreview = buildOfficialDebtReminderTemplate({
    dealId: sampleDeal ? sampleDeal.id : 'M-XXXX',
    productName: sampleDeal?.productName,
    commissionFeeVND: sampleDeal?.commissionFee
  });

  const handleBulkDispatch = async () => {
    if (verifiedDebtors.length === 0) {
      setError(isVi ? 'Không có khách hàng chậm thanh toán nào đã được xác minh để gửi.' : 'No verified debtors found.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await safeFetchJson<{
        success: boolean;
        dispatchedCount: number;
        skippedUnverifiedCount: number;
        matchingBubbles: MatchingBubble[];
      }>('/api/debt/reminder/bulk-send-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });

      if (res.success) {
        setResultsInfo({
          dispatchedCount: res.dispatchedCount,
          skippedCount: res.skippedUnverifiedCount
        });
        setTimeout(() => {
          onSuccess(res.matchingBubbles, res.dispatchedCount);
          onClose();
        }, 1800);
      } else {
        throw new Error('Gởi hàng loạt thất bại');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi gửi thông báo nhắc nợ hàng loạt');
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      id="bulk-debt-reminder-modal"
    >
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Gởi Mẫu Nhắc Nợ Cho Tất Cả Khách Chậm Thanh Toán' : 'Bulk Dispatch Debt Reminder to Verified Debtors'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {verifiedDebtors.length} {isVi ? 'Khách Đã Xác Minh' : 'Verified'}
                </span>
              </div>
              <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                {isVi 
                  ? '⚠️ BẮT BUỘC: Chỉ gởi khi đã xác minh Mã Deal đã được thực hiện (có tin nhắn trong Thư mục)' 
                  : 'Mandatory Rule: Only send when deal execution has been verified'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {resultsInfo && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 space-y-1 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{isVi ? `Đã gởi thành công tới ${resultsInfo.dispatchedCount} khách hàng chậm thanh toán!` : `Successfully dispatched to ${resultsInfo.dispatchedCount} debtors!`}</span>
              </div>
              <p className="text-xs text-emerald-400/80">
                {isVi ? `Đã tự động bỏ qua ${resultsInfo.skippedCount} deal chưa có tin nhắn xác thực thương vụ.` : `Skipped ${resultsInfo.skippedCount} unverified deals.`}
              </p>
            </div>
          )}

          {/* Official Template Preview (DE NGHI TT.jpg) */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isVi ? 'Mẫu Nhắc Nợ Chính Thức (Mã Deal Trên Đầu - DE NGHI TT.jpg)' : 'Official Reminder Template Preview'}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Bilingual VN / EN</span>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
              {templatePreview}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Mỗi khách hàng sẽ nhận được nội dung trên kèm Mã Deal tương ứng ở đầu tin nhắn.</span>
              <span className="text-indigo-400 font-semibold">Tài khoản: Sacombank 060129073198 (NGUYỄN TẤN SĨ)</span>
            </div>
          </div>

          {/* Channel Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              {isVi ? 'Kênh Gửi Thông Báo Hàng Loạt' : 'Bulk Dispatch Channel'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Email & Zalo / SMS', label: 'Email & Zalo / SMS', icon: Mail },
                { id: 'SMS Direct', label: 'SMS Direct Hotline', icon: Smartphone },
                { id: 'WhatsApp B2B', label: 'WhatsApp B2B', icon: MessageSquare }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = channel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setChannel(opt.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Verified Debtors (Ready to receive) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVi ? `Khách Chậm Thanh Toán ĐÃ XÁC MINH DEAL (${verifiedDebtors.length})` : `Verified Debtors (${verifiedDebtors.length})`}</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Tổng công nợ: {formatCurrency(totalDebtAmount, currency, exchangeRate)}
              </span>
            </div>

            {verifiedDebtors.length === 0 ? (
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-slate-400">
                {isVi ? 'Không có deal nào đủ điều kiện (cần có tin nhắn xác thực thương vụ trong Thư mục).' : 'No verified deals eligible.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {verifiedDebtors.map((deal) => {
                  const proofCount = deal.confirmationsFolder?.length || 0;
                  const latestProof = deal.confirmationsFolder?.[0];

                  return (
                    <div 
                      key={deal.id}
                      className="p-3 bg-slate-950/70 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            DEAL #{deal.id}
                          </span>
                          <span className="font-bold text-white">{deal.buyerName}</span>
                          <span className="text-[10px] text-slate-400">({deal.productName})</span>
                        </div>
                        {latestProof && (
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                            <FolderArchive className="w-3 h-3 text-teal-400 shrink-0" />
                            <span className="truncate italic">"{latestProof.message}"</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-emerald-400 text-xs block">
                          {formatCurrency(deal.commissionFee, currency, exchangeRate)}
                        </span>
                        <span className="text-[10px] text-emerald-400/90 font-medium">
                          ✅ Đã có {proofCount} tin xác thực
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* List of Skipped Unverified Deals (Notice & Action) */}
          {unverifiedDebtors.length > 0 && (
            <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-rose-300 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{isVi ? `BỎ QUA ${unverifiedDebtors.length} Deal Chưa Xác Minh (Theo Quy Chế Sàn)` : `Skipping ${unverifiedDebtors.length} Unverified Deals`}</span>
                </div>
                <span className="text-[10px] text-slate-400">Không gửi nhắc nợ khi chưa có tin xác thực</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {unverifiedDebtors.map((deal) => (
                  <div key={deal.id} className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-amber-400 font-bold">Deal #{deal.id}</span>
                        <span className="text-slate-300">{deal.buyerName}</span>
                      </div>
                      <span className="text-[10px] text-rose-400 block mt-0.5">
                        ⚠️ Chưa có tin xác thực từ {deal.sellerName} hoặc {deal.buyerName}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenFriendlyInquiry) {
                          onOpenFriendlyInquiry(deal);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <HeartHandshake className="w-3 h-3" />
                      <span>{isVi ? 'Tương Tác Xác Thực' : 'Inquire'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isVi ? 'Hủy' : 'Cancel'}
          </button>

          <button
            onClick={handleBulkDispatch}
            disabled={sending || verifiedDebtors.length === 0}
            className="px-6 py-2.5 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            id="confirm-bulk-debt-reminder-btn"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{isVi ? 'Đang gửi hàng loạt...' : 'Dispatching...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {isVi 
                    ? `Xác Nhận Gửi Mẫu Nhắc Nợ (${verifiedDebtors.length} Khách Đã Xác Minh)` 
                    : `Dispatch Reminder to ${verifiedDebtors.length} Verified Debtors`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
