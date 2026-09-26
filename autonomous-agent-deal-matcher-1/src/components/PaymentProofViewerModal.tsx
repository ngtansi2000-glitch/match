/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Download, CheckCircle2, AlertTriangle, Landmark, ShieldCheck, Calendar, Hash, QrCode, Copy, Check } from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble } from '../types';

interface PaymentProofViewerModalProps {
  deal: MatchingBubble | null;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const PaymentProofViewerModal: React.FC<PaymentProofViewerModalProps> = ({
  deal,
  isOpen,
  onClose,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  if (!isOpen || !deal) return null;

  const isVi = language === 'vi';
  const [showVietQr, setShowVietQr] = useState<boolean>(false);
  const [copiedStk, setCopiedStk] = useState<boolean>(false);

  const commissionAmountVnd = Math.round(
    currency === 'VND' 
      ? deal.commissionFee 
      : deal.commissionFee * exchangeRate
  );

  const vietQrUrl = `https://img.vietqr.io/image/970403-060129073198-compact2.png?amount=${commissionAmountVnd}&addInfo=${encodeURIComponent(`HOAHONG ${deal.id}`)}&accountName=${encodeURIComponent('NGUYEN TAN SI')}`;
  const hasProof = Boolean(deal.paymentProofUrl);

  const handleDownload = () => {
    if (!deal.paymentProofUrl) return;
    const a = document.createElement('a');
    a.href = deal.paymentProofUrl;
    a.download = `BienLai_HoaHong_${deal.id}_${deal.paymentTransactionRef || 'Sacombank'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isVi ? 'Chứng Từ Chuyển Khoản Hoa Hồng Của Khách Hàng' : 'Customer Commission Payment Proof'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                  {deal.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {deal.productName} • {deal.buyerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          {hasProof ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">
                    {isVi ? 'Đã Nhận Được Hình Ảnh Chuyển Tiền Của Khách' : 'Payment Proof Verified'}
                  </h4>
                  <p className="text-xs text-emerald-400/80 mt-0.5">
                    {isVi 
                      ? `Khoản hoa hồng ${formatCurrency(deal.commissionFee, currency, exchangeRate)} đã có hình ảnh biên lai đối soát hợp lệ.`
                      : `Commission fee of ${formatCurrency(deal.commissionFee, currency, exchangeRate)} verified with valid customer receipt.`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                {isVi ? 'Tải Biên Lai' : 'Download'}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-300">
                  {isVi ? 'Chưa Có Hình Ảnh Chuyển Tiền Của Khách Gởi' : 'No Payment Proof Available'}
                </h4>
                <p className="text-xs text-amber-400/80 mt-0.5 font-medium">
                  {isVi 
                    ? 'Quy tắc: Nếu chưa có hình ảnh chuyển tiền của khách gởi, xem như chưa nhận được thanh toán (đang ghi nhận công nợ).'
                    : 'Rule: Without customer transfer proof, this commission is considered unpaid debt.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block">{isVi ? 'Số Tiền Hoa Hồng' : 'Commission Fee'}</span>
              <span className="text-sm font-bold text-amber-400 mt-1 block">
                {formatCurrency(deal.commissionFee, currency, exchangeRate)}
              </span>
              <span className="text-[10px] text-slate-500">({deal.commissionPercent}% platform)</span>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block">{isVi ? 'Mã Tham Chiếu FT' : 'Ref Code'}</span>
              <span className="text-xs font-mono font-bold text-blue-400 mt-1 block truncate">
                {deal.paymentTransactionRef || (hasProof ? 'SCB-PENDING' : 'N/A')}
              </span>
              <span className="text-[10px] text-slate-500">{isVi ? 'Giao dịch ngân hàng' : 'Bank transaction'}</span>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Tài Khoản Thụ Hưởng' : 'Beneficiary'}</span>
                <button
                  type="button"
                  onClick={() => setShowVietQr(!showVietQr)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <QrCode className="w-3 h-3" />
                  <span>{showVietQr ? (isVi ? 'Ẩn QR' : 'Hide') : 'VietQR'}</span>
                </button>
              </div>
              <span className="text-xs font-bold text-white mt-1 block">
                NGUYỄN TẤN SĨ (NGUYEN TAN SI)
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-amber-300 font-mono font-semibold">Sacombank 060129073198</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('060129073198');
                    setCopiedStk(true);
                    setTimeout(() => setCopiedStk(false), 2000);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title={isVi ? 'Sao chép STK' : 'Copy STK'}
                >
                  {copiedStk ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block">{isVi ? 'Thời Gian Nhận' : 'Proof Date'}</span>
              <span className="text-xs font-medium text-slate-300 mt-1 block">
                {deal.paymentProofTimestamp 
                  ? new Date(deal.paymentProofTimestamp).toLocaleDateString('vi-VN')
                  : (isVi ? 'Chưa có' : 'Pending')}
              </span>
              <span className="text-[10px] text-slate-500">
                {deal.paymentProofTimestamp 
                  ? new Date(deal.paymentProofTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </span>
            </div>
          </div>

          {/* Optional VietQR Popup / Collapsible in Viewer */}
          {showVietQr && (
            <div className="p-3 bg-slate-950/80 border border-slate-700/70 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-xs animate-in fade-in duration-150">
              <div className="bg-white p-2 rounded-lg shadow max-w-[150px]">
                <img src={vietQrUrl} alt="VietQR" className="w-full h-auto object-contain" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="font-bold text-amber-400 block text-xs">Mã VietQR Sacombank 24/7</span>
                <p className="text-slate-300 text-[11px]">
                  Số tiền hoa hồng: <strong className="text-white">{commissionAmountVnd.toLocaleString('vi-VN')} VND</strong>
                </p>
                <p className="text-slate-300 text-[11px]">
                  STK: <strong className="text-amber-300 font-mono">060129073198</strong> • Ngân hàng: <strong className="text-white">Sacombank</strong>
                </p>
                <p className="text-slate-300 text-[11px]">
                  Chủ TK: <strong className="text-emerald-400">NGUYỄN TẤN SĨ</strong>
                </p>
                <p className="text-slate-400 text-[10px]">
                  Nội dung: <span className="font-mono text-slate-300">HOAHONG {deal.id}</span>
                </p>
              </div>
            </div>
          )}

          {/* Customer Note if any */}
          {deal.paymentCustomerNote && (
            <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-xs">
              <span className="text-slate-400 font-medium mr-2">{isVi ? 'Ghi chú từ khách hàng:' : 'Customer Note:'}</span>
              <span className="text-slate-200">{deal.paymentCustomerNote}</span>
            </div>
          )}

          {/* Proof Image Render Canvas */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[320px]">
            {hasProof ? (
              <div className="relative group max-w-lg w-full">
                <img
                  src={deal.paymentProofUrl}
                  alt={`Payment proof for ${deal.id}`}
                  className="w-full h-auto rounded-lg shadow-xl border border-slate-700/60 object-contain max-h-[500px]"
                />
                <div className="mt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isVi ? 'Hình ảnh khách hàng cung cấp đối soát thành công' : 'Customer-submitted verified receipt'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-dashed border-slate-600 flex items-center justify-center mx-auto text-slate-500">
                  <AlertTriangle className="w-8 h-8 text-amber-500/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    {isVi ? 'Chưa có hình ảnh chứng từ nào cho thương vụ này' : 'No payment proof image for this deal'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {isVi 
                      ? 'Khách hàng cần gởi hình ảnh biên lai chuyển tiền hoa hồng để hệ thống xác nhận đóng thương vụ.'
                      : 'The customer must submit a transfer proof image to close this deal and clear debt.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors"
          >
            {isVi ? 'Đóng Cửa Sổ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
