/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, Image as ImageIcon, Camera, Clipboard, RotateCw, 
  Trash2, Eye, CheckCircle2, AlertTriangle, Sparkles, X, 
  FileCheck, ShieldAlert, RefreshCw, ZoomIn
} from 'lucide-react';
import { Language, Currency, formatCurrency } from '../lib/i18n';
import { MatchingBubble } from '../types';
import { generateBankingReceiptSvg } from '../lib/receiptGenerator';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  dimensions?: { width: number; height: number };
  uploadedAt: string;
}

export interface PaymentProofFileUploadProps {
  deal?: MatchingBubble | null;
  value?: string;
  onChange: (imageUrl: string, metadata?: FileMetadata) => void;
  onClear?: () => void;
  disabled?: boolean;
  compact?: boolean;
  allowSampleGeneration?: boolean;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
  className?: string;
}

export const PaymentProofFileUpload: React.FC<PaymentProofFileUploadProps> = ({
  deal,
  value = '',
  onChange,
  onClear,
  disabled = false,
  compact = false,
  allowSampleGeneration = true,
  language = 'vi',
  currency = 'VND',
  exchangeRate = 25000,
  className = ''
}) => {
  const isVi = language === 'vi';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rotationDegree, setRotationDegree] = useState<number>(0);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Inspect image dimensions once loaded
  const inspectDimensions = (dataUrl: string, baseMeta: Omit<FileMetadata, 'dimensions'>) => {
    const img = new Image();
    img.onload = () => {
      const fullMeta: FileMetadata = {
        ...baseMeta,
        dimensions: { width: img.naturalWidth, height: img.naturalHeight }
      };
      setMetadata(fullMeta);
      onChange(dataUrl, fullMeta);
      setIsProcessing(false);
    };
    img.onerror = () => {
      setMetadata(baseMeta);
      onChange(dataUrl, baseMeta);
      setIsProcessing(false);
    };
    img.src = dataUrl;
  };

  // Process raw File from upload, drag, paste, or camera
  const processFile = useCallback((file: File) => {
    setErrorMessage(null);

    // Validate mime type: images only
    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        isVi 
          ? 'Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp hình ảnh (PNG, JPG, JPEG, WebP, SVG).' 
          : 'Unsupported file format. Please upload an image file (PNG, JPG, JPEG, WebP, SVG).'
      );
      return;
    }

    // Validate size: max 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(
        isVi 
          ? `Kích thước tệp quá lớn (${formatBytes(file.size)}). Giới hạn tối đa là 15MB.` 
          : `File size is too large (${formatBytes(file.size)}). Maximum limit is 15MB.`
      );
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        setRotationDegree(0);
        inspectDimensions(dataUrl, {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        });
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMessage(isVi ? 'Không thể đọc tệp hình ảnh.' : 'Failed to read image file.');
    };
    reader.readAsDataURL(file);
  }, [isVi]);

  // Handle Drag & Drop Events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Manual Input File Change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // reset input value so re-uploading same file name triggers change
    e.target.value = '';
  };

  // Handle Clipboard Paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (!e.clipboardData) return;

      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            processFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [disabled, processFile]);

  // Manual Paste from Clipboard button trigger
  const handleReadClipboard = async () => {
    if (disabled) return;
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setErrorMessage(
          isVi 
            ? 'Trình duyệt không hỗ trợ truy cập clipboard trực tiếp. Hãy bấm phím tắt Ctrl+V (Cmd+V trên Mac) để dán ảnh chụp màn hình.' 
            : 'Clipboard direct read not supported. Press Ctrl+V (Cmd+V) to paste screenshots directly.'
        );
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      let foundImage = false;
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `clipboard-proof-${Date.now()}.${imageType.split('/')[1] || 'png'}`, { type: imageType });
          processFile(file);
          foundImage = true;
          break;
        }
      }
      if (!foundImage) {
        setErrorMessage(
          isVi 
            ? 'Không tìm thấy hình ảnh nào trong Clipboard. Vui lòng sao chép ảnh chụp biên lai trước rồi thử lại.' 
            : 'No image found in clipboard. Please copy a receipt screenshot and try again.'
        );
      }
    } catch (err: any) {
      console.warn('Clipboard read error:', err);
      setErrorMessage(
        isVi 
          ? 'Không thể dán từ clipboard. Hãy sử dụng phím tắt Ctrl+V để dán trực tiếp.' 
          : 'Unable to access clipboard. Press Ctrl+V directly to paste.'
      );
    }
  };

  // Rotate Image 90 Degrees Clockwise
  const handleRotate = () => {
    setRotationDegree(prev => (prev + 90) % 360);
  };

  // Clear / Remove Uploaded Image
  const handleRemove = () => {
    setMetadata(null);
    setRotationDegree(0);
    setErrorMessage(null);
    onChange('');
    if (onClear) onClear();
  };

  // Generate Sample Sacombank Banking Receipt SVG
  const handleGenerateSampleReceipt = () => {
    if (!deal) {
      setErrorMessage(isVi ? 'Vui lòng chọn hoặc liên kết thương vụ để tạo biên lai' : 'No deal linked to generate receipt');
      return;
    }

    const sample = generateBankingReceiptSvg({
      dealId: deal.id,
      buyerName: deal.buyerName,
      commissionAmountVND: deal.commissionFee,
      beneficiaryName: 'NGUYỄN TẤN SĨ',
      beneficiaryAccount: '060129073198'
    });

    setRotationDegree(0);
    inspectDimensions(sample, {
      name: `sacombank-receipt-${deal.id}.svg`,
      size: sample.length,
      type: 'image/svg+xml',
      uploadedAt: new Date().toISOString()
    });
  };

  return (
    <div className={`space-y-3 ${className}`} id="payment-proof-file-uploader">
      {/* Hidden File Inputs for Manual Browse & Direct Camera Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center justify-between text-rose-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="p-1 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* State A: An image is uploaded / present */}
      {value ? (
        <div className="p-4 bg-slate-950 border border-slate-700/80 rounded-2xl shadow-lg relative group">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Thumbnail with Rotation */}
            <div 
              className="relative w-full sm:w-48 h-48 sm:h-36 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center cursor-pointer group/thumb"
              onClick={() => setIsInspecting(true)}
              title={isVi ? 'Nhấn để phóng to kiểm tra biên lai' : 'Click to inspect full size'}
            >
              <img
                src={value}
                alt="Payment Proof Receipt"
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover/thumb:scale-105"
                style={{ transform: `rotate(${rotationDegree}deg)` }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
                <ZoomIn className="w-5 h-5" />
                <span>{isVi ? 'Phóng to' : 'Inspect'}</span>
              </div>
            </div>

            {/* Metadata & Controls */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isVi ? 'Đã Nhận Hình Ảnh Bằng Chứng' : 'Payment Proof Image Attached'}</span>
                </span>

                <span className="text-[10px] text-slate-400 font-mono">
                  {metadata?.dimensions ? `${metadata.dimensions.width}×${metadata.dimensions.height}px` : 'Image Validated'}
                </span>
              </div>

              {/* Deal commission connection info if provided */}
              {deal && (
                <div className="p-2 bg-slate-900/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-slate-500">{isVi ? 'Đóng deal: ' : 'Settling deal: '}</span>
                    <span className="font-bold text-white font-mono">#{deal.id}</span>
                    <span className="text-slate-400 ml-1 truncate">({deal.buyerName})</span>
                  </div>
                  <span className="font-extrabold text-amber-400 font-mono shrink-0 ml-2">
                    {formatCurrency(deal.commissionFee, currency, exchangeRate)}
                  </span>
                </div>
              )}

              {/* File details */}
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div className="truncate">
                  <span className="text-slate-500">{isVi ? 'Tên tệp: ' : 'File: '}</span>
                  <span className="text-slate-200 font-medium">{metadata?.name || 'receipt-proof.png'}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span>{isVi ? 'Kích thước: ' : 'Size: '}<strong className="text-slate-300">{metadata ? formatBytes(metadata.size) : 'Ready'}</strong></span>
                  <span>•</span>
                  <span>{isVi ? 'Loại: ' : 'Type: '}<strong className="text-slate-300">{metadata?.type || 'Image'}</strong></span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  id="replace-payment-proof-btn"
                >
                  <RefreshCw className="w-3 h-3 text-blue-400" />
                  <span>{isVi ? 'Đổi Ảnh Khác' : 'Replace Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={isVi ? 'Xoay ảnh 90 độ' : 'Rotate 90 degrees'}
                  id="rotate-payment-proof-btn"
                >
                  <RotateCw className="w-3 h-3 text-amber-400" />
                  <span>{isVi ? 'Xoay Ảnh 90°' : 'Rotate'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInspecting(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  id="inspect-payment-proof-btn"
                >
                  <Eye className="w-3 h-3 text-indigo-400" />
                  <span>{isVi ? 'Xem Chi Tiết' : 'Zoom'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                  id="remove-payment-proof-btn"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>{isVi ? 'Xóa' : 'Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* State B: Empty Drop Zone - Waiting for file upload */
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-6 transition-all duration-200 text-center ${
            isDragOver
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-700/80 bg-slate-950/70 hover:border-slate-600 hover:bg-slate-900/50'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          id="payment-proof-dropzone"
        >
          {/* Main Drop Area Content */}
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-7 h-7 animate-pulse" />
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">
                {isVi ? 'Kéo & Thả Hình Ảnh Biên Lai Vào Đây' : 'Drag & Drop Payment Proof Image Here'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isVi 
                  ? 'Hỗ trợ định dạng PNG, JPG, JPEG, WebP hoặc SVG (Tối đa 15MB). Hoặc nhấn phím Ctrl+V để dán trực tiếp ảnh chụp màn hình.' 
                  : 'Supports PNG, JPG, JPEG, WebP or SVG (Up to 15MB). Or press Ctrl+V to paste screenshot directly.'}
              </p>
            </div>

            {/* Quick Upload Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {/* Manual File Selector */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-950/40 flex items-center gap-2 cursor-pointer active:scale-95"
                id="browse-files-btn"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isVi ? 'Chọn Ảnh Từ Thiết Bị' : 'Browse Local Files'}</span>
              </button>

              {/* Direct Camera on Mobile */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                title={isVi ? 'Chụp ảnh trực tiếp từ máy ảnh' : 'Take photo with camera'}
                id="camera-capture-btn"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>{isVi ? 'Chụp Ảnh' : 'Camera'}</span>
              </button>

              {/* Clipboard Paste Trigger */}
              <button
                type="button"
                onClick={handleReadClipboard}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                title={isVi ? 'Dán ảnh từ bộ nhớ tạm (Clipboard)' : 'Paste from clipboard'}
                id="paste-clipboard-btn"
              >
                <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isVi ? 'Dán (Ctrl+V)' : 'Paste'}</span>
              </button>
            </div>

            {/* Synthetic Sacombank Receipt Generator Shortcut */}
            {allowSampleGeneration && deal && (
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleGenerateSampleReceipt}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors font-semibold cursor-pointer"
                  id="generate-sacombank-sample-btn"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isVi 
                      ? 'Tạo Biên Lai Sacombank Mẫu (060129073198 - NGUYỄN TẤN SĨ)' 
                      : 'Generate Official Sacombank Sample Proof (060129073198)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Inspecting Image in Full Detail */}
      {isInspecting && value && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsInspecting(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-4 overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  {isVi ? 'Kiểm Tra Chi Tiết Bằng Chứng Chuyển Tiền Hoa Hồng' : 'Inspect Payment Proof Remittance'}
                </h4>
              </div>
              <button
                onClick={() => setIsInspecting(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex items-center justify-center max-h-[70vh] overflow-auto bg-slate-950 rounded-xl my-2">
              <img
                src={value}
                alt="Full proof preview"
                className="max-h-[65vh] w-auto object-contain rounded"
                style={{ transform: `rotate(${rotationDegree}deg)` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>{metadata?.name || 'receipt-proof.png'}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 font-semibold"
                >
                  {isVi ? 'Xoay 90°' : 'Rotate'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsInspecting(false)}
                  className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold"
                >
                  {isVi ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
