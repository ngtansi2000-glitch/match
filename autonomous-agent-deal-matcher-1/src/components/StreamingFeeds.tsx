/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, Radio, Plus, UserPlus, Flame, CheckCircle, 
  Sparkles, Database, Zap, Activity, ChevronDown, ChevronUp, 
  Search, SlidersHorizontal, ArrowDownToLine, Globe, Server
} from 'lucide-react';
import { Product, BuyerLead, SellerLead, PipelineSignal, ResearchPipelineStats } from '../types';
import { Language, Currency, translations, formatCurrency } from '../lib/i18n';

interface StreamingFeedsProps {
  buyersList: BuyerLead[];
  sellersList: SellerLead[];
  pipelineSignals?: PipelineSignal[];
  researchPipelineStats?: ResearchPipelineStats | null;
  onAddLead: (lead: {
    name: string;
    demand: string;
    targetPrice: number;
    contact: string;
    type: 'buyer' | 'seller';
    source: string;
  }) => Promise<void>;
  onIngestSignal?: (signalId: string) => Promise<void>;
  onMatchOnlineProducts?: () => Promise<void> | void;
  onDrawResearchData?: (channel?: string, count?: number) => Promise<void> | void;
  isMatchingOnline?: boolean;
  isDrawingResearch?: boolean;
  isAddingLead: boolean;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export const RESEARCH_PLATFORMS = [
  'All Sources',
  'Twitter Decahose',
  'QVC Data Lake',
  'B2B Wholesale',
  'Amazon',
  'YouTube',
  'Taobao',
  'TikTok',
  'Instagram',
  'TalkShopLive',
  'Popshop Live',
  'eBay Live',
  'Klarna',
  'ShopShops',
  'Real-time Data Stream'
] as const;

export default function StreamingFeeds({
  buyersList,
  sellersList,
  pipelineSignals = [],
  researchPipelineStats,
  onAddLead,
  onIngestSignal,
  onMatchOnlineProducts,
  onDrawResearchData,
  isMatchingOnline = false,
  isDrawingResearch = false,
  isAddingLead,
  language = 'en',
  currency = 'VND',
  exchangeRate = 25000
}: StreamingFeedsProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'pipeline' | 'manual'>('pipeline');
  const [selectedChannel, setSelectedChannel] = useState<string>('All Sources');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSemanticSigId, setExpandedSemanticSigId] = useState<string | null>(null);

  const [formType, setFormType] = useState<'buyer' | 'seller'>('buyer');
  const [formData, setFormData] = useState({
    name: '',
    demand: '',
    targetPrice: '',
    contact: '',
    source: 'Twitter Decahose Stream'
  });

  const [formError, setFormError] = useState('');
  const [ingestingId, setIngestingId] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { name, demand, targetPrice, contact, source } = formData;

    if (!name.trim() || !demand.trim() || !targetPrice || !contact.trim()) {
      setFormError(language === 'vi' ? 'Vui lòng điền đầy đủ các thông tin bắt buộc.' : 'Please fill out all mandatory fields.');
      return;
    }

    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError(language === 'vi' ? 'Giá đơn vị mục tiêu phải là số dương hợp lệ.' : 'Target unit price must be a valid positive number.');
      return;
    }

    try {
      await onAddLead({
        name,
        demand,
        targetPrice: priceNum,
        contact,
        type: formType,
        source
      });

      setFormData({
        name: '',
        demand: '',
        targetPrice: '',
        contact: '',
        source: 'Twitter Decahose Stream'
      });
      
      setActiveTab('pipeline');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit lead.');
    }
  };

  const handleIngestClick = async (sigId: string) => {
    if (!onIngestSignal) return;
    setIngestingId(sigId);
    try {
      await onIngestSignal(sigId);
    } catch (err) {
      console.error(err);
    } finally {
      setIngestingId(null);
    }
  };

  const handleDrawClick = async () => {
    if (!onDrawResearchData) return;
    const channelToDraw = selectedChannel === 'All Sources' ? undefined : selectedChannel;
    await onDrawResearchData(channelToDraw, 2);
  };

  const filteredSignals = useMemo(() => {
    return pipelineSignals.filter((sig) => {
      // Channel filter
      if (selectedChannel !== 'All Sources') {
        const matchesChannel = sig.platform.toLowerCase().includes(selectedChannel.toLowerCase()) ||
          selectedChannel.toLowerCase().includes(sig.platform.toLowerCase());
        if (!matchesChannel) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = sig.title.toLowerCase().includes(q);
        const matchPlatform = sig.platform.toLowerCase().includes(q);
        const matchKeywords = sig.keywords && sig.keywords.some((k) => k.toLowerCase().includes(q));
        const matchEntity = sig.semanticAnalysis?.extractedEntities.productName.toLowerCase().includes(q);
        if (!matchTitle && !matchPlatform && !matchKeywords && !matchEntity) return false;
      }
      return true;
    });
  }, [pipelineSignals, selectedChannel, searchQuery]);

  const getPlatformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('twitter') || p.includes('decahose')) {
      return 'bg-sky-950/70 text-sky-300 border-sky-500/30';
    }
    if (p.includes('qvc') || p.includes('data lake')) {
      return 'bg-red-950/70 text-red-300 border-red-500/30';
    }
    if (p.includes('b2b') || p.includes('alibaba')) {
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
    }
    if (p.includes('amazon')) {
      return 'bg-amber-950/70 text-amber-300 border-amber-500/30';
    }
    if (p.includes('youtube')) {
      return 'bg-rose-950/70 text-rose-300 border-rose-500/30';
    }
    if (p.includes('taobao')) {
      return 'bg-orange-950/70 text-orange-300 border-orange-500/30';
    }
    if (p.includes('tiktok')) {
      return 'bg-slate-900 text-slate-200 border-slate-700/60';
    }
    if (p.includes('instagram')) {
      return 'bg-pink-950/70 text-pink-300 border-pink-500/30';
    }
    if (p.includes('talkshoplive')) {
      return 'bg-violet-950/70 text-violet-300 border-violet-500/30';
    }
    if (p.includes('popshop')) {
      return 'bg-yellow-950/70 text-yellow-300 border-yellow-500/30';
    }
    if (p.includes('ebay')) {
      return 'bg-blue-950/70 text-blue-300 border-blue-500/30';
    }
    if (p.includes('klarna')) {
      return 'bg-pink-900/40 text-pink-200 border-pink-400/20';
    }
    if (p.includes('shopshops')) {
      return 'bg-teal-950/70 text-teal-300 border-teal-500/30';
    }
    if (p.includes('real-time') || p.includes('kafka') || p.includes('pipeline')) {
      return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40';
    }
    return 'bg-slate-900/90 text-slate-300 border-slate-700/60';
  };

  const getSourceIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('twitter') || p.includes('decahose')) return '𝕏 Decahose';
    if (p.includes('qvc')) return '🌊 QVC Lake';
    if (p.includes('b2b')) return '📦 B2B Wholesale';
    if (p.includes('amazon')) return '🛒 Amazon Live';
    if (p.includes('youtube')) return '▶️ YouTube';
    if (p.includes('taobao')) return '🏮 Taobao';
    if (p.includes('tiktok')) return '🎵 TikTok';
    if (p.includes('instagram')) return '📸 Instagram';
    if (p.includes('talkshoplive')) return '📺 TalkShopLive';
    if (p.includes('popshop')) return '🎨 Popshop Live';
    if (p.includes('ebay')) return '🔨 eBay Live';
    if (p.includes('klarna')) return '💳 Klarna';
    if (p.includes('shopshops')) return '✈️ ShopShops';
    if (p.includes('real-time') || p.includes('stream')) return '⚡ Real-time Stream';
    return '🌐 Source';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl" id="streaming-feeds-root">
      
      {/* Streaming Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 tracking-wide uppercase">
              <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>{language === 'vi' ? 'Trung Tâm Rút Dữ Liệu Nghiên Cứu' : 'Research Data & Pipeline Firehose'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'vi' 
                ? 'Rút và xử lý luồng dữ liệu thời gian thực: B2B, Amazon, YouTube, Taobao, Instagram, TalkShopLive, TikTok, Popshop Live, eBay Live, Klarna, ShopShops, QVC Data Lake & X/Twitter Decahose.'
                : 'Live telemetry ingestion: B2B, Amazon, YouTube, Taobao, Instagram, TalkShopLive, TikTok, Popshop Live, eBay Live, Klarna, ShopShops, QVC Data Lake & X/Twitter Decahose.'}
            </p>
          </div>
          
          {/* Tabs Control */}
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800/80 text-[10px] font-bold">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'pipeline' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              id="tab-stream-pipeline"
            >
              {language === 'vi' ? 'Luồng Dữ Liệu' : 'Live Firehose'}
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              id="tab-stream-manual"
            >
              {t.manualInbound}
            </button>
          </div>
        </div>

        {/* Real-time Data Pipeline Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-850/80 text-[10px] font-mono">
          <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>EPS Speed</span>
            </span>
            <span className="font-bold text-amber-300">
              {(researchPipelineStats?.eventsPerSecond || 3420).toLocaleString()} eps
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Latency</span>
            </span>
            <span className="font-bold text-emerald-300">
              {researchPipelineStats?.averageLatencyMs || 14} ms
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Server className="w-3 h-3 text-indigo-400" />
              <span>Channels</span>
            </span>
            <span className="font-bold text-indigo-300">
              {researchPipelineStats?.activeStreamsCount || 14} Firehoses
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>NLP Intent</span>
            </span>
            <span className="font-bold text-purple-300">
              {researchPipelineStats?.semanticConfidenceAvg || 94.6}% Acc
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'pipeline' ? (
        <div className="flex-1 overflow-y-auto max-h-[520px] p-3 space-y-3 custom-scrollbar" id="pipeline-stream-section">
          
          {/* Research Draw Data Action Box */}
          <div className="p-3 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/25 rounded-2xl flex flex-col gap-2.5 shadow-md" id="research-draw-box">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                  <ArrowDownToLine className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">
                    {language === 'vi' ? 'Rút Dữ Liệu Nghiên Cứu & Semantic Decahose' : 'Research Data Draw & Decahose Engine'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {language === 'vi' 
                      ? 'Thu thập dữ liệu thương mại tức thì từ 14 nguồn trực tiếp với bộ phân tích ngữ nghĩa Gemini & Decahose.'
                      : 'Fetch verified trade signals with semantic intent classification across 14 direct streaming sources.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Channel Selection Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 custom-scrollbar text-[10px]">
              {RESEARCH_PLATFORMS.map((platform) => {
                const isSelected = selectedChannel === platform;
                return (
                  <button
                    key={platform}
                    onClick={() => setSelectedChannel(platform)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-900/50'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    id={`btn-channel-${platform.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    {platform === 'All Sources' && (language === 'vi' ? 'Tất cả nguồn' : 'All Sources')}
                    {platform === 'Twitter Decahose' && '𝕏 Twitter Decahose'}
                    {platform === 'QVC Data Lake' && '🌊 QVC Data Lake'}
                    {platform === 'B2B Wholesale' && '📦 B2B Wholesale'}
                    {platform === 'Amazon' && '🛒 Amazon Live'}
                    {platform === 'YouTube' && '▶️ YouTube'}
                    {platform === 'Taobao' && '🏮 Taobao'}
                    {platform === 'TikTok' && '🎵 TikTok'}
                    {platform === 'Instagram' && '📸 Instagram'}
                    {platform === 'TalkShopLive' && '📺 TalkShopLive'}
                    {platform === 'Popshop Live' && '🎨 Popshop Live'}
                    {platform === 'eBay Live' && '🔨 eBay Live'}
                    {platform === 'Klarna' && '💳 Klarna'}
                    {platform === 'ShopShops' && '✈️ ShopShops'}
                    {platform === 'Real-time Data Stream' && '⚡ Real-time Stream'}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleDrawClick}
                disabled={isDrawingResearch}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                id="btn-draw-research-data"
              >
                {isDrawingResearch ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>
                      {language === 'vi' 
                        ? `Đang rút dữ liệu từ ${selectedChannel}...` 
                        : `Drawing data from ${selectedChannel}...`}
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-200" />
                    <span>
                      {language === 'vi' 
                        ? `Rút Dữ Liệu Nghiên Cứu (${selectedChannel === 'All Sources' ? 'Toàn Bộ Nguồn' : selectedChannel})` 
                        : `Draw Research Data (${selectedChannel})`}
                    </span>
                  </>
                )}
              </button>

              {onMatchOnlineProducts && (
                <button
                  onClick={() => onMatchOnlineProducts()}
                  disabled={isMatchingOnline}
                  className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={language === 'vi' ? 'Khớp tất cả sản phẩm đang chạy online' : 'Match all online products'}
                  id="btn-match-all-online-short"
                >
                  {isMatchingOnline ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{language === 'vi' ? 'Khớp Online' : 'Match Online'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Counter Toolbar */}
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'vi' ? 'Tìm theo sản phẩm, nguồn hoặc từ khóa...' : 'Filter signals, platform, entities...'}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                id="input-filter-signals"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {filteredSignals.length} {language === 'vi' ? 'tín hiệu' : 'signals'}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span>{t.liveCrawling}</span>
              </span>
            </div>
          </div>

          {/* Pipeline Signal List */}
          <div className="space-y-2.5" id="pipeline-signals-container">
            {filteredSignals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs bg-slate-950/30 border border-slate-850 rounded-2xl p-4">
                <Radio className="w-6 h-6 mx-auto mb-2 text-slate-600 animate-pulse" />
                <p>{language === 'vi' ? 'Chưa có tín hiệu nào cho bộ lọc này. Nhấp "Rút Dữ Liệu Nghiên Cứu" để lấy tín hiệu tức thì.' : 'No signals found for this filter. Click "Draw Research Data" to ingest live commercial signals.'}</p>
                <button
                  onClick={handleDrawClick}
                  disabled={isDrawingResearch}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Rút Dữ Liệu Ngay' : 'Draw Signals Now'}</span>
                </button>
              </div>
            ) : (
              filteredSignals.map((sig) => {
                const isSemanticExpanded = expandedSemanticSigId === sig.id;
                const sem = sig.semanticAnalysis;
                const fire = sig.firehoseMeta;

                return (
                  <div 
                    key={sig.id} 
                    className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-xs gap-2"
                    id={`signal-card-${sig.id}`}
                  >
                    {/* Signal Header: Platform + Provenance + Trending Score */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[8px] font-extrabold uppercase border px-2 py-0.5 rounded-md leading-none tracking-wider ${getPlatformBadge(sig.platform)}`}>
                          {getSourceIcon(sig.platform)}
                        </span>
                        
                        {fire && (
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {fire.sourceType} • {fire.latencyMs}ms
                          </span>
                        )}

                        {sem && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                            sem.intent === 'purchase_intent' || sem.intent === 'demand_surge'
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/20'
                              : 'bg-indigo-950/50 text-indigo-300 border-indigo-500/20'
                          }`}>
                            {sem.intent === 'purchase_intent' && '🎯 Purchase Intent'}
                            {sem.intent === 'demand_surge' && '⚡ Demand Surge'}
                            {sem.intent === 'supplier_broadcast' && '📢 Supplier Broadcast'}
                            {sem.intent === 'price_arbitrage' && '⚖️ Price Arbitrage'}
                            {sem.intent === 'inquiry' && '💬 Inquiry'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px]">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="font-bold text-slate-300">{sig.trendingScore}</span>
                      </div>
                    </div>

                    {/* Signal Title */}
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {sig.title}
                    </p>

                    {/* Semantic Extracted Entities Chip & NLP Reasoning */}
                    {sem && (
                      <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-2 space-y-1 text-[10px]">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>Entity: <strong className="text-slate-200">{sem.extractedEntities.productName}</strong></span>
                          </span>
                          <span className="text-purple-300 font-mono font-bold">
                            NLP Confidence: {sem.intentConfidence}%
                          </span>
                        </div>

                        {/* Collapsible Semantic Reasoning View */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedSemanticSigId(isSemanticExpanded ? null : sig.id)}
                            className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <span>
                              {isSemanticExpanded 
                                ? (language === 'vi' ? 'Ẩn phân tích ngữ nghĩa Decahose' : 'Hide Decahose Semantic Analysis')
                                : (language === 'vi' ? 'Xem phân tích ngữ nghĩa Decahose & Entity' : 'View Decahose Semantic & Entity Details')}
                            </span>
                            {isSemanticExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isSemanticExpanded && (
                            <div className="mt-1.5 p-2 bg-slate-950/80 border border-indigo-500/20 rounded-lg space-y-1.5 text-[9px] text-slate-300 leading-normal animate-in fade-in duration-200">
                              <p className="italic text-indigo-200">
                                {sem.semanticSummary}
                              </p>
                              {sem.extractedEntities.specifications && sem.extractedEntities.specifications.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                  <span className="text-slate-400">Specs:</span>
                                  {sem.extractedEntities.specifications.map((spec, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-800/90 text-slate-300 rounded border border-slate-700/60 font-mono text-[8px]">
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {fire && (
                                <div className="pt-1 flex items-center justify-between text-[8px] text-slate-400 border-t border-slate-800">
                                  <span>Partition: {fire.partitionId || 'Stream-Cluster-Hot'}</span>
                                  <span>Throughput: {fire.throughputEps} eps</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata & Ingestion Button */}
                    <div className="flex items-center justify-between border-t border-slate-900/80 pt-2 mt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black font-mono text-slate-100">
                          {formatCurrency(sig.price, currency, exchangeRate)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium font-mono">
                          Vol: {sig.volume.toLocaleString()}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${
                          sig.sentiment === 'Positive' 
                            ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                            : sig.sentiment === 'Negative'
                            ? 'text-rose-400 bg-rose-500/5 border-rose-500/10'
                            : 'text-slate-400 bg-slate-500/5 border-slate-500/10'
                        }`}>
                          {sig.sentiment === 'Positive' && language === 'vi' ? 'Tích cực' : sig.sentiment === 'Negative' && language === 'vi' ? 'Tiêu cực' : sig.sentiment}
                        </span>
                      </div>

                      {sig.matchingEligible ? (
                        <button
                          onClick={() => handleIngestClick(sig.id)}
                          disabled={ingestingId === sig.id}
                          className="text-[9px] font-bold px-2.5 py-1 bg-indigo-600/90 hover:bg-indigo-600 hover:scale-105 active:scale-100 text-white rounded-lg transition-all border border-indigo-500/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          id={`btn-ingest-${sig.id}`}
                        >
                          {ingestingId === sig.id ? (
                            <span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-2.5 h-2.5" />
                          )}
                          <span>{t.ingest}</span>
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 text-slate-500 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-1 select-none">
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                          <span>{t.ingested}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Manual Ingest Lead Form */
        <div className="p-4 flex-1 overflow-y-auto max-h-[520px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-slate-500" /> Ingest Lead into Sourcing Matrix
            </h4>
            <div className="flex bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[10px] font-bold">
              <button
                onClick={() => { setFormType('buyer'); setFormError(''); }}
                type="button"
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${formType === 'buyer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Buyer
              </button>
              <button
                onClick={() => { setFormType('seller'); setFormError(''); }}
                type="button"
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${formType === 'seller' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Supplier
              </button>
            </div>
          </div>

          {formError && (
            <div className="mb-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {formType === 'buyer' ? 'Client / Brand Name' : 'Manufacturer / Factory Name'}
              </label>
              <input
                type="text"
                placeholder={formType === 'buyer' ? 'e.g. Nordic Outdoor Wholesale Ltd' : 'e.g. Bình Dương Eco Textile Co.'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-800 bg-slate-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                id="lead-form-name"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {formType === 'buyer' ? 'Purchasing Requirement / Spec' : 'Wholesale Product Supply Details'}
              </label>
              <textarea
                rows={2}
                placeholder={formType === 'buyer' ? 'e.g. Seeking bulk order of 40oz insulated tumblers with custom straw lids.' : 'e.g. Wholesale 100% natural organic mulberry silk scarves.'}
                value={formData.demand}
                onChange={(e) => setFormData({ ...formData, demand: e.target.value })}
                className="w-full border border-slate-800 bg-slate-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                id="lead-form-demand"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Price (VND)</label>
                <input
                  type="number"
                  placeholder="VND Price per unit"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  className="w-full border border-slate-800 bg-slate-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  id="lead-form-price"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Source Stream</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full border border-slate-800 bg-slate-950 rounded-xl px-2 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  id="lead-form-source"
                >
                  <option value="Twitter Decahose Stream" className="bg-slate-900 text-slate-100">Twitter Decahose 10%</option>
                  <option value="QVC Data Lake Firehose" className="bg-slate-900 text-slate-100">QVC Data Lake</option>
                  <option value="B2B Wholesale Portal" className="bg-slate-900 text-slate-100">B2B Wholesale</option>
                  <option value="Amazon Live Commerce" className="bg-slate-900 text-slate-100">Amazon Live</option>
                  <option value="YouTube Shopping Stream" className="bg-slate-900 text-slate-100">YouTube Shopping</option>
                  <option value="Taobao Business Firehose" className="bg-slate-900 text-slate-100">Taobao Wholesales</option>
                  <option value="TikTok Shop Live Stream" className="bg-slate-900 text-slate-100">TikTok Shop Live</option>
                  <option value="Instagram Feed Search" className="bg-slate-900 text-slate-100">Instagram Reels</option>
                  <option value="TalkShopLive Live Chat" className="bg-slate-900 text-slate-100">TalkShopLive</option>
                  <option value="Popshop Live Stream Feed" className="bg-slate-900 text-slate-100">Popshop Live</option>
                  <option value="eBay Live Stream" className="bg-slate-900 text-slate-100">eBay Live</option>
                  <option value="Klarna Virtual Sourcing" className="bg-slate-900 text-slate-100">Klarna</option>
                  <option value="ShopShops Cross-Border Stream" className="bg-slate-900 text-slate-100">ShopShops</option>
                  <option value="Real-time Kafka Pipeline" className="bg-slate-900 text-slate-100">Real-time Data Stream</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Verified Contact details</label>
              <input
                type="text"
                placeholder="Phone number, Email, or WeChat handle"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full border border-slate-800 bg-slate-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                id="lead-form-contact"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingLead}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:bg-indigo-800/80 disabled:text-slate-400 disabled:scale-100 cursor-pointer"
              id="lead-form-submit-btn"
            >
              {isAddingLead ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Ingesting Sourcing Lead...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Ingest & Match with Gemini AI</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Directory Counters */}
      <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex justify-between text-center">
        <div className="flex-1 border-r border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sourcing Buyers</span>
          <p className="text-base font-extrabold text-slate-100 mt-0.5">{buyersList.length}</p>
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manufacturers</span>
          <p className="text-base font-extrabold text-slate-100 mt-0.5">{sellersList.length}</p>
        </div>
      </div>

    </div>
  );
}
