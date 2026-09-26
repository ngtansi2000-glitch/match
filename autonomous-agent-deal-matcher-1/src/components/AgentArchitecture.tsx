/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Cpu, Shield, Database, RefreshCw, HelpCircle, CheckCircle, Play, Layers, BarChart3, Activity, Gauge, Zap, AlertTriangle, TrendingUp, Brain, Globe } from 'lucide-react';
import { ActivityLog, AgentMetric, AgentIntercom } from '../types';
import { Language, Currency, translations, formatCurrency } from '../lib/i18n';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-slate-800 p-2 rounded shadow-xl text-[10px] font-mono">
        <p className="font-bold text-slate-300 mb-1">{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pld.color || pld.fill }} />
            <span className="text-slate-400">{pld.name}:</span>
            <span className="font-extrabold text-slate-100">
              {pld.value}
              {pld.name.includes('Rate') ? '%' : 'ms'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ConversionTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-800 p-2.5 rounded-xl shadow-2xl text-[10px] font-mono">
        <p className="font-extrabold text-indigo-400 mb-1">{data.time}</p>
        <p className="text-slate-300 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>Rate: <strong className="text-indigo-300">{data.rate}%</strong></span>
        </p>
        <div className="text-[9px] text-slate-400 mt-1 space-y-0.5 border-t border-slate-900 pt-1">
          <p>Matched: <span className="font-bold text-slate-300">{data.proposed}</span></p>
          <p>Completed: <span className="font-bold text-slate-300">{data.completed}</span></p>
          <p className="text-[8.5px] text-slate-500 mt-1 italic truncate max-w-[180px]">{data.event}</p>
        </div>
      </div>
    );
  }
  return null;
};

interface AgentArchitectureProps {
  logs: ActivityLog[];
  intercoms?: AgentIntercom[];
  onClearLogs?: () => void;
  language?: Language;
  currency?: Currency;
  exchangeRate?: number;
}

export default function AgentArchitecture({
  logs,
  intercoms = [],
  language = 'en',
  currency = 'VND',
  exchangeRate = 25000
}: AgentArchitectureProps) {
  const t = translations[language];
  const [activeLayer, setActiveLayer] = useState<number>(1);
  const [consoleTab, setConsoleTab] = useState<'logs' | 'intercom' | 'performance'>('logs');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationLogs, setCalibrationLogs] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Segment/Filter logs based on geographical region selection
  const filteredLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    if (selectedRegion === 'all') return logs;

    return logs.filter(log => {
      const msg = log.message.toLowerCase();
      const id = log.id;

      let matchKeywords = false;
      if (selectedRegion === 'vn') {
        matchKeywords = msg.includes('vietnam') || msg.includes('sacombank') || msg.includes('vnd') || msg.includes('văn phong') || msg.includes('ha dong') || msg.includes('silk village') || msg.includes('nguyen tan si') || msg.includes('domestic') || msg.includes('hcm') || msg.includes('hanoi') || msg.includes('saigon');
      } else if (selectedRegion === 'apac') {
        matchKeywords = msg.includes('taobao') || msg.includes('tiktok') || msg.includes('singapore') || msg.includes('china') || msg.includes('asia') || msg.includes('vietnam') || msg.includes('sacombank') || msg.includes('vnd') || msg.includes('văn phong') || msg.includes('ha dong') || msg.includes('silk village') || msg.includes('nguyen tan si') || msg.includes('domestic') || msg.includes('hcm') || msg.includes('hanoi') || msg.includes('saigon');
      } else if (selectedRegion === 'na') {
        matchKeywords = msg.includes('alena') || msg.includes('smirnova') || msg.includes('amazon') || msg.includes('ebay') || msg.includes('us') || msg.includes('america') || msg.includes('usd') || msg.includes('dollar') || msg.includes('new york') || msg.includes('canada');
      } else if (selectedRegion === 'eu') {
        matchKeywords = msg.includes('milan') || msg.includes('europe') || msg.includes('eu') || msg.includes('germany') || msg.includes('france') || msg.includes('euro') || msg.includes('italy') || msg.includes('london');
      }

      if (matchKeywords) return true;

      // Deterministic fallback based on log ID or length to guarantee rich logs across sections
      const numStr = id.replace(/\D/g, '');
      const num = numStr ? parseInt(numStr, 10) : log.message.length;
      const index = num % 4; // 4 regions
      
      const regionMap = ['vn', 'apac', 'na', 'eu'];
      const chosenRegion = regionMap[index];

      if (selectedRegion === 'vn') return chosenRegion === 'vn';
      if (selectedRegion === 'apac') return chosenRegion === 'apac' || chosenRegion === 'vn';
      if (selectedRegion === 'na') return chosenRegion === 'na';
      if (selectedRegion === 'eu') return chosenRegion === 'eu';

      return false;
    });
  }, [logs, selectedRegion]);

  const layers = [
    {
      id: 1,
      title: 'Layer 1: Executive AI Agent',
      subtitle: 'The CEO of the Platform',
      icon: Cpu,
      color: 'border-blue-500 bg-blue-50/50 text-blue-700',
      desc: 'Orchestrates the entire platform. Reads business objectives, partitions complex workflow pipelines, coordinates specialists, and directs autonomous actions.',
      responsibilities: [
        'Analyze global trade sourcing requests',
        'Direct task delegations to Research, Sales & Finance',
        'Evaluate confidence data and authorize outreach'
      ],
      tools: ['Workflow Orchestrator', 'Continuous Improvement Feedback Hook']
    },
    {
      id: 2,
      title: 'Layer 2: Specialist AI Agents',
      subtitle: 'Department Experts',
      icon: Layers,
      color: 'border-purple-500 bg-purple-50/50 text-purple-700',
      desc: 'Highly specialized agent brains acting as dedicated departments. They work in tandem, trading information in a secure pipeline.',
      responsibilities: [
        'Sales AI: Find leads, qualify buyers, manage CRM communication logs',
        'Research AI: Crawl social feeds (TikTok, Taobao, Popshop) for trending products',
        'Marketing AI: Auto-generate optimized, high-converting trade proposals',
        'Finance AI: Compute commission margins and verify Sacombank clearances'
      ],
      tools: ['Gemini 3.6 Flash', 'Grounding Models', 'Trade Classification Engine']
    },
    {
      id: 3,
      title: 'Layer 3: Tool & Integration Agents',
      subtitle: 'Software Handlers',
      icon: Database,
      color: 'border-amber-500 bg-amber-50/50 text-amber-700',
      desc: 'Technical executers that interact directly with software interfaces, APIs, files, and notification hubs. They execute, they do not make strategic decisions.',
      responsibilities: [
        'Browser Agent: Scraping live product streams on digital firehoses',
        'Email Agent: Dispatching trade proposals directly to buyers/sellers',
        'Database Agent: Reading/writing match indexes and transactions',
        'File Agent: Archiving agreements, invoices, and ledger documents'
      ],
      tools: ['Web Scrapers', 'SMTP Transports', 'PostgreSQL/Firestore Client', 'Local File Systems']
    },
    {
      id: 4,
      title: 'Layer 4: Memory System',
      subtitle: 'The Knowledge Vault',
      icon: Database,
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700',
      desc: 'Multi-tiered storage keeping memory synchronized. Ensures agents act with consistent context and preserve client preferences across sessions.',
      responsibilities: [
        'Short-term Memory: Live transaction sessions & active chats',
        'Long-term Memory: Historical buyer purchase behaviors & supplier reliability',
        'Knowledge Base: Standard Operating Procedures (SOPs) & international trade rules'
      ],
      tools: ['In-Memory State', 'Vector Embeddings', 'Sacombank Commission Ledger']
    },
    {
      id: 5,
      title: 'Layer 5: Continuous Improvement',
      subtitle: 'Self-Evaluating Engine',
      icon: RefreshCw,
      color: 'border-teal-500 bg-teal-50/50 text-teal-700',
      desc: 'Post-task assessment loop. Analyzes successful conversions and optimizes communication templates without modifying core platform code.',
      responsibilities: [
        'Measure conversions & buyer bubble click-through rates',
        'Optimize outreach pitch templates based on winning responses',
        'Adjust heuristic matching filters dynamically'
      ],
      tools: ['A/B Testing Framework', 'Feedback Weight Matrices', 'Template Optimizer']
    },
    {
      id: 6,
      title: 'Layer 6: Matching Engine',
      subtitle: 'Trade Match Calculator',
      icon: CheckCircle,
      color: 'border-rose-500 bg-rose-50/50 text-rose-700',
      desc: 'Determines compatibility score between buyers and manufacturers. Ensures strict evaluation of confidence (must score ≥80% to authorize).',
      responsibilities: [
        'Calculate word-similarity overlaps of buyer demands',
        'Assess price discrepancies relative to targets',
        'Evaluate geographical and delivery turnaround risks'
      ],
      tools: ['Gemini 3.6 Flash Semantic Analyzer', 'Price Tolerance Filter']
    },
    {
      id: 7,
      title: 'Layer 7: 24/7 Scheduler',
      subtitle: 'Constant Autonomous Loop',
      icon: Play,
      color: 'border-indigo-500 bg-indigo-50/50 text-indigo-700',
      desc: 'Triggers matching routines, stream crawls, and customer notifications at defined intervals to guarantee uninterrupted operation.',
      responsibilities: [
        'Query social commerce networks every minute',
        'Identify matching opportunities automatically',
        'Push deal updates in real-time'
      ],
      tools: ['Interval Task Orchestration', 'Background Job Queues']
    },
    {
      id: 8,
      title: 'Layer 8: Safety & Guardrails',
      subtitle: 'Transaction Gatekeeper',
      icon: Shield,
      color: 'border-red-500 bg-red-50/50 text-red-700',
      desc: 'Ensures the system does not act errantly. Restricts contacts until commission is authorized, and provides transparent audit logs.',
      responsibilities: [
        'Mask direct contact numbers until bubble click-through occurs',
        'Enforce manual broker approvals for massive bulk contracts',
        'Log all agent actions in encrypted telemetry streams'
      ],
      tools: ['Access Control Tokens', 'Audit Log Monitor']
    }
  ];

  const agentMetrics: AgentMetric[] = [
    { name: 'Executive AI', status: 'idle', lastActive: 'Just now', successRate: 98, tasksCompleted: 421 },
    { name: 'Research AI', status: 'working', lastActive: '12s ago', successRate: 91, tasksCompleted: 1805 },
    { name: 'Sales AI', status: 'working', lastActive: '5s ago', successRate: 88, tasksCompleted: 844 },
    { name: 'Finance AI', status: 'idle', lastActive: '3m ago', successRate: 100, tasksCompleted: 219 }
  ];

  // Dynamic performance metrics calculated based on telemetry logs and stalled statuses
  const performanceData = useMemo(() => {
    const agentIssues = {
      Research: 0,
      Sales: 0,
      Finance: 0,
    };
    
    filteredLogs.forEach(log => {
      const agentKey = log.agent;
      if (agentKey === 'Research' || agentKey === 'Sales' || agentKey === 'Finance') {
        if (log.status === 'warning' || log.status === 'error') {
          agentIssues[agentKey]++;
        }
      }
    });

    const hasStalledDeals = filteredLogs.some(log => 
      log.message.toLowerCase().includes('stalled') || 
      log.message.toLowerCase().includes('intervention')
    );
    
    let researchSuccess = Math.max(78, 93 - agentIssues.Research * 4);
    let researchLatency = 950 + agentIssues.Research * 180;

    let salesSuccess = Math.max(72, (hasStalledDeals ? 82 : 89) - agentIssues.Sales * 5);
    let salesLatency = 1850 + (hasStalledDeals ? 750 : 0) + agentIssues.Sales * 250;

    let financeSuccess = Math.max(92, 99 - agentIssues.Finance * 2);
    let financeLatency = 320 + agentIssues.Finance * 60;

    // Apply geographical region multipliers/adjustments to the values to show high realism:
    if (selectedRegion === 'vn') {
      researchLatency = Math.round(researchLatency * 0.82);
      researchSuccess = Math.min(100, researchSuccess + 3);
      salesLatency = Math.round(salesLatency * 0.88);
      financeLatency = Math.round(financeLatency * 0.75); // Domestic Sacombank is blazing fast!
      financeSuccess = Math.min(100, financeSuccess + 1);
    } else if (selectedRegion === 'apac') {
      researchLatency = Math.round(researchLatency * 0.90);
      salesLatency = Math.round(salesLatency * 0.95);
      financeLatency = Math.round(financeLatency * 0.88);
    } else if (selectedRegion === 'na') {
      researchLatency = Math.round(researchLatency * 1.10); // Scrapers are slightly slower cross-border
      salesSuccess = Math.min(100, salesSuccess + 2); // Higher deal closing rate in North America
      salesLatency = Math.round(salesLatency * 1.05);
      financeLatency = Math.round(financeLatency * 1.12);
    } else if (selectedRegion === 'eu') {
      researchLatency = Math.round(researchLatency * 1.15); // Strict GDPR/scraping filters
      salesLatency = Math.round(salesLatency * 1.10);
      financeLatency = Math.round(financeLatency * 1.20); // Escrow clearance takes longer in EU
      financeSuccess = Math.max(85, financeSuccess - 2);
    }

    // Apply active optimization calibration state
    if (isCalibrating) {
      researchSuccess = Math.min(99, researchSuccess + 5);
      researchLatency = Math.round(researchLatency * 0.45);
      
      salesSuccess = Math.min(98, salesSuccess + 8);
      salesLatency = Math.round(salesLatency * 0.4);
      
      financeSuccess = Math.min(100, financeSuccess + 1);
      financeLatency = Math.round(financeLatency * 0.5);
    }

    return [
      {
        name: 'Research Agent',
        'Response Time': Math.round(researchLatency),
        'Success Rate': Math.round(researchSuccess),
        latencyColor: researchLatency > 1200 ? '#f59e0b' : '#6366f1',
        description: 'Scrapes social & wholesale feeds',
        status: isCalibrating ? 'Calibrated' : (researchLatency > 1200 ? 'Delayed' : 'Optimal'),
        issues: agentIssues.Research
      },
      {
        name: 'Sales Agent',
        'Response Time': Math.round(salesLatency),
        'Success Rate': Math.round(salesSuccess),
        latencyColor: salesLatency > 2200 ? '#f43f5e' : (salesLatency > 1500 ? '#f59e0b' : '#6366f1'),
        description: 'Qualifies leads & manages active chats',
        status: isCalibrating ? 'Calibrated' : (salesLatency > 2200 ? 'Bottleneck' : (salesLatency > 1500 ? 'Delayed' : 'Optimal')),
        issues: agentIssues.Sales + (hasStalledDeals ? 1 : 0)
      },
      {
        name: 'Finance Agent',
        'Response Time': Math.round(financeLatency),
        'Success Rate': Math.round(financeSuccess),
        latencyColor: '#10b981',
        description: 'Ledger clearance & escrow checks',
        status: isCalibrating ? 'Calibrated' : 'Optimal',
        issues: agentIssues.Finance
      }
    ];
  }, [filteredLogs, selectedRegion, isCalibrating]);

  // Dynamic successful deal conversion rate calculated chronologically over the activity logs
  const conversionRateData = useMemo(() => {
    const activeLogs = filteredLogs && filteredLogs.length > 0 ? filteredLogs : logs;
    if (!activeLogs || activeLogs.length === 0) {
      return [];
    }

    // Sort logs by timestamp ascending
    const sortedLogs = [...activeLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let proposedCount = 2; // Baseline based on initial deal bubbles (m-1 and m-2)
    let completedCount = 1; // Baseline (m-1 is COMPLETED, m-2 is pending)
    
    const dataPoints: { time: string; rate: number; proposed: number; completed: number; event: string }[] = [];

    // First seed point
    if (sortedLogs.length > 0) {
      const firstTime = new Date(sortedLogs[0].timestamp);
      const seedTime = new Date(firstTime.getTime() - 60000);
      
      let baseRate = Math.round((completedCount / proposedCount) * 100);
      if (selectedRegion === 'vn') baseRate = Math.min(95, baseRate + 5);
      else if (selectedRegion === 'apac') baseRate = Math.min(95, baseRate + 2);
      else if (selectedRegion === 'na') baseRate = Math.max(20, baseRate - 3);
      else if (selectedRegion === 'eu') baseRate = Math.max(20, baseRate - 5);

      dataPoints.push({
        time: seedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        rate: baseRate,
        proposed: proposedCount,
        completed: completedCount,
        event: 'System Boot'
      });
    }

    sortedLogs.forEach((log) => {
      const msg = log.message.toLowerCase();
      
      const isProposal = 
        msg.includes('match calculated') || 
        msg.includes('generated deal') || 
        msg.includes('proposal sent') || 
        msg.includes('matched') || 
        msg.includes('compatibility match') || 
        msg.includes('new compatibility match') || 
        msg.includes('added manually') || 
        msg.includes('ingested fresh signal');

      const isCompletion = 
        msg.includes('completed') || 
        msg.includes('finalized') || 
        msg.includes('cleared to sacombank') || 
        msg.includes('success') || 
        msg.includes('successful transaction') || 
        msg.includes('re-match success');

      if (isProposal) proposedCount++;
      if (isCompletion) completedCount++;

      // Prevent any logic edge cases where completed exceeds proposed
      const actualProposed = Math.max(proposedCount, completedCount);
      let rate = actualProposed > 0 ? Math.round((completedCount / actualProposed) * 100) : 0;
      
      if (selectedRegion === 'vn') rate = Math.min(100, rate + 5);
      else if (selectedRegion === 'apac') rate = Math.min(100, rate + 2);
      else if (selectedRegion === 'na') rate = Math.max(0, rate - 3);
      else if (selectedRegion === 'eu') rate = Math.max(0, rate - 5);

      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Clean display event label
      let eventLabel = 'Telemetry Updated';
      if (isProposal) {
        eventLabel = 'Proposal Ingested';
      } else if (isCompletion) {
        eventLabel = 'Deal Cleared';
      } else if (log.message.includes('calibration')) {
        eventLabel = 'Calibration';
      }

      dataPoints.push({
        time: timeStr,
        rate: Math.min(100, rate),
        proposed: actualProposed,
        completed: completedCount,
        event: eventLabel
      });
    });

    // Backfill historical points if too short
    if (dataPoints.length < 6) {
      const needed = 6 - dataPoints.length;
      const baseTime = sortedLogs.length > 0 ? new Date(sortedLogs[0].timestamp).getTime() : Date.now();
      
      const extraPoints = [];
      for (let i = needed; i > 0; i--) {
        const simTime = new Date(baseTime - (i + 1) * 300000);
        let simRate = 45;
        if (selectedRegion === 'vn') simRate = 65 + (i % 3) * 5;
        else if (selectedRegion === 'apac') simRate = 58 + (i % 3) * 4;
        else if (selectedRegion === 'na') simRate = 52 + (i % 3) * 3;
        else if (selectedRegion === 'eu') simRate = 48 + (i % 3) * 2;

        extraPoints.push({
          time: simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rate: simRate,
          proposed: 3,
          completed: 2,
          event: 'Historical baseline'
        });
      }
      return [...extraPoints, ...dataPoints].slice(-12);
    }

    // Take at most the last 12 points to preserve chart clarity and prevent overlaps
    return dataPoints.slice(-12);
  }, [filteredLogs, logs, selectedRegion]);

  // Dynamic average completion time from ingestion to match completion calculated over logs
  const avgCompletionTime = useMemo(() => {
    const proposals: { [id: string]: number } = {};
    const completions: number[] = [];

    const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedLogs.forEach((log) => {
      const msg = log.message;
      const timestamp = new Date(log.timestamp).getTime();

      const isProposal = 
        msg.includes('generated deal') || 
        msg.includes('compatibility match') || 
        msg.includes('Proposal Ingestor') || 
        msg.includes('Special Match Proposal') ||
        msg.includes('discovered new buyer') ||
        msg.includes('discovered new manufacturer') ||
        msg.includes('scanned & categorized') ||
        msg.includes('added manually') ||
        msg.includes('matching engine generated');

      const isCompletion = 
        msg.includes('CONFIRMED SUCCESS') || 
        msg.includes('finalized') || 
        msg.includes('cleared to Sacombank') || 
        msg.includes('RE-MATCH SUCCESS') ||
        msg.includes('successful transaction');

      const matchId = msg.match(/\[([^\]]+)\]/);
      const id = matchId ? matchId[1] : null;

      if (isProposal && id) {
        proposals[id] = timestamp;
      } else if (isCompletion && id && proposals[id]) {
        const durationSeconds = (timestamp - proposals[id]) / 1000;
        if (durationSeconds > 0 && durationSeconds < 3600) {
          completions.push(durationSeconds);
        }
      } else if (isCompletion) {
        const recentProposalTime = Object.values(proposals).sort((a, b) => b - a)[0];
        if (recentProposalTime && timestamp > recentProposalTime) {
          const durationSeconds = (timestamp - recentProposalTime) / 1000;
          if (durationSeconds > 0 && durationSeconds < 3600) {
            completions.push(durationSeconds);
          }
        }
      }
    });

    if (completions.length > 0) {
      const avg = completions.reduce((a, b) => a + b, 0) / completions.length;
      return avg;
    }

    // Dynamic but realistic simulation based on latency
    const isHighLatency = performanceData.some(p => p['Response Time'] > 1800);
    return isHighLatency ? 15.6 : 8.4;
  }, [filteredLogs, performanceData]);

  const formattedAvgTime = useMemo(() => {
    const secs = avgCompletionTime;
    if (secs < 60) {
      return `${secs.toFixed(1)}s`;
    }
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.round(secs % 60);
    return `${mins}m ${remainingSecs}s`;
  }, [avgCompletionTime]);

  // Dynamic agent brain activity tracker
  const currentBrainActivity = useMemo(() => {
    const latestLog = filteredLogs && filteredLogs.length > 0 ? filteredLogs[0] : null;
    const isVi = language === 'vi';

    if (!latestLog) {
      return {
        agent: isVi ? 'Lõi Hệ Thống AI' : 'Core AI Engine',
        state: isVi ? 'Đang Ghép Nối' : 'Matching',
        phase: isVi ? 'Quét Tương Đồng Ngữ Nghĩa' : 'Semantic Similarity Scan',
        subtask: isVi ? 'Đang phân tích độ tương thích giữa nhu cầu của người mua và sản phẩm của nhà máy' : 'Analyzing compatibility between buyer requirements and manufacturer product offerings',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/20',
        pingColor: 'bg-indigo-500',
        hz: 74.8,
        intensity: 'Normal'
      };
    }

    const agentName = latestLog.agent || '';
    const msg = latestLog.message || '';

    if (agentName.includes('Research') || msg.toLowerCase().includes('scanned') || msg.toLowerCase().includes('discovered')) {
      return {
        agent: isVi ? 'Research AI' : 'Research AI',
        state: isVi ? 'Đang Phân Tích' : 'Analyzing',
        phase: isVi ? 'Crawl & Phân Tích Tín Hiệu Sourcing' : 'Signal Scraping & Analysis',
        subtask: msg,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/20',
        pingColor: 'bg-cyan-500',
        hz: 92.4,
        intensity: 'High'
      };
    }

    if (agentName.includes('Sales') || msg.toLowerCase().includes('negotiat') || msg.toLowerCase().includes('stalled') || msg.toLowerCase().includes('outreach')) {
      return {
        agent: isVi ? 'Sales AI' : 'Sales AI',
        state: isVi ? 'Đang Thương Thảo' : 'Negotiating',
        phase: isVi ? 'Soạn Tin Outreach & Đàm Phán' : 'Lead Outreach & Price Negotiation',
        subtask: msg,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/20',
        pingColor: 'bg-purple-500',
        hz: 85.1,
        intensity: 'Moderate'
      };
    }

    if (agentName.includes('Finance') || msg.toLowerCase().includes('commission') || msg.toLowerCase().includes('sacombank') || msg.toLowerCase().includes('cleared')) {
      return {
        agent: isVi ? 'Finance AI' : 'Finance AI',
        state: isVi ? 'Đang Tính Toán' : 'Calculating',
        phase: isVi ? 'Tính Toán Hoa Hồng & Giải Ngân' : 'Commission Split & Escrow Clearance',
        subtask: msg,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/20',
        pingColor: 'bg-emerald-500',
        hz: 78.5,
        intensity: 'Normal'
      };
    }

    if (agentName.includes('Executive') || msg.toLowerCase().includes('orchestrat') || msg.toLowerCase().includes('dismissed') || msg.toLowerCase().includes('approved')) {
      return {
        agent: isVi ? 'Executive AI' : 'Executive AI',
        state: isVi ? 'Đang Điều Phối' : 'Orchestrating',
        phase: isVi ? 'Phân Tách Quy Trình & Giám Sát' : 'Pipeline Orchestration & Supervision',
        subtask: msg,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/20',
        pingColor: 'bg-blue-500',
        hz: 96.2,
        intensity: 'Maximum'
      };
    }

    return {
      agent: isVi ? `${agentName} AI` : `${agentName} AI`,
      state: isVi ? 'Đang Xử Lý' : 'Executing',
      phase: isVi ? 'Xử Lý Nghiệp Vụ Tự Trị' : 'Autonomous Task Execution',
      subtask: msg,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/20',
      pingColor: 'bg-indigo-500',
      hz: 81.3,
      intensity: 'Normal'
    };
  }, [filteredLogs, language]);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setCalibrationLogs([
      `[${new Date().toLocaleTimeString()}] EX_CMD: INITIALIZE_DESYNC_CALIBRATION`,
      `[${new Date().toLocaleTimeString()}] RUN: Scanning active specialist sockets...`,
      `[${new Date().toLocaleTimeString()}] COMPACT: Restricting token context to 8,192 blocks`,
      `[${new Date().toLocaleTimeString()}] CLEAN: Compacting SalesAgent communications cache...`,
      `[${new Date().toLocaleTimeString()}] STATUS: Latency optimized. Specialist agent streams synchronized successfully.`
    ]);

    setTimeout(() => {
      setIsCalibrating(false);
    }, 15000);
  };

  const getIntercomTypeBadge = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNMENT': return 'bg-blue-950 text-blue-300 border-blue-500/25';
      case 'DATA_SHARING': return 'bg-purple-950 text-purple-300 border-purple-500/25';
      case 'FEEDBACK': return 'bg-emerald-950 text-emerald-300 border-emerald-500/25';
      default: return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl" id="agent-architecture-root">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative" id="agent-architecture-header">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 tracking-wide uppercase">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Autonomous Multi-Agent Architecture
          </h2>
          <p className="text-[11px] text-slate-400">
            A modular, 8-layer team design working collaboratively to scan, match, and lock deals.
          </p>
        </div>

        {/* Header Controls (Geographic dropdown + Brain activity) */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-auto self-start" id="agent-header-controls">
          {/* Geographic Region Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1.5 shadow-sm hover:border-slate-700 transition-all" id="geographic-region-selector-container">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-slate-300 outline-none cursor-pointer focus:text-indigo-400 transition-colors pr-1"
              id="geographic-region-dropdown"
            >
              <option value="all" className="bg-slate-950 text-slate-200">{t.regionAll}</option>
              <option value="vn" className="bg-slate-950 text-slate-200">{t.regionVn}</option>
              <option value="apac" className="bg-slate-950 text-slate-200">{t.regionApac}</option>
              <option value="na" className="bg-slate-950 text-slate-200">{t.regionNa}</option>
              <option value="eu" className="bg-slate-950 text-slate-200">{t.regionEu}</option>
            </select>
          </div>

          {/* Real-time Agent Brain Activity Indicator */}
          <div className="relative group/brain cursor-help" id="agent-brain-activity-indicator">
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${currentBrainActivity.color}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentBrainActivity.pingColor}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${currentBrainActivity.pingColor}`}></span>
              </span>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Brain className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                <span className="text-slate-200">{language === 'vi' ? 'Hoạt Động Trí Tuệ' : 'Brain activity'}:</span>
                <span className="font-extrabold">{currentBrainActivity.state}</span>
              </div>
            </div>

            {/* Dynamic Tooltip */}
            <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 border border-slate-800 p-3.5 rounded-2xl shadow-2xl transition-all duration-300 transform scale-95 opacity-0 pointer-events-none group-hover/brain:scale-100 group-hover/brain:opacity-100 group-hover/brain:pointer-events-auto z-50 text-left backdrop-blur-md space-y-2" id="brain-activity-tooltip">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-extrabold text-slate-100 uppercase tracking-wide">
                    {language === 'vi' ? 'Trạng Thái Lõi Nhận Thức' : 'Cognitive Core Status'}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/10">{currentBrainActivity.hz} Hz</span>
              </div>

              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500">{language === 'vi' ? 'Agent Hoạt Động:' : 'Active Agent:'}</span>
                  <span className="col-span-2 font-bold text-slate-200">{currentBrainActivity.agent}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500">{language === 'vi' ? 'Nghiệp Vụ:' : 'Operation:'}</span>
                  <span className="col-span-2 font-bold text-slate-200">{currentBrainActivity.phase}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500">{language === 'vi' ? 'Cường Độ:' : 'Intensity:'}</span>
                  <span className={`col-span-2 font-bold uppercase text-[9px] ${
                    currentBrainActivity.intensity === 'Maximum' ? 'text-rose-400' :
                    currentBrainActivity.intensity === 'High' ? 'text-orange-400' :
                    currentBrainActivity.intensity === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{currentBrainActivity.intensity}</span>
                </div>
                <div className="pt-2 border-t border-slate-900 space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">
                    {language === 'vi' ? 'Tác Vụ Phụ Hiện Tại' : 'Current Subtask'}
                  </span>
                  <p className="text-[10px] text-slate-300 leading-normal bg-slate-900/40 p-1.5 rounded-lg border border-slate-900/60 max-h-16 overflow-y-auto font-sans">
                    {currentBrainActivity.subtask}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 justify-center pt-1.5 text-[8px] text-slate-500 border-t border-slate-900 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>{language === 'vi' ? 'Lõi liên lạc synapse tự trị đang hoạt động' : 'Real-time autonomous synapse cycle active'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer selector tabs */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/50 border-b border-slate-800">
        {layers.map(layer => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`p-1.5 rounded-xl text-left transition-all border ${
                isActive
                  ? 'bg-slate-800 border-slate-700 text-indigo-400 font-bold shadow-lg'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
              }`}
              id={`layer-tab-${layer.id}`}
            >
              <div className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="text-[10px] font-bold">L{layer.id}</span>
              </div>
              <p className="text-[9px] text-slate-500 truncate mt-0.5">{layer.title.split(':')[1].trim()}</p>
            </button>
          );
        })}
      </div>

      {/* Active Layer Details */}
      {layers.map(layer => {
        if (layer.id !== activeLayer) return null;
        const Icon = layer.icon;
        return (
          <div key={layer.id} className="p-4 bg-slate-950/20 border-b border-slate-800 flex-1 overflow-y-auto" id={`layer-details-${layer.id}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-indigo-400">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">{layer.title}</h3>
                <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">{layer.subtitle}</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {layer.desc}
            </p>

            <div className="mt-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agent Operational Mandates</h4>
              <ul className="mt-2 space-y-1.5">
                {layer.responsibilities.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Associated Integration Tools</h4>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {layer.tools.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-[9px] font-semibold bg-slate-800/60 text-slate-300 rounded border border-slate-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Live Active Agent Heartbeats */}
      <div className="p-3 bg-slate-950/40 border-t border-slate-800">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Platform Specialist Statuses</h4>
        <div className="grid grid-cols-2 gap-2">
          {agentMetrics.map((agent, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">{agent.name}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Rate: {agent.successRate}% • Done: {agent.tasksCompleted}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'working' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[10px] font-medium text-slate-400 capitalize">{agent.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduler Logs Console */}
      <div className={`flex flex-col transition-all duration-300 bg-slate-950/80 border-t border-slate-800 font-mono text-[11px] ${consoleTab === 'performance' ? 'h-[520px]' : 'h-56'}`}>
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 text-slate-400 border-b border-slate-800 flex-shrink-0">
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800/80 text-[9px] font-bold">
            <button
              onClick={() => setConsoleTab('logs')}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${consoleTab === 'logs' ? 'bg-slate-800 text-indigo-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {language === 'vi' ? 'Nhật ký đo lường' : 'Telemetry logs'}
            </button>
            <button
              onClick={() => setConsoleTab('intercom')}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${consoleTab === 'intercom' ? 'bg-slate-800 text-indigo-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {language === 'vi' ? 'Gói Intercom' : 'Intercom Packets'} ({intercoms.length})
            </button>
            <button
              onClick={() => setConsoleTab('performance')}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${consoleTab === 'performance' ? 'bg-slate-800 text-indigo-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.performanceAnalytics}
            </button>
          </div>
          <span className="text-[9px] text-slate-600">24/7 Agent Net</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-slate-300 custom-scrollbar">
          {consoleTab === 'logs' ? (
            filteredLogs.slice(0, 15).map(log => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              let statusColor = 'text-slate-400';
              if (log.status === 'success') statusColor = 'text-emerald-400';
              if (log.status === 'warning') statusColor = 'text-amber-400';
              if (log.status === 'error') statusColor = 'text-rose-400';

              return (
                <div key={log.id} className="leading-relaxed hover:bg-slate-800/40 px-1 py-0.5 rounded-lg transition-all text-xs">
                  <span className="text-slate-500 mr-1.5 font-bold">[{timeStr}]</span>
                  <span className="text-indigo-400 font-bold mr-1.5">[{log.agent}AI]</span>
                  <span className={statusColor}>{log.message}</span>
                </div>
              );
            })
          ) : consoleTab === 'intercom' ? (
            intercoms.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {language === 'vi' ? 'Chưa có gói liên lạc nào được ghi nhận.' : 'No communication packets captured in this session yet.'}
              </div>
            ) : (
              intercoms.map(packet => (
                <div key={packet.messageId} className="p-2 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5 hover:border-slate-800 transition-all text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">{new Date(packet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className={`text-[8px] font-extrabold uppercase border px-1.5 py-0.2 rounded-md ${getIntercomTypeBadge(packet.messageType)}`}>
                      {packet.messageType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-slate-300">
                    <span className="text-blue-400">{packet.sender}</span>
                    <span className="text-slate-600 font-normal">→</span>
                    <span className="text-indigo-400">{packet.receiver}</span>
                  </div>
                  <pre className="text-[9px] text-emerald-400 bg-slate-900/40 p-2 rounded-lg border border-slate-900/60 overflow-x-auto select-all max-w-full font-mono">
                    {JSON.stringify(packet.payload, null, 2)}
                  </pre>
                </div>
              ))
            )
          ) : (
            /* Performance tab layout */
            <div className="flex flex-col space-y-3 font-sans pb-4" id="performance-analytics-panel">
              {/* Performance Control Header */}
              <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                    {t.specialistHealth}
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                    {isCalibrating 
                      ? '⚡ Executing self-calibration matrix... Streams optimized.' 
                      : t.telemetryDesc}
                  </p>
                </div>
                <button
                  onClick={handleCalibrate}
                  disabled={isCalibrating}
                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCalibrating
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed animate-pulse'
                      : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/15'
                  }`}
                >
                  <Zap className={`w-3 h-3 ${isCalibrating ? 'animate-spin' : ''}`} />
                  <span>{isCalibrating ? t.calibrating : t.optimizeLatency}</span>
                </button>
              </div>

              {/* Calibration Logs stream overlay if active */}
              {isCalibrating && (
                <div className="bg-slate-950 border border-emerald-500/15 p-2 rounded-lg text-[9px] font-mono text-emerald-400 space-y-0.5 animate-pulse">
                  {calibrationLogs.map((clog, idx) => (
                    <p key={idx} className="leading-relaxed">{clog}</p>
                  ))}
                </div>
              )}

              {/* Performance Summary Section */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4" id="performance-summary-section">
                <div className="space-y-1 text-left flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                      <Gauge className="w-3.5 h-3.5" />
                    </div>
                    <h5 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">{t.performanceSummaryTitle}</h5>
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-xl leading-relaxed">
                    {t.performanceSummaryDesc}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/50 p-3 rounded-xl min-w-[240px] justify-between shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase tracking-wider">{t.avgTimeIngestionToMatch}</span>
                    <span className="text-[8.5px] text-slate-500 block leading-tight max-w-[150px]">{t.avgTimeIngestionToMatchDesc}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-indigo-400 font-mono tracking-tight animate-pulse block">
                      {formattedAvgTime}
                    </span>
                    <span className="text-[8px] text-emerald-400 uppercase tracking-widest font-bold">
                      {isCalibrating ? (language === 'vi' ? 'Đã Tối Ưu' : 'Optimized') : (language === 'vi' ? 'Thời Gian Thực' : 'Real-time')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Response Latency Chart */}
                <div className="bg-slate-900/40 border border-slate-800/60 p-2.5 rounded-xl flex flex-col justify-between h-[155px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Response Latency (ms)</span>
                    <span className="text-[8px] text-indigo-400 font-mono font-bold">Lower is better</span>
                  </div>
                  <div className="flex-1 w-full min-h-[110px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={8} unit="ms" tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0f172a', opacity: 0.3 }} />
                        <Bar dataKey="Response Time" radius={[3, 3, 0, 0]}>
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.latencyColor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quality & Success Ledger */}
                <div className="bg-slate-900/40 border border-slate-800/60 p-2.5 rounded-xl flex flex-col justify-between h-[155px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quality Success Rate (%)</span>
                    <span className="text-[8px] text-emerald-400 font-mono font-bold">Target ≥ 80%</span>
                  </div>
                  <div className="flex-1 w-full min-h-[110px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={8} domain={[60, 100]} unit="%" tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Floor', fill: '#f59e0b', fontSize: 6, position: 'insideBottomRight' }} />
                        <Area type="monotone" dataKey="Success Rate" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Platform Deal Conversion Rate Line Chart Section */}
              <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl flex flex-col justify-between h-[190px]" id="deal-conversion-chart-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">{t.dealConversionRateTitle}</span>
                      <p className="text-[8.5px] text-slate-500">{t.dealConversionRateDesc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-indigo-400 font-mono font-bold block">{conversionRateData[conversionRateData.length - 1]?.rate || 0}% Current</span>
                    <span className="text-[8px] text-slate-500 block font-mono">Matched: {conversionRateData[conversionRateData.length - 1]?.proposed || 0} • Cleared: {conversionRateData[conversionRateData.length - 1]?.completed || 0}</span>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={conversionRateData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#475569" 
                        fontSize={8} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={8} 
                        domain={[0, 100]} 
                        unit="%" 
                        tickLine={false}
                      />
                      <Tooltip content={<ConversionTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#1e1b4b', stroke: '#6366f1', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 1.5 }}
                        name={t.conversionRateAxis}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottleneck & Diagnostic Insights panel */}
              <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-amber-500 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Real-time Pipeline Diagnostics</span>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                    {isCalibrating ? (
                      <span className="text-emerald-400 font-medium">✨ OPTIMIZATION COMPLETED: Sockets calibrated. Specialist pipelines are synchronized with latencies optimized down to average 180ms.</span>
                    ) : performanceData.some(p => p['Response Time'] > 1800) ? (
                      <span>
                        ⚠️ <strong className="text-rose-400 font-extrabold">Sales Agent Latency Alert:</strong> Response delays (average <strong className="font-mono text-rose-300">{performanceData.find(p => p.name === 'Sales Agent')?.['Response Time']}ms</strong>) detected. Price negotiation stall requires manual manager intervention or network calibration to resume autonomous matching loops.
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">✅ Specialist network healthy: All active agents are responding within acceptable latency parameters. No severe bottlenecks detected.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
