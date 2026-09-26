/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Folder, FolderArchive, FileCheck, CheckCircle2, AlertTriangle, 
  Search, Filter, Plus, MessageSquare, ShieldCheck, Clock, User, 
  Building2, Send, ExternalLink, RefreshCw, ChevronRight, HeartHandshake
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble, DealExecutionConfirmation } from '../types';
import { safeFetchJson } from '../lib/api';

interface DealExecutionFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchingBubbles: MatchingBubble[];
  onDealUpdated?: (updatedBubble: MatchingBubble) => void;
  onOpenFriendlyInquiry?: (deal: MatchingBubble) => void;
  onOpenBulkInquiry?: () => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const DealExecutionFolderModal: React.FC<DealExecutionFolderModalProps> = ({
  isOpen,
  onClose,
  matchingBubbles,
  onDealUpdated,
  onOpenFriendlyInquiry,
  onOpenBulkInquiry,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  const isVi = language === 'vi';

  const [confirmations, setConfirmations] = useState<DealExecutionConfirmation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [selectedDealId, setSelectedDealId] = useState<string>('all');

  // Manual addition form
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formDealId, setFormDealId] = useState<string>('');
  const [formSenderRole, setFormSenderRole] = useState<'buyer' | 'seller'>('seller');
  const [formSenderName, setFormSenderName] = useState<string>('');
  const [formChannel, setFormChannel] = useState<'Zalo' | 'WhatsApp' | 'SMS' | 'B2B Chat' | 'Email'>('Zalo');
  const [formMessage, setFormMessage] = useState<string>('');
  const [formProofType, setFormProofType] = useState<'order_signed' | 'deposit_paid' | 'goods_delivered' | 'counterpart_confirmed'>('counterpart_confirmed');
  const [formNotes, setFormNotes] = useState<string>('');
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchFolderData = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        totalConfirmations: number;
        verifiedDealsCount: number;
        confirmations: DealExecutionConfirmation[];
      }>('/api/deal/confirmations/folder');

      if (res && res.confirmations) {
        setConfirmations(res.confirmations);
      }
    } catch (err) {
      console.error('Failed to load confirmations folder', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFolderData();
      if (matchingBubbles.length > 0 && !formDealId) {
        setFormDealId(matchingBubbles[0].id);
      }
    }
  }, [isOpen, matchingBubbles]);

  // Update sender name when form deal or role changes
  useEffect(() => {
    if (formDealId) {
      const d = matchingBubbles.find(b => b.id === formDealId);
      if (d) {
        setFormSenderName(formSenderRole === 'buyer' ? d.buyerName : d.sellerName);
      }
    }
  }, [formDealId, formSenderRole, matchingBubbles]);

  const filteredConfirmations = useMemo(() => {
    return confirmations.filter(item => {
      if (roleFilter !== 'all' && item.senderRole !== roleFilter) return false;
      if (selectedDealId !== 'all' && item.dealId !== selectedDealId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.dealId.toLowerCase().includes(q) ||
          item.dealProductName.toLowerCase().includes(q) ||
          item.senderName.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.channel.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [confirmations, roleFilter, selectedDealId, searchQuery]);

  const handleAddConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDealId || !formMessage.trim()) {
      setFormError(isVi ? 'Vui lòng nhập đầy đủ Mã Deal và nội dung tin nhắn xác thực' : 'Please provide Deal ID and message');
      return;
    }

    setIsSubmittingForm(true);
    setFormError(null);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        deal: MatchingBubble;
        confirmationItem: DealExecutionConfirmation;
      }>('/api/deal/confirmations/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: formDealId,
          senderRole: formSenderRole,
          senderName: formSenderName,
          channel: formChannel,
          message: formMessage,
          proofType: formProofType,
          notes: formNotes
        })
      });

      if (res.success && res.confirmationItem) {
        setConfirmations(prev => [res.confirmationItem, ...prev]);
        if (onDealUpdated && res.deal) {
          onDealUpdated(res.deal);
        }
        setShowAddForm(false);
        setFormMessage('');
        setFormNotes('');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Lỗi khi lưu tin xác thực');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      id="deal-execution-folder-modal"
    >
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Thư Mục Lưu Tin Xác Thực Thương Vụ' : 'Deal Execution Evidence Folder'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {confirmations.length} {isVi ? 'Bằng chứng' : 'Proofs'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi 
                  ? 'Lưu trữ các tin nhắn từ người mua / người bán xác thực giao dịch đã thực hiện để làm căn cứ yêu cầu thanh toán hoa hồng' 
                  : 'Centralized repository of confirmation messages from buyer or seller verifying deal execution'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isVi ? 'Thêm Tin Xác Thực' : 'Add Confirmation'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">{isVi ? 'Deal Đã Xác Minh Thực Hiện:' : 'Verified Deals:'}</span>
            <span className="font-bold text-emerald-400 font-mono">
              {matchingBubbles.filter(b => b.dealExecutionVerified).length} / {matchingBubbles.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">{isVi ? 'Deal Chưa Xác Minh:' : 'Unverified Deals:'}</span>
            <span className="font-bold text-amber-400 font-mono">
              {matchingBubbles.filter(b => !b.dealExecutionVerified).length}
            </span>
            {matchingBubbles.filter(b => !b.dealExecutionVerified).length > 0 && onOpenBulkInquiry && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBulkInquiry();
                }}
                className="ml-2 text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold transition-all flex items-center gap-1 cursor-pointer"
                title={isVi ? 'Gởi thư xác thực tới toàn bộ khách chưa xác minh' : 'Bulk send inquiry'}
              >
                <HeartHandshake className="w-3 h-3" />
                <span>{isVi ? 'Gởi Toàn Bộ' : 'Bulk Send'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">{isVi ? 'Quy chế sàn:' : 'Policy:'}</span>
            <span className="font-semibold text-slate-300">
              {isVi ? 'Bắt buộc có tin xác thực trước khi đòi nợ' : 'Proof required before reminder'}
            </span>
          </div>
        </div>

        {/* Add Confirmation Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddConfirmation} className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>{isVi ? 'Thêm Tin Nhắn Xác Thực Vào Thư Mục' : 'Add Confirmation Message to Folder'}</span>
              </span>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
            </div>

            {formError && (
              <div className="p-2 bg-rose-950/50 border border-rose-500/40 rounded-lg text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">{isVi ? 'Chọn Deal' : 'Select Deal'}</label>
                <select
                  value={formDealId}
                  onChange={(e) => setFormDealId(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {matchingBubbles.map((b) => (
                    <option key={b.id} value={b.id}>
                      Deal #{b.id} - {b.productName.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">{isVi ? 'Bên Gửi Tin' : 'Sender Role'}</label>
                <select
                  value={formSenderRole}
                  onChange={(e) => setFormSenderRole(e.target.value as any)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="seller">{isVi ? 'Người Bán (Seller)' : 'Seller'}</option>
                  <option value="buyer">{isVi ? 'Người Mua (Buyer)' : 'Buyer'}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">{isVi ? 'Tên Đối Tác' : 'Partner Name'}</label>
                <input
                  type="text"
                  value={formSenderName}
                  onChange={(e) => setFormSenderName(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Tên đối tác..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">{isVi ? 'Kênh Nhận Tin' : 'Channel'}</label>
                <select
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value as any)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Zalo">Zalo Direct</option>
                  <option value="WhatsApp">WhatsApp B2B</option>
                  <option value="SMS">SMS Message</option>
                  <option value="B2B Chat">B2B Platform Chat</option>
                  <option value="Email">Email Official</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                {isVi ? 'Nội Dung Tin Nhắn Xác Thực (Bằng chứng thương vụ đã thực hiện)' : 'Confirmation Message Content'}
              </label>
              <textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                placeholder={isVi ? 'Ví dụ: Dạ bên em xác nhận đã chốt hợp đồng và nhận tiền cọc cho đơn hàng...' : 'Enter message content confirming deal completion...'}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmittingForm || !formMessage.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSubmittingForm ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isVi ? 'Đang lưu...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isVi ? 'Lưu Vào Thư Mục' : 'Save to Folder'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isVi ? 'Tìm kiếm theo mã deal, đối tác, nội dung tin nhắn...' : 'Search proofs by deal ID, partner, text...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by Deal */}
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">{isVi ? 'Tất Cả Các Deal' : 'All Deals'}</option>
              {matchingBubbles.map(b => (
                <option key={b.id} value={b.id}>
                  Deal #{b.id} ({b.buyerName.slice(0, 15)}...)
                </option>
              ))}
            </select>

            {/* Filter by Role */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {[
                { id: 'all', label: isVi ? 'Tất Cả' : 'All' },
                { id: 'seller', label: isVi ? 'Người Bán' : 'Seller' },
                { id: 'buyer', label: isVi ? 'Người Mua' : 'Buyer' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    roleFilter === tab.id
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchFolderData}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title={isVi ? 'Làm mới thư mục' : 'Refresh folder'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Folder Item List */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs flex-1">
          {filteredConfirmations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Folder className="w-6 h-6" />
              </div>
              <p className="text-slate-400 font-medium">
                {isVi 
                  ? 'Chưa có tin nhắn xác thực nào khớp với bộ lọc tìm kiếm.' 
                  : 'No confirmation proof messages matching current filter.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Thêm Tin Xác Thực Thủ Công' : 'Add Manual Confirmation'}</span>
                </button>
              </div>
            </div>
          ) : (
            filteredConfirmations.map((item) => {
              const matchedDeal = matchingBubbles.find(b => b.id === item.dealId);
              const isSeller = item.senderRole === 'seller';

              return (
                <div 
                  key={item.id}
                  className="p-4 bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all space-y-2.5"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        DEAL #{item.dealId}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSeller
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      }`}>
                        {isSeller ? (isVi ? 'Bên Bán (Seller)' : 'Seller') : (isVi ? 'Bên Mua (Buyer)' : 'Buyer')}
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {item.senderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                        {item.channel}
                      </span>
                    </div>
                  </div>

                  {/* Product Title */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">{isVi ? 'Sản phẩm:' : 'Product:'}</span>
                    <span className="truncate">{item.dealProductName}</span>
                    {matchedDeal && (
                      <span className="ml-auto font-mono text-emerald-400 font-bold">
                        Hoa hồng: {formatCurrency(matchedDeal.commissionFee, currency, exchangeRate)}
                      </span>
                    )}
                  </div>

                  {/* Message Quote Box */}
                  <div className="p-3 bg-slate-900/90 border-l-2 border-amber-500 rounded-r-lg text-xs text-slate-200 leading-relaxed font-sans">
                    <p>"{item.message}"</p>
                  </div>

                  {/* Footer tags */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Bằng chứng hợp lệ: Đã xác thực thực hiện giao dịch' : 'Valid Evidence: Transaction execution confirmed'}</span>
                    </div>
                    {item.notes && (
                      <span className="text-slate-500 italic truncate max-w-md">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Unverified Deals Notice & Quick Inquiry Section */}
          {matchingBubbles.some(b => !b.dealExecutionVerified) && (
            <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isVi 
                    ? 'Các Thương Vụ Chưa Có Tin Nhắn Xác Thực (Chưa Thể Đòi Nợ Hoa Hồng)' 
                    : 'Deals Lacking Execution Proof (Reminders Blocked Until Verified)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {isVi 
                  ? 'Theo chỉ đạo: Chỉ gởi nhắc nợ khi đã xác minh Mã Deal đã được thực hiện. Hoa hồng nếu do một bên thanh toán, hãy tương tác tin nhắn thân thiện với bên còn lại để nhận tin xác thực.'
                  : 'Policy: Only send reminder once deal is verified. Inquire politely with the counterpart to collect proof.'}
              </p>

              <div className="space-y-2">
                {matchingBubbles.filter(b => !b.dealExecutionVerified).map(deal => {
                  const counterpart = deal.payingParty === 'seller' ? deal.buyerName : deal.sellerName;
                  const counterpartRole = deal.payingParty === 'seller' ? 'Người Mua' : 'Người Bán';

                  return (
                    <div key={deal.id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">Deal #{deal.id}</span>
                          <span className="text-white font-semibold">{deal.productName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Khách nộp phí: <span className="text-amber-200">{deal.buyerName}</span> | Phí: <span className="font-mono text-emerald-400 font-bold">{formatCurrency(deal.commissionFee, currency, exchangeRate)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenFriendlyInquiry) {
                            onOpenFriendlyInquiry(deal);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>{isVi ? `Tương Tác Với ${counterpartRole}` : 'Inquire Counterpart'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <span className="text-[11px] text-slate-400">
            {isVi 
              ? 'Thư mục lưu trữ phục vụ đối soát, kiểm toán và làm bằng chứng yêu cầu thanh toán hoa hồng' 
              : 'Audit proof archive for commission claims'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            {isVi ? 'Đóng Thư Mục' : 'Close Folder'}
          </button>
        </div>
      </div>
    </div>
  );
};
