/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  Flame,
  Award,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Building2,
  Check,
  ChevronRight,
  ExternalLink,
  Printer,
  X,
  Plus,
  Zap,
  Phone,
  Mail,
  MapPin,
  Landmark,
  BadgePercent,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AgencyContract, ManufacturerItem, ManufacturerHotProduct } from '../types';
import { translations, formatCurrency, Language, Currency } from '../lib/i18n';

interface AgencyContractsManagerProps {
  language: Language;
  currency: Currency;
  exchangeRate: number;
  onContractSigned?: (contract: AgencyContract) => void;
}

export const AgencyContractsManager: React.FC<AgencyContractsManagerProps> = ({
  language,
  currency,
  exchangeRate,
  onContractSigned
}) => {
  const t = translations[language];

  const [manufacturers, setManufacturers] = useState<ManufacturerItem[]>([]);
  const [contracts, setContracts] = useState<AgencyContract[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'signed'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Modals state
  const [signingModalOpen, setSigningModalOpen] = useState<boolean>(false);
  const [selectedMfgForSign, setSelectedMfgForSign] = useState<ManufacturerItem | null>(null);

  const [viewerModalOpen, setViewerModalOpen] = useState<boolean>(false);
  const [viewingContract, setViewingContract] = useState<AgencyContract | null>(null);

  const [advisorModalOpen, setAdvisorModalOpen] = useState<boolean>(false);
  const [advisorMfg, setAdvisorMfg] = useState<ManufacturerItem | null>(null);
  const [advisorAdvice, setAdvisorAdvice] = useState<any>(null);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState<boolean>(false);

  // Fetch manufacturers & contracts
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mfgRes, contractRes] = await Promise.all([
        fetch('/api/manufacturers').then(r => r.json()).catch(() => ({ manufacturers: [] })),
        fetch('/api/agency-contracts').then(r => r.json()).catch(() => ({ contracts: [] }))
      ]);

      if (mfgRes.manufacturers) {
        setManufacturers(mfgRes.manufacturers);
      }
      if (contractRes.contracts) {
        setContracts(contractRes.contracts);
      }
    } catch (err) {
      console.error('Failed to load manufacturers/contracts data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = [
    { id: 'all', label: language === 'vi' ? 'Tất Cả Ngành Hàng' : 'All Categories' },
    { id: 'smart_home', label: language === 'vi' ? 'Gia Dụng Thông Minh' : 'Smart Home' },
    { id: 'cosmetics', label: language === 'vi' ? 'Dược Mỹ Phẩm Hot Trend' : 'BioCosmetics' },
    { id: 'fmcg', label: language === 'vi' ? 'Healthy Food & FMCG' : 'Healthy FMCG' },
    { id: 'tech', label: language === 'vi' ? 'Phụ Kiện Công Nghệ' : 'Tech & Livestream' },
    { id: 'fashion', label: language === 'vi' ? 'Lụa & Thời Trang' : 'Silk & Fashion' },
    { id: 'eco', label: language === 'vi' ? 'Đồ Tre & Gia Dụng Xanh' : 'Eco Bamboo' }
  ];

  const filteredManufacturers = manufacturers.filter(m => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'smart_home') return m.category.toLowerCase().includes('gia dụng thông minh');
    if (selectedCategory === 'cosmetics') return m.category.toLowerCase().includes('mỹ phẩm');
    if (selectedCategory === 'fmcg') return m.category.toLowerCase().includes('thực phẩm');
    if (selectedCategory === 'tech') return m.category.toLowerCase().includes('phụ kiện');
    if (selectedCategory === 'fashion') return m.category.toLowerCase().includes('thời trang') || m.category.toLowerCase().includes('lụa');
    if (selectedCategory === 'eco') return m.category.toLowerCase().includes('tre') || m.category.toLowerCase().includes('bền vững');
    return true;
  });

  const totalCommittedTarget = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.monthlyTargetVND || 0), 0);

  const handleOpenSignModal = (mfg: ManufacturerItem) => {
    setSelectedMfgForSign(mfg);
    setSigningModalOpen(true);
  };

  const handleOpenAdvisor = async (mfg: ManufacturerItem) => {
    setAdvisorMfg(mfg);
    setAdvisorModalOpen(true);
    setIsAdvisorLoading(true);
    setAdvisorAdvice(null);
    try {
      const res = await fetch('/api/agency-contracts/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturerId: mfg.id,
          selectedProducts: mfg.hotProducts.map(p => p.name),
          targetSalesVND: mfg.discountTiers[1]?.minMonthlySalesVND || 100000000,
          channel: 'TikTok Shop, Shopee Mall & Kênh Đại Lý Sỉ'
        })
      });
      const data = await res.json();
      if (data.advice) {
        setAdvisorAdvice(data.advice);
      }
    } catch (err) {
      console.error('Advisor error', err);
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const handleContractCreated = (newContract: AgencyContract) => {
    setContracts(prev => [newContract, ...prev]);
    setSigningModalOpen(false);
    setActiveTab('signed');
    setStatusMessage(language === 'vi' 
      ? `Hợp đồng đại lý ${newContract.contractNumber} đã được ký kết và kích hoạt thành công!` 
      : `Agency contract ${newContract.contractNumber} has been signed and activated!`
    );
    setTimeout(() => setStatusMessage(''), 8000);
    if (onContractSigned) {
      onContractSigned(newContract);
    }
  };

  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-xl flex flex-col gap-6 text-slate-200"
      id="agency-contracts-manager-root"
    >
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Flame className="w-3 h-3 animate-pulse" />
                {t.fastSellingBadge}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {language === 'vi' ? 'Hợp Đồng Pháp Lý Điện Tử' : 'Certified E-Agreements'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
                <Landmark className="w-3 h-3" />
                Sacombank: 060129073198 (NGUYỄN TẤN SĨ)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {t.agencyContractsTitle}
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl">
              {t.agencyContractsSubtitle}
            </p>
          </div>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 shrink-0">
          <div className="border-r border-slate-800 pr-3">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">
              {language === 'vi' ? 'Xưởng Xác Minh' : 'Verified Factories'}
            </span>
            <span className="text-sm font-black text-white font-mono">{manufacturers.length} {language === 'vi' ? 'Nhà Máy' : 'Units'}</span>
          </div>
          <div className="border-r border-slate-800 pr-3">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">
              {language === 'vi' ? 'Hợp Đồng Đang Chạy' : 'Active Contracts'}
            </span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {contracts.filter(c => c.status === 'active').length} {language === 'vi' ? 'Bản' : 'Agreements'}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">
              {t.monthlyTarget}
            </span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {formatCurrency(totalCommittedTarget, currency, exchangeRate)}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {statusMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage('')}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-manufacturers-catalog"
          >
            <Building2 className="w-4 h-4" />
            {t.manufacturersCatalogTab}
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-indigo-200">
              {manufacturers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('signed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'signed'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-signed-contracts"
          >
            <FileText className="w-4 h-4" />
            {t.signedContractsTab}
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-300">
              {contracts.length}
            </span>
          </button>
        </div>

        {/* Quick Refresh Button */}
        <button
          onClick={loadData}
          disabled={isLoading}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 transition-all self-start sm:self-auto cursor-pointer"
          title="Tải lại dữ liệu hợp đồng & xưởng"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{language === 'vi' ? 'Đồng bộ dữ liệu' : 'Sync Records'}</span>
        </button>
      </div>

      {/* VIEW 1: CATALOG OF MANUFACTURERS & FAST-SELLING HOT PRODUCTS */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-5">
          {/* Categories Horizontal Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600/30 border border-indigo-500 text-indigo-200 shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Manufacturers List Grid */}
          <div className="grid grid-cols-1 gap-5">
            {filteredManufacturers.map(mfg => {
              const hasActiveContract = contracts.some(
                c => c.manufacturerId === mfg.id && c.status === 'active'
              );
              const activeContract = contracts.find(
                c => c.manufacturerId === mfg.id && c.status === 'active'
              );

              return (
                <div
                  key={mfg.id}
                  className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 md:p-6 transition-all hover:border-slate-700/80 flex flex-col gap-4 shadow-sm"
                  id={`mfg-card-${mfg.id}`}
                >
                  {/* Top Bar: Manufacturer Name, Location, Badges & Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-900 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                          {mfg.brand}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {mfg.verificationBadge}
                        </span>
                        <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 flex items-center gap-1">
                          ★ {mfg.rating}
                        </span>
                        {hasActiveContract && (
                          <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {language === 'vi' ? 'Đã Ký Hợp Đồng Đại Lý' : 'Contract Active'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base md:text-lg font-black text-white">
                        {mfg.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {mfg.location}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          {mfg.turnoverRate}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono">
                          {language === 'vi' ? 'Công suất:' : 'Capacity:'} {mfg.capacity}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons on card */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenAdvisor(mfg)}
                        className="bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Xem phân tích chiến lược chạy doanh số AI"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{t.aiContractAdvisorBtn}</span>
                      </button>

                      {hasActiveContract && activeContract ? (
                        <button
                          onClick={() => {
                            setViewingContract(activeContract);
                            setViewerModalOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Xem Hợp Đồng' : 'View Contract'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenSignModal(mfg)}
                          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                          id={`btn-sign-contract-${mfg.id}`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>{t.signAgencyContractBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hot-Selling Products Grid (Hàng dễ bán và chạy doanh số) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        {language === 'vi' 
                          ? 'Danh Sách Hàng Dễ Bán & Chạy Doanh Số Tuyển Chọn (Direct Factory)'
                          : 'High-Velocity & Fast-Selling Products Portfolio'
                        }
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {language === 'vi' ? 'Chiết khấu đại lý lên tới 66.7%' : 'Up to 66.7% Agent Margin'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {mfg.hotProducts.map(prod => (
                        <div
                          key={prod.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3 hover:border-slate-700 transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                {prod.salesVelocity}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                {prod.monthlySalesUnits.toLocaleString()} {language === 'vi' ? 'đơn/tháng' : 'units/mo'}
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-white line-clamp-2">
                              {prod.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {prod.category}
                            </p>
                          </div>

                          {/* Pricing & Margins */}
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>{t.wholesalePrice}:</span>
                              <span className="font-mono text-white font-bold">
                                {formatCurrency(prod.wholesalePrice, currency, exchangeRate)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>{t.retailPrice}:</span>
                              <span className="font-mono text-slate-300">
                                {formatCurrency(prod.suggestedRetailPrice, currency, exchangeRate)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-800/60 pt-1 text-emerald-400 font-extrabold">
                              <span>{t.marginDiscount}:</span>
                              <span className="font-mono text-xs">
                                +{prod.marginPercent}% (Biên lãi cao)
                              </span>
                            </div>
                          </div>

                          {/* Features list pills */}
                          <div className="flex flex-wrap gap-1">
                            {prod.features.slice(0, 2).map((feat, fIdx) => (
                              <span
                                key={fIdx}
                                className="text-[9px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded font-medium"
                              >
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manufacturer Agency Tiers Info */}
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-400">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-400" />
                        {language === 'vi' ? 'Chính Sách Đại Lý:' : 'Agency Tiers:'}
                      </span>
                      {mfg.discountTiers.map((dt, dtIdx) => (
                        <span key={dtIdx} className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
                          <span className="text-white font-bold">{dt.tierName.split('(')[0]}:</span>{' '}
                          <span className="text-emerald-400 font-bold">Chiết khấu {dt.discountPercent}%</span>
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {mfg.contactPerson} ({mfg.contactPhone})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ACTIVE SIGNED AGENCY CONTRACTS */}
      {activeTab === 'signed' && (
        <div className="flex flex-col gap-4">
          {contracts.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <FileText className="w-12 h-12 text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">
                {language === 'vi' ? 'Chưa Có Hợp Đồng Đại Lý Nào Được Ký' : 'No Signed Agency Contracts Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                {language === 'vi'
                  ? 'Chọn một nhà sản xuất trong danh mục hàng dễ bán để ký kết thỏa thuận đại lý cấp 1 và bắt đầu chạy doanh số.'
                  : 'Select a manufacturer from the catalog to execute an agency agreement and start driving sales volume.'}
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl mt-2 transition-all cursor-pointer"
              >
                {t.manufacturersCatalogTab}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-slate-700"
                  id={`contract-card-${contract.id}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                        {contract.contractNumber}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          contract.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {contract.status === 'active' ? t.contractActive : 'Đã Thanh Lý'}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Chiết khấu đại lý: {contract.discountPercent}%
                      </span>
                    </div>

                    <h3 className="text-base md:text-lg font-black text-white">
                      {contract.manufacturerName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>
                        <strong className="text-slate-300">{language === 'vi' ? 'Cấp Đại Lý:' : 'Tier:'}</strong>{' '}
                        {contract.tierName}
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-300">{language === 'vi' ? 'Kênh Phân Phối:' : 'Channel:'}</strong>{' '}
                        {contract.distributionChannel}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-amber-300">
                        <strong>{t.monthlyTarget}:</strong>{' '}
                        {formatCurrency(contract.monthlyTargetVND, currency, exchangeRate)}
                      </span>
                    </div>

                    {/* Products covered in contract */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {language === 'vi' ? 'Mặt Hàng Đại Lý:' : 'Products:'}
                      </span>
                      {contract.selectedHotProducts.map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md"
                        >
                          {p}
                        </span>
                      ))}
                    </div>

                    {/* Signatures verified strip */}
                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Check className="w-3 h-3" />
                        Đại lý: {contract.agentSignature} ({new Date(contract.agentSignedAt).toLocaleDateString()})
                      </span>
                      <span className="flex items-center gap-1 text-indigo-300 font-medium">
                        <Award className="w-3 h-3" />
                        Nhà sản xuất: {contract.manufacturerSignature}
                      </span>
                      <span className="font-mono text-slate-400">
                        Sacombank: {contract.sacombankEscrowAccount} ({contract.sacombankRecipient})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => {
                        setViewingContract(contract);
                        setViewerModalOpen(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Xem & In Hợp Đồng' : 'View & Print PDF'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SIGNING CONTRACT MODAL */}
      {signingModalOpen && selectedMfgForSign && (
        <SignContractModal
          mfg={selectedMfgForSign}
          language={language}
          currency={currency}
          exchangeRate={exchangeRate}
          onClose={() => setSigningModalOpen(false)}
          onSuccess={handleContractCreated}
        />
      )}

      {/* CONTRACT VIEWER & PDF PRINT MODAL */}
      {viewerModalOpen && viewingContract && (
        <ContractViewerModal
          contract={viewingContract}
          language={language}
          currency={currency}
          exchangeRate={exchangeRate}
          onClose={() => setViewerModalOpen(false)}
        />
      )}

      {/* AI STRATEGY ADVISOR MODAL */}
      {advisorModalOpen && advisorMfg && (
        <AIContractAdvisorModal
          mfg={advisorMfg}
          advice={advisorAdvice}
          isLoading={isAdvisorLoading}
          language={language}
          onClose={() => setAdvisorModalOpen(false)}
          onProceedToSign={() => {
            setAdvisorModalOpen(false);
            handleOpenSignModal(advisorMfg);
          }}
        />
      )}
    </section>
  );
};

// -----------------------------------------------------------------
// SUB-COMPONENT: SIGN CONTRACT MODAL
// -----------------------------------------------------------------

interface SignContractModalProps {
  mfg: ManufacturerItem;
  language: Language;
  currency: Currency;
  exchangeRate: number;
  onClose: () => void;
  onSuccess: (contract: AgencyContract) => void;
}

const SignContractModal: React.FC<SignContractModalProps> = ({
  mfg,
  language,
  currency,
  exchangeRate,
  onClose,
  onSuccess
}) => {
  const t = translations[language];

  // Default values
  const [selectedTier, setSelectedTier] = useState<'regional_exclusive' | 'tier1_volume' | 'online_dropship'>('tier1_volume');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(mfg.hotProducts.map(p => p.name));
  const [monthlyTargetVND, setMonthlyTargetVND] = useState<number>(
    mfg.discountTiers.find(t => t.tier === 'tier1_volume')?.minMonthlySalesVND || 100000000
  );
  const [distributionChannel, setDistributionChannel] = useState<string>(
    'Đa Kênh Online (TikTok Shop Live, Shopee Mall, Hệ Thống Đại Lý Sỉ Toàn Quốc)'
  );
  const [territory, setTerritory] = useState<string>('Toàn Quốc & Xuất Khẩu');
  const [agentName, setAgentName] = useState<string>('NGUYỄN TẤN SĨ (Đại Lý Phân Phối Toàn Quốc)');
  const [agentRepresentative, setAgentRepresentative] = useState<string>('NGUYỄN TẤN SĨ');
  const [agentPhone, setAgentPhone] = useState<string>('+84 912 345 678');
  const [agentEmail, setAgentEmail] = useState<string>('singuyenemail@gmail.com');
  const [agentTaxId, setAgentTaxId] = useState<string>('0318928192-001');
  const [agentAddress, setAgentAddress] = useState<string>('Tòa Nhà Thương Mại Quốc Tế, TP. Hồ Chí Minh');
  const [sacombankAccount, setSacombankAccount] = useState<string>('060129073198 (Sacombank - NGUYỄN TẤN SĨ)');

  // E-Signature state
  const [signatureText, setSignatureText] = useState<string>('NGUYỄN TẤN SĨ');
  const [hasAgreedTerms, setHasAgreedTerms] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  const currentTierData = mfg.discountTiers.find(t => t.tier === selectedTier) || mfg.discountTiers[0];

  const handleProductToggle = (prodName: string) => {
    if (selectedProducts.includes(prodName)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter(p => p !== prodName));
      }
    } else {
      setSelectedProducts([...selectedProducts, prodName]);
    }
  };

  const handleExecuteSign = async () => {
    if (!hasAgreedTerms) {
      setErrorText(language === 'vi' ? 'Vui lòng đồng ý với các điều khoản hợp đồng' : 'Please accept terms');
      return;
    }
    if (selectedProducts.length === 0) {
      setErrorText(language === 'vi' ? 'Vui lòng chọn ít nhất 1 mặt hàng đại lý' : 'Select at least 1 product');
      return;
    }

    setIsSubmitting(true);
    setErrorText('');

    try {
      const payload = {
        manufacturerId: mfg.id,
        tier: selectedTier,
        tierName: currentTierData.tierName,
        discountPercent: currentTierData.discountPercent,
        monthlyTargetVND,
        selectedHotProducts: selectedProducts,
        agentName,
        agentRepresentative,
        agentPhone,
        agentEmail,
        agentTaxId,
        agentAddress,
        distributionChannel,
        territory,
        agentSignature: `${signatureText} [Xác Thực E-Signature 2026]`
      };

      const res = await fetch('/api/agency-contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.contract) {
        onSuccess(data.contract);
      } else {
        setErrorText(data.error || 'Failed to sign contract');
      }
    } catch (err: any) {
      console.error('Sign contract error:', err);
      setErrorText(err.message || 'Network error signing contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-200 my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-white">
                {language === 'vi' ? 'Ký Kết Hợp Đồng Đại Lý Phân Phối' : 'Execute Agency Agreement'}
              </h3>
              <p className="text-xs text-slate-400">
                {mfg.name} • {mfg.brand}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 scrollbar-thin">
          
          {errorText && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Section 1: Choose Agency Tier */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              {language === 'vi' ? '1. Chọn Cấp Bậc Hợp Đồng Đại Lý' : '1. Select Agency Tier & Discount Level'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mfg.discountTiers.map(dt => (
                <div
                  key={dt.tier}
                  onClick={() => {
                    setSelectedTier(dt.tier);
                    setMonthlyTargetVND(dt.minMonthlySalesVND);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedTier === dt.tier
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {dt.tier === 'regional_exclusive' ? 'Độc Quyền' : dt.tier === 'tier1_volume' ? 'Cấp 1 Chạy Số' : 'Online / Dropship'}
                      </span>
                      <span className="font-mono text-sm font-black text-emerald-400">
                        Chiết khấu {dt.discountPercent}%
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white">
                      {dt.tierName.split('(')[0]}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {dt.supportPolicy}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{language === 'vi' ? 'Cam kết tối thiểu:' : 'Min Commitment:'}</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatCurrency(dt.minMonthlySalesVND, currency, exchangeRate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Choose Hot Products for Distributorship */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                {language === 'vi' 
                  ? '2. Chọn Các Mặt Hàng Dễ Bán Muốn Ký Kết Phân Phối' 
                  : '2. Select Products for Distributorship'
                }
              </label>
              <span className="text-[11px] text-indigo-400 font-bold">
                {selectedProducts.length} {language === 'vi' ? 'sản phẩm đã chọn' : 'selected'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mfg.hotProducts.map(prod => {
                const isChecked = selectedProducts.includes(prod.name);
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleProductToggle(prod.name)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isChecked
                        ? 'bg-slate-950 border-emerald-500/80 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {prod.salesVelocity.split('(')[0]}
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400 text-[10px] font-bold">
                        +{prod.marginPercent}% Lãi
                      </span>
                    </div>

                    <h5 className="text-xs font-black text-white">
                      {prod.name}
                    </h5>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                      <span>{t.wholesalePrice}: <strong className="text-white font-mono">{formatCurrency(prod.wholesalePrice, currency, exchangeRate)}</strong></span>
                      <span>Bán lẻ: <strong className="text-slate-300 font-mono">{formatCurrency(prod.suggestedRetailPrice, currency, exchangeRate)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Monthly Target Commitment & Distribution Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                {language === 'vi' ? '3. Cam Kết Doanh Số Tháng (VND)' : '3. Monthly Target Commitment'}
              </label>
              <input
                type="number"
                value={monthlyTargetVND}
                onChange={e => setMonthlyTargetVND(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                placeholder="100000000"
              />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-500">Mức nhanh:</span>
                {[50000000, 100000000, 250000000, 500000000].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMonthlyTargetVND(v)}
                    className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 hover:text-white"
                  >
                    {(v / 1000000)}M
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {language === 'vi' ? 'Kênh Phân Phối Bán Hàng' : 'Distribution Channels'}
              </label>
              <input
                type="text"
                value={distributionChannel}
                onChange={e => setDistributionChannel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 4: Agent Legal & Banking Details (Pre-filled for NGUYEN TAN SI) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase text-indigo-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {language === 'vi' ? '4. Thông Tin Bên Đại Lý & Tài Khoản Thanh Toán Sacombank' : '4. Agent Details & Bank Account'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Đại Diện Pháp Lý:</span>
                <input
                  type="text"
                  value={agentRepresentative}
                  onChange={e => setAgentRepresentative(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 mt-1 font-bold text-white focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Mã Số Thuế / CCCD:</span>
                <input
                  type="text"
                  value={agentTaxId}
                  onChange={e => setAgentTaxId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 mt-1 font-mono text-slate-300 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Tài Khoản Sacombank Đối Soát:</span>
                <input
                  type="text"
                  value={sacombankAccount}
                  readOnly
                  className="w-full bg-slate-900 border border-amber-500/30 text-amber-300 font-mono font-black rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Digital E-Signature */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {language === 'vi' ? '5. Chữ Ký Điện Tử & Xác Nhận Cam Kết Pháp Lý' : '5. Digital Signature Verification'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">
                  Nhập tên để tạo chữ ký số điện tử:
                </span>
                <input
                  type="text"
                  value={signatureText}
                  onChange={e => setSignatureText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-serif italic font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Chữ Ký Số Hợp Lệ</span>
                <span className="font-serif italic text-lg font-black text-indigo-300 mt-1">
                  {signatureText || 'NGUYEN TAN SI'}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 mt-0.5">
                  ✓ Verified E-Signature Protocol
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={hasAgreedTerms}
                onChange={e => setHasAgreedTerms(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span>
                Tôi đã đọc và đồng ý với tất cả điều khoản đại lý, cam kết doanh số và chính sách bảo hành từ nhà sản xuất.
              </span>
            </label>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
          </button>

          <button
            onClick={handleExecuteSign}
            disabled={isSubmitting || !hasAgreedTerms}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
            id="btn-confirm-sign-agreement"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? (language === 'vi' ? 'Đang xác thực & ký số...' : 'Verifying & Signing...')
                : t.signNow
              }
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// SUB-COMPONENT: CONTRACT VIEWER & PRINTABLE LEGAL DOCUMENT MODAL
// -----------------------------------------------------------------

interface ContractViewerModalProps {
  contract: AgencyContract;
  language: Language;
  currency: Currency;
  exchangeRate: number;
  onClose: () => void;
}

const ContractViewerModal: React.FC<ContractViewerModalProps> = ({
  contract,
  language,
  currency,
  exchangeRate,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto">
        
        {/* Modal Toolbar (hidden on print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>{contract.contractNumber} • {contract.status === 'active' ? 'ĐANG CÓ HIỆU LỰC' : 'ĐÃ THANH LÝ'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="In hoặc lưu file PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'In / Lưu PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legal Printable Document Body */}
        <div className="p-8 md:p-12 overflow-y-auto flex flex-col gap-6 font-serif leading-relaxed text-sm bg-white text-slate-900 scrollbar-thin">
          
          {/* Header Quốc Hiệu Tiêu Ngữ */}
          <div className="text-center border-b-2 border-slate-900 pb-5">
            <h4 className="text-xs uppercase font-bold tracking-widest text-slate-800">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <p className="text-xs font-bold tracking-wider text-slate-700 mt-1">
              Độc lập - Tự do - Hạnh phúc
            </p>
            <div className="w-24 h-0.5 bg-slate-900 mx-auto my-2" />
            <h2 className="text-xl md:text-2xl font-black font-sans uppercase tracking-tight text-slate-900 mt-3">
              HỢP ĐỒNG ĐẠI LÝ PHÂN PHỐI BÁN BUÔN & CHẠY DOANH SỐ
            </h2>
            <p className="text-xs font-mono text-slate-600 mt-1">
              Số hợp đồng: <strong>{contract.contractNumber}</strong> • Ngày lập: {new Date(contract.contractDate).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Legal Parties */}
          <div className="flex flex-col gap-4 font-sans text-xs">
            {/* BÊN A: NHÀ SẢN XUẤT */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-black text-slate-900 uppercase text-xs mb-2">
                BÊN GIAO ĐẠI LÝ (BÊN A - NHÀ SẢN XUẤT / CHỦ HÀNG GỐC):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                <p><strong>Tên Doanh Nghiệp:</strong> {contract.manufacturerName}</p>
                <p><strong>Người Đại Diện:</strong> {contract.manufacturerRepresentative}</p>
                <p><strong>Tình Trạng Chứng Nhận:</strong> Đã kiểm tra thực địa & xác thực chuẩn chất lượng ISO/CGMP</p>
                <p><strong>Cam Kết Cung Ứng:</strong> Bảo đảm nguồn hàng ổn định, giá gốc xuất xưởng</p>
              </div>
            </div>

            {/* BÊN B: ĐẠI LÝ */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-black text-slate-900 uppercase text-xs mb-2">
                BÊN ĐẠI LÝ PHÂN PHỐI (BÊN B - ĐẠI LÝ BÁN HÀNG & CHẠY DOANH SỐ):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                <p><strong>Tên Đại Lý:</strong> {contract.agentName}</p>
                <p><strong>Người Đại Diện:</strong> {contract.agentRepresentative}</p>
                <p><strong>Điện Thoại / Email:</strong> {contract.agentPhone} • {contract.agentEmail}</p>
                <p><strong>Mã Số Thuế / CCCD:</strong> {contract.agentTaxId}</p>
                <p><strong>Địa Chỉ Trụ Sở:</strong> {contract.agentAddress}</p>
                <p><strong>Tài Khoản Sacombank Bảo Lãnh:</strong> 060129073198 (Chủ TK: NGUYỄN TẤN SĨ / NGUYEN TAN SI)</p>
              </div>
            </div>
          </div>

          {/* Core Terms */}
          <div className="flex flex-col gap-3 font-sans text-xs text-slate-800">
            <h4 className="font-black uppercase text-slate-900">
              ĐIỀU 1: PHẠM VI HỢP ĐỒNG & MẶT HÀNG PHÂN PHỐI
            </h4>
            <p>
              Bên A đồng ý giao và Bên B đồng ý nhận làm <strong>{contract.tierName}</strong> cho các sản phẩm hàng dễ bán, vòng quay nhanh thuộc danh mục sản xuất của Bên A tại địa bàn <strong>{contract.territory}</strong> qua kênh phân phối <strong>{contract.distributionChannel}</strong>.
            </p>
            <div className="bg-slate-100 p-3 rounded-lg font-mono text-[11px]">
              <strong>Danh mục sản phẩm ủy thác đại lý:</strong>
              <ul className="list-disc list-inside mt-1">
                {contract.selectedHotProducts.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <h4 className="font-black uppercase text-slate-900 mt-2">
              ĐIỀU 2: CHÍNH SÁCH CHIẾT KHẤU & CAM KẾT DOANH SỐ
            </h4>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>Mức chiết khấu đại lý cố định áp dụng: <strong>{contract.discountPercent}%</strong> tính trên giá bán lẻ đề xuất.</li>
              <li>Chỉ tiêu cam kết doanh số hàng tháng của Bên B: <strong>{contract.monthlyTargetVND.toLocaleString('vi-VN')} VND / tháng</strong>.</li>
              <li>Thưởng vượt KPI: Bên B được thưởng thêm 3% tổng doanh thu phát sinh khi đạt trên 130% chỉ tiêu tháng.</li>
            </ul>

            <h4 className="font-black uppercase text-slate-900 mt-2">
              ĐIỀU 3: PHƯƠNG THỨC THANH TOÁN & ĐỐI SOÁT QUA SACOMBANK
            </h4>
            <p>
              Mọi khoản tiền hàng, phí ký quỹ và thanh toán hoa hồng đối soát định kỳ giữa hai bên được thực hiện minh bạch qua cổng tài khoản chỉ định:
            </p>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 font-mono text-[11px]">
              <strong>Ngân Hàng Sacombank Việt Nam</strong> • Số Tài Khoản: <strong>{contract.sacombankEscrowAccount}</strong> • Chủ Tài Khoản: <strong>{contract.sacombankRecipient}</strong>
            </div>

            <h4 className="font-black uppercase text-slate-900 mt-2">
              ĐIỀU 4: BẢO HÀNH & HỖ TRỢ XÚC TIẾN BÁN HÀNG
            </h4>
            {contract.termsSummary.map((t, idx) => (
              <p key={idx}>• {t}</p>
            ))}

            <h4 className="font-black uppercase text-slate-900 mt-2">
              ĐIỀU 5: HIỆU LỰC HỢP ĐỒNG
            </h4>
            <p>
              Hợp đồng có hiệu lực kể từ ngày <strong>{new Date(contract.effectiveDate).toLocaleDateString('vi-VN')}</strong> đến hết ngày <strong>{new Date(contract.expiryDate).toLocaleDateString('vi-VN')}</strong> (thời hạn 12 tháng và tự động gia hạn khi hoàn thành chỉ tiêu cam kết).
            </p>
          </div>

          {/* Signatures and Certified Seals */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 font-sans text-xs mt-6">
            <div className="text-center flex flex-col items-center">
              <span className="font-bold uppercase text-slate-900">ĐẠI DIỆN BÊN A (NHÀ SẢN XUẤT)</span>
              <span className="text-[10px] text-slate-500 italic mt-0.5">(Ký, đóng dấu số và ghi rõ họ tên)</span>
              
              {/* Manufacturer Stamp Box */}
              <div className="my-4 border-2 border-dashed border-red-500/80 rounded-2xl p-3 w-48 text-red-600 bg-red-50/50">
                <span className="text-[9px] font-black uppercase block">★ ĐÃ XÁC THỰC SỐ ★</span>
                <span className="text-xs font-black block mt-0.5">{contract.manufacturerName.slice(0, 30)}...</span>
                <span className="text-[9px] font-mono block mt-1">CERTIFIED FACTORY SEAL</span>
              </div>
              <span className="font-black text-slate-900 mt-1">{contract.manufacturerRepresentative}</span>
            </div>

            <div className="text-center flex flex-col items-center">
              <span className="font-bold uppercase text-slate-900">ĐẠI DIỆN BÊN B (ĐẠI LÝ)</span>
              <span className="text-[10px] text-slate-500 italic mt-0.5">(Ký điện tử và ghi rõ họ tên)</span>
              
              {/* Agent Signature Box */}
              <div className="my-4 border-2 border-indigo-400 rounded-2xl p-3 w-48 bg-indigo-50/50 text-indigo-900">
                <span className="font-serif italic font-black text-lg block">{contract.agentSignature.split('[')[0]}</span>
                <span className="text-[9px] font-mono text-emerald-700 block mt-1">✓ Verified E-Signature</span>
              </div>
              <span className="font-black text-slate-900 mt-1">{contract.agentRepresentative}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// SUB-COMPONENT: AI CONTRACT & SALES STRATEGY ADVISOR MODAL
// -----------------------------------------------------------------

interface AIContractAdvisorModalProps {
  mfg: ManufacturerItem;
  advice: any;
  isLoading: boolean;
  language: Language;
  onClose: () => void;
  onProceedToSign: () => void;
}

const AIContractAdvisorModal: React.FC<AIContractAdvisorModalProps> = ({
  mfg,
  advice,
  isLoading,
  language,
  onClose,
  onProceedToSign
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200 my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {language === 'vi' ? 'AI Cố Vấn Chiến Lược Hợp Đồng & Chạy Doanh Số' : 'AI Distributorship & Sales Velocity Advisor'}
              </h3>
              <p className="text-xs text-slate-400">
                {mfg.name} • {mfg.brand}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs scrollbar-thin">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="font-bold text-slate-300">
                {language === 'vi' ? 'AI đang phân tích dữ liệu thị trường và xây dựng kế hoạch chạy số...' : 'AI is analyzing market signals and sales velocity strategies...'}
              </span>
            </div>
          ) : advice ? (
            <div className="flex flex-col gap-4">
              
              {/* Market Opportunity */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-extrabold uppercase text-indigo-300 mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  {language === 'vi' ? 'Tại Sao Sản Phẩm Này Dễ Bán & Cháy Hàng?' : 'Why Products Are High-Velocity'}
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  {advice.marketAnalysis}
                </p>
              </div>

              {/* Monthly Revenue & Margin Forecast */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
                <h4 className="font-extrabold uppercase text-emerald-400 mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {language === 'vi' ? 'Dự Phóng Doanh Thu & Lợi Nhuận Gộp' : 'Projected Revenue & Gross Margin'}
                </h4>
                <p className="text-emerald-200 leading-relaxed font-mono">
                  {advice.monthlyRevenueForecast}
                </p>
              </div>

              {/* Sales Velocity Tactics */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-extrabold uppercase text-amber-300 mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {language === 'vi' ? 'Chiến Thuật Bán Chạy & Tăng Tốc Doanh Số' : 'Sales Acceleration Tactics'}
                </h4>
                <div className="flex flex-col gap-2">
                  {advice.salesVelocityTactics?.map((t: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negotiation Tips */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-extrabold uppercase text-indigo-300 mb-2 flex items-center gap-1.5">
                  <BadgePercent className="w-4 h-4 text-indigo-400" />
                  {language === 'vi' ? 'Mẹo Đàm Phán Quyền Lợi Thêm Từ Xưởng' : 'Factory Negotiation Levers'}
                </h4>
                <div className="flex flex-col gap-2">
                  {advice.negotiationTips?.map((tip: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Management */}
              {advice.riskManagement && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>{language === 'vi' ? 'Kiểm soát rủi ro:' : 'Risk control:'}</strong> {advice.riskManagement}</span>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>

          <button
            onClick={onProceedToSign}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'vi' ? 'Tiến Hành Ký Hợp Đồng Đại Lý Với Xưởng' : 'Proceed to Sign Contract'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
