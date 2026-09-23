/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Send, CheckCircle2, AlertTriangle, 
  Users, ShieldCheck, HeartHandshake, Sparkles, FolderArchive 
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble, DealExecutionConfirmation } from '../types';
import { buildFriendlyCounterpartInquiry } from '../lib/debtReminderTemplate';
import { safeFetchJson } from '../lib/api';

interface FriendlyCounterpartInquiryModalProps {
  deal: MatchingBubble | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDeal: MatchingBubble, confirmation: DealExecutionConfirmation) => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const FriendlyCounterpartInquiryModal: React.FC<FriendlyCounterpartInquiryModalProps> = ({
  deal,
  isOpen,
  onClose,
  onSuccess,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  const isVi = language === 'vi';
  const [inquiryText, setInquiryText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    confirmation: DealExecutionConfirmation;
    inquiryText: string;
  } | null>(null);

  const payingParty = deal?.payingParty || 'buyer';
  const counterpartRole = payingParty === 'buyer' ? 'seller' : 'buyer';
  const counterpartName = counterpartRole === 'seller' ? deal?.sellerName : deal?.buyerName;
  const payingPartyName = payingParty === 'buyer' ? deal?.buyerName : deal?.sellerName;

  useEffect(() => {
    if (deal) {
      const draft = buildFriendlyCounterpartInquiry({
        dealId: deal.id,
        counterpartRole,
        counterpartName: counterpartName || '',
        payingPartyName: payingPartyName || '',
        productName: deal.productName
      });
      setInquiryText(draft);
      setError(null);
      setSuccessInfo(null);
    }
  }, [deal, counterpartRole, counterpartName, payingPartyName]);

  if (!isOpen || !deal) return null;

  const handleSendInquiry = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        deal: MatchingBubble;
        inquiryText: string;
        replyConfirmation: DealExecutionConfirmation;
      }>('/api/deal/inquiry/send-friendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          customInquiryText: inquiryText,
          autoSimulateReply: true
        })
      });

      if (res.success && res.deal && res.replyConfirmation) {
        setSuccessInfo({
          confirmation: res.replyConfirmation,
          inquiryText: res.inquiryText
        });
        setTimeout(() => {
          onSuccess(res.deal, res.replyConfirmation);
          onClose();
        }, 1800);
      } else {
        throw new Error('Gửi tin nhắn thân thiện thất bại');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể tương tác với đối tác. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      id="friendly-counterpart-inquiry-modal"
    >
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isVi ? 'Tương Tác Thân Thiện Xác Thực Deal' : 'Friendly Counterpart Deal Inquiry'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase">
                  Mã Deal: {deal.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi 
                  ? 'Gửi tin nhắn hỏi thăm thân thiện với bên còn lại để nhận bằng chứng xác thực thương vụ' 
                  : 'Send warm inquiry to the counterpart to collect proof of completed transaction'}
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

          {successInfo && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isVi ? 'Đã Nhận Phản Hồi & Lưu Vào Thư Mục Bằng Chứng Thành Công!' : 'Counterpart Confirmed & Saved to Folder!'}</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-emerald-500/20 text-[11px] text-slate-300 italic">
                "{successInfo.confirmation.message}"
              </div>
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                <span>📁 Đã tự động lưu vào Thư Mục Lưu Tin Xác Thực</span>
                <span>✅ Mã Deal #{deal.id} Đã Xác Minh</span>
              </div>
            </div>
          )}

          {/* Parties Mapping */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="border-r border-slate-800/80 pr-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">
                {isVi ? 'Bên Nộp Hoa Hồng (Khách Hàng)' : 'Paying Party'}
              </span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate">
                {payingPartyName}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Phí: {formatCurrency(deal.commissionFee, currency, exchangeRate)}
              </span>
            </div>
            <div className="pl-1">
              <span className="text-[10px] text-teal-400 font-bold uppercase block flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{isVi ? 'Bên Còn Lại (Cần Tương Tác)' : 'Counterpart to Inquire'}</span>
              </span>
              <span className="text-xs font-bold text-teal-200 block mt-0.5 truncate">
                {counterpartName}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Vai trò: {counterpartRole === 'seller' ? 'Người Bán / Xưởng Cung Cấp' : 'Người Mua'}
              </span>
            </div>
          </div>

          {/* Workflow rule banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block text-amber-200">
                {isVi ? 'Quy chế đối soát & bằng chứng thanh toán hoa hồng:' : 'Verification rule:'}
              </span>
              {isVi 
                ? 'Khi hoa hồng được thanh toán do một bên, hệ thống tương tác gửi tin nhắn thân thiện với bên còn lại để nhận xác nhận khách quan. Tin nhắn phản hồi sẽ được lưu vào Thư mục Bằng chứng làm căn cứ pháp lý để yêu cầu thanh toán.'
                : 'When commission is paid by one party, interact politely with the counterpart to verify transaction execution. Their affirmative message is stored in the Evidence Folder to legally support payment collection.'}
            </div>
          </div>

          {/* Editable Inquiry Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                <span>{isVi ? 'Nội Dung Tin Nhắn Hỏi Thăm Thân Thiện' : 'Friendly Inquiry Message'}</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">{inquiryText.length} chars</span>
            </div>
            <textarea
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              rows={8}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-teal-500 transition-colors resize-none"
              placeholder={isVi ? 'Nội dung tin nhắn gửi tới bên còn lại...' : 'Enter message body...'}
            />
          </div>

          {/* Existing confirmations for this deal */}
          {deal.confirmationsFolder && deal.confirmationsFolder.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isVi ? `Đã Có ${deal.confirmationsFolder.length} Tin Xác Thực Trong Thư Mục:` : `Existing Evidence Messages (${deal.confirmationsFolder.length})`}
              </span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {deal.confirmationsFolder.map((conf) => (
                  <div key={conf.id} className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-[10px] text-slate-300">
                    <div className="flex items-center justify-between font-semibold text-teal-300 mb-0.5">
                      <span>{conf.senderName} ({conf.senderRole === 'seller' ? 'Người Bán' : 'Người Mua'})</span>
                      <span className="text-slate-500">{new Date(conf.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-400 truncate">"{conf.message}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>
          
          <button
            onClick={handleSendInquiry}
            disabled={sending || Boolean(successInfo) || !inquiryText.trim()}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
              successInfo
                ? 'bg-emerald-600 text-white'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-black'
            }`}
            id="send-friendly-inquiry-btn"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{isVi ? 'Đang gửi & thu nhận xác thực...' : 'Sending & Collecting...'}</span>
              </>
            ) : successInfo ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVi ? 'Đã Lưu Bằng Chứng!' : 'Proof Archived!'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isVi ? 'Gửi Tin Thân Thiện & Nhận Xác Thực' : 'Send Inquiry & Collect Proof'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
