/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, Code, Table, Terminal, Shield, Clipboard, Check, 
  Calendar, Cpu, AlertTriangle, CheckCircle, Info, RefreshCw, X, Download,
  Layers, MessageSquare, Landmark, Globe, ChevronDown, ChevronRight, FolderTree, Sparkles
} from 'lucide-react';
import { ActivityLog } from '../types';
import { Language, translations } from '../lib/i18n';

export interface AgentAuditLogProps {
  logs: ActivityLog[];
  language: Language;
  onCleanLogs?: (cleanedLogs: ActivityLog[]) => void;
}

export type LogActionCategory = 'matching' | 'outreach' | 'payments' | 'research' | 'system';

/**
 * Categorize any activity log into one of the core activity types:
 * matching, outreach, payments, research, system
 */
export function categorizeLogAction(log: ActivityLog): LogActionCategory {
  const agent = (log.agent || '').toLowerCase();
  const msg = (log.message || '').toLowerCase();

  // 1. Payments / Commission / Sacombank / Finance
  if (
    agent.includes('finance') ||
    msg.includes('thanh toán') ||
    msg.includes('hoa hồng') ||
    msg.includes('commission') ||
    msg.includes('sacombank') ||
    msg.includes('060129073198') ||
    msg.includes('0601 2907 3198') ||
    msg.includes('nguyen tan si') ||
    msg.includes('chuyển khoản') ||
    msg.includes('biên lai') ||
    msg.includes('proof') ||
    msg.includes('công nợ') ||
    msg.includes('settlement') ||
    msg.includes('payout') ||
    msg.includes('đối soát') ||
    msg.includes('remittance') ||
    msg.includes('phí dịch vụ') ||
    msg.includes('cleared') ||
    msg.includes('payment')
  ) {
    return 'payments';
  }

  // 2. Outreach / Communication / Negotiation
  if (
    agent.includes('outreach') ||
    agent.includes('email') ||
    agent.includes('intercom') ||
    agent.includes('communication') ||
    msg.includes('outreach') ||
    msg.includes('nhắn tin') ||
    msg.includes('giao tiếp') ||
    msg.includes('liên hệ') ||
    msg.includes('thương lượng') ||
    msg.includes('đàm phán') ||
    msg.includes('negotiat') ||
    msg.includes('chat') ||
    msg.includes('email') ||
    msg.includes('template') ||
    msg.includes('unlock') ||
    msg.includes('mở khóa') ||
    msg.includes('contact info') ||
    msg.includes('tin nhắn') ||
    msg.includes('proposal sent') ||
    msg.includes('reminder') ||
    msg.includes('nhắc nợ')
  ) {
    return 'outreach';
  }

  // 3. Matching / Scoring / Deals / Bubbles
  if (
    agent.includes('sales') ||
    msg.includes('khớp') ||
    msg.includes('matching') ||
    msg.includes('match') ||
    msg.includes('cặp') ||
    msg.includes('lead') ||
    msg.includes('đầu mối') ||
    msg.includes('deal') ||
    msg.includes('thương vụ') ||
    msg.includes('confidence') ||
    msg.includes('score') ||
    msg.includes('stalled') ||
    msg.includes('can thiệp') ||
    msg.includes('alignment') ||
    msg.includes('ghép nối') ||
    msg.includes('bubble') ||
    msg.includes('evaluating buyer')
  ) {
    return 'matching';
  }

  // 4. Research / Ingestion / Social Streams / Market Signals
  if (
    agent.includes('research') ||
    msg.includes('research') ||
    msg.includes('quét') ||
    msg.includes('scan') ||
    msg.includes('stream') ||
    msg.includes('signal') ||
    msg.includes('decahose') ||
    msg.includes('firehose') ||
    msg.includes('tiktok') ||
    msg.includes('taobao') ||
    msg.includes('youtube') ||
    msg.includes('amazon') ||
    msg.includes('catalog') ||
    msg.includes('lake') ||
    msg.includes('thị trường') ||
    msg.includes('sourcing')
  ) {
    return 'research';
  }

  return 'system';
}

/**
 * Pure cleanup function to automatically remove duplicate audit log entries
 * from any array of logs based on unique IDs, normalized signatures, and repeated identical messages.
 */
export function cleanupDuplicateAuditLogs(logs: ActivityLog[]): ActivityLog[] {
  if (!logs || !Array.isArray(logs)) return [];
  
  const seenIds = new Set<string>();
  const seenExactSignatures = new Set<string>();
  const cleaned: ActivityLog[] = [];

  for (const log of logs) {
    if (!log) continue;

    const id = (log.id || '').trim();
    if (id) {
      if (seenIds.has(id)) {
        continue;
      }
      seenIds.add(id);
    }

    const agent = (log.agent || '').trim().toLowerCase();
    const msg = (log.message || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const time = (log.timestamp || '').trim();

    // Check exact duplicate signature
    const exactSig = `${agent}|${time}|${msg}`;
    if (seenExactSignatures.has(exactSig)) {
      continue;
    }
    seenExactSignatures.add(exactSig);

    // Skip consecutive identical messages from the same agent
    if (cleaned.length > 0) {
      const prev = cleaned[cleaned.length - 1];
      const prevAgent = (prev.agent || '').trim().toLowerCase();
      const prevMsg = (prev.message || '').trim().replace(/\s+/g, ' ').toLowerCase();
      if (prevAgent === agent && prevMsg === msg) {
        continue;
      }
    }

    cleaned.push(log);
  }

  return cleaned;
}

export default function AgentAuditLog({ logs, language, onCleanLogs }: AgentAuditLogProps) {
  const t = translations[language];

  // Internal state of logs with automatic deduplication
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>(() => cleanupDuplicateAuditLogs(logs));
  const [cleanedDuplicatesCount, setCleanedDuplicatesCount] = useState<number>(0);
  const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);

  // Category toggle state: 'ALL' or specific activity type (matching, outreach, payments, etc.)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // Search & secondary filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'json' | 'table'>('json');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Grouping state
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Remote server audit & self-improvement status
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSuccessMessage, setAuditSuccessMessage] = useState<string | null>(null);

  // Automated state deduplication cleanup function
  const runStateDeduplication = useCallback((incomingLogs: ActivityLog[]) => {
    const cleaned = cleanupDuplicateAuditLogs(incomingLogs);
    const removed = incomingLogs.length - cleaned.length;
    if (removed > 0) {
      setCleanedDuplicatesCount(prev => prev + removed);
      if (onCleanLogs) {
        onCleanLogs(cleaned);
      }
    }
    setAuditLogs(cleaned);
    return { cleaned, removed };
  }, [onCleanLogs]);

  // Automatically monitor and clean incoming logs prop whenever it changes
  useEffect(() => {
    runStateDeduplication(logs);
  }, [logs, runStateDeduplication]);

  // Manual trigger button to remove duplicates from state immediately
  const handleManualCleanup = () => {
    const { removed } = runStateDeduplication(auditLogs);
    if (removed > 0) {
      const msg = language === 'vi'
        ? `Đã tự động dọn sạch ${removed} bản ghi log trùng lặp trong state.`
        : `Automatically removed ${removed} duplicate audit log entries in state.`;
      setCleanupNotice(msg);
    } else {
      const msg = language === 'vi'
        ? `State đã được dọn sạch hoàn toàn. 0 bản ghi trùng lặp.`
        : `State is 100% clean. No duplicate log entries detected.`;
      setCleanupNotice(msg);
    }
    setTimeout(() => setCleanupNotice(null), 4000);
  };

  // Compute live counts per category from deduplicated audit logs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: auditLogs.length,
      matching: 0,
      outreach: 0,
      payments: 0,
      research: 0,
      system: 0
    };

    auditLogs.forEach(log => {
      const cat = categorizeLogAction(log);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.system++;
      }
    });

    return counts;
  }, [auditLogs]);

  // Category definitions with styling
  const categoryDefinitions = useMemo(() => {
    return [
      {
        id: 'matching' as LogActionCategory,
        name: t.logCategoryMatching,
        shortLabel: language === 'vi' ? 'Khớp Nối' : 'Matching',
        description: language === 'vi' 
          ? 'Thuật toán đối soát độ tương thích, điểm số ghép cặp nhà cung ứng & người mua'
          : 'Autonomous alignment scoring, buyer-seller pairing and confidence analysis',
        icon: Layers,
        activeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm shadow-sky-500/20',
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        borderColor: 'border-sky-500/30 hover:border-sky-500/50'
      },
      {
        id: 'outreach' as LogActionCategory,
        name: t.logCategoryOutreach,
        shortLabel: language === 'vi' ? 'Tiếp Cận & Đàm Phán' : 'Outreach',
        description: language === 'vi'
          ? 'Tin nhắn đàm phán, mở khóa liên hệ và điều phối trao đổi đôi bên'
          : 'Negotiation dispatch, contact disclosure and autonomous multi-agent chats',
        icon: MessageSquare,
        activeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/20',
        badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        borderColor: 'border-purple-500/30 hover:border-purple-500/50'
      },
      {
        id: 'payments' as LogActionCategory,
        name: t.logCategoryPayments,
        shortLabel: language === 'vi' ? 'Thanh Toán & Hoa Hồng' : 'Payments',
        description: language === 'vi'
          ? 'Xác thực biên lai Sacombank 060129073198 (NGUYỄN TẤN SĨ / NGUYEN TAN SI), đối soát doanh số & thu hồi công nợ'
          : 'Sacombank remittances, verified commission receipts, debt tracking and payout ledgers',
        icon: Landmark,
        activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        borderColor: 'border-emerald-500/30 hover:border-emerald-500/50'
      },
      {
        id: 'research' as LogActionCategory,
        name: t.logCategoryResearch,
        shortLabel: language === 'vi' ? 'Nghiên Cứu' : 'Research',
        description: language === 'vi'
          ? 'Quét dữ liệu real-time từ Decahose, Firehose, TikTok, Taobao, YouTube, Amazon'
          : 'High-frequency streaming signals, social commerce discovery and catalog lake ingestion',
        icon: Globe,
        activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        borderColor: 'border-amber-500/30 hover:border-amber-500/50'
      },
      {
        id: 'system' as LogActionCategory,
        name: t.logCategorySystem,
        shortLabel: language === 'vi' ? 'Hệ Thống' : 'System',
        description: language === 'vi'
          ? 'Điều hành đa Agent, socket kiểm toán, quản trị lỗi và tự hoàn thiện định kỳ'
          : 'Multi-agent orchestration, socket synchronization, integrity audits and self-improvement',
        icon: Terminal,
        activeColor: 'bg-slate-700/50 text-slate-200 border-slate-600 shadow-sm',
        badgeColor: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
        borderColor: 'border-slate-700/50 hover:border-slate-600'
      }
    ];
  }, [t, language]);

  // Extract unique agents from current audit logs for filter list
  const availableAgents = useMemo(() => {
    const agents = new Set<string>();
    auditLogs.forEach(log => {
      if (log.agent) agents.add(log.agent);
    });
    return Array.from(agents).sort();
  }, [auditLogs]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered logs based on Category Toggle, search query, agent, and severity
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const category = categorizeLogAction(log);
      const matchesCategory = activeCategoryFilter === 'ALL' || category === activeCategoryFilter;

      const matchesSearch = 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAgent = selectedAgent === 'ALL' || log.agent === selectedAgent;
      const matchesSeverity = selectedSeverity === 'ALL' || log.status === selectedSeverity;

      return matchesCategory && matchesSearch && matchesAgent && matchesSeverity;
    });
  }, [auditLogs, searchTerm, selectedAgent, selectedSeverity, activeCategoryFilter]);

  // Grouped logs dictionary
  const groupedLogs = useMemo(() => {
    const groups: Record<LogActionCategory, ActivityLog[]> = {
      matching: [],
      outreach: [],
      payments: [],
      research: [],
      system: []
    };

    filteredLogs.forEach(log => {
      const cat = categorizeLogAction(log);
      if (groups[cat]) {
        groups[cat].push(log);
      } else {
        groups.system.push(log);
      }
    });

    return groups;
  }, [filteredLogs]);

  // Toggle category collapse
  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    categoryDefinitions.forEach(c => {
      allCollapsed[c.id] = true;
    });
    setCollapsedCategories(allCollapsed);
  };

  // Trigger manual Audit & Self-Improvement on backend
  const handleTriggerAudit = async () => {
    setIsAuditing(true);
    setAuditSuccessMessage(null);
    try {
      const res = await fetch('/api/system/audit-self-improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.activityLogs) {
          runStateDeduplication(data.activityLogs);
        }
        const removed = (data.report?.duplicatesRemoved?.buyers || 0) +
                        (data.report?.duplicatesRemoved?.sellers || 0) +
                        (data.report?.duplicatesRemoved?.bubbles || 0) +
                        (data.report?.duplicatesRemoved?.verifiedDeals || 0) +
                        (data.report?.duplicatesRemoved?.logs || 0);
        const msg = language === 'vi'
          ? `Kiểm toán hoàn tất: Đã loại bỏ ${removed} mục trùng lặp. Sổ cái Sacombank: ${data.totalCommissionEarnedVND?.toLocaleString()} VND.`
          : `Audit successful: ${removed} duplicates purged. Sacombank verified commission: ${data.totalCommissionEarnedVND?.toLocaleString()} VND.`;
        setAuditSuccessMessage(msg);
        setTimeout(() => setAuditSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Audit trigger error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Export logs to CSV with Category column
  const exportLogsToCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;

    const headers = [
      'Log ID',
      'Timestamp',
      'Action Category',
      'Agent',
      'Severity/Status',
      'Message'
    ];

    const escapeCSV = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredLogs.map(log => [
      escapeCSV(log.id),
      escapeCSV(log.timestamp),
      escapeCSV(categorizeLogAction(log).toUpperCase()),
      escapeCSV(log.agent),
      escapeCSV(log.status),
      escapeCSV(log.message)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `agent_audit_logs_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color map for severity
  const getSeverityStyle = (status: 'info' | 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          text: 'text-emerald-400',
          indicator: 'bg-emerald-400',
          icon: CheckCircle
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          text: 'text-amber-400',
          indicator: 'bg-amber-400',
          icon: AlertTriangle
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          text: 'text-rose-400',
          indicator: 'bg-rose-400',
          icon: AlertTriangle
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          text: 'text-indigo-400',
          indicator: 'bg-indigo-400',
          icon: Info
        };
    }
  };

  // Render a log entry in JSON view
  const renderJsonEntry = (log: ActivityLog, index: number) => {
    const sev = getSeverityStyle(log.status);
    const category = categorizeLogAction(log);
    
    const logJson = JSON.stringify({
      id: log.id,
      timestamp: log.timestamp,
      category: category.toUpperCase(),
      agent: log.agent,
      action: log.message,
      status: log.status,
      integrity_hash: `sha256_${btoa(log.id + (log.agent || '')).substring(0, 8)}`
    }, null, 2);

    return (
      <div 
        key={`${log.id}-${index}`} 
        className="bg-slate-950/90 border border-slate-800/60 rounded-xl p-3.5 transition-all hover:border-slate-700/80 relative group"
      >
        <button
          onClick={() => handleCopy(logJson, log.id)}
          className="absolute right-3 top-3 p-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 rounded-lg text-slate-400 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 cursor-pointer"
          title="Copy log entry to clipboard"
          id={`copy-log-btn-${log.id}`}
        >
          {copiedId === log.id ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-bold text-emerald-400 font-sans uppercase">Copied</span>
            </>
          ) : (
            <>
              <Clipboard className="w-3 h-3" />
              <span className="text-[9px] font-bold font-sans uppercase">Copy</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-900/50 flex-wrap">
          <span className={`w-2 h-2 rounded-full ${sev.indicator}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 font-sans">
            <Cpu className="w-3 h-3 text-indigo-400" />
            {log.agent} Agent
          </span>
          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {category}
          </span>
          <span className="text-[10px] font-bold text-slate-600 font-sans ml-auto">
            ID: {log.id}
          </span>
        </div>

        <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap select-all font-mono leading-relaxed max-w-full">
          <span className="text-slate-500">&#123;</span>
          {`\n  `}
          <span className="text-sky-400">"id"</span>: <span className="text-amber-300">"{log.id}"</span>,
          {`\n  `}
          <span className="text-sky-400">"timestamp"</span>: <span className="text-emerald-400">"{log.timestamp}"</span>, <span className="text-slate-600 font-sans text-[10px] select-none">// {t.realDateOnly}</span>
          {`\n  `}
          <span className="text-sky-400">"category"</span>: <span className="text-purple-300">"{category.toUpperCase()}"</span>,
          {`\n  `}
          <span className="text-sky-400">"agent"</span>: <span className="text-amber-300">"{log.agent}"</span>,
          {`\n  `}
          <span className="text-sky-400">"action"</span>: <span className="text-indigo-300">"{log.message}"</span>,
          {`\n  `}
          <span className="text-sky-400">"status"</span>: <span className={log.status === 'success' ? 'text-emerald-400' : log.status === 'warning' ? 'text-amber-400' : log.status === 'error' ? 'text-rose-400' : 'text-sky-400'}>"{log.status}"</span>
          {`\n`}
          <span className="text-slate-500">&#123;</span>
        </pre>
      </div>
    );
  };

  // Render a log entry in Table view
  const renderTableRows = (entries: ActivityLog[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold text-[10px]">{t.realDateOnly}</th>
              <th className="px-4 py-3 font-semibold text-[10px]">Log ID</th>
              <th className="px-4 py-3 font-semibold text-[10px]">Category</th>
              <th className="px-4 py-3 font-semibold text-[10px]">Agent Specialist</th>
              <th className="px-4 py-3 font-semibold text-[10px]">Severity</th>
              <th className="px-4 py-3 font-semibold text-[10px]">Executed Payload Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 bg-slate-950/20">
            {entries.map((log, index) => {
              const sev = getSeverityStyle(log.status);
              const LogIcon = sev.icon;
              const category = categorizeLogAction(log);
              return (
                <tr 
                  key={`${log.id}-${index}`} 
                  className="hover:bg-slate-900/30 transition-all"
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-300 font-bold">
                    {log.id}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                      <Cpu className="w-3 h-3 text-indigo-400" />
                      {log.agent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${sev.bg}`}>
                      <LogIcon className="w-3 h-3" />
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-sm lg:max-w-md truncate hover:whitespace-normal font-mono text-[11px]" title={log.message}>
                    {log.message}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/20 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-slate-950/20 flex flex-col" id="agent-audit-log-section">
      
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shadow-inner shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
                {t.agentAuditLog}
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold">
                AUDIT-SECURE
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AUTO-CLEANED STATE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t.auditLogDesc}
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          
          {/* Cleanup Duplicate Logs in State Button */}
          <button
            onClick={handleManualCleanup}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            title="Automatically remove duplicate audit log entries in state"
            id="btn-cleanup-duplicates"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'vi' ? 'Dọn Bản Ghi Trùng' : 'Clean Duplicates'}</span>
            {cleanedDuplicatesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold">
                -{cleanedDuplicatesCount}
              </span>
            )}
          </button>

          {/* Autonomous Audit & Self-Improve Button */}
          <button
            onClick={handleTriggerAudit}
            disabled={isAuditing}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              isAuditing 
                ? 'bg-indigo-950/40 text-indigo-400/50 border-indigo-900/50' 
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50'
            }`}
            title="Trigger real-time integrity audit & remove duplicates on server"
            id="trigger-audit-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? (language === 'vi' ? 'Đang Kiểm Toán...' : 'Auditing...') : (language === 'vi' ? 'Audit & Tự Hoàn Thiện' : 'Audit & Self-Improve')}</span>
          </button>

          {/* Group by Category Toggle Button */}
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              groupByCategory
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-extrabold'
                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Toggle grouping log entries by action category accordion"
            id="toggle-group-category-btn"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>{groupByCategory ? t.ungroupLogs : t.groupLogsByCategory}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportLogsToCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Export logs to CSV"
            id="export-audit-logs-csv-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Xuất CSV' : 'Export CSV'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setViewMode('json')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'json' 
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="view-mode-json-btn"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.jsonView}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table' 
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="view-mode-table-btn"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.tableView}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit & Cleanup notifications */}
      {cleanupNotice && (
        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in slide-in-from-top-1">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{cleanupNotice}</span>
        </div>
      )}

      {auditSuccessMessage && (
        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in slide-in-from-top-1">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{auditSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY TOGGLE: Filter log entries by activity type (matching, outreach, payments) */}
      {/* ========================================================================= */}
      <div className="mt-4 pt-1 pb-3.5 border-b border-slate-800/60 flex flex-col gap-2" id="audit-category-toggle-section">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-sans">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              {language === 'vi' ? 'Bộ Lọc Danh Mục Hoạt Động' : 'Activity Type Filter'}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">•</span>
            <span className="text-[10.5px] text-slate-400 hidden sm:inline">
              {language === 'vi' ? 'Chọn loại hoạt động để lọc ngay lập tức' : 'Toggle category to filter log entries by activity type'}
            </span>
          </div>

          {activeCategoryFilter !== 'ALL' && (
            <button
              onClick={() => setActiveCategoryFilter('ALL')}
              className="text-[10.5px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{language === 'vi' ? 'Xem Tất Cả' : 'Show All'}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Toggle Segmented Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          
          {/* 1. All Activities Toggle */}
          <button
            onClick={() => setActiveCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeCategoryFilter === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-extrabold'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            id="category-toggle-all"
            title="Show all activity types"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.logCategoryAll}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              activeCategoryFilter === 'ALL' ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-400'
            }`}>
              {categoryCounts.ALL}
            </span>
          </button>

          {/* 2. Matching Toggle (Activity Type: matching) */}
          <button
            onClick={() => setActiveCategoryFilter('matching')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeCategoryFilter === 'matching'
                ? 'bg-sky-500/25 text-sky-200 border-sky-500/60 shadow-md shadow-sky-500/20 font-extrabold ring-1 ring-sky-400/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-sky-300 hover:border-sky-500/40'
            }`}
            id="category-toggle-matching"
            title="Filter by Matching activity (supplier & buyer alignment, scoring)"
          >
            <Layers className={`w-3.5 h-3.5 ${activeCategoryFilter === 'matching' ? 'text-sky-300' : 'text-sky-400'}`} />
            <span>{language === 'vi' ? 'Khớp Nối (Matching)' : 'Matching'}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              activeCategoryFilter === 'matching' ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-900 text-slate-400'
            }`}>
              {categoryCounts.matching}
            </span>
          </button>

          {/* 3. Outreach Toggle (Activity Type: outreach) */}
          <button
            onClick={() => setActiveCategoryFilter('outreach')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeCategoryFilter === 'outreach'
                ? 'bg-purple-500/25 text-purple-200 border-purple-500/60 shadow-md shadow-purple-500/20 font-extrabold ring-1 ring-purple-400/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-purple-300 hover:border-purple-500/40'
            }`}
            id="category-toggle-outreach"
            title="Filter by Outreach activity (negotiation messages, contact unlock)"
          >
            <MessageSquare className={`w-3.5 h-3.5 ${activeCategoryFilter === 'outreach' ? 'text-purple-300' : 'text-purple-400'}`} />
            <span>{language === 'vi' ? 'Tiếp Cận (Outreach)' : 'Outreach'}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              activeCategoryFilter === 'outreach' ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-900 text-slate-400'
            }`}>
              {categoryCounts.outreach}
            </span>
          </button>

          {/* 4. Payments Toggle (Activity Type: payments) */}
          <button
            onClick={() => setActiveCategoryFilter('payments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeCategoryFilter === 'payments'
                ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/60 shadow-md shadow-emerald-500/20 font-extrabold ring-1 ring-emerald-400/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
            }`}
            id="category-toggle-payments"
            title="Filter by Payments activity (Sacombank 060129073198 remittances, commission proofs)"
          >
            <Landmark className={`w-3.5 h-3.5 ${activeCategoryFilter === 'payments' ? 'text-emerald-300' : 'text-emerald-400'}`} />
            <span>{language === 'vi' ? 'Thanh Toán (Payments)' : 'Payments'}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              activeCategoryFilter === 'payments' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-900 text-slate-400'
            }`}>
              {categoryCounts.payments}
            </span>
          </button>

          {/* 5. Research & Sourcing Toggle */}
          <button
            onClick={() => setActiveCategoryFilter('research')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              activeCategoryFilter === 'research'
                ? 'bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-md shadow-amber-500/20 font-extrabold ring-1 ring-amber-400/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
            }`}
            id="category-toggle-research"
            title="Filter by Market Research & Sourcing Streams"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'vi' ? 'Nghiên Cứu' : 'Research'}</span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-900 text-slate-400">
              {categoryCounts.research}
            </span>
          </button>

          {/* 6. System & Governance Toggle */}
          <button
            onClick={() => setActiveCategoryFilter('system')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              activeCategoryFilter === 'system'
                ? 'bg-slate-700/60 text-slate-100 border-slate-500 shadow-md font-extrabold'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            id="category-toggle-system"
            title="Filter by System orchestration & audit logs"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'vi' ? 'Hệ Thống' : 'System'}</span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-900 text-slate-400">
              {categoryCounts.system}
            </span>
          </button>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 pb-4 border-b border-slate-800/40">
        
        {/* Search input */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchLogsPlaceholder}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 focus:outline-none rounded-xl pl-10 pr-8 py-2 text-xs font-medium text-slate-200 placeholder-slate-500"
            id="search-audit-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Agent filter dropdown */}
        <div className="md:col-span-3 flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden lg:inline">Agent:</span>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 focus:outline-none rounded-xl px-3 py-2 text-xs font-medium text-slate-200"
            id="filter-agent-select"
          >
            <option value="ALL">{t.allAgentsFilter}</option>
            {availableAgents.map(ag => (
              <option key={ag} value={ag}>{ag} Agent</option>
            ))}
          </select>
        </div>

        {/* Severity filter dropdown */}
        <div className="md:col-span-4 flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden lg:inline">Status:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 focus:outline-none rounded-xl px-3 py-2 text-xs font-medium text-slate-200"
            id="filter-severity-select"
          >
            <option value="ALL">{t.allSeveritiesFilter}</option>
            <option value="success">Success / Green</option>
            <option value="info">Info / Neutral</option>
            <option value="warning">Warning / Alert</option>
            <option value="error">Error / Fault</option>
          </select>
          
          <div className="text-[10.5px] font-bold font-mono text-slate-400 px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl shrink-0" title="Filtered entries / Total deduplicated in state">
            {filteredLogs.length} / {auditLogs.length}
          </div>
        </div>

      </div>

      {/* Accordion expand/collapse row when Grouping is toggled */}
      {groupByCategory && (
        <div className="flex items-center justify-between gap-2 mt-3 pb-2 border-b border-slate-800/40">
          <span className="text-[10.5px] font-bold text-slate-400">
            {language === 'vi' ? 'Đang hiển thị dạng nhóm danh mục hành động' : 'Displaying logs grouped by category accordion'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t.expandAllGroups}
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={collapseAll}
              className="text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t.collapseAllGroups}
            </button>
          </div>
        </div>
      )}

      {/* Logs Render Container */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col">
        
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Terminal className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider">No Auditable Entries Match Filters</p>
            <p className="text-[11px] text-slate-400">
              {activeCategoryFilter !== 'ALL' 
                ? `No entries found for activity type: "${activeCategoryFilter}". Click "Show All" or switch category.`
                : 'Try adjusting your query strings or dropdown parameters.'}
            </p>
            {activeCategoryFilter !== 'ALL' && (
              <button
                onClick={() => setActiveCategoryFilter('ALL')}
                className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                {language === 'vi' ? 'Xóa Bộ Lọc Danh Mục' : 'Clear Category Filter'}
              </button>
            )}
          </div>
        ) : groupByCategory ? (
          /* GROUPED BY CATEGORY VIEW */
          <div className="overflow-y-auto max-h-[600px] p-4 space-y-4 custom-scrollbar">
            {categoryDefinitions
              .filter(cat => activeCategoryFilter === 'ALL' || activeCategoryFilter === cat.id)
              .map(cat => {
                const entries = groupedLogs[cat.id] || [];
                if (entries.length === 0 && activeCategoryFilter !== cat.id) {
                  return null; // Skip empty categories unless filtered specifically
                }

                const isCollapsed = Boolean(collapsedCategories[cat.id]);
                const Icon = cat.icon;

                // Breakdown stats
                const successCount = entries.filter(e => e.status === 'success').length;
                const warningCount = entries.filter(e => e.status === 'warning').length;
                const errorCount = entries.filter(e => e.status === 'error').length;
                const infoCount = entries.filter(e => e.status === 'info').length;

                return (
                  <div 
                    key={cat.id}
                    className={`border rounded-xl bg-slate-950/90 transition-all ${cat.borderColor} overflow-hidden shadow-md`}
                  >
                    {/* Category Accordion Header */}
                    <div 
                      onClick={() => toggleCategory(cat.id)}
                      className="p-3.5 bg-slate-900/60 hover:bg-slate-900/90 cursor-pointer flex items-center justify-between gap-3 select-none transition-colors border-b border-slate-850"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${cat.badgeColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                              {cat.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {entries.length} {language === 'vi' ? 'bản ghi' : 'entries'}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 mt-0.5 max-w-2xl line-clamp-1">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      {/* Right chips and Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        {successCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hidden sm:inline">
                            {successCount} ok
                          </span>
                        )}
                        {warningCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hidden sm:inline">
                            {warningCount} warn
                          </span>
                        )}
                        {errorCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hidden sm:inline">
                            {errorCount} err
                          </span>
                        )}
                        {infoCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hidden md:inline">
                            {infoCount} info
                          </span>
                        )}
                        <div className="p-1 rounded bg-slate-800/80 text-slate-400">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category Content */}
                    {!isCollapsed && (
                      <div className="p-3">
                        {entries.length === 0 ? (
                          <div className="py-6 text-center text-slate-500 text-xs">
                            {language === 'vi' ? 'Không có bản ghi nào trong danh mục này khớp với bộ lọc hiện tại' : 'No logs in this category match current filters'}
                          </div>
                        ) : viewMode === 'json' ? (
                          <div className="space-y-3 font-mono text-xs text-slate-300">
                            {entries.map((log, index) => renderJsonEntry(log, index))}
                          </div>
                        ) : (
                          renderTableRows(entries)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : viewMode === 'json' ? (
          /* STANDARD UNGROUPED JSON LOG VIEW */
          <div className="overflow-y-auto max-h-[500px] p-4 space-y-3.5 custom-scrollbar font-mono text-xs text-slate-300">
            {filteredLogs.map((log, index) => renderJsonEntry(log, index))}
          </div>
        ) : (
          /* STANDARD UNGROUPED TABLE VIEW */
          <div className="overflow-y-auto max-h-[500px]">
            {renderTableRows(filteredLogs)}
          </div>
        )}
      </div>

      {/* Verification footer block */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <span>Real-time Syncing & State Deduplication: Active</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span>Sacombank 060129073198 Hash Verified • Self-Improving</span>
        </div>
      </div>

    </div>
  );
}
