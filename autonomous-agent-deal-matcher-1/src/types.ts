/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  source: 'TikTok' | 'Instagram' | 'TalkShopLive' | 'Amazon Data' | 'YouTube' | 'Taobao' | 'Popshop Live' | 'eBay Live' | 'Klarna' | 'ShopShops' | 'QVC' | 'Twitter Decahose';
  timestamp: string;
  imageUrl?: string;
}

export interface BuyerLead {
  id: string;
  name: string;
  demand: string;
  targetPrice: number;
  contact: string;
  source: string;
  timestamp: string;
  clientTier?: 'standard' | 'regular_vip'; // 'regular_vip' = Khách Quen (ưu tiên chăm sóc)
  priorityResearch?: boolean; // Luôn ưu tiên research liên tục cho đến khi đáp ứng xong
  unfulfilledReason?: string;
  unfulfilledDetails?: string;
  lastContactDate?: string;
  keepContactHistory?: {
    id: string;
    timestamp: string;
    message: string;
    channel: string;
  }[];
  unfulfilledHistory?: {
    dealId: string;
    productName: string;
    reason: string;
    notes?: string;
    timestamp: string;
    status: 'searching' | 'alternative_matched' | 'fulfilled';
  }[];
}

export interface SellerLead {
  id: string;
  name: string;
  productName: string;
  price: number;
  contact: string;
  source: string;
  timestamp: string;
  moq?: number;
  leadTime?: string;
  certification?: string;
  keyAdvantages?: string[];
}

export interface BetterSupplierOption {
  id: string;
  name: string;
  productName: string;
  price: number;
  discountPercent: number; // e.g. 15 for 15% cheaper
  moq: number;
  leadTime: string;
  certification: string;
  contact: string;
  source: string;
  keyAdvantages: string[];
  addressingReason: string;
}

export interface MatchingBubble {
  id: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  productName: string;
  price: number;
  confidenceScore: number; // 0-100
  evaluationReason: string;
  commissionFee: number; // calculated VND or USD
  commissionPercent: number;
  status: 'pending' | 'sent' | 'approved' | 'rejected' | 'completed';
  buyerContactUnlocked: boolean;
  sellerContactUnlocked: boolean;
  requiresIntervention?: boolean;
  stalledReason?: string;
  
  // Unfulfilled Deal Handling (Khớp deal không thành & cung cấp nguồn tốt hơn)
  unfulfilledStatus?: 'none' | 'aborted' | 'inquiry_sent' | 'investigated' | 'alternative_matched';
  unfulfilledReason?: string;
  unfulfilledNotes?: string;
  unfulfilledTimestamp?: string;
  betterSourcesSuggested?: BetterSupplierOption[];
  
  // Payment Proof & Debt Tracking
  paymentStatus?: 'unpaid' | 'paid' | 'pending_proof';
  paymentProofUrl?: string; // Image URL or Base64 of customer remittance slip
  paymentProofTimestamp?: string;
  paymentTransactionRef?: string;
  paymentCustomerNote?: string;
  paymentVerifiedBy?: string;

  // Deal Execution Verification & Confirmation Proof Folder
  dealExecutionVerified?: boolean; // True only when at least 1 party has sent confirmation message
  dealExecutionStatus?: 'unverified' | 'inquiry_sent' | 'verified_executed';
  payingParty?: 'buyer' | 'seller'; // Which party pays commission (default: 'buyer')
  counterpartInquiryStatus?: 'none' | 'sent' | 'received';
  lastCounterpartInquiryAt?: string;
  confirmationsFolder?: DealExecutionConfirmation[];

  // Automated 48-Hour Reminder Tracking
  dealCompletedAt?: string; // Timestamp when deal was agreed/completed to track the 48h SLA
  lastReminderSentAt?: string; // Timestamp when the latest follow-up notification was dispatched
  reminderCount?: number; // Total number of follow-up reminders sent
  reminderHistory?: ReminderHistoryItem[]; // Detailed log of reminders sent to buyer

  // Detailed matching engine parameters
  extractedBuyerRequirements?: {
    productType: string;
    quantityNeeded: number;
    keyCriteria: string[];
  };
  scoreBreakdown?: {
    priceAlignment: number;      // 0-100
    productAlignment: number;    // 0-100
    logisticsFeasibility: number;// 0-100
    volumeCapacity: number;       // 0-100
  };
}

export interface ReminderHistoryItem {
  id: string;
  timestamp: string;
  channel: string; // e.g., 'Email & Zalo', 'SMS', 'WhatsApp'
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  triggerType: 'automated_48h' | 'manual' | 'bulk_verified';
  hoursSinceCompletion: number;
}

export interface DealExecutionConfirmation {
  id: string;
  dealId: string;
  dealProductName: string;
  senderRole: 'buyer' | 'seller';
  senderName: string;
  recipientRole: 'agent' | 'counterpart';
  recipientName: string;
  channel: 'Zalo' | 'WhatsApp' | 'SMS' | 'B2B Chat' | 'Email' | 'Zalo / B2B Chat' | string;
  message: string;
  timestamp: string;
  verified: boolean;
  verifiedAt?: string;
  proofType: 'order_signed' | 'deposit_paid' | 'goods_delivered' | 'counterpart_confirmed' | 'manual_input';
  notes?: string;
}

export interface AutoReminderSettings {
  enabled: boolean;
  thresholdHours: number; // default 48h
  bankRecipient: string;
  bankName: string;
  bankAccount: string;
}

export interface CommissionDebtRecord {
  dealId: string;
  buyerName: string;
  sellerName: string;
  productName: string;
  dealValue: number;
  commissionFee: number;
  commissionPercent: number;
  status: 'pending' | 'sent' | 'approved' | 'rejected' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'pending_proof';
  paymentProofUrl?: string;
  paymentProofTimestamp?: string;
  paymentTransactionRef?: string;
  paymentCustomerNote?: string;
  dealCompletedAt?: string;
  lastReminderSentAt?: string;
  reminderCount?: number;
}

export type ResearchDataSource = 
  | 'B2B Wholesale'
  | 'Amazon'
  | 'YouTube'
  | 'Taobao'
  | 'Instagram'
  | 'TalkShopLive'
  | 'TikTok'
  | 'Popshop Live'
  | 'eBay Live'
  | 'Klarna'
  | 'ShopShops'
  | 'QVC Data Lake'
  | 'Twitter Decahose'
  | 'Real-time Data Stream'
  | string;

export interface SemanticAnalysis {
  intent: 'purchase_intent' | 'supplier_broadcast' | 'price_arbitrage' | 'demand_surge' | 'inquiry';
  sentimentScore: number; // 0.0 to 1.0
  polarity: 'Bullish' | 'Neutral' | 'Bearish';
  intentConfidence: number; // 0 - 100%
  extractedEntities: {
    productName: string;
    targetPrice?: number;
    volume?: number;
    specifications?: string[];
    urgency?: 'Immediate' | 'Standard' | 'Futures';
  };
  semanticSummary: string;
}

export interface FirehoseMeta {
  sourceType: 'Decahose' | 'Data Lake' | 'Live Firehose' | 'Real-time Stream' | 'B2B OrderBook';
  throughputEps: number; // events per second
  latencyMs: number;
  partitionId?: string;
  dataLakeBucket?: string;
  streamQuality: 'Ultra-High' | 'High' | 'Standard';
}

export interface ResearchPipelineStats {
  activeStreamsCount: number;
  eventsPerSecond: number;
  totalSignalsProcessed: number;
  averageLatencyMs: number;
  firehoseStatus: 'STREAMING_ACTIVE' | 'HIGH_THROUGHPUT' | 'IDLE';
  activeChannels: string[];
  semanticConfidenceAvg: number;
}

export interface PipelineSignal {
  id: string;
  platform: ResearchDataSource;
  title: string;
  type: 'buyer_signal' | 'supplier_signal';
  price: number;
  volume: number;
  timestamp: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  keywords: string[];
  trendingScore: number; // 0-100
  matchingEligible: boolean;
  semanticAnalysis?: SemanticAnalysis;
  firehoseMeta?: FirehoseMeta;
}

export interface AgentIntercom {
  messageId: string;
  sender: 'ExecutiveAgent' | 'ResearchAgent' | 'SalesAgent' | 'MarketingAgent' | 'FinanceAgent' | 'DatabaseAgent';
  receiver: 'ExecutiveAgent' | 'ResearchAgent' | 'SalesAgent' | 'MarketingAgent' | 'FinanceAgent' | 'DatabaseAgent';
  timestamp: string;
  messageType: 'TASK_ASSIGNMENT' | 'DATA_SHARING' | 'FEEDBACK' | 'ERROR_REPORT';
  payload: any;
  status: 'SUCCESS' | 'ERROR';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  agent: 'Executive' | 'Research' | 'Sales' | 'Marketing' | 'Finance' | 'Browser' | 'Email' | 'Database' | 'System';
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface CommunicationStatus {
  pairId: string;
  lastMessageSender: 'buyer' | 'seller' | 'agent';
  messages: {
    id: string;
    sender: 'buyer' | 'seller' | 'agent';
    text: string;
    timestamp: string;
  }[];
  outreachTemplate: string;
}

export interface AgentMetric {
  name: string;
  status: 'idle' | 'working' | 'success' | 'error';
  lastActive: string;
  successRate: number;
  tasksCompleted: number;
}

export interface AppToast {
  id: string;
  type: 'high_value' | 'stalled' | 'general' | 'milestone';
  title: string;
  message?: string;
  timestamp: string;
  commissionFee?: number;
  productName?: string;
  dealId?: string;
  meta?: {
    dealId: string;
    commissionFee?: number;
    productName?: string;
  };
}

export interface ManufacturerHotProduct {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number; // Giá nhập buôn từ xưởng (VND)
  suggestedRetailPrice: number; // Giá bán lẻ đề xuất (VND)
  marginPercent: number; // Biên lợi nhuận đại lý %
  salesVelocity: 'Viral Hot (Cháy Hàng)' | 'Bán Chạy Cực Nhanh' | 'Doanh Số Ổn Định';
  features: string[];
  monthlySalesUnits: number;
}

export interface ManufacturerDiscountTier {
  tier: 'regional_exclusive' | 'tier1_volume' | 'online_dropship';
  tierName: string;
  minMonthlySalesVND: number;
  discountPercent: number;
  supportPolicy: string;
}

export interface ManufacturerItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  location: string;
  verificationBadge: string;
  rating: number; // 4.9/5
  turnoverRate: string; // e.g. "Vòng quay 5-7 ngày • Top 1 TikTok Shop"
  capacity: string; // e.g. "60.000 sản phẩm/tháng"
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  verifiedCertificates: string[];
  hotProducts: ManufacturerHotProduct[];
  discountTiers: ManufacturerDiscountTier[];
}

export interface AgencyContract {
  id: string;
  contractNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  manufacturerRepresentative: string;
  agentName: string;
  agentRepresentative: string;
  agentPhone: string;
  agentEmail: string;
  agentTaxId: string;
  agentAddress: string;
  distributionChannel: string;
  territory: string;
  tier: 'regional_exclusive' | 'tier1_volume' | 'online_dropship';
  tierName: string;
  discountPercent: number;
  monthlyTargetVND: number;
  selectedHotProducts: string[];
  contractDate: string;
  effectiveDate: string;
  expiryDate: string;
  status: 'active' | 'pending' | 'draft' | 'terminated';
  agentSignature: string;
  agentSignedAt: string;
  manufacturerSignature: string;
  manufacturerSignedAt: string;
  sacombankEscrowAccount: string;
  sacombankRecipient: string;
  termsSummary: string[];
  aiAdviceNotes?: string;
  notes?: string;
}

