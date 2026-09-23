/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Bell, Clock, Send, CheckCircle2, AlertTriangle, 
  MessageSquare, ShieldAlert, Landmark, Smartphone, Mail, Sparkles,
  HeartHandshake, FolderArchive, ShieldCheck
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble } from '../types';
import { safeFetchJson } from '../lib/api';
import { buildOfficialDebtReminderTemplate } from '../lib/debtReminderTemplate';

interface DebtReminderModalProps {
  deal: MatchingBubble | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDeal: MatchingBubble) => void;
  onOpenFriendlyInquiry?: (deal: MatchingBubble) => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const DebtReminderModal: React.FC<DebtReminderModalProps> = ({
  deal,
  isOpen,
  onClose,
  onSuccess,
  onOpenFriendlyInquiry,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  const isVi = language === 'vi';
  const [channel, setChannel] = useState<'Email & Zalo / SMS' | 'SMS Direct' | 'WhatsApp B2B'>('Email & Zalo / SMS');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotif, setSuccessNotif] = useState<boolean>(false);

  // Calculate elapsed time
  const hoursSince = deal?.dealCompletedAt 
    ? Math.max(0, Math.round((Date.now() - new Date(deal.dealCompletedAt).getTime()) / (3600 * 1000)))
    : 48;
  const isOverdue48h = hoursSince >= 48;

  useEffect(() => {
    if (deal) {
      // Use official bilingual template matching DE NGHI TT.jpg with Deal ID at the top
      const officialTemplate = buildOfficialDebtReminderTemplate({
        dealId: deal.id,
        productName: deal.productName,
        buyerName: deal.buyerName,
        sellerName: deal.sellerName,
        commissionFeeVND: deal.commissionFee
      });

      setCustomMessage(officialTemplate);
      setError(null);
      setSuccessNotif(false);
    }
  }, [deal, isVi, currency, exchangeRate]);

  if (!isOpen || !deal) return null;

  const handleSendReminder = async () => {
    if (!deal.dealExecutionVerified) {
      setError(
        isVi
          ? 'Chỉ gởi khi đã xác minh Mã Deal đã được thực hiện! Vui lòng nhấn "Tương Tác Xác Thực" để gửi tin hỏi bên còn lại trước.'
          : 'Deal execution must be verified before dispatching debt reminder!'
      );
      return;
    }

    setSending(true);
    setError(null);
    try {
      const result = await safeFetchJson<{
        success: boolean;
        deal: MatchingBubble;
        reminder: any;
      }>('/api/debt/reminder/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          message: customMessage,
          channel
        })
      });

      if (result.success && result.deal) {
        setSuccessNotif(true);
        setTimeout(() => {
          onSuccess(result.deal);
          onClose();
        }, 1200);
      } else {
        throw new Error('Gửi nhắc nợ thất bại');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể gửi thông báo nhắc nợ. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      id="debt-reminder-modal"
    >
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isVi ? 'Gửi Thông Báo Nhắc Nợ Khách Hàng' : 'Dispatch Payment Proof Reminder'}</span>
                {isOverdue48h ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold uppercase">
                    {isVi ? `Quá Hạn ${hoursSince}h` : `Overdue ${hoursSince}h`}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-extrabold uppercase">
                    {isVi ? `Đã Hoàn Tất ${hoursSince}h` : `${hoursSince}h Elapsed`}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi ? 'Nhắc nhở khách gởi hình ảnh biên lai chuyển tiền hoa hồng để đóng thương vụ' : 'Request buyer upload transfer receipt screenshot to finalize deal'}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successNotif && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{isVi ? 'Đã gửi thông báo nhắc nợ thành công!' : 'Reminder notification dispatched successfully!'}</span>
            </div>
          )}

          {/* Deal & Commission Overview */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">{isVi ? 'Khách Hàng (Buyer)' : 'Buyer'}</span>
              <span className="text-xs font-bold text-slate-200 block truncate">{deal.buyerName}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{deal.productName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">{isVi ? 'Phí Hoa Hồng Cần Thu' : 'Commission Due'}</span>
              <span className="text-sm font-extrabold text-amber-400 font-mono block">
                {formatCurrency(deal.commissionFee, currency, exchangeRate)}
              </span>
              <span className="text-[10px] text-rose-400 font-semibold flex items-center justify-end gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{isVi ? 'Chưa nhận được hình ảnh bill' : 'No payment proof uploaded'}</span>
              </span>
            </div>
          </div>

          {/* Deal Verification Status Banner (Mandatory condition) */}
          <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
            deal.dealExecutionVerified
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-start gap-2.5">
              {deal.dealExecutionVerified ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <span>
                    {deal.dealExecutionVerified
                      ? (isVi ? 'ĐÃ XÁC MINH THƯƠNG VỤ ĐÃ THỰC HIỆN' : 'DEAL EXECUTION VERIFIED')
                      : (isVi ? 'CHƯA XÁC MINH THƯƠNG VỤ ĐÃ THỰC HIỆN' : 'DEAL NOT VERIFIED YET')}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 font-mono text-amber-300">
                    Mã #{deal.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  {deal.dealExecutionVerified
                    ? (isVi 
                        ? `Có ${deal.confirmationsFolder?.length || 1} tin nhắn xác thực từ các bên trong Thư mục. Đủ điều kiện gửi thông báo đòi nợ.` 
                        : 'Confirmed messages exist in the evidence folder. Eligible to dispatch reminder.')
                    : (isVi 
                        ? 'Chỉ gởi khi đã xác minh Mã Deal đã được thực hiện. Cần có tin nhắn xác thực từ một trong hai bên trong Thư mục.' 
                        : 'Rule: Only dispatch reminder once deal execution has been verified.')}
                </p>
              </div>
            </div>

            {!deal.dealExecutionVerified && onOpenFriendlyInquiry && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFriendlyInquiry(deal);
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>{isVi ? 'Tương Tác Xác Thực' : 'Inquire'}</span>
              </button>
            )}
          </div>

          {/* Sacombank Bank Target */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-between text-indigo-200">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="text-[11px]">
                <span className="font-bold text-white">Sacombank: </span>
                <span className="font-mono text-emerald-400 font-bold">060129073198</span>
                <span className="text-slate-300 font-medium"> (NGUYỄN TẤN SĨ / NGUYEN TAN SI)</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-medium">
              1.5% Success Fee
            </span>
          </div>

          {/* Channel Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              {isVi ? 'Kênh Gửi Thông Báo Tự Động' : 'Dispatch Channel'}
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
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
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

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {isVi ? 'Nội Dung Tin Nhắn Nhắc Nhở & Yêu Cầu Bill' : 'Notification Message Body'}
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {customMessage.length} characters
              </span>
            </div>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={7}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder={isVi ? 'Nhập nội dung nhắc nhở...' : 'Enter reminder body...'}
            />
          </div>

          {/* Reminder History for this deal */}
          {deal.reminderHistory && deal.reminderHistory.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isVi ? `Lịch Sử Đã Nhắc Nợ (${deal.reminderHistory.length} lần)` : `Prior Reminder Logs (${deal.reminderHistory.length})`}
              </label>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {deal.reminderHistory.map((h, idx) => (
                  <div key={h.id || idx} className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/80 text-[10px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{new Date(h.timestamp).toLocaleString()}</span>
                      <span className="text-slate-500">via</span>
                      <span className="font-semibold text-indigo-400">{h.channel}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                      {h.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isVi ? 'Hủy' : 'Cancel'}
          </button>
          
          <button
            onClick={handleSendReminder}
            disabled={sending || successNotif || !customMessage.trim() || !deal.dealExecutionVerified}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              successNotif
                ? 'bg-emerald-600 text-white'
                : !deal.dealExecutionVerified
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
            }`}
            id="send-debt-reminder-submit-btn"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{isVi ? 'Đang gửi...' : 'Dispatching...'}</span>
              </>
            ) : successNotif ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVi ? 'Đã gửi thành công!' : 'Dispatched!'}</span>
              </>
            ) : !deal.dealExecutionVerified ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{isVi ? 'Chưa Xác Minh Thực Hiện Deal' : 'Unverified Deal'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isVi ? 'Gửi Mẫu Nhắc Nợ Khách Hàng' : 'Dispatch Follow-up Notification'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
