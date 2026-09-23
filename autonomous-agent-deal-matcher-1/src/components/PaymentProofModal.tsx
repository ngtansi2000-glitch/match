/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, AlertTriangle, Landmark, 
  FileText, ShieldCheck, Image as ImageIcon,
  QrCode, Copy, Check, Download, Share2, Sparkles,
  ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble } from '../types';
import { PaymentProofFileUpload } from './PaymentProofFileUpload';
import { safeFetchJson } from '../lib/api';

interface PaymentProofModalProps {
  deal: MatchingBubble | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBubble: MatchingBubble) => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

// User's verified banking credentials for commission settlement
export const SACOMBANK_INFO = {
  bankName: 'SACOMBANK',
  bankFullName: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
  accountNumber: '060129073198',
  formattedAccount: '060129073198',
  beneficiaryName: 'NGUYỄN TẤN SĨ',
  beneficiaryNameAscii: 'NGUYEN TAN SI',
  bin: '970403', // Sacombank National BIN code
  country: 'VIETNAM'
};

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  deal,
  isOpen,
  onClose,
  onSuccess,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000
}) => {
  if (!isOpen || !deal) return null;

  const isVi = language === 'vi';

  const [imageUrl, setImageUrl] = useState<string>(deal.paymentProofUrl || '');
  const [transactionRef, setTransactionRef] = useState<string>(
    deal.paymentTransactionRef || `SCB${Math.floor(100000000 + Math.random() * 900000000)}`
  );
  const [customerNote, setCustomerNote] = useState<string>(
    deal.paymentCustomerNote || `${deal.buyerName} đã chuyển khoản hoa hồng deal ${deal.id}`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // VietQR states
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [qrCopiedField, setQrCopiedField] = useState<string | null>(null);
  const [qrTemplate, setQrTemplate] = useState<'compact2' | 'compact' | 'qr_only'>('compact2');
  const [customQrMemo, setCustomQrMemo] = useState<string>(`HOAHONG ${deal.id}`);
  const [isQrLoading, setIsQrLoading] = useState<boolean>(false);

  // Calculate commission in VND
  const commissionAmountVnd = Math.round(
    currency === 'VND' 
      ? deal.commissionFee 
      : deal.commissionFee * exchangeRate
  );

  const qrMemoText = (customQrMemo || `HOAHONG ${deal.id}`).trim();
  
  // VietQR endpoint format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
  const vietQrUrl = `https://img.vietqr.io/image/${SACOMBANK_INFO.bin}-${SACOMBANK_INFO.accountNumber}-${qrTemplate}.png?amount=${commissionAmountVnd}&addInfo=${encodeURIComponent(qrMemoText)}&accountName=${encodeURIComponent(SACOMBANK_INFO.beneficiaryNameAscii)}`;

  const handleCopy = (text: string, fieldName: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setQrCopiedField(fieldName);
      setTimeout(() => setQrCopiedField(null), 2000);
    }
  };

  const handleCopyAllBankDetails = () => {
    const fullText = isVi
      ? `THÔNG TIN THANH TOÁN HOA HỒNG VIETQR SACOMBANK:
- Ngân Hàng: ${SACOMBANK_INFO.bankFullName}
- Số Tài Khoản (STK): ${SACOMBANK_INFO.accountNumber}
- Chủ Tài Khoản: ${SACOMBANK_INFO.beneficiaryName} (${SACOMBANK_INFO.beneficiaryNameAscii})
- Số Tiền: ${commissionAmountVnd.toLocaleString('vi-VN')} VND
- Nội Dung Chuyển Khoản: ${qrMemoText}
- Mã Thương Vụ: ${deal.id} (${deal.productName})`
      : `COMMISSION PAYMENT DETAILS VIA SACOMBANK VIETQR:
- Bank: ${SACOMBANK_INFO.bankFullName}
- Account No: ${SACOMBANK_INFO.accountNumber}
- Beneficiary: ${SACOMBANK_INFO.beneficiaryName} (${SACOMBANK_INFO.beneficiaryNameAscii})
- Amount: ${commissionAmountVnd.toLocaleString('vi-VN')} VND
- Transfer Memo: ${qrMemoText}
- Deal ID: ${deal.id} (${deal.productName})`;

    handleCopy(fullText, 'all');
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(vietQrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `VietQR_Sacombank_${SACOMBANK_INFO.accountNumber}_Deal_${deal.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(vietQrUrl, '_blank');
    }
  };

  // Sync state if deal changes
  useEffect(() => {
    if (deal) {
      setImageUrl(deal.paymentProofUrl || '');
      setTransactionRef(deal.paymentTransactionRef || `SCB${Math.floor(100000000 + Math.random() * 900000000)}`);
      setCustomerNote(deal.paymentCustomerNote || `${deal.buyerName} đã chuyển khoản hoa hồng deal ${deal.id}`);
      setCustomQrMemo(`HOAHONG ${deal.id}`);
      setErrorMessage(null);
    }
  }, [deal]);

  const handleSubmit = async () => {
    // Strict requirement per prompt:
    // "Nếu chưa có hình ảnh chuyển tiền của khách gởi. xem như chưa nhận được thanh toán"
    if (!imageUrl) {
      setErrorMessage(
        isVi 
          ? 'Bắt buộc: Khách hàng phải gởi hình ảnh biên lai đã chuyển tiền Hoa Hồng để đóng thương vụ. Nếu chưa có hình ảnh, xem như chưa nhận được thanh toán!'
          : 'Mandatory: Customer transfer proof image is required to close the deal. Without proof, payment is considered unreceived.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await safeFetchJson<{
        success: boolean;
        bubble: MatchingBubble;
        error?: string;
      }>('/api/deal/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairId: deal.id,
          paymentProofUrl: imageUrl,
          paymentTransactionRef: transactionRef,
          paymentCustomerNote: customerNote
        })
      });

      if (response && response.success && response.bubble) {
        onSuccess(response.bubble);
        onClose();
      } else {
        setErrorMessage(response?.error || (isVi ? 'Không thể hoàn tất đóng thương vụ' : 'Failed to finalize deal'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isVi ? 'Lỗi kết nối máy chủ' : 'Server connection error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isVi ? 'Xác Minh Chuyển Tiền Hoa Hồng & Đóng Thương Vụ' : 'Verify Commission Remittance & Close Deal'}
              </h3>
              <p className="text-xs text-slate-400">
                {deal.id} • {deal.productName}
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Policy Banner Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-1">
                {isVi ? 'Quy Tắc Đóng Thương Vụ & Theo Dõi Công Nợ:' : 'Commission Settlement Policy:'}
              </span>
              <p className="text-slate-300 leading-relaxed">
                {isVi 
                  ? 'Khi thương vụ kết thúc, bắt buộc yêu cầu khách hàng gởi hình ảnh đã chuyển tiền Hoa Hồng để đóng thương vụ. Nếu chưa có hình ảnh chuyển tiền của khách gởi, hệ thống xem như chưa nhận được thanh toán và tiếp tục theo dõi công nợ.'
                  : 'Upon closing a deal, customer must submit payment proof for commission. Without a valid proof image, commission remains marked as unpaid debt.'
                }
              </p>
            </div>
          </div>

          {/* Deal & Commission Summary */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/50 pb-2.5">
              <div>
                <span className="text-xs text-slate-400 block">{isVi ? 'Khách Mua / Người Chuyển' : 'Buyer Client'}</span>
                <span className="text-sm font-semibold text-white">{deal.buyerName}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">{isVi ? 'Số Tiền Hoa Hồng Bắt Buộc' : 'Commission Due'}</span>
                <span className="text-base font-extrabold text-amber-400">
                  {formatCurrency(deal.commissionFee, currency, exchangeRate)}
                </span>
                <span className="text-[10px] text-slate-400 block">({deal.commissionPercent}% platform rate)</span>
              </div>
            </div>

            {/* Recipient Bank Details & VietQR Trigger */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-700/70 rounded-xl space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black tracking-tighter">
                    SCB
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">{isVi ? 'Tài khoản Sacombank thụ hưởng:' : 'Sacombank Beneficiary:'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        {isVi ? 'Chính Chủ' : 'Verified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-white text-sm">{SACOMBANK_INFO.beneficiaryName}</span>
                      <span className="text-slate-400 font-mono text-xs">({SACOMBANK_INFO.beneficiaryNameAscii})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-amber-300 font-bold text-xs tracking-wider">
                        {SACOMBANK_INFO.accountNumber}
                      </span>
                      <span className="text-slate-400 text-[10px]">({SACOMBANK_INFO.bankFullName})</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(SACOMBANK_INFO.accountNumber, 'account')}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isVi ? 'Sao chép STK' : 'Copy Account Number'}
                      >
                        {qrCopiedField === 'account' ? (
                          <span className="text-emerald-400 text-[10px] flex items-center gap-0.5 font-bold">
                            <Check className="w-3 h-3" /> {isVi ? 'Đã chép' : 'Copied'}
                          </span>
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 hover:text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Generate Payment QR Button */}
                <button
                  type="button"
                  id="generate-payment-qr-btn"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border ${
                    showQrCode
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 hover:bg-blue-600/40'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-400/30 shadow-blue-900/30'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {showQrCode 
                      ? (isVi ? 'Đóng Mã VietQR' : 'Close VietQR') 
                      : (isVi ? 'Tạo Mã VietQR Thanh Toán' : 'Generate Payment QR')}
                  </span>
                  {showQrCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Dynamic VietQR Panel */}
              {showQrCode && (
                <div className="pt-3 border-t border-slate-700/70 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">
                        {isVi ? 'Mã VietQR Chuẩn Napas 24/7 (Quét Tự Động Điền Tiền & STK)' : 'National VietQR Standard (Auto-Fills STK & Amount)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['compact2', 'compact', 'qr_only'] as const).map((tmpl) => (
                        <button
                          key={tmpl}
                          type="button"
                          onClick={() => setQrTemplate(tmpl)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                            qrTemplate === tmpl
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tmpl === 'compact2' ? (isVi ? 'Chi Tiết' : 'Detail') : tmpl === 'compact' ? (isVi ? 'Gọn' : 'Compact') : 'QR'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {/* VietQR Image */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white p-2.5 rounded-lg shadow-inner">
                      <div className="relative w-full aspect-square max-w-[210px] flex items-center justify-center">
                        <img
                          src={vietQrUrl}
                          alt="VietQR Sacombank"
                          className="w-full h-full object-contain rounded"
                          onLoad={() => setIsQrLoading(false)}
                          onError={() => setIsQrLoading(false)}
                        />
                      </div>
                      <span className="text-[10px] text-slate-600 font-semibold mt-1">
                        VietQR • Sacombank 060129073198
                      </span>
                    </div>

                    {/* QR Payment Information and Quick Actions */}
                    <div className="sm:col-span-7 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1.5 text-slate-300">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                          <span className="text-[11px] text-slate-400">{isVi ? 'Ngân hàng:' : 'Bank:'}</span>
                          <span className="font-bold text-white">SACOMBANK (970403)</span>
                        </div>
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                          <span className="text-[11px] text-slate-400">{isVi ? 'Số tài khoản:' : 'Account:'}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-300">{SACOMBANK_INFO.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(SACOMBANK_INFO.accountNumber, 'account')}
                              className="text-slate-400 hover:text-white cursor-pointer"
                              title="Copy"
                            >
                              {qrCopiedField === 'account' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                          <span className="text-[11px] text-slate-400">{isVi ? 'Người thụ hưởng:' : 'Beneficiary:'}</span>
                          <span className="font-bold text-emerald-400">{SACOMBANK_INFO.beneficiaryName}</span>
                        </div>
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                          <span className="text-[11px] text-slate-400">{isVi ? 'Số tiền thanh toán:' : 'Amount Due:'}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-amber-400 text-sm">
                              {commissionAmountVnd.toLocaleString('vi-VN')} VND
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(commissionAmountVnd.toString(), 'amount')}
                              className="text-slate-400 hover:text-white cursor-pointer"
                              title="Copy"
                            >
                              {qrCopiedField === 'amount' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Editable Transfer Memo */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-400">{isVi ? 'Nội dung chuyển khoản:' : 'Transfer Memo:'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(qrMemoText, 'memo')}
                              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                            >
                              {qrCopiedField === 'memo' ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> {isVi ? 'Đã chép' : 'Copied'}
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5">
                                  <Copy className="w-2.5 h-2.5" /> {isVi ? 'Chép nội dung' : 'Copy memo'}
                                </span>
                              )}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={customQrMemo}
                            onChange={(e) => setCustomQrMemo(e.target.value)}
                            placeholder={`HOAHONG ${deal.id}`}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-amber-300 font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleDownloadQr}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors border border-slate-700 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>{isVi ? 'Tải Ảnh VietQR' : 'Download QR'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyAllBankDetails}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors border border-slate-700 cursor-pointer"
                        >
                          {qrCopiedField === 'all' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300 font-bold">{isVi ? 'Đã Sao Chép Đầy Đủ!' : 'Copied All!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{isVi ? 'Sao Chép Thông Tin' : 'Copy All Info'}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Quick shortcut: Use VietQR image directly as proof URL or note
                            setImageUrl(vietQrUrl);
                            setCustomerNote(`${deal.buyerName} đã quét VietQR Sacombank thanh toán hoa hồng deal ${deal.id}`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-semibold transition-colors border border-emerald-500/30 cursor-pointer ml-auto"
                          title={isVi ? 'Dùng VietQR làm ảnh bằng chứng' : 'Use VietQR as proof url'}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isVi ? 'Dùng Làm Mẫu Bill' : 'Use as Sample'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    {isVi
                      ? '💡 Mẹo: Quý khách hoặc đối tác mở bất kỳ App Ngân Hàng (Sacombank Pay, VCB Digibank, Techcombank, MB...) hoặc Ví điện tử (MoMo, ZaloPay) bấm Quét Mã QR để thanh toán hoa hồng tức thì mà không cần nhập tay thông tin.'
                      : '💡 Tip: Open any banking app or e-wallet to scan this VietQR. All beneficiary and amount details are auto-filled for instant clearing.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Image Upload Area Component */}
          <div>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              {isVi ? 'Hình Ảnh Khách Hàng Gởi Chứng Minh Chuyển Tiền *' : 'Customer Payment Proof Image *'}
            </label>

            <PaymentProofFileUpload
              deal={deal}
              value={imageUrl}
              onChange={(newUrl, meta) => {
                setImageUrl(newUrl);
                setErrorMessage(null);
                if (meta?.name && !customerNote) {
                  setCustomerNote(`${deal.buyerName} đã gởi biên lai ${meta.name}`);
                }
              }}
              onClear={() => setImageUrl('')}
              allowSampleGeneration={true}
              language={language}
              currency={currency}
              exchangeRate={exchangeRate}
            />
          </div>

          {/* Reference and Notes inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {isVi ? 'Mã Giao Dịch Ngân Hàng / FT Code' : 'Transaction Ref Code'}
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="VD: SCB98234129841"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {isVi ? 'Ghi Chú Xác Nhận Của Khách' : 'Customer Note'}
              </label>
              <input
                type="text"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder={isVi ? 'Khách đã thanh toán đủ 1.5%' : 'Customer confirmed payment'}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {imageUrl ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {isVi ? 'Đủ điều kiện đóng thương vụ & tất toán công nợ' : 'Eligible for deal closure and debt clearance'}
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {isVi ? 'Chưa nhận được thanh toán (đang là công nợ)' : 'Considered unpaid debt without receipt'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors flex-1 sm:flex-initial"
            >
              {isVi ? 'Hủy Bỏ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !imageUrl}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-md ${
                imageUrl && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isVi ? 'Đang Xác Nhận...' : 'Verifying...'}</span>
                </>
              ) : imageUrl ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Xác Nhận Đã Nhận Tiền & Đóng Thương Vụ' : 'Confirm Payment & Close Deal'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Chưa Có Ảnh Bill (Không Thể Đóng)' : 'Proof Required to Close'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
