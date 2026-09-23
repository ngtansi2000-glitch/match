/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, Send, CheckCircle2, AlertTriangle, ShieldCheck, 
  Clock, Users, Mail, Smartphone, MessageSquare, Landmark,
  FolderArchive, HeartHandshake, Eye, Sparkles, UserCheck, 
  HelpCircle, RefreshCw, ChevronRight, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble, DealExecutionConfirmation } from '../types';
import { buildFriendlyCounterpartInquiry } from '../lib/debtReminderTemplate';
import { safeFetchJson } from '../lib/api';

interface BulkCounterpartInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchingBubbles: MatchingBubble[];
  onSuccess: (updatedBubbles: MatchingBubble[], sentCount: number) => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const BulkCounterpartInquiryModal: React.FC<BulkCounterpartInquiryModalProps> = ({
  isOpen,
  onClose,
  matchingBubbles,
  onSuccess,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  const isVi = language === 'vi';
  const [channel, setChannel] = useState<'Zalo / Email B2B' | 'WhatsApp / B2B Chat' | 'SMS Direct'>('Zalo / Email B2B');
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'template' | 'deals' | 'replies'>('template');
  
  // Feedback simulation state
  const [processingReplyDealId, setProcessingReplyDealId] = useState<string | null>(null);
  const [resultsInfo, setResultsInfo] = useState<{
    sentCount: number;
    message: string;
  } | null>(null);

  // Filter unverified deals
  const unverifiedDeals = useMemo(() => {
    return matchingBubbles.filter(b => !b.dealExecutionVerified);
  }, [matchingBubbles]);

  const awaitingReplyDeals = useMemo(() => {
    return matchingBubbles.filter(b => b.counterpartInquiryStatus === 'sent' && !b.dealExecutionVerified);
  }, [matchingBubbles]);

  const verifiedDeals = useMemo(() => {
    return matchingBubbles.filter(b => b.dealExecutionVerified);
  }, [matchingBubbles]);

  if (!isOpen) return null;

  // Sample Deal for template preview
  const sampleDeal = unverifiedDeals[0] || matchingBubbles[0] || {
    id: 'm-1789823612546',
    productName: 'Live Showcase: Introducing our new sustainable Premium Mulberry Silk Sleeping Eye Masks - open for global wholesale!',
    sellerName: 'Supplier Factory via ShopShops',
    buyerName: 'Alena Milan Sourcing',
    payingParty: 'buyer'
  };

  const counterpartRole = sampleDeal.payingParty === 'buyer' ? 'seller' : 'buyer';
  const counterpartName = counterpartRole === 'seller' ? sampleDeal.sellerName : sampleDeal.buyerName;
  const payingPartyName = sampleDeal.payingParty === 'buyer' ? sampleDeal.buyerName : sampleDeal.sellerName;

  const sampleTemplate = buildFriendlyCounterpartInquiry({
    dealId: sampleDeal.id,
    counterpartRole,
    counterpartName: counterpartName || 'Supplier Factory via ShopShops',
    payingPartyName: payingPartyName || 'Alena Milan Sourcing',
    productName: sampleDeal.productName
  });

  const handleBulkDispatch = async () => {
    if (unverifiedDeals.length === 0) {
      setError(isVi ? 'Không có deal nào chưa xác thực để gửi.' : 'No unverified deals found.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await safeFetchJson<{
        success: boolean;
        sentCount: number;
        message?: string;
        matchingBubbles: MatchingBubble[];
      }>('/api/deal/inquiry/send-bulk-unverified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });

      if (res.success) {
        setResultsInfo({
          sentCount: res.sentCount,
          message: res.message || `Đã gửi thành công thư hỏi thăm tới ${res.sentCount} đối tác chưa xác thực!`
        });
        setActiveTab('deals');
        onSuccess(res.matchingBubbles, res.sentCount);
      } else {
        throw new Error('Không thể gửi thư xác thực hàng loạt.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi gửi thư xác thực.');
    } finally {
      setSending(false);
    }
  };

  const handleRecordReply = async (dealId: string, isConfirmed: boolean) => {
    setProcessingReplyDealId(dealId);
    setError(null);

    try {
      const res = await safeFetchJson<{
        success: boolean;
        isConfirmed: boolean;
        deal: MatchingBubble;
        matchingBubbles: MatchingBubble[];
      }>('/api/deal/inquiry/receive-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          isConfirmed
        })
      });

      if (res.success) {
        onSuccess(res.matchingBubbles, 1);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tiếp nhận phản hồi.');
    } finally {
      setProcessingReplyDealId(null);
    }
  };

  const handleSimulateAllReplies = async () => {
    setSending(true);
    setError(null);

    try {
      const res = await safeFetchJson<{
        success: boolean;
        processedCount: number;
        confirmedCount: number;
        unfulfilledCount: number;
        matchingBubbles: MatchingBubble[];
      }>('/api/deal/inquiry/simulate-all-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.success) {
        setResultsInfo({
          sentCount: res.processedCount,
          message: `Đã tiếp nhận phản hồi: ${res.confirmedCount} chốt thành công (ĐÃ LƯU XÁC THỰC), ${res.unfulfilledCount} chưa chốt (Đã gửi đối tác thay thế).`
        });
        onSuccess(res.matchingBubbles, res.processedCount);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi mô phỏng phản hồi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      id="bulk-counterpart-inquiry-modal"
    >
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Gởi Thư Xác Thực Cho Toàn Bộ Khách Chưa Xác Thực' : 'Bulk Send Inquiry to Unverified Counterparts'}
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  {unverifiedDeals.length} {isVi ? 'Deal Chưa Xác Thực' : 'Unverified Deals'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi 
                  ? 'Mẫu thư chuẩn của Si Nguyen • Xác thực CHỈ được lưu vào Thư Mục Bằng Chứng khi có phản hồi từ khách' 
                  : 'Official template by Si Nguyen • Verification is saved ONLY upon customer response'}
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

        {/* Sub-Header Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-950/50 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('template')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'template'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isVi ? 'Mẫu Thư Hỏi Thăm Chuẩn' : 'Official Letter Template'}</span>
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'deals'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isVi ? `Danh Sách Nhận Thư (${unverifiedDeals.length})` : `Recipients (${unverifiedDeals.length})`}</span>
            </button>
            {awaitingReplyDeals.length > 0 && (
              <button
                onClick={() => setActiveTab('replies')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'replies'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-amber-400 hover:text-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>{isVi ? `Chờ Khách Phản Hồi (${awaitingReplyDeals.length})` : `Awaiting Reply (${awaitingReplyDeals.length})`}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{isVi ? 'Kênh gởi:' : 'Channel:'}</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="Zalo / Email B2B">Zalo / Email B2B</option>
              <option value="WhatsApp / B2B Chat">WhatsApp / B2B Chat</option>
              <option value="SMS Direct">SMS Direct</option>
            </select>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {resultsInfo && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-1.5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resultsInfo.message}</span>
              </div>
              <p className="text-[11px] text-emerald-400/90 pl-6">
                {isVi 
                  ? 'Quy chế: Trạng thái xác thực chỉ được lưu khi nhận được phản hồi từ khách hàng. Hãy theo dõi các phản hồi bên dưới.'
                  : 'Policy: Verification is recorded only when counterpart response is confirmed.'}
              </p>
            </div>
          )}

          {/* Core Policy Rule Notice */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed text-[11px]">
              <div className="font-bold text-amber-200 flex items-center gap-2">
                <span>{isVi ? 'QUY CHẾ XÁC THỰC THƯƠNG VỤ:' : 'DEAL EXECUTION VERIFICATION RULE:'}</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isVi ? 'CHỈ LƯU KHI CÓ PHẢN HỒI' : 'ONLY ON CONFIRMATION'}
                </span>
              </div>
              <p>
                {isVi 
                  ? 'Thư này sẽ được gửi tới toàn bộ các đối tác trong các thương vụ chưa xác thực. Sau khi gửi, hệ thống sẽ KHÔNG tự động cấp trạng thái xác thực. Xác thực chỉ được lưu vào Thư Mục Bằng Chứng khi đối tác có phản hồi xác nhận chốt hợp đồng thuận lợi.'
                  : 'This inquiry is dispatched to all unverified deal counterparts. The system will NOT automatically grant verified status upon sending. Verification is saved to the Evidence Folder ONLY when the customer confirms transaction execution.'}
              </p>
              <p className="text-amber-400 font-medium">
                {isVi 
                  ? 'Trường hợp khách hàng phản hồi chưa chốt deal vì lý do nào đó: Hệ thống ghi nhận lý do và tự động đề xuất một đối tác khác phù hợp theo đúng cam kết trong thư.'
                  : 'If the customer reports the deal was not closed, the system records the reason and suggests alternative matching suppliers as promised.'}
              </p>
            </div>
          </div>

          {/* TAB 1: Template Preview */}
          {activeTab === 'template' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isVi ? 'Nội Dung Thư Mẫu Gửi Khách Hàng (Tự động điền theo từng Deal):' : 'Inquiry Letter Preview:'}</span>
                </span>
                <span className="text-[10px] text-teal-400 font-mono">
                  {isVi ? 'Đại diện phát hành: Si Nguyen' : 'Issuer: Si Nguyen'}
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-xs font-sans leading-relaxed whitespace-pre-wrap select-all">
                {sampleTemplate}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] font-bold uppercase">Người gửi / Đại diện</span>
                  <span className="font-semibold text-white">Si Nguyen</span>
                  <span className="text-slate-400 block text-[10px] truncate">singuyenemail@gmail.com</span>
                </div>
                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] font-bold uppercase">Liên hệ trực tiếp</span>
                  <span className="font-semibold text-emerald-400 font-mono">+84702499445</span>
                  <span className="text-slate-400 block text-[10px]">WhatsApp / Zalo No.</span>
                </div>
                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] font-bold uppercase">Lưu trữ bằng chứng</span>
                  <span className="font-semibold text-amber-300">Thư Mục Bằng Chứng</span>
                  <span className="text-slate-400 block text-[10px]">Tự động đối soát hoa hồng</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Unverified Deals List */}
          {activeTab === 'deals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isVi ? `Danh Sách ${unverifiedDeals.length} Deal Chưa Xác Thực Sẽ Nhận Thư:` : `Unverified Deals List (${unverifiedDeals.length}):`}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {isVi ? 'Đang hiển thị các deal chưa có bằng chứng xác nhận' : 'Showing unverified deals'}
                </span>
              </div>

              {unverifiedDeals.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">
                    {isVi ? 'Toàn bộ thương vụ đã được xác minh thành công!' : 'All deals are verified!'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isVi ? 'Không còn khách hàng nào trong danh sách chưa xác thực.' : 'No pending unverified deals.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {unverifiedDeals.map((deal) => {
                    const payingParty = deal.payingParty || 'buyer';
                    const counterpartRole = payingParty === 'buyer' ? 'seller' : 'buyer';
                    const counterpartName = counterpartRole === 'seller' ? deal.sellerName : deal.buyerName;
                    const payingPartyName = payingParty === 'buyer' ? deal.buyerName : deal.sellerName;
                    const isAwaiting = deal.counterpartInquiryStatus === 'sent';

                    return (
                      <div 
                        key={deal.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                              #{deal.id}
                            </span>
                            <span className="text-xs font-bold text-white truncate max-w-sm">
                              {deal.productName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span>
                              <strong className="text-teal-400">{isVi ? 'Bên Nhận Thư:' : 'Recipient:'}</strong> {counterpartName} ({counterpartRole === 'seller' ? 'Xưởng' : 'Người Mua'})
                            </span>
                            <span>•</span>
                            <span>
                              <strong className="text-amber-400">{isVi ? 'Bên Nộp Phí:' : 'Paying:'}</strong> {payingPartyName}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-300">
                              {formatCurrency(deal.commissionFee, currency, exchangeRate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          {isAwaiting ? (
                            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                              <span>{isVi ? 'Đã gởi thư • Chờ khách phản hồi' : 'Inquiry sent • Waiting'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                              {isVi ? 'Chưa gửi thư' : 'Not sent'}
                            </span>
                          )}

                          {/* Quick response simulation button */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRecordReply(deal.id, true)}
                              disabled={processingReplyDealId === deal.id}
                              title={isVi ? 'Ghi nhận khách phản hồi: ĐÃ CHỐT THÀNH CÔNG (Lưu xác thực)' : 'Simulate affirmative reply (Save verification)'}
                              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRecordReply(deal.id, false)}
                              disabled={processingReplyDealId === deal.id}
                              title={isVi ? 'Ghi nhận khách phản hồi: CHƯA CHỐT (Gửi đối tác khác)' : 'Simulate unfulfilled reply (Recommend alternative)'}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-colors cursor-pointer"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Awaiting Replies & Feedback Management */}
          {activeTab === 'replies' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>{isVi ? `Các Deal Đã Gởi Thư Đang Đợi Phản Hồi (${awaitingReplyDeals.length}):` : `Awaiting Replies (${awaitingReplyDeals.length}):`}</span>
                </span>
                <button
                  onClick={handleSimulateAllReplies}
                  disabled={sending || awaitingReplyDeals.length === 0}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isVi ? 'Mô Phỏng Nhận Phản Hồi Toàn Bộ' : 'Simulate All Responses'}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {awaitingReplyDeals.map((deal) => {
                  const payingParty = deal.payingParty || 'buyer';
                  const counterpartRole = payingParty === 'buyer' ? 'seller' : 'buyer';
                  const counterpartName = counterpartRole === 'seller' ? deal.sellerName : deal.buyerName;

                  return (
                    <div 
                      key={deal.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300">
                            #{deal.id}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-sm">
                            {deal.productName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Đối tác: <strong className="text-teal-300">{counterpartName}</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-amber-400">
                          {isVi ? '⏳ Đã gửi thư theo mẫu của Si Nguyen • Chờ phản hồi' : 'Inquiry dispatched • Awaiting customer feedback'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRecordReply(deal.id, true)}
                            disabled={processingReplyDealId === deal.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isVi ? 'Khách Xác Nhận: Đã Chốt Deal' : 'Confirm Closed'}</span>
                          </button>
                          <button
                            onClick={() => handleRecordReply(deal.id, false)}
                            disabled={processingReplyDealId === deal.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>{isVi ? 'Khách Báo: Chưa Chốt' : 'Not Closed'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {unverifiedDeals.length > 0 
                ? (isVi ? `${unverifiedDeals.length} deal chưa xác minh` : `${unverifiedDeals.length} unverified`) 
                : (isVi ? 'Đã xác minh toàn bộ' : 'All verified')}
            </span>

            <button
              onClick={handleBulkDispatch}
              disabled={sending || unverifiedDeals.length === 0}
              className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                unverifiedDeals.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-950/40'
              }`}
              id="bulk-send-unverified-inquiry-btn"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{isVi ? 'Đang gửi tới toàn bộ khách...' : 'Sending in Bulk...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {isVi 
                      ? `Gởi Thư Xác Thực Cho Toàn Bộ Khách Chưa Xác Thực (${unverifiedDeals.length})` 
                      : `Send Inquiry to All Unverified (${unverifiedDeals.length})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCounterpartInquiryModal;
