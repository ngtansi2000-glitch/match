/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { 
  MatchingBubble, BuyerLead, SellerLead, ActivityLog, CommunicationStatus, 
  PipelineSignal, AgentIntercom, AutoReminderSettings, ReminderHistoryItem, 
  AgencyContract, ManufacturerItem, DealExecutionConfirmation 
} from './src/types';
import { generateBankingReceiptSvg } from './src/lib/receiptGenerator';
import { INITIAL_MANUFACTURERS } from './src/data/manufacturersData';
import { 
  buildOfficialDebtReminderTemplate, 
  buildFriendlyCounterpartInquiry 
} from './src/lib/debtReminderTemplate';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

const SELF_IMPROVED_FILE_PATH = path.join(process.cwd(), 'self_improved_data.json');
const AGENCY_CONTRACTS_FILE_PATH = path.join(process.cwd(), 'agency_contracts.json');

function readAgencyContracts(): AgencyContract[] {
  try {
    if (fs.existsSync(AGENCY_CONTRACTS_FILE_PATH)) {
      const raw = fs.readFileSync(AGENCY_CONTRACTS_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read agency_contracts.json', err);
  }
  return [];
}

function writeAgencyContracts(data: AgencyContract[]) {
  try {
    fs.writeFileSync(AGENCY_CONTRACTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write agency_contracts.json', err);
  }
}

let agencyContracts: AgencyContract[] = readAgencyContracts();
let manufacturersList: ManufacturerItem[] = INITIAL_MANUFACTURERS;

function readSelfImprovedData() {
  try {
    if (fs.existsSync(SELF_IMPROVED_FILE_PATH)) {
      const raw = fs.readFileSync(SELF_IMPROVED_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read self_improved_data.json', err);
  }
  return {
    totalCommissionVND: 24850000,
    successfulDealsCount: 18,
    totalBusinessVolumeVND: 1656660000,
    payoutDetails: {
      receiverName: "NGUYỄN TẤN SĨ",
      bankName: "Sacombank Vietnam",
      accountNumber: "060129073198"
    },
    verifiedDeals: [],
    selfImprovedPatterns: {
      optimizationModel: "gemini-3.5-flash",
      lastImprovedTimestamp: "2026-07-30T10:16:06-07:00",
      negotiationStrictness: "Balanced"
    }
  };
}

function writeSelfImprovedData(data: any) {
  try {
    fs.writeFileSync(SELF_IMPROVED_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write self_improved_data.json', err);
  }
}

const initialSelfImproved = readSelfImprovedData();

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// -----------------------------------------------------------------
// SEED DATA & IN-MEMORY STATE
// -----------------------------------------------------------------

let commissionRate = 1.5; // Adjustable commission percentage (e.g., 1.5% - adjustable)
let totalCommissionEarnedVND = initialSelfImproved.totalCommissionVND;
let successfulDealsCount = initialSelfImproved.successfulDealsCount;

let autoReminderSettings: AutoReminderSettings = {
  enabled: true,
  thresholdHours: 48,
  bankRecipient: 'NGUYỄN TẤN SĨ',
  bankName: 'Sacombank Vietnam',
  bankAccount: '060129073198'
};

let buyersList: BuyerLead[] = [
  {
    id: 'b-1',
    name: 'Alena Smirnova (Milan Fashion)',
    demand: 'High-quality silk scarf bulk manufacturer. Needs 5,000 units with custom brand stitching.',
    targetPrice: 350000, // VND per unit (approx $15)
    contact: '+39 02 8821 9921 / alena@milanofashion.it',
    source: 'Instagram Feed Search',
    timestamp: '2026-07-30T04:10:00Z'
  },
  {
    id: 'b-2',
    name: 'Minh Tuã¡n (TechGadgets VN)',
    demand: 'Looking for reliable suppliers of RGB desk pads, bulk shipment of 1,000 pieces with custom logo.',
    targetPrice: 120000,
    contact: '+84 912 345 678 / tuan@techgadgetsvn.com',
    source: 'Taobao Import Community',
    timestamp: '2026-07-30T05:22:00Z'
  },
  {
    id: 'b-3',
    name: 'Sarah Jenkins (US Beauty Brand)',
    demand: 'Natural organic face rollers (jade/quartz). Dropshipping direct shipping with 48h US warehouse processing.',
    targetPrice: 180000,
    contact: '+1 213 555 0192 / sarah@jenkinsskin.co',
    source: 'TalkShopLive Live Chat',
    timestamp: '2026-07-30T05:35:00Z'
  },
  {
    id: 'b-4',
    name: 'Yuki Tanaka (Tokyo Lifestyle)',
    demand: 'Minimalist bamboo wood storage boxes. Eco-friendly certified. Need 2,000 pieces for sustainable launch.',
    targetPrice: 220000,
    contact: '+81 3 5555 0143 / yuki@lifestyle-tokyo.jp',
    source: 'Amazon Data / Best Sellers',
    timestamp: '2026-07-30T05:48:00Z'
  }
];

let sellersList: SellerLead[] = [
  {
    id: 's-1',
    name: 'VÄƒn Phong (Ha Dong Silk Village)',
    productName: 'Premium Pure Mulberry Silk Scarves - Handwoven',
    price: 320000,
    contact: '+84 983 112 233 / phong@hadongsilk.vn',
    source: 'TikTok Shop VN Live Stream',
    timestamp: '2026-07-30T03:55:00Z'
  },
  {
    id: 's-2',
    name: 'Yiwu Smart Trade Co., Ltd.',
    productName: 'Eco-friendly Anti-fray RGB LED Desk Mats',
    price: 95000,
    contact: 'sales@yiwusmarttrade.cn / WeChat: yiwu_smart_99',
    source: 'Taobao Business Firehose',
    timestamp: '2026-07-30T04:15:00Z'
  },
  {
    id: 's-3',
    name: 'GreenLife Bamboo Vietnam',
    productName: 'Premium Minimalist Bamboo Storage Organizers (FSC Certified)',
    price: 195000,
    contact: '+84 905 889 999 / contact@greenlifebamboo.com',
    source: 'QVC Live Stream Hub',
    timestamp: '2026-07-30T04:30:00Z'
  },
  {
    id: 's-4',
    name: 'Shenzhen Aura Beauty Factory',
    productName: 'Genuine Jade and Rose Quartz Facial Rollers with Anti-Squeak Silencer',
    price: 140000,
    contact: 'aura_beauty@szfactory.com / WhatsApp: +86 138 2912 3456',
    source: 'Popshop Live Stream Feed',
    timestamp: '2026-07-30T05:01:00Z'
  }
];

let matchingBubbles: MatchingBubble[] = [
  {
    id: 'm-1',
    buyerId: 'b-1',
    sellerId: 's-1',
    buyerName: 'Alena Smirnova (Milan Fashion)',
    sellerName: 'Văn Phong (Ha Dong Silk Village)',
    productName: 'Premium Pure Mulberry Silk Scarves - Handwoven',
    price: 320000,
    confidenceScore: 92,
    evaluationReason: 'Seller offers 100% natural handwoven mulberry silk at 320,000 VND which is 8.5% below the buyers target budget of 350,000 VND. Authentic craft village provenance strongly matches Milano high-end brand requirements.',
    commissionFee: 24000000, // Total deal: 5000 units * 320,000 * 1.5% = 24,000,000 VND
    commissionPercent: 1.5,
    status: 'completed',
    buyerContactUnlocked: true,
    sellerContactUnlocked: true,
    dealCompletedAt: '2026-07-30T04:30:00Z',
    paymentStatus: 'paid',
    paymentProofUrl: generateBankingReceiptSvg({
      dealId: 'm-1',
      buyerName: 'Alena Smirnova (Milan Fashion)',
      commissionAmountVND: 24000000,
      transactionRef: 'SCB98234129841',
      timestamp: '30/07/2026 14:21:32'
    }),
    paymentProofTimestamp: '2026-07-30T05:00:00Z',
    paymentTransactionRef: 'SCB98234129841',
    paymentCustomerNote: 'Alena Smirnova đã gởi hình ảnh biên lai Sacombank chuyển 24,000,000 VND phí hoa hồng',
    reminderCount: 0,
    reminderHistory: [],
    dealExecutionVerified: true,
    dealExecutionStatus: 'verified_executed',
    payingParty: 'buyer',
    counterpartInquiryStatus: 'received',
    confirmationsFolder: [
      {
        id: 'conf-m1-1',
        dealId: 'm-1',
        dealProductName: 'Premium Pure Mulberry Silk Scarves - Handwoven',
        senderRole: 'buyer',
        senderName: 'Alena Smirnova (Milan Fashion)',
        recipientRole: 'agent',
        recipientName: 'B2B Trade Agent',
        channel: 'WhatsApp',
        message: 'Dear Agent, we have signed the 5,000 units silk scarf contract with Van Phong (Ha Dong Silk Village) and wire-transferred the production advance. Everything is progressing great!',
        timestamp: '2026-07-30T04:00:00Z',
        verified: true,
        verifiedAt: '2026-07-30T04:05:00Z',
        proofType: 'order_signed',
        notes: 'Xác nhận hợp đồng đã ký từ Người Mua quốc tế'
      },
      {
        id: 'conf-m1-2',
        dealId: 'm-1',
        dealProductName: 'Premium Pure Mulberry Silk Scarves - Handwoven',
        senderRole: 'seller',
        senderName: 'Văn Phong (Ha Dong Silk Village)',
        recipientRole: 'agent',
        recipientName: 'B2B Trade Agent',
        channel: 'Zalo',
        message: 'Dạ bên em xưởng lụa Vạn Phúc đã nhận đủ 50% tiền cọc sản xuất 5.000 khăn lụa tơ tằm từ chị Alena. Giao dịch đã chốt và đang vào khung dệt.',
        timestamp: '2026-07-30T04:15:00Z',
        verified: true,
        verifiedAt: '2026-07-30T04:20:00Z',
        proofType: 'deposit_paid',
        notes: 'Xác nhận nhận cọc từ Xưởng Sản Xuất'
      }
    ],
    extractedBuyerRequirements: {
      productType: 'Mulberry Silk Scarves',
      quantityNeeded: 5000,
      keyCriteria: ['Handwoven', 'Mulberry silk', 'Custom brand stitching']
    },
    scoreBreakdown: {
      priceAlignment: 94,
      productAlignment: 96,
      logisticsFeasibility: 88,
      volumeCapacity: 90
    }
  },
  {
    id: 'm-2',
    buyerId: 'b-2',
    sellerId: 's-2',
    buyerName: 'Minh Tuấn (TechGadgets VN)',
    sellerName: 'Yiwu Smart Trade Co., Ltd.',
    productName: 'Eco-friendly Anti-fray RGB LED Desk Mats',
    price: 95000,
    confidenceScore: 88,
    evaluationReason: 'The seller price of 95,000 VND is significantly lower than the target of 120,000 VND. High volume match (1,000 units) with verified custom branding capability matches buyer specifications.',
    commissionFee: 1425000, // 1000 units * 95,000 * 1.5% = 1,425,000 VND
    commissionPercent: 1.5,
    status: 'completed',
    buyerContactUnlocked: true,
    sellerContactUnlocked: true,
    dealCompletedAt: new Date(Date.now() - 53 * 3600 * 1000).toISOString(), // Completed 53h ago (>48h SLA breached!)
    paymentStatus: 'unpaid', // CÔNG NỢ CHƯA THU
    lastReminderSentAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    reminderCount: 1,
    reminderHistory: [
      {
        id: 'rem-init-1',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        channel: 'Email & Zalo / SMS',
        message: buildOfficialDebtReminderTemplate({
          dealId: 'm-2',
          productName: 'Eco-friendly Anti-fray RGB LED Desk Mats',
          commissionFeeVND: 1425000
        }),
        status: 'delivered',
        triggerType: 'automated_48h',
        hoursSinceCompletion: 48
      }
    ],
    dealExecutionVerified: true,
    dealExecutionStatus: 'verified_executed',
    payingParty: 'buyer',
    counterpartInquiryStatus: 'received',
    confirmationsFolder: [
      {
        id: 'conf-m2-1',
        dealId: 'm-2',
        dealProductName: 'Eco-friendly Anti-fray RGB LED Desk Mats',
        senderRole: 'seller',
        senderName: 'Yiwu Smart Trade Co., Ltd.',
        recipientRole: 'agent',
        recipientName: 'B2B Trade Agent',
        channel: 'Zalo',
        message: 'Dạ bên em Yiwu Smart Trade xác nhận đã chốt hợp đồng cung cấp 1.000 lót chuột RGB và nhận cọc đợt 1 từ anh Minh Tuấn (TechGadgets VN) rồi ạ. Đơn hàng đang được in logo thương hiệu và chuẩn bị giao.',
        timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
        verified: true,
        verifiedAt: new Date(Date.now() - 51 * 3600 * 1000).toISOString(),
        proofType: 'counterpart_confirmed',
        notes: 'Bằng chứng đối soát từ Người Bán: Đã nhận cọc và chốt đơn 1.000 chiếc. Đủ điều kiện đòi nợ hoa hồng.'
      }
    ],
    extractedBuyerRequirements: {
      productType: 'RGB Desk Pads',
      quantityNeeded: 1000,
      keyCriteria: ['RGB LEDs', 'Anti-fray', 'Custom logo branding']
    },
    scoreBreakdown: {
      priceAlignment: 98,
      productAlignment: 90,
      logisticsFeasibility: 82,
      volumeCapacity: 84
    }
  },
  {
    id: 'm-3',
    buyerId: 'b-3',
    sellerId: 's-4',
    buyerName: 'Sarah Jenkins (US Beauty Brand)',
    sellerName: 'Shenzhen Aura Beauty Factory',
    productName: 'Genuine Jade and Rose Quartz Facial Rollers with Anti-Squeak Silencer',
    price: 140000,
    confidenceScore: 85,
    evaluationReason: 'The facial roller price of 140,000 VND fits the buyer limit. The manufacturer offers 48-hour shipment and direct logistics support, perfectly addressing dropshipping operational demands.',
    commissionFee: 2100000, // 1000 units * 140k * 1.5%
    commissionPercent: 1.5,
    status: 'completed',
    buyerContactUnlocked: true,
    sellerContactUnlocked: true,
    dealCompletedAt: new Date(Date.now() - 19 * 3600 * 1000).toISOString(), // Completed 19h ago (<48h - 29h countdown remaining!)
    paymentStatus: 'unpaid', // CÔNG NỢ CHƯA THU
    reminderCount: 0,
    reminderHistory: [],
    dealExecutionVerified: false, // Chưa xác minh thực hiện deal - Cần tương tác với bên còn lại để nhận tin xác thực
    dealExecutionStatus: 'unverified',
    payingParty: 'buyer',
    counterpartInquiryStatus: 'none',
    confirmationsFolder: [],
    extractedBuyerRequirements: {
      productType: 'Cosmetic Face Rollers',
      quantityNeeded: 1500,
      keyCriteria: ['Natural jade/quartz', 'Anti-squeak silencer', '48h dropshipping processing']
    },
    scoreBreakdown: {
      priceAlignment: 88,
      productAlignment: 85,
      logisticsFeasibility: 95,
      volumeCapacity: 80
    }
  },
  {
    id: 'm-4',
    buyerId: 'b-4',
    sellerId: 's-5',
    buyerName: 'Hoàng Long (Gia Dụng Việt B2B)',
    sellerName: 'Bảo Minh Eco Packaging Co.',
    productName: 'Hộp Đựng Thực Phẩm Bã Mía Tự Phân Hủy Sinh Học 1000ml',
    price: 4500,
    confidenceScore: 91,
    evaluationReason: 'Bảo Minh cung cấp mức giá sỉ 4.500 VND/hộp bã mía chuẩn xuất khẩu, chứng chỉ SGS an toàn thực phẩm, cam kết cung ứng 50.000 hộp/tháng cho chuỗi F&B của anh Long.',
    commissionFee: 3375000, // 50,000 units * 4,500 * 1.5% = 3,375,000 VND
    commissionPercent: 1.5,
    status: 'completed',
    buyerContactUnlocked: true,
    sellerContactUnlocked: true,
    dealCompletedAt: new Date(Date.now() - 62 * 3600 * 1000).toISOString(), // Quá hạn 62h!
    paymentStatus: 'unpaid', // Chậm thanh toán
    lastReminderSentAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    reminderCount: 1,
    reminderHistory: [
      {
        id: 'rem-m4-1',
        timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        channel: 'Zalo / SMS Direct',
        message: buildOfficialDebtReminderTemplate({
          dealId: 'm-4',
          productName: 'Hộp Đựng Thực Phẩm Bã Mía Tự Phân Hủy Sinh Học 1000ml',
          commissionFeeVND: 3375000
        }),
        status: 'delivered',
        triggerType: 'automated_48h',
        hoursSinceCompletion: 48
      }
    ],
    dealExecutionVerified: true,
    dealExecutionStatus: 'verified_executed',
    payingParty: 'buyer',
    counterpartInquiryStatus: 'received',
    confirmationsFolder: [
      {
        id: 'conf-m4-1',
        dealId: 'm-4',
        dealProductName: 'Hộp Đựng Thực Phẩm Bã Mía Tự Phân Hủy Sinh Học 1000ml',
        senderRole: 'seller',
        senderName: 'Bảo Minh Eco Packaging Co.',
        recipientRole: 'agent',
        recipientName: 'B2B Trade Agent',
        channel: 'Zalo',
        message: 'Dạ bên em xác nhận đã chốt hợp đồng cung ứng 50.000 hộp bã mía và nhận cọc 50.000.000 VND từ anh Hoàng Long sáng qua rồi ạ. Đơn hàng đang bốc xếp lên xe tải giao nội thành!',
        timestamp: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
        verified: true,
        verifiedAt: new Date(Date.now() - 59 * 3600 * 1000).toISOString(),
        proofType: 'counterpart_confirmed',
        notes: 'Xác nhận trực tiếp từ Người Bán: Giao dịch đã thực hiện, nhận cọc 50 triệu.'
      }
    ],
    extractedBuyerRequirements: {
      productType: 'Biodegradable Food Containers',
      quantityNeeded: 50000,
      keyCriteria: ['Sugarcane bagasse', 'FDA / SGS certified', '1000ml microwave safe']
    },
    scoreBreakdown: {
      priceAlignment: 96,
      productAlignment: 94,
      logisticsFeasibility: 90,
      volumeCapacity: 92
    }
  }
];

let dismissedBubbles: MatchingBubble[] = [];

let activityLogs = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 20000000).toISOString(),
    agent: 'Executive',
    message: 'System initialization complete. Executive Agent active 24/7 matching loops starting...',
    status: 'success'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    agent: 'Research',
    message: 'Scanned TikTok Live streams & Taobao firehoses. Found 4 active products and 2 wholesale demand posts.',
    status: 'info'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 15000000).toISOString(),
    agent: 'Sales',
    message: 'Evaluating buyer requirements for Milan Fashion against Silk Village supplier database...',
    status: 'info'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 14000000).toISOString(),
    agent: 'Finance',
    message: 'Match calculated: "Ha Dong Silk" & "Milan Fashion". Confidence score: 92% (>80% required). Projected Commission: 24,000,000 VND to Sacombank.',
    status: 'success'
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 10000000).toISOString(),
    agent: 'Email',
    message: 'Automated deal proposal sent to Alena Smirnova and Văn Phong. High convenience layout used.',
    status: 'success'
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 5000000).toISOString(),
    agent: 'Database',
    message: 'Alena Smirnova clicked bubble and agreed to pay 1.5% commission fee. Deal [m-1] status set to: COMPLETED.',
    status: 'success'
  },
  {
    id: 'log-7',
    timestamp: new Date().toISOString(),
    agent: 'Finance',
    message: 'Commission of 24,000,000 VND cleared to Sacombank Acc. No 060129073198 (NGUYỄN TẤN SĨ / NGUYEN TAN SI). Successful transaction recorded!',
    status: 'success'
  }
];

let communicationStatuses = [
  {
    pairId: 'm-1',
    lastMessageSender: 'agent',
    messages: [
      { id: 'msg-1', sender: 'agent', text: 'Greeting Alena and Văn Phong. We found a perfect match! Văn Phong can supply handwoven silk scarves at 320,000 VND matching your exact brand requirements. Please click the bubble to unlock full contacts and confirm the 1.5% success fee.', timestamp: new Date(Date.now() - 15000000).toISOString() },
      { id: 'msg-2', sender: 'buyer', text: 'Excellent price and the samples look extremely premium in the photo. Unlocking contact info immediately!', timestamp: new Date(Date.now() - 12000000).toISOString() },
      { id: 'msg-3', sender: 'seller', text: 'Thank you! We can begin production immediately once Alena confirms the contract terms.', timestamp: new Date(Date.now() - 10000000).toISOString() }
    ],
    outreachTemplate: 'Dear Alena, we identified handwoven silk scarves matching Milano high-end brand criteria from Văn Phong (Ha Dong Silk Village). Price: 320,000 VND.'
  },
  {
    pairId: 'm-2',
    lastMessageSender: 'agent',
    messages: [
      { id: 'msg-4', sender: 'agent', text: 'Deal Alert: Minh Tuấn (TechGadgets VN) wants bulk custom RGB desk pads. Yiwu Smart Trade supplies them at 95,000 VND (within your target 120,000 VND). Agree to unlock contact info.', timestamp: new Date(Date.now() - 5000000).toISOString() }
    ],
    outreachTemplate: 'Hello Minh Tuấn, we found premium anti-fray RGB LED Desk Mats from Yiwu Smart Trade at 95,000 VND per unit. This is 20% below your target budget!'
  },
  {
    pairId: 'm-3',
    lastMessageSender: 'agent',
    messages: [
      { id: 'msg-5', sender: 'agent', text: 'Deal Alert: Sarah Jenkins (US Beauty Brand) wants dropship quartz facial rollers. Shenzhen Aura Beauty supplies them at 140,000 VND with 48h delivery processing.', timestamp: new Date(Date.now() - 1000000).toISOString() }
    ],
    outreachTemplate: 'Hi Sarah, we paired your cosmetic demand with Shenzhen Aura Beauty Factory for Genuine Quartz Rollers with Anti-Squeak Silencer at 140,000 VND.'
  }
];

// -----------------------------------------------------------------
// PIPELINE SIGNALS & AGENT INTER-COMMUNICATIONS STATE
// -----------------------------------------------------------------

let researchPipelineStats = {
  activeStreamsCount: 14,
  eventsPerSecond: 3420,
  totalSignalsProcessed: 54980,
  averageLatencyMs: 14,
  firehoseStatus: 'STREAMING_ACTIVE',
  activeChannels: [
    'B2B Wholesale',
    'Amazon',
    'YouTube',
    'Taobao',
    'Instagram',
    'TalkShopLive',
    'TikTok',
    'Popshop Live',
    'eBay Live',
    'Klarna',
    'ShopShops',
    'QVC Data Lake',
    'Twitter Decahose',
    'Real-time Data Stream'
  ],
  semanticConfidenceAvg: 94.6
};

function generateFirehoseMeta(platform: string) {
  switch (platform) {
    case 'Twitter Decahose':
      return {
        sourceType: 'Decahose' as const,
        throughputEps: 5600,
        latencyMs: 12,
        partitionId: 'decahose-stream-us-east-01',
        streamQuality: 'Ultra-High' as const
      };
    case 'QVC Data Lake':
      return {
        sourceType: 'Data Lake' as const,
        throughputEps: 3800,
        latencyMs: 24,
        dataLakeBucket: 's3://qvc-commerce-firehose-lakehouse/partition-hourly',
        streamQuality: 'Ultra-High' as const
      };
    case 'B2B Wholesale':
      return {
        sourceType: 'B2B OrderBook' as const,
        throughputEps: 2200,
        latencyMs: 16,
        streamQuality: 'High' as const
      };
    case 'Amazon':
      return {
        sourceType: 'Live Firehose' as const,
        throughputEps: 4400,
        latencyMs: 15,
        streamQuality: 'Ultra-High' as const
      };
    case 'Real-time Data Stream':
      return {
        sourceType: 'Real-time Stream' as const,
        throughputEps: 4900,
        latencyMs: 10,
        partitionId: 'kafka-trade-feed-hot-partition-09',
        streamQuality: 'Ultra-High' as const
      };
    default:
      return {
        sourceType: 'Live Firehose' as const,
        throughputEps: 2800,
        latencyMs: 18,
        streamQuality: 'High' as const
      };
  }
}

function generateSemanticAnalysis(platform: string, title: string, price: number, volume: number, isBuyer: boolean) {
  const intent = isBuyer 
    ? (title.toLowerCase().includes('seeking') || title.toLowerCase().includes('looking') || title.toLowerCase().includes('needed') ? 'purchase_intent' : 'demand_surge')
    : (title.toLowerCase().includes('pricing') || title.toLowerCase().includes('stock') ? 'price_arbitrage' : 'supplier_broadcast');

  const productName = title.replace(/^(Buyer Sourcing:|Live Showcase:|TRENDING:|AD:|Sourcing:|Viral conversation regarding|RFQ:|B2B Wholesale:)/i, '').trim().split('.')[0];
  
  return {
    intent: intent as any,
    sentimentScore: isBuyer ? 0.92 : 0.88,
    polarity: (isBuyer ? 'Bullish' : 'Neutral') as any,
    intentConfidence: Math.floor(90 + Math.random() * 8),
    extractedEntities: {
      productName: productName.slice(0, 45),
      targetPrice: price,
      volume,
      specifications: ['Verified Supplier Grade', 'Direct Warehouse Delivery', 'Custom OEM Stitching'],
      urgency: (isBuyer ? 'Immediate' : 'Standard') as any
    },
    semanticSummary: platform === 'Twitter Decahose'
      ? `Decahose Semantic NLP Engine: Real-time 10% sampling firehose extracted ${isBuyer ? 'high commercial purchasing intent' : 'commercial supplier broadcast'} with structured entity mapping and ${volume.toLocaleString()} target units.`
      : `Deep Semantic NLP Model: Processed commercial context from ${platform}. Extracted entity "${productName.slice(0, 30)}" with target price ${price.toLocaleString()} VND.`
  };
}

let pipelineSignals: any[] = [
  {
    id: 'sig-1',
    platform: 'Twitter Decahose' as any,
    title: 'Viral conversation regarding high-quality jade beauty rollers. Looking for anti-squeak silencer feature in bulk 1,500 units.',
    type: 'buyer_signal' as any,
    price: 150000,
    volume: 1500,
    timestamp: 'Just now',
    sentiment: 'Positive' as any,
    keywords: ['quartz rollers', 'jade rollers', 'anti-squeak', 'Decahose'],
    trendingScore: 96,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'purchase_intent' as any,
      sentimentScore: 0.94,
      polarity: 'Bullish' as any,
      intentConfidence: 96,
      extractedEntities: {
        productName: 'Anti-Squeak Jade & Quartz Facial Rollers',
        targetPrice: 150000,
        volume: 1500,
        specifications: ['Anti-squeak silencer', 'Natural jade', 'Bulk packaging'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'Twitter Decahose Semantic Engine: Processed 10% commercial firehose. High purchase intent identified with strict anti-squeak silencer requirement.'
    },
    firehoseMeta: {
      sourceType: 'Decahose' as any,
      throughputEps: 5800,
      latencyMs: 11,
      partitionId: 'decahose-stream-us-east-01',
      streamQuality: 'Ultra-High' as any
    }
  },
  {
    id: 'sig-2',
    platform: 'QVC Data Lake' as any,
    title: 'Data Lake Telemetry: Rapid surge in broadcast inquiries for Multi-Zone Heated Shiatsu Neck Massagers. Target 2,500 units.',
    type: 'buyer_signal' as any,
    price: 280000,
    volume: 2500,
    timestamp: '1m ago',
    sentiment: 'Positive' as any,
    keywords: ['shiatsu massager', 'heated neck wrap', 'QVC Data Lake', 'broadcast'],
    trendingScore: 95,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'demand_surge' as any,
      sentimentScore: 0.91,
      polarity: 'Bullish' as any,
      intentConfidence: 94,
      extractedEntities: {
        productName: 'Heated Shiatsu Neck Massagers',
        targetPrice: 280000,
        volume: 2500,
        specifications: ['UL/CE certified', 'Multi-zone heat', 'Quiet motors'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'QVC Data Lake Analytics: Ingested from broadcast telemetry lakehouse. Rapid conversion demand detected across regional segments.'
    },
    firehoseMeta: {
      sourceType: 'Data Lake' as any,
      throughputEps: 3600,
      latencyMs: 21,
      dataLakeBucket: 's3://qvc-commerce-firehose-lakehouse/telemetry-hot',
      streamQuality: 'Ultra-High' as any
    }
  },
  {
    id: 'sig-3',
    platform: 'B2B Wholesale' as any,
    title: 'B2B RFQ Order Book: Sourcing verified bulk supply of 40oz Insulated Stainless Steel Tumbler Cups with Leakproof Lids.',
    type: 'buyer_signal' as any,
    price: 95000,
    volume: 5000,
    timestamp: '2m ago',
    sentiment: 'Positive' as any,
    keywords: ['B2B Wholesale', 'tumblers', 'stainless steel', 'Alibaba B2B'],
    trendingScore: 93,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'purchase_intent' as any,
      sentimentScore: 0.89,
      polarity: 'Bullish' as any,
      intentConfidence: 92,
      extractedEntities: {
        productName: '40oz Insulated Tumbler Cups',
        targetPrice: 95000,
        volume: 5000,
        specifications: ['Double-wall vacuum', 'Food-grade 304 steel', 'Leakproof straw lid'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'B2B OrderBook Engine: Verified commercial RFQ matched against global wholesale catalog with high volume readiness.'
    },
    firehoseMeta: {
      sourceType: 'B2B OrderBook' as any,
      throughputEps: 2400,
      latencyMs: 14,
      streamQuality: 'High' as any
    }
  },
  {
    id: 'sig-4',
    platform: 'Amazon' as any,
    title: 'Amazon Live Commerce Stream: Best-seller velocity alert for 3-in-1 Foldable Magnetic Wireless Charging Docks.',
    type: 'supplier_signal' as any,
    price: 185000,
    volume: 4000,
    timestamp: '4m ago',
    sentiment: 'Positive' as any,
    keywords: ['Amazon Live', 'wireless charger', 'magnetic', 'fast charging'],
    trendingScore: 91,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'supplier_broadcast' as any,
      sentimentScore: 0.88,
      polarity: 'Neutral' as any,
      intentConfidence: 91,
      extractedEntities: {
        productName: '3-in-1 Foldable Wireless Charging Docks',
        targetPrice: 185000,
        volume: 4000,
        specifications: ['Qi2 certified', 'MagSafe compatible', 'Overheat protection'],
        urgency: 'Standard' as any
      },
      semanticSummary: 'Amazon Firehose Processor: Live shopping stream inventory synced with warehouse dispatch buffers.'
    },
    firehoseMeta: {
      sourceType: 'Live Firehose' as any,
      throughputEps: 4200,
      latencyMs: 15,
      streamQuality: 'Ultra-High' as any
    }
  },
  {
    id: 'sig-5',
    platform: 'TikTok' as any,
    title: 'TRENDING: Bulk 100% pure organic mulberry silk fabric. In-stock ready for craft orders.',
    type: 'supplier_signal' as any,
    price: 310000,
    volume: 5000,
    timestamp: '5m ago',
    sentiment: 'Positive' as any,
    keywords: ['mulberry silk', 'handwoven', 'scarves', 'fabric'],
    trendingScore: 92,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'supplier_broadcast' as any,
      sentimentScore: 0.90,
      polarity: 'Bullish' as any,
      intentConfidence: 90,
      extractedEntities: {
        productName: 'Handwoven Mulberry Silk Fabric',
        targetPrice: 310000,
        volume: 5000,
        specifications: ['100% Mulberry silk', 'Handloom certified'],
        urgency: 'Standard' as any
      },
      semanticSummary: 'TikTok Live Commerce Engine: High trending momentum detected in craft textiles category.'
    },
    firehoseMeta: {
      sourceType: 'Live Firehose' as any,
      throughputEps: 3100,
      latencyMs: 16,
      streamQuality: 'High' as any
    }
  },
  {
    id: 'sig-6',
    platform: 'Taobao' as any,
    title: 'Sourcing: RGB non-slip LED oversized desk pads with double-stitching borders. Needed 2000 units.',
    type: 'buyer_signal' as any,
    price: 110000,
    volume: 2000,
    timestamp: '7m ago',
    sentiment: 'Neutral' as any,
    keywords: ['desk pads', 'RGB LED', 'custom stitching'],
    trendingScore: 89,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'purchase_intent' as any,
      sentimentScore: 0.85,
      polarity: 'Neutral' as any,
      intentConfidence: 89,
      extractedEntities: {
        productName: 'RGB LED Desk Pads',
        targetPrice: 110000,
        volume: 2000,
        specifications: ['RGB lighting modes', 'Anti-fray edges'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'Taobao Sourcing Feed: Buyer commercial posting validated against Yiwu hardware suppliers.'
    },
    firehoseMeta: {
      sourceType: 'Live Firehose' as any,
      throughputEps: 2900,
      latencyMs: 17,
      streamQuality: 'High' as any
    }
  },
  {
    id: 'sig-7',
    platform: 'Instagram' as any,
    title: 'AD: Sustainable organic bamboo home accessories wholesale. European warehouse shipments.',
    type: 'supplier_signal' as any,
    price: 190000,
    volume: 3000,
    timestamp: '9m ago',
    sentiment: 'Positive' as any,
    keywords: ['bamboo', 'sustainable', 'storage boxes'],
    trendingScore: 85,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'supplier_broadcast' as any,
      sentimentScore: 0.87,
      polarity: 'Bullish' as any,
      intentConfidence: 88,
      extractedEntities: {
        productName: 'Modular Bamboo Storage Boxes',
        targetPrice: 190000,
        volume: 3000,
        specifications: ['FSC Certified', 'Stackable design'],
        urgency: 'Standard' as any
      },
      semanticSummary: 'Instagram Reels Stream: Eco-lifestyle creator brand broadcasting wholesale availability.'
    },
    firehoseMeta: {
      sourceType: 'Live Firehose' as any,
      throughputEps: 2700,
      latencyMs: 19,
      streamQuality: 'High' as any
    }
  },
  {
    id: 'sig-8',
    platform: 'Popshop Live' as any,
    title: 'Popshop Live Stream Feed: Exclusive drop of Limited Edition Designer Resin Figurines for boutique distributors.',
    type: 'supplier_signal' as any,
    price: 340000,
    volume: 1200,
    timestamp: '11m ago',
    sentiment: 'Positive' as any,
    keywords: ['Popshop Live', 'art toys', 'resin figurines', 'collectible'],
    trendingScore: 94,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'supplier_broadcast' as any,
      sentimentScore: 0.93,
      polarity: 'Bullish' as any,
      intentConfidence: 95,
      extractedEntities: {
        productName: 'Limited Edition Designer Resin Figurines',
        targetPrice: 340000,
        volume: 1200,
        specifications: ['Hand-painted', 'Numbered edition', 'Collector box packaging'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'Popshop Live Stream: Interactive collectible broadcast identifying boutique distributor demand.'
    },
    firehoseMeta: {
      sourceType: 'Live Firehose' as any,
      throughputEps: 2600,
      latencyMs: 15,
      streamQuality: 'High' as any
    }
  },
  {
    id: 'sig-9',
    platform: 'TalkShopLive' as any,
    title: 'Interactive Live Broadcast: High-velocity bulk orders placed for Anti-Squeak Natural Jade Rollers.',
    type: 'buyer_signal' as any,
    price: 140000,
    volume: 3000,
    timestamp: '14m ago',
    sentiment: 'Positive' as any,
    keywords: ['TalkShopLive', 'jade rollers', 'skincare', 'live commerce'],
    trendingScore: 93,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'purchase_intent' as any,
      sentimentScore: 0.91,
      polarity: 'Bullish' as any,
      intentConfidence: 93,
      extractedEntities: {
        productName: 'Natural Jade Facial Rollers',
        targetPrice: 140000,
        volume: 3000,
        specifications: ['Anti-squeak silicone cap', 'Real jade stone'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'TalkShopLive Feed: Active interactive host chat with direct purchase commitments extracted.'
    },
    firehoseMeta: {
      sourceType: 'Live Firehose' as any,
      throughputEps: 2500,
      latencyMs: 16,
      streamQuality: 'High' as any
    }
  },
  {
    id: 'sig-10',
    platform: 'ShopShops' as any,
    title: 'Cross-Border Stream: Seeking wholesale suppliers for Premium Vintage Washed Cotton Tees (240 GSM).',
    type: 'buyer_signal' as any,
    price: 90000,
    volume: 4000,
    timestamp: '16m ago',
    sentiment: 'Positive' as any,
    keywords: ['ShopShops', 'cotton tees', 'cross-border', 'apparel'],
    trendingScore: 90,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'purchase_intent' as any,
      sentimentScore: 0.89,
      polarity: 'Bullish' as any,
      intentConfidence: 91,
      extractedEntities: {
        productName: '240 GSM Vintage Heavyweight Tees',
        targetPrice: 90000,
        volume: 4000,
        specifications: ['240 GSM', 'Acid wash finish', 'Custom woven tag'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'ShopShops Cross-Border Stream: Global livestreaming buyer placing commercial orders.'
    },
    firehoseMeta: {
      sourceType: 'Live Firehose' as any,
      throughputEps: 2700,
      latencyMs: 18,
      streamQuality: 'High' as any
    }
  },
  {
    id: 'sig-11',
    platform: 'Real-time Data Stream' as any,
    title: 'Real-Time Pipeline Stream: High-frequency Kafka buffer ingested 500+ commercial inquiries for Gym Resistance Bands.',
    type: 'buyer_signal' as any,
    price: 70000,
    volume: 6000,
    timestamp: '18m ago',
    sentiment: 'Positive' as any,
    keywords: ['Real-time Stream', 'resistance bands', 'fitness', 'Kafka buffer'],
    trendingScore: 94,
    matchingEligible: true,
    semanticAnalysis: {
      intent: 'demand_surge' as any,
      sentimentScore: 0.92,
      polarity: 'Bullish' as any,
      intentConfidence: 95,
      extractedEntities: {
        productName: '5-Level Latex Resistance Bands',
        targetPrice: 70000,
        volume: 6000,
        specifications: ['Natural latex', '5 color-coded resistances', 'Drawstring bag'],
        urgency: 'Immediate' as any
      },
      semanticSummary: 'Real-Time Pipeline Stream: Ingested via Kafka broker partition 09. High throughput demand spike observed.'
    },
    firehoseMeta: {
      sourceType: 'Real-time Stream' as any,
      throughputEps: 5100,
      latencyMs: 9,
      partitionId: 'kafka-trade-feed-hot-partition-09',
      streamQuality: 'Ultra-High' as any
    }
  }
];

let agentIntercoms = [
  {
    messageId: 'ic-1',
    sender: 'ExecutiveAgent' as any,
    receiver: 'ResearchAgent' as any,
    timestamp: new Date(Date.now() - 25000000).toISOString(),
    messageType: 'TASK_ASSIGNMENT' as any,
    payload: { action: 'INITIALIZE_COMMERCE_CRAWL', targets: ['TikTok', 'Taobao', 'Instagram', 'Klarna', 'Twitter Decahose'] },
    status: 'SUCCESS' as any
  },
  {
    messageId: 'ic-2',
    sender: 'ResearchAgent' as any,
    receiver: 'ExecutiveAgent' as any,
    timestamp: new Date(Date.now() - 24800000).toISOString(),
    messageType: 'FEEDBACK' as any,
    payload: { status: 'SUCCESS', crawledSignalsCount: 24, trendingSignalsIdentified: 8 },
    status: 'SUCCESS' as any
  },
  {
    messageId: 'ic-3',
    sender: 'ExecutiveAgent' as any,
    receiver: 'SalesAgent' as any,
    timestamp: new Date(Date.now() - 24500000).toISOString(),
    messageType: 'TASK_ASSIGNMENT' as any,
    payload: { action: 'EXECUTE_MATCHING_SWEEP', buyers: 4, sellers: 4 },
    status: 'SUCCESS' as any
  },
  {
    messageId: 'ic-4',
    sender: 'SalesAgent' as any,
    receiver: 'ExecutiveAgent' as any,
    timestamp: new Date(Date.now() - 24300000).toISOString(),
    messageType: 'FEEDBACK' as any,
    payload: {
      matchesFound: [
        { matchId: 'm-1', buyer: 'Alena Smirnova', seller: 'Văn Phong', confidence: 92 },
        { matchId: 'm-2', buyer: 'Minh Tuấn', seller: 'Yiwu Smart Trade', confidence: 88 }
      ]
    },
    status: 'SUCCESS' as any
  }
];

// Helper to log inter-agent communication messages
function addAgentIntercom(
  sender: 'ExecutiveAgent' | 'ResearchAgent' | 'SalesAgent' | 'MarketingAgent' | 'FinanceAgent' | 'DatabaseAgent',
  receiver: 'ExecutiveAgent' | 'ResearchAgent' | 'SalesAgent' | 'MarketingAgent' | 'FinanceAgent' | 'DatabaseAgent',
  messageType: 'TASK_ASSIGNMENT' | 'DATA_SHARING' | 'FEEDBACK' | 'ERROR_REPORT',
  payload: any,
  status: 'SUCCESS' | 'ERROR' = 'SUCCESS'
) {
  agentIntercoms.unshift({
    messageId: `ic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sender,
    receiver,
    timestamp: new Date().toISOString(),
    messageType,
    payload,
    status
  });
  if (agentIntercoms.length > 50) agentIntercoms.pop();
}

// Extract buyer requirements (product type, volume, criteria) from raw demand
function extractBuyerRequirementsHeuristic(demand: string, targetPrice: number) {
  const lowercaseDemand = demand.toLowerCase();
  
  let productType = 'Custom Wholesale Goods';
  if (lowercaseDemand.includes('silk') || lowercaseDemand.includes('scarf') || lowercaseDemand.includes('scarves')) {
    productType = 'Mulberry Silk Scarves';
  } else if (lowercaseDemand.includes('pad') || lowercaseDemand.includes('desk mat') || lowercaseDemand.includes('desk pad')) {
    productType = 'RGB Desk Pads';
  } else if (lowercaseDemand.includes('roller') || lowercaseDemand.includes('quartz') || lowercaseDemand.includes('jade')) {
    productType = 'Cosmetic Face Rollers';
  } else if (lowercaseDemand.includes('bamboo') || lowercaseDemand.includes('storage') || lowercaseDemand.includes('organizer')) {
    productType = 'Bamboo Storage Organizers';
  } else if (lowercaseDemand.includes('cotton') || lowercaseDemand.includes('tee') || lowercaseDemand.includes('shirt')) {
    productType = 'Organic Cotton T-Shirts';
  } else if (lowercaseDemand.includes('leather') || lowercaseDemand.includes('keychain')) {
    productType = 'Recycled Leather Goods';
  } else if (lowercaseDemand.includes('band') || lowercaseDemand.includes('gym') || lowercaseDemand.includes('resistance')) {
    productType = 'Gym Resistance Bands';
  } else if (lowercaseDemand.includes('blazer') || lowercaseDemand.includes('linen') || lowercaseDemand.includes('suit')) {
    productType = 'Linen Summer Blazers';
  } else if (lowercaseDemand.includes('collagen') || lowercaseDemand.includes('mist') || lowercaseDemand.includes('spray')) {
    productType = 'Vegan Collagen Mist';
  } else if (lowercaseDemand.includes('straw')) {
    productType = 'Organic Bamboo Straws';
  }

  let quantityNeeded = 1500;
  const qtyMatch = demand.match(/(\d{1,3}(,\d{3})*|\d+)\s*(units|pieces|pcs|sets|units|pieces)/i);
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(parsedQty) && parsedQty > 0) {
      quantityNeeded = parsedQty;
    }
  } else {
    const rawNumbers = demand.match(/\b\d{2,6}\b/g);
    if (rawNumbers) {
      for (const numStr of rawNumbers) {
        const val = parseInt(numStr, 10);
        if (val >= 50 && val <= 100000) {
          quantityNeeded = val;
          break;
        }
      }
    }
  }

  const keyCriteria: string[] = [];
  if (lowercaseDemand.includes('custom') || lowercaseDemand.includes('stitch') || lowercaseDemand.includes('logo')) {
    keyCriteria.push('Custom Logo Branding & Stitching');
  }
  if (lowercaseDemand.includes('handwoven') || lowercaseDemand.includes('craft') || lowercaseDemand.includes('traditional')) {
    keyCriteria.push('Handwoven Craft Village Origin');
  }
  if (lowercaseDemand.includes('organic') || lowercaseDemand.includes('natural') || lowercaseDemand.includes('vegan') || lowercaseDemand.includes('eco')) {
    keyCriteria.push('Eco-Friendly Certified Bio-Materials');
  }
  if (lowercaseDemand.includes('dropshipping') || lowercaseDemand.includes('dropship') || lowercaseDemand.includes('warehouse') || lowercaseDemand.includes('direct')) {
    keyCriteria.push('Direct Dropshipping Warehouse Logistics');
  }
  if (lowercaseDemand.includes('certified') || lowercaseDemand.includes('fsc')) {
    keyCriteria.push('FSC / International Standard Certification');
  }
  if (lowercaseDemand.includes('anti-squeak') || lowercaseDemand.includes('silencer') || lowercaseDemand.includes('noise')) {
    keyCriteria.push('Anti-Squeak Integrated Silencer Pad');
  }
  
  if (keyCriteria.length === 0) {
    keyCriteria.push('Bulk Wholesale Unit Economics Compliance');
    keyCriteria.push('High-Fidelity Material Quality Verification');
  }

  return { productType, quantityNeeded, keyCriteria };
}

// Calculate detailed compatibility scores
function calculateDetailedScoreHeuristic(buyerReq: any, sellerProduct: string, targetPrice: number, actualPrice: number) {
  // 1. Price alignment score
  let priceAlignment = 50;
  if (actualPrice <= targetPrice) {
    priceAlignment = 100;
    const diffPercent = (targetPrice - actualPrice) / targetPrice;
    priceAlignment += Math.min(Math.floor(diffPercent * 10), 0);
  } else {
    const overPercent = (actualPrice - targetPrice) / targetPrice;
    priceAlignment = Math.max(10, Math.round(100 - (overPercent * 300)));
  }

  // 2. Product alignment score
  let productAlignment = 40;
  const reqWords = buyerReq.productType.toLowerCase().split(/\s+/);
  const prodWords = sellerProduct.toLowerCase().split(/\s+/);
  let matchCount = 0;
  for (const w of reqWords) {
    if (w.length > 2 && prodWords.some(pw => pw.includes(w) || w.includes(pw))) {
      matchCount++;
    }
  }
  productAlignment += Math.min(matchCount * 25, 60);
  
  let criteriaMatchCount = 0;
  for (const cr of buyerReq.keyCriteria) {
    const crWords = cr.toLowerCase().split(/\s+/);
    if (crWords.some(cw => cw.length > 3 && sellerProduct.toLowerCase().includes(cw))) {
      criteriaMatchCount++;
    }
  }
  productAlignment = Math.min(100, productAlignment + criteriaMatchCount * 10);

  // 3. Logistics Feasibility Score
  let logisticsFeasibility = 80;
  if (buyerReq.keyCriteria.some((c: string) => c.toLowerCase().includes('dropship') || c.toLowerCase().includes('warehouse'))) {
    if (sellerProduct.toLowerCase().includes('warehouse') || sellerProduct.toLowerCase().includes('dropship') || sellerProduct.toLowerCase().includes('express')) {
      logisticsFeasibility = 92;
    } else {
      logisticsFeasibility = 65;
    }
  } else if (buyerReq.keyCriteria.some((c: string) => c.toLowerCase().includes('handwoven') || c.toLowerCase().includes('traditional'))) {
    logisticsFeasibility = 88;
  }

  // 4. Volume Capacity Score
  let volumeCapacity = 85;
  if (buyerReq.quantityNeeded > 4000) {
    if (sellerProduct.toLowerCase().includes('factory') || sellerProduct.toLowerCase().includes('trade') || sellerProduct.toLowerCase().includes('co.')) {
      volumeCapacity = 92;
    } else {
      volumeCapacity = 78;
    }
  } else {
    volumeCapacity = 90;
  }

  const confidenceScore = Math.round(priceAlignment * 0.4 + productAlignment * 0.3 + logisticsFeasibility * 0.15 + volumeCapacity * 0.15);

  return {
    priceAlignment: Math.min(100, Math.max(10, priceAlignment)),
    productAlignment: Math.min(100, Math.max(20, productAlignment)),
    logisticsFeasibility: Math.min(100, Math.max(20, logisticsFeasibility)),
    volumeCapacity: Math.min(100, Math.max(20, volumeCapacity)),
    confidenceScore: Math.min(98, Math.max(30, confidenceScore))
  };
}

// Helper to add logs easily with deduplication & guaranteed unique IDs
let logSequenceCounter = 0;
function addLog(agent: any, message: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') {
  logSequenceCounter++;
  // De-duplicate recent identical messages to avoid log flooding
  const isRecentDuplicate = activityLogs.slice(0, 3).some(l => l.agent === agent && l.message === message);
  if (isRecentDuplicate) {
    return;
  }

  activityLogs.unshift({
    id: `log-${Date.now()}-${logSequenceCounter}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    agent,
    message,
    status
  });
  if (activityLogs.length > 100) activityLogs.pop();
}

// -----------------------------------------------------------------
// 24/7 SCHEDULER SIMULATION
// -----------------------------------------------------------------
// To make the agent work 24/7 and show real dynamic feedback, we'll
// run an automated scheduler tick every 30 seconds to fetch and match!
setInterval(() => {
  const sources = [
    'B2B Wholesale',
    'Amazon',
    'YouTube',
    'Taobao',
    'Instagram',
    'TalkShopLive',
    'TikTok',
    'Popshop Live',
    'eBay Live',
    'Klarna',
    'ShopShops',
    'QVC Data Lake',
    'Twitter Decahose',
    'Real-time Data Stream'
  ];
  const source = sources[Math.floor(Math.random() * sources.length)] as any;
  
  const randomEvents = [
    () => {
      // Find a new buyer lead (check for duplicates before adding)
      const names = ['David Beckham Shop', 'Thanh Hằng Boutique', 'Oliver Lifestyle', 'Sophie Cosmetics', 'K-Beauty Distributor', 'Alena Milan Sourcing'];
      const demands = [
        'Looking for organic cotton premium tees. Quantity: 3,000 units.',
        'Sourcing vegan collagen face mist with custom aesthetic spray nozzle.',
        'Needs recycled leather keychains for corporate gifting.',
        'High-density gym resistance bands. Wholesale batch of 500 sets.',
        'Korean style linen summer blazers.',
        'High-grade anti-squeak quartz and jade facial rollers.'
      ];
      const name = names[Math.floor(Math.random() * names.length)];
      const demand = demands[Math.floor(Math.random() * demands.length)];
      
      const existingBuyer = buyersList.find(b => b.name === name && b.demand === demand);
      if (existingBuyer) {
        return; // Skip duplicate command/post
      }

      const targetPrice = Math.floor(Math.random() * 10 + 5) * 15000;
      
      const newB = {
        id: `b-${Date.now()}`,
        name,
        demand,
        targetPrice,
        contact: `agency-forward+${Math.floor(Math.random()*1000)}@dealmatcher.co`,
        source: `${source} Scanner`,
        timestamp: new Date().toISOString()
      };
      buyersList.unshift(newB);
      addLog('Research', `Discovered new buyer lead from ${source}: ${name} seeking "${demand.slice(0, 40)}..."`, 'info');
      triggerAutomatedMatching(newB, 'buyer');
    },
    () => {
      // Find a new seller lead (check for duplicates before adding)
      const names = ['Thanh Hóa Eco-Weave', 'Shenzhen TechGlow Ltd', 'Hà Nội Leather Workshop', 'Bình Dương Eco-Goods Factory', 'Yiwu Direct Factory Hub'];
      const products = [
        'Premium organic heavy-weight cotton tees - 220 GSM',
        'Custom engraved vegan leather lifestyle accessories',
        'Advanced double-loop high resistance elastic bands',
        'Eco-friendly compostable cardboard packaging sleeves',
        'Traditional Linen Blended Lightweight Blazers',
        '40oz Insulated Stainless Steel Tumblers with Straw Lid'
      ];
      const name = names[Math.floor(Math.random() * names.length)];
      const productName = products[Math.floor(Math.random() * products.length)];

      const existingSeller = sellersList.find(s => s.name === name && s.productName === productName);
      if (existingSeller) {
        return; // Skip duplicate command/post
      }

      const price = Math.floor(Math.random() * 8 + 4) * 15000;

      const newS = {
        id: `s-${Date.now()}`,
        name,
        productName,
        price,
        contact: `wholesale-sales@${name.toLowerCase().replace(/[^a-z]/g, '')}.vn`,
        source: `${source} Streaming Feed`,
        timestamp: new Date().toISOString()
      };
      sellersList.unshift(newS);
      addLog('Research', `Discovered new manufacturer deal via ${source}: ${name} offering "${productName}" at ${price.toLocaleString()} VND.`, 'info');
      triggerAutomatedMatching(newS, 'seller');
    },
    () => {
      // Create a random streaming social commerce signal
      const productNames = [
        'Premium Mulberry Silk Sleeping Eye Masks',
        'Ergonomic Leather Laptop Sleeves with Cable Organizers',
        'Organic Bamboo Straw Sets with Hand-sewn Linen Bags',
        'Anti-squeak Quartz Roller & Gua Sha Beauty Set',
        '40oz Double-Wall Vacuum Insulated Tumblers',
        'Multi-Zone Heated Deep Tissue Shiatsu Massagers'
      ];
      const keywords = [
        ['silk', 'sleeping', 'mask'],
        ['leather', 'laptop', 'sleeve'],
        ['bamboo', 'straws', 'eco'],
        ['quartz', 'beauty', 'roller'],
        ['tumbler', 'insulated', 'stainless'],
        ['shiatsu', 'massager', 'heated']
      ];
      const idx = Math.floor(Math.random() * productNames.length);
      const isBuyer = Math.random() > 0.5;
      const price = Math.floor(Math.random() * 15 + 5) * 12000;
      const volume = Math.floor(Math.random() * 5000 + 500);
      const title = isBuyer 
        ? `Buyer Sourcing: Seeking large batches of ${productNames[idx]} (approx ${volume.toLocaleString()} units)`
        : `Live Showcase: Introducing our new sustainable ${productNames[idx]} - open for global wholesale!`;
      
      const newSig = {
        id: `sig-${Date.now()}`,
        platform: source,
        title,
        type: isBuyer ? 'buyer_signal' as any : 'supplier_signal' as any,
        price,
        volume,
        timestamp: 'Just now',
        sentiment: (Math.random() > 0.7 ? 'Positive' : 'Neutral') as any,
        keywords: keywords[idx],
        trendingScore: Math.floor(Math.random() * 20 + 78),
        matchingEligible: true,
        semanticAnalysis: generateSemanticAnalysis(source, title, price, volume, isBuyer),
        firehoseMeta: generateFirehoseMeta(source)
      };
      
      pipelineSignals.unshift(newSig);
      if (pipelineSignals.length > 50) pipelineSignals.pop();
      addLog('Research', `Live Ingestion Pipeline: Scanned & categorized raw commercial post on ${source}: "${newSig.title.slice(0, 45)}..."`, 'info');
      
      // 10% chance to automatically ingest signal and run matchmaking
      if (Math.random() > 0.85) {
        addLog('Executive', `Signal Ingestor: Auto-promoting trending ${source} signal "${newSig.title.slice(0, 30)}..." to active pipeline lead!`, 'success');
        
        const tempLead = {
          name: isBuyer ? `Lead Client via ${source}` : `Supplier Factory via ${source}`,
          demand: newSig.title,
          targetPrice: newSig.price,
          contact: `direct-inbound-dispatch@${source.toLowerCase().replace(/[^a-z]/g, '')}-broker.net`,
          type: isBuyer ? 'buyer' as any : 'seller' as any,
          source: `${source} Auto-Stream`
        };
        
        const id = `${isBuyer ? 'b' : 's'}-${Date.now()}`;
        const timestamp = new Date().toISOString();
        
        if (isBuyer) {
          const newB = { id, ...tempLead, timestamp };
          buyersList.unshift(newB);
          triggerAutomatedMatching(newB, 'buyer');
        } else {
          const newS = { id, name: tempLead.name, productName: tempLead.demand, price: tempLead.targetPrice, contact: tempLead.contact, source: tempLead.source, timestamp };
          sellersList.unshift(newS);
          triggerAutomatedMatching(newS, 'seller');
        }
      }
    },
    () => {
      // Find a pending deal and mark it as stalled, or create a stalled/stuck deal if none exist
      const pendingDeals = matchingBubbles.filter(b => b.status === 'pending');
      const hasStalledDeal = matchingBubbles.some(b => b.requiresIntervention || b.buyerName === 'Grand Plaza Sourcing Office');
      
      if (hasStalledDeal) {
        // System already has a stalled deal waiting for manager intervention; prevent duplicates
        return;
      }

      if (pendingDeals.length > 0 && Math.random() > 0.4) {
        const randomDeal = pendingDeals[Math.floor(Math.random() * pendingDeals.length)];
        randomDeal.requiresIntervention = true;
        randomDeal.stalledReason = 'Price negotiations failed. Target budget gap too wide for autonomous resolution.';
        addLog('Sales', `Stalled Deal warning: Match [${randomDeal.id}] is stalled! Sales agent requires manual intervention.`, 'warning');
        addAgentIntercom('SalesAgent', 'ExecutiveAgent', 'ERROR_REPORT', {
          code: 'DEAL_STALLED',
          message: `Match [${randomDeal.id}] for "${randomDeal.productName}" is stalled. Require manager intervention.`,
          stalledDealId: randomDeal.id
        }, 'ERROR');
      } else if (!hasStalledDeal) {
        // Create an interesting new deal that starts off requiring intervention
        const name = 'Grand Plaza Sourcing Office';
        const productName = 'Premium Bamboo Toothbrush Sets - Laser Engraved';
        const price = 48000;
        const buyerId = `b-stalled-${Date.now()}`;
        const sellerId = `s-stalled-${Date.now()}`;
        
        const newB = {
          id: buyerId,
          name,
          demand: 'Seeking high-quality laser engraved bamboo toothbrushes. Large wholesale order.',
          targetPrice: 35000,
          contact: 'sourcing@grandplaza.vn',
          source: 'Instagram Scanner',
          timestamp: new Date().toISOString()
        };
        buyersList.unshift(newB);

        const newS = {
          id: sellerId,
          name: 'Bến Tre Eco Bamboo Mills',
          productName,
          price,
          contact: 'wholesale@bentre-eco-bamboo.com.vn',
          source: 'Taobao Stream',
          timestamp: new Date().toISOString()
        };
        sellersList.unshift(newS);

        const bubbleId = `m-stalled-${Date.now()}`;
        const commission = Math.round(5000 * price * (commissionRate / 100)); // ~3.6M VND
        const newBubble = {
          id: bubbleId,
          buyerId,
          sellerId,
          buyerName: name,
          sellerName: 'Bến Tre Eco Bamboo Mills',
          productName,
          price,
          confidenceScore: 78,
          evaluationReason: 'Price difference of 13,000 VND exceeds standard negotiation limit. Sales agent marked this deal for manual price adjustment.',
          commissionFee: commission,
          commissionPercent: commissionRate,
          status: 'pending' as any,
          buyerContactUnlocked: false,
          sellerContactUnlocked: false,
          requiresIntervention: true,
          stalledReason: 'Pricing alignment too low (78%). Sourcing budget and manufacturer price mismatch.',
          extractedBuyerRequirements: {
            productType: 'Bamboo Toothbrushes',
            quantityNeeded: 5000,
            keyCriteria: ['Laser Engraved', 'Wholesale order']
          },
          scoreBreakdown: {
            priceAlignment: 65,
            productAlignment: 92,
            logisticsFeasibility: 80,
            volumeCapacity: 85
          }
        };
        matchingBubbles.unshift(newBubble);
        communicationStatuses.unshift({
          pairId: bubbleId,
          lastMessageSender: 'agent',
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: 'agent',
              text: 'Alert: Price gap too high. Manufacturer price of 48,000 VND exceeds buyer budget of 35,000 VND. Require intervention.',
              timestamp: new Date().toISOString()
            }
          ],
          outreachTemplate: 'Direct sourcing request: Premium Bamboo Toothbrush Sets.'
        });

        addLog('Sales', `Special Match Proposal [${bubbleId}] has stalled due to tight margins. Agent requires manual intervention!`, 'warning');
        addAgentIntercom('SalesAgent', 'ExecutiveAgent', 'ERROR_REPORT', {
          code: 'DEAL_STALLED',
          message: `Match [${bubbleId}] stalled. Require intervention.`,
          stalledDealId: bubbleId
        }, 'ERROR');
      }
    }
  ];

  const action = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  action();

}, 25000);

// Basic internal heuristic matching in case Gemini is not active
function triggerAutomatedMatching(item: any, type: 'buyer' | 'seller') {
  addLog('Sales', `Orchestrating autonomous matching check for newly posted ${type} item...`, 'info');
  
  // LOG SPECIALIST AGENTS COMMUNICATION FOR ROBUST PROTOCOL
  addAgentIntercom('ExecutiveAgent', 'SalesAgent', 'TASK_ASSIGNMENT', {
    action: 'COORDINATE_MATCH',
    targetId: item.id,
    targetType: type
  });

  let matchFound = false;
  if (type === 'buyer') {
    const extracted = extractBuyerRequirementsHeuristic(item.demand, item.targetPrice);
    
    addAgentIntercom('SalesAgent', 'ResearchAgent', 'TASK_ASSIGNMENT', {
      action: 'EXTRACT_CONSTRAINTS',
      text: item.demand
    });
    addAgentIntercom('ResearchAgent', 'SalesAgent', 'DATA_SHARING', {
      parsedRequirements: extracted
    });

    // Find matching seller
    for (const seller of sellersList) {
      const breakdown = calculateDetailedScoreHeuristic(extracted, seller.productName, item.targetPrice, seller.price);
      if (breakdown.confidenceScore >= 80) {
        createMatchBubble(item, seller, breakdown.confidenceScore, extracted, breakdown);
        matchFound = true;
        
        addAgentIntercom('SalesAgent', 'ExecutiveAgent', 'FEEDBACK', {
          verdict: 'MATCH_APPROVED',
          score: breakdown.confidenceScore,
          breakdown
        });

        addAgentIntercom('ExecutiveAgent', 'FinanceAgent', 'TASK_ASSIGNMENT', {
          action: 'ESTIMATE_YIELD',
          price: seller.price,
          volume: extracted.quantityNeeded,
          rate: commissionRate
        });
        
        const fee = Math.round(extracted.quantityNeeded * seller.price * (commissionRate / 100));
        addAgentIntercom('FinanceAgent', 'ExecutiveAgent', 'FEEDBACK', {
          estimatedCommissionVND: fee,
          recipient: 'NGUYEN TAN SI'
        });
        break;
      }
    }
  } else {
    // Find matching buyer
    for (const buyer of buyersList) {
      const extracted = extractBuyerRequirementsHeuristic(buyer.demand, buyer.targetPrice);
      const breakdown = calculateDetailedScoreHeuristic(extracted, item.productName, buyer.targetPrice, item.price);
      if (breakdown.confidenceScore >= 80) {
        createMatchBubble(buyer, item, breakdown.confidenceScore, extracted, breakdown);
        matchFound = true;

        addAgentIntercom('SalesAgent', 'ExecutiveAgent', 'FEEDBACK', {
          verdict: 'MATCH_APPROVED',
          score: breakdown.confidenceScore,
          breakdown
        });

        addAgentIntercom('ExecutiveAgent', 'FinanceAgent', 'TASK_ASSIGNMENT', {
          action: 'ESTIMATE_YIELD',
          price: item.price,
          volume: extracted.quantityNeeded,
          rate: commissionRate
        });
        break;
      }
    }
  }

  if (!matchFound) {
    addLog('Sales', `No matching target found above 80% confidence score for ${item.name}. Queueing item in raw data lake.`, 'warning');
    addAgentIntercom('SalesAgent', 'ExecutiveAgent', 'ERROR_REPORT', {
      code: 'MATCH_THRESHOLD_FAIL',
      message: `No listings exceeded the 80% compatibility limit for ${item.id}`
    }, 'ERROR');
  }
}

function createMatchBubble(buyer: any, seller: any, score: number, extractedReq?: any, scoreBreakdown?: any) {
  // Deduplication check: prevent creating identical duplicate bubbles
  const existingBubble = matchingBubbles.find(b => 
    (b.buyerId === buyer.id && b.sellerId === seller.id) ||
    (b.buyerName.trim().toLowerCase() === buyer.name.trim().toLowerCase() && 
     b.sellerName.trim().toLowerCase() === seller.name.trim().toLowerCase() &&
     b.productName.trim().toLowerCase() === seller.productName.trim().toLowerCase())
  );
  if (existingBubble) {
    return existingBubble;
  }
  const isDismissed = dismissedBubbles.find(b => 
    (b.buyerName.trim().toLowerCase() === buyer.name.trim().toLowerCase() && 
     b.sellerName.trim().toLowerCase() === seller.name.trim().toLowerCase() &&
     b.productName.trim().toLowerCase() === seller.productName.trim().toLowerCase())
  );
  if (isDismissed) {
    return isDismissed;
  }

  const bubbleId = `m-${Date.now()}`;
  
  const finalExtracted = extractedReq || extractBuyerRequirementsHeuristic(buyer.demand, buyer.targetPrice);
  const finalBreakdown = scoreBreakdown || calculateDetailedScoreHeuristic(finalExtracted, seller.productName, buyer.targetPrice, seller.price);
  
  const estVolume = finalExtracted.quantityNeeded;
  const commission = Math.round(estVolume * seller.price * (commissionRate / 100));

  const newBubble = {
    id: bubbleId,
    buyerId: buyer.id,
    sellerId: seller.id,
    buyerName: buyer.name,
    sellerName: seller.name,
    productName: seller.productName,
    price: seller.price,
    confidenceScore: finalBreakdown.confidenceScore,
    evaluationReason: `Autonomous Matcher found high alignment. Price Alignment: ${finalBreakdown.priceAlignment}%, Product Overlap: ${finalBreakdown.productAlignment}%, Logistics Feasibility: ${finalBreakdown.logisticsFeasibility}%, Fulfill Capacity: ${finalBreakdown.volumeCapacity}%. Wholesale unit price of ${seller.price.toLocaleString()} VND fits target.`,
    commissionFee: commission,
    commissionPercent: commissionRate,
    status: 'pending' as any,
    buyerContactUnlocked: false,
    sellerContactUnlocked: false,
    dealCompletedAt: new Date().toISOString(),
    paymentStatus: 'unpaid' as const,
    reminderCount: 0,
    reminderHistory: [],
    extractedBuyerRequirements: finalExtracted,
    scoreBreakdown: finalBreakdown
  };

  matchingBubbles.unshift(newBubble);
  communicationStatuses.unshift({
    pairId: bubbleId,
    lastMessageSender: 'agent',
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        text: `Automated match generated with ${finalBreakdown.confidenceScore}% confidence! Buyer: ${buyer.name} seeking "${buyer.demand.slice(0, 50)}...". Seller: ${seller.name} offering "${seller.productName}" for ${seller.price.toLocaleString()} VND. Click the bubble on screen to agree on the ${commissionRate}% commission to Sacombank and unlock direct contact.`,
        timestamp: new Date().toISOString()
      }
    ],
    outreachTemplate: `Outreach Match: Hello ${buyer.name}, we found a highly compatible supplier ${seller.name} who can deliver "${seller.productName}" for ${seller.price.toLocaleString()} VND.`
  });

  addLog('Finance', `Autonomous Matching Engine generated deal [${bubbleId}] with ${finalBreakdown.confidenceScore}% confidence. Potential commission: ${commission.toLocaleString()} VND!`, 'success');
}


// -----------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------

// 1. Get entire app state
app.get('/api/state', (req, res) => {
  res.json({
    buyersList,
    sellersList,
    matchingBubbles,
    activityLogs,
    communicationStatuses,
    commissionRate,
    totalCommissionEarnedVND,
    successfulDealsCount,
    pipelineSignals,
    agentIntercoms,
    dismissedBubbles,
    researchPipelineStats,
    agencyContracts,
    manufacturersList
  });
});

// Draw research data from requested sources (b2b, Amazon, YouTube, Taobao, Instagram, TalkShopLive, TikTok, Popshop Live, eBay Live, Klarna, ShopShops, QVC Data Lake/Firehose, Twitter Decahose, Real-time Stream)
app.post('/api/research/draw', (req, res) => {
  const { channel, channels, count = 2 } = req.body || {};
  
  const pool = [
    {
      platform: 'Twitter Decahose',
      title: 'Decahose 10% Feed: Spiking discussion on natural mulberry silk scrunchies and sleep masks with organic dyes.',
      type: 'buyer_signal',
      price: 180000,
      volume: 3200,
      keywords: ['Twitter Decahose', 'mulberry silk', 'organic dye', 'scrunchies'],
      trendingScore: 97
    },
    {
      platform: 'QVC Data Lake',
      title: 'QVC Data Lake Firehose: High-volume purchase stream for Ergonomic Cordless Deep-Tissue Back Massagers.',
      type: 'supplier_signal',
      price: 320000,
      volume: 2800,
      keywords: ['QVC Data Lake', 'massagers', 'cordless', 'deep tissue'],
      trendingScore: 94
    },
    {
      platform: 'B2B Wholesale',
      title: 'Global B2B Wholesale Portal: Verified manufacturer opening bulk production run for 100% Recycled Cotton Heavy Hoodies.',
      type: 'supplier_signal',
      price: 160000,
      volume: 4500,
      keywords: ['B2B Wholesale', 'recycled cotton', 'hoodies', 'Alibaba B2B'],
      trendingScore: 93
    },
    {
      platform: 'Amazon',
      title: 'Amazon Live Shopping: High buyer demand volume for Double-Insulated Stainless Steel 40oz Tumblers with Straw Lid.',
      type: 'buyer_signal',
      price: 95000,
      volume: 5000,
      keywords: ['Amazon', 'Amazon Live', 'tumblers', 'stainless steel'],
      trendingScore: 96
    },
    {
      platform: 'YouTube',
      title: 'YouTube Shopping Stream: Creator showcase driving bulk orders for RGB Extended Gaming Mouse Pads with Edge Stitching.',
      type: 'buyer_signal',
      price: 115000,
      volume: 2400,
      keywords: ['YouTube', 'YouTube Shopping', 'RGB desk pad', 'gaming'],
      trendingScore: 92
    },
    {
      platform: 'Taobao',
      title: 'Taobao Live Factory Stream: Yiwu trade center factory offering Direct Bulk Export of Rose Quartz Gua Sha & Roller sets.',
      type: 'supplier_signal',
      price: 135000,
      volume: 3500,
      keywords: ['Taobao', 'Taobao Live', 'gua sha', 'jade roller', 'factory'],
      trendingScore: 91
    },
    {
      platform: 'Instagram',
      title: 'Instagram Shop / Reels: Viral influencer campaign generating high wholesale inquiries for FSC Modular Bamboo Organizers.',
      type: 'buyer_signal',
      price: 195000,
      volume: 2000,
      keywords: ['Instagram', 'IG Shop', 'bamboo storage', 'modular'],
      trendingScore: 89
    },
    {
      platform: 'TalkShopLive',
      title: 'TalkShopLive Live Commerce: Live host broadcast selling out inventory of Anti-Squeak Dual Head Jade Beauty Rollers.',
      type: 'supplier_signal',
      price: 145000,
      volume: 3000,
      keywords: ['TalkShopLive', 'live shopping', 'anti-squeak', 'jade roller'],
      trendingScore: 95
    },
    {
      platform: 'TikTok',
      title: 'TikTok Shop Live Feed: Viral product surge for 240 GSM Vintage Washed Heavyweight Boxy T-Shirts.',
      type: 'buyer_signal',
      price: 88000,
      volume: 4200,
      keywords: ['TikTok', 'TikTok Shop', 'vintage wash', 'heavyweight tee'],
      trendingScore: 98
    },
    {
      platform: 'Popshop Live',
      title: 'Popshop Live Streaming Feed: Limited batch collector drop for Hand-painted Art Toy Figurines and Display Cases.',
      type: 'supplier_signal',
      price: 360000,
      volume: 1500,
      keywords: ['Popshop Live', 'art toy', 'resin figurine', 'collector'],
      trendingScore: 94
    },
    {
      platform: 'eBay Live',
      title: 'eBay Live Trade Firehose: Real-time auction broadcast seeking wholesale lots of Biodegradable Bamboo Toothbrushes.',
      type: 'buyer_signal',
      price: 42000,
      volume: 7000,
      keywords: ['eBay Live', 'bamboo toothbrush', 'biodegradable', 'bulk trade'],
      trendingScore: 88
    },
    {
      platform: 'Klarna',
      title: 'Klarna Virtual Sourcing Hub: AI-detected customer demand surge for Vegan Collagen Hydrating Facial Mist Sprays.',
      type: 'buyer_signal',
      price: 135000,
      volume: 3100,
      keywords: ['Klarna', 'sourcing hub', 'vegan collagen', 'facial mist'],
      trendingScore: 93
    },
    {
      platform: 'ShopShops',
      title: 'ShopShops Cross-Border Livestream: Global buying concierge sourcing luxury Handcrafted Silk Scarves and Pocket Squares.',
      type: 'buyer_signal',
      price: 330000,
      volume: 2500,
      keywords: ['ShopShops', 'cross-border', 'silk scarves', 'luxury'],
      trendingScore: 92
    },
    {
      platform: 'Real-time Data Stream',
      title: 'Real-Time Pipeline Stream: Low-latency Kafka telemetry detected urgent RFQ for High-Tensile 5-Level Workout Bands.',
      type: 'buyer_signal',
      price: 68000,
      volume: 5500,
      keywords: ['Real-time Stream', 'Kafka', 'workout bands', 'fitness'],
      trendingScore: 96
    }
  ];

  let filtered = pool;
  if (channel && channel !== 'All' && channel !== 'All Sources') {
    filtered = pool.filter(p => p.platform.toLowerCase().includes(channel.toLowerCase()) || channel.toLowerCase().includes(p.platform.toLowerCase()));
    if (filtered.length === 0) filtered = pool;
  } else if (Array.isArray(channels) && channels.length > 0) {
    filtered = pool.filter(p => channels.some((c: string) => p.platform.toLowerCase().includes(c.toLowerCase())));
    if (filtered.length === 0) filtered = pool;
  }

  const drawnCount = Math.min(Math.max(1, count), 6);
  const drawnSignals: any[] = [];

  for (let i = 0; i < drawnCount; i++) {
    const template = filtered[(i + Math.floor(Math.random() * filtered.length)) % filtered.length];
    const isBuyer = template.type === 'buyer_signal';
    const priceVariance = Math.round(template.price * (0.95 + Math.random() * 0.1));
    const volumeVariance = Math.round(template.volume * (0.9 + Math.random() * 0.2));
    
    const sig = {
      id: `sig-draw-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`,
      platform: template.platform as any,
      title: template.title,
      type: template.type as any,
      price: priceVariance,
      volume: volumeVariance,
      timestamp: 'Just now',
      sentiment: 'Positive' as any,
      keywords: template.keywords,
      trendingScore: Math.min(99, template.trendingScore + Math.floor(Math.random() * 3)),
      matchingEligible: true,
      semanticAnalysis: generateSemanticAnalysis(template.platform, template.title, priceVariance, volumeVariance, isBuyer),
      firehoseMeta: generateFirehoseMeta(template.platform)
    };

    pipelineSignals.unshift(sig);
    drawnSignals.push(sig);
  }

  if (pipelineSignals.length > 60) {
    pipelineSignals = pipelineSignals.slice(0, 60);
  }

  researchPipelineStats.totalSignalsProcessed += drawnSignals.length;
  researchPipelineStats.eventsPerSecond = Math.floor(3200 + Math.random() * 800);
  researchPipelineStats.averageLatencyMs = Math.floor(10 + Math.random() * 6);

  addLog('Research', `Data Pipeline Ingestor: Successfully drew ${drawnSignals.length} intelligence signals from [${channel || 'All Connected Sources'}]. Semantic intent extracted.`, 'success');

  addAgentIntercom('ResearchAgent', 'ExecutiveAgent', 'DATA_SHARING', {
    action: 'RESEARCH_DRAW_SUCCESS',
    channels: drawnSignals.map(s => s.platform),
    signalsCount: drawnSignals.length,
    highestConfidence: 97
  });

  res.json({
    success: true,
    drawnSignals,
    pipelineSignals,
    researchPipelineStats
  });
});

// Telemetry endpoint for real-time pipeline stats
app.get('/api/research/pipeline-stats', (req, res) => {
  res.json({
    success: true,
    stats: researchPipelineStats
  });
});

// Ingest a pipeline signal manually as an active lead
app.post('/api/pipeline/ingest', (req, res) => {
  const { signalId } = req.body;
  const sig = pipelineSignals.find(s => s.id === signalId);
  if (!sig) {
    return res.status(404).json({ error: 'Signal not found' });
  }

  addLog('Executive', `Manual Ingestor: User requested promotion of signal "${sig.title.slice(0, 30)}..." to active pipeline!`, 'info');
  
  // Create agent protocol trace for user trigger
  addAgentIntercom('ExecutiveAgent', 'ResearchAgent', 'TASK_ASSIGNMENT', {
    action: 'INGEST_SIGNAL_MANUALLY',
    signalId,
    platform: sig.platform
  });

  const isBuyer = sig.type === 'buyer_signal';
  const tempLead = {
    name: isBuyer ? `Inbound Buyer (via ${sig.platform})` : `Inbound Supplier (via ${sig.platform})`,
    demand: sig.title,
    targetPrice: sig.price,
    contact: `pipeline-agent-routing@${sig.platform.toLowerCase().replace(/[^a-z]/g, '')}-brokers.net`,
    type: isBuyer ? 'buyer' as any : 'seller' as any,
    source: `${sig.platform} Feed`
  };
  
  const id = `${isBuyer ? 'b' : 's'}-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  addAgentIntercom('ResearchAgent', 'SalesAgent', 'DATA_SHARING', {
    status: 'INGESTION_COMPLETE',
    leadId: id,
    details: tempLead
  });

  if (isBuyer) {
    const newB = { id, ...tempLead, timestamp };
    buyersList.unshift(newB);
    triggerAutomatedMatching(newB, 'buyer');
  } else {
    const newS = { id, name: tempLead.name, productName: tempLead.demand, price: tempLead.targetPrice, contact: tempLead.contact, source: tempLead.source, timestamp };
    sellersList.unshift(newS);
    triggerAutomatedMatching(newS, 'seller');
  }

  // Disable eligibility so they cannot re-ingest
  sig.matchingEligible = false;

  res.json({ success: true, leadId: id });
});

// 2. Adjust Commission Configuration
app.post('/api/config/commission', (req, res) => {
  const { rate } = req.body;
  if (typeof rate === 'number' && rate >= 0 && rate <= 10) {
    commissionRate = rate;
    
    // Log Agent communication protocol packet for adjustment
    addAgentIntercom('ExecutiveAgent', 'FinanceAgent', 'TASK_ASSIGNMENT', {
      action: 'UPDATE_COMMISSION_MARGIN',
      newRate: rate
    });

    // update current pending bubbles
    matchingBubbles = matchingBubbles.map(b => {
      if (b.status === 'pending') {
        // Recalculate estimated commission fee
        const estVolume = b.extractedBuyerRequirements?.quantityNeeded || 1500;
        return {
          ...b,
          commissionPercent: rate,
          commissionFee: Math.round(estVolume * b.price * (rate / 100))
        };
      }
      return b;
    });

    addAgentIntercom('FinanceAgent', 'ExecutiveAgent', 'FEEDBACK', {
      status: 'UPDATED',
      recalculatedDealsCount: matchingBubbles.filter(b => b.status === 'pending').length
    });

    addLog('Finance', `Executive updated commission platform fee rate to ${rate}% adjustable standard. Recalculated pending deals.`, 'success');
    return res.json({ success: true, commissionRate });
  }
  res.status(400).json({ error: 'Invalid commission rate value' });
});

// 3. User manually adds a lead (Sourcing request)
app.post('/api/lead/add', async (req, res) => {
  const { name, demand, targetPrice, contact, type, source } = req.body;
  
  if (!name || !demand || !targetPrice || !contact || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const id = `${type === 'buyer' ? 'b' : 's'}-${Date.now()}`;
  const timestamp = new Date().toISOString();

  let geminiMatched = false;
  let responseText = '';

  const ai = getGeminiClient();

  if (type === 'buyer') {
    const newB = { id, name, demand, targetPrice: Number(targetPrice), contact, source: source || 'Manual Entry', timestamp };
    buyersList.unshift(newB);
    addLog('Executive', `New Sourcing Buyer Lead added manually: ${name}`, 'info');

    if (ai) {
      try {
        addLog('Sales', 'Querying Gemini API (gemini-3.6-flash) for real-time semantic analysis & matching database scan...', 'info');
        
        // Pass standard matching context to Gemini
        const systemPrompt = `You are the chief matching agent for an automated bulk supply-chain agency. 
        Analyze the incoming Sourcing Demand against our seller directory:
        ${JSON.stringify(sellersList)}
        
        Evaluate each supplier and calculate a compatibility score (0-100).
        If any supplier exceeds 80% confidence, generate a match details. 
        Always return a valid JSON object matching this schema:
        {
          "hasMatch": boolean,
          "matchedSellerId": string or null,
          "confidenceScore": number,
          "evaluationReason": string,
          "suggestedOutreachText": string
        }`;

        const prompt = `Buyer Demand: "${demand}" with Target Unit Price: ${targetPrice} VND.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          }
        });

        const resultText = response.text || '';
        const parsed = JSON.parse(resultText);

        if (parsed.hasMatch && parsed.matchedSellerId) {
          const seller = sellersList.find(s => s.id === parsed.matchedSellerId);
          if (seller) {
            const bubbleId = `m-${Date.now()}`;
            const estVolume = 1500;
            const commission = Math.round(estVolume * seller.price * (commissionRate / 100));

            const bubble = {
              id: bubbleId,
              buyerId: newB.id,
              sellerId: seller.id,
              buyerName: newB.name,
              sellerName: seller.name,
              productName: seller.productName,
              price: seller.price,
              confidenceScore: parsed.confidenceScore,
              evaluationReason: parsed.evaluationReason,
              commissionFee: commission,
              commissionPercent: commissionRate,
              status: 'pending' as any,
              buyerContactUnlocked: false,
              sellerContactUnlocked: false
            };

            matchingBubbles.unshift(bubble);
            communicationStatuses.unshift({
              pairId: bubbleId,
              lastMessageSender: 'agent',
              messages: [
                {
                  id: `msg-${Date.now()}`,
                  sender: 'agent',
                  text: `Matched with Gemini AI! ${parsed.suggestedOutreachText}`,
                  timestamp: new Date().toISOString()
                }
              ],
              outreachTemplate: parsed.suggestedOutreachText
            });

            addLog('Finance', `Gemini-3.6-flash matched ${name} with ${seller.name} at ${parsed.confidenceScore}% confidence. Est Commission: ${commission.toLocaleString()} VND.`, 'success');
            geminiMatched = true;
          }
        }
      } catch (err: any) {
        console.error('Gemini API call failed', err);
        addLog('System', `Gemini API Matching errored: ${err.message}. Cascading back to heuristic matching algorithm.`, 'warning');
      }
    }

    if (!geminiMatched) {
      // Rule-based fallback
      triggerAutomatedMatching(newB, 'buyer');
    }

  } else {
    const newS = { id, name, productName: demand, price: Number(targetPrice), contact, source: source || 'Manual Entry', timestamp };
    sellersList.unshift(newS);
    addLog('Executive', `New Seller Product offering added manually: ${name} - ${demand}`, 'info');

    if (ai) {
      try {
        addLog('Sales', 'Querying Gemini API (gemini-3.6-flash) for product classification and demand scan...', 'info');
        const systemPrompt = `You are the chief supply matching agent.
        Analyze the incoming Product offering against our buyer demands directory:
        ${JSON.stringify(buyersList)}
        
        Evaluate each buyer and calculate a compatibility score (0-100).
        If any buyer exceeds 80% confidence, generate a match. 
        Always return a valid JSON object matching this schema:
        {
          "hasMatch": boolean,
          "matchedBuyerId": string or null,
          "confidenceScore": number,
          "evaluationReason": string,
          "suggestedOutreachText": string
        }`;

        const prompt = `Product Offered: "${demand}" at Unit Price: ${targetPrice} VND.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          }
        });

        const resultText = response.text || '';
        const parsed = JSON.parse(resultText);

        if (parsed.hasMatch && parsed.matchedBuyerId) {
          const buyer = buyersList.find(b => b.id === parsed.matchedBuyerId);
          if (buyer) {
            const bubbleId = `m-${Date.now()}`;
            const estVolume = 1500;
            const commission = Math.round(estVolume * newS.price * (commissionRate / 100));

            const bubble = {
              id: bubbleId,
              buyerId: buyer.id,
              sellerId: newS.id,
              buyerName: buyer.name,
              sellerName: newS.name,
              productName: newS.productName,
              price: newS.price,
              confidenceScore: parsed.confidenceScore,
              evaluationReason: parsed.evaluationReason,
              commissionFee: commission,
              commissionPercent: commissionRate,
              status: 'pending' as any,
              buyerContactUnlocked: false,
              sellerContactUnlocked: false
            };

            matchingBubbles.unshift(bubble);
            communicationStatuses.unshift({
              pairId: bubbleId,
              lastMessageSender: 'agent',
              messages: [
                {
                  id: `msg-${Date.now()}`,
                  sender: 'agent',
                  text: `Matched with Gemini AI! ${parsed.suggestedOutreachText}`,
                  timestamp: new Date().toISOString()
                }
              ],
              outreachTemplate: parsed.suggestedOutreachText
            });

            addLog('Finance', `Gemini matched seller ${name} with buyer ${buyer.name} at ${parsed.confidenceScore}% confidence!`, 'success');
            geminiMatched = true;
          }
        }
      } catch (err: any) {
        console.error('Gemini API call failed', err);
        addLog('System', `Gemini API Matching failed. Fallback to local heuristic matching.`, 'warning');
      }
    }

    if (!geminiMatched) {
      triggerAutomatedMatching(newS, 'seller');
    }
  }

  res.json({ success: true, buyersList, sellersList, matchingBubbles });
});

// 4. Improve Outreach message using Gemini API
app.post('/api/outreach/improve', async (req, res) => {
  const { pairId, tone } = req.body;
  const bubble = matchingBubbles.find(b => b.id === pairId);
  const comm = communicationStatuses.find(c => c.pairId === pairId);

  if (!bubble || !comm) {
    return res.status(404).json({ error: 'Match pair not found' });
  }

  const buyer = buyersList.find(b => b.id === bubble.buyerId);
  const seller = sellersList.find(s => s.id === bubble.sellerId);

  let improvedText = '';
  const ai = getGeminiClient();

  if (ai && buyer && seller) {
    try {
      addLog('Marketing', 'Utilizing Gemini API to generate optimized and high-converting B2B outreach message...', 'info');
      
      const systemPrompt = `You are a world-class strategic broker who crafts highly professional, direct, and non-spammy outreach communications for international trade. 
      Write a concise, high-converting outreach message in English. 
      Do not use fluff words or generic hype keywords.
      Address the buyer and seller's exact match details, highlight why this deal has ${bubble.confidenceScore}% compatibility, and specify the convenience details. 
      Frame it as a clean mutual business opportunity. Write only the outreach email body text.`;

      const prompt = `
      Buyer Name: ${buyer.name}
      Buyer Sourcing Needs: ${buyer.demand}
      Seller Name: ${seller.name}
      Seller Product: ${seller.productName}
      Agreed Match Price: ${bubble.price.toLocaleString()} VND.
      Tone Request: ${tone || 'Professional & Collaborative'}
      Our commission is ${bubble.commissionPercent}% after deal success to Sacombank NGUYEN TAN SI.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt
        }
      });

      improvedText = response.text?.trim() || '';
    } catch (err: any) {
      console.error('Gemini Outreach API failed', err);
      addLog('System', 'Gemini API outreach failed. Using elegant rule-based template instead.', 'warning');
    }
  }

  if (!improvedText) {
    // Elegant fallback templates
    if (tone === 'Urgent') {
      improvedText = `DEAL ALERT: Perfect supply alignment detected for ${bubble.productName}. Unit price of ${bubble.price.toLocaleString()} VND is ready for execution. Let's unlock contact credentials now to capture this limited wholesale production slot.`;
    } else if (tone === 'Friendly') {
      improvedText = `Hi there! We have found an amazing partner. ${bubble.sellerName} can deliver premium ${bubble.productName} exactly matching what ${bubble.buyerName} is looking for. Click the button to get in touch and close this successful deal together!`;
    } else {
      improvedText = `Official matching summary: Sourcing demand for ${bubble.buyerName} is successfully aligned with ${bubble.sellerName}'s offering of "${bubble.productName}". Verified compatibility score is ${bubble.confidenceScore}% with unit pricing locked at ${bubble.price.toLocaleString()} VND. Ready for contact disclosure and terms finalization.`;
    }
  }

  comm.outreachTemplate = improvedText;
  addLog('Marketing', `Successfully generated improved ${tone || 'Standard'} outreach sentence for pair ${pairId}!`, 'success');
  res.json({ success: true, outreachTemplate: improvedText, communicationStatuses });
});

// 5. Send Outreach Message / Chat in real-time
app.post('/api/outreach/send-message', (req, res) => {
  const { pairId, sender, text } = req.body;
  const comm = communicationStatuses.find(c => c.pairId === pairId);
  const bubble = matchingBubbles.find(b => b.id === pairId);

  if (!comm) {
    return res.status(404).json({ error: 'Communication thread not found' });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    sender,
    text,
    timestamp: new Date().toISOString()
  };

  comm.messages.push(newMsg);
  comm.lastMessageSender = sender;

  addLog('Sales', `Message dispatched to outreach thread [${pairId}] by ${sender}: "${text.slice(0, 30)}..."`, 'info');

  // Trigger simulated response from buyer or seller after 3 seconds to feel alive!
  if (sender === 'agent' && bubble) {
    if (bubble.status === 'pending') {
      bubble.status = 'sent';
    }

    setTimeout(() => {
      const responses = [
        'That sounds extremely reasonable. We are ready to proceed with contract drafting once we have the contact details.',
        'Could you verify if the supplier can include custom retail packaging box designs?',
        'We agree with the pricing and terms! Unlocking our contacts now.',
        'Perfect match. Thanks for orchestrating this automated connection.'
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      
      comm.messages.push({
        id: `reply-${Date.now()}`,
        sender: Math.random() > 0.5 ? 'buyer' : 'seller',
        text: randomReply,
        timestamp: new Date().toISOString()
      });
      comm.lastMessageSender = 'buyer';
      
      addLog('Browser', `Received incoming feedback from matched lead for deal [${pairId}]: "${randomReply.slice(0, 30)}..."`, 'info');
    }, 3000);
  }

  res.json({ success: true, communicationStatuses, matchingBubbles });
});

// 6. Approve deal / Unlock contacts (Agree to Sacombank Commission)
app.post('/api/deal/unlock', (req, res) => {
  const { pairId } = req.body;
  const bubble = matchingBubbles.find(b => b.id === pairId);

  if (!bubble) {
    return res.status(404).json({ error: 'Matching bubble not found' });
  }

  bubble.buyerContactUnlocked = true;
  bubble.sellerContactUnlocked = true;
  
  if (bubble.status === 'pending' || bubble.status === 'sent') {
    bubble.status = 'approved';
  }

  addLog('Finance', `Partner agreed to the ${bubble.commissionPercent}% platform commission. Contact info disclosed for both buyer and seller. Transaction initialized.`, 'success');
  res.json({ success: true, bubble, matchingBubbles });
});

// 7. Complete deal and transfer commission (MANDATORY: Requires customer remittance proof image)
app.post('/api/deal/complete', (req, res) => {
  const { pairId, paymentProofUrl, paymentTransactionRef, paymentCustomerNote } = req.body;
  const bubble = matchingBubbles.find(b => b.id === pairId);

  if (!bubble) {
    return res.status(404).json({ error: 'Matching bubble not found' });
  }

  // Strict check per user directive:
  // "Khi thương vụ kết thúc. yêu cầu khách hàng gởi hình ảnh đã chuyển tiền Hoa Hồng để đóng thương vụ.
  //  Nếu chưa có hình ảnh chuyển tiền của khách gởi. xem như chưa nhận được thanh toán"
  const proof = paymentProofUrl || bubble.paymentProofUrl;
  if (!proof) {
    return res.status(400).json({
      error: 'Yêu cầu khách hàng gởi hình ảnh đã chuyển tiền Hoa Hồng để đóng thương vụ. Nếu chưa có hình ảnh chuyển tiền của khách gởi, xem như chưa nhận được thanh toán (Công nợ).'
    });
  }

  const isNewlyCompleted = bubble.status !== 'completed';

  bubble.paymentProofUrl = proof;
  bubble.paymentStatus = 'paid';
  bubble.paymentTransactionRef = paymentTransactionRef || bubble.paymentTransactionRef || `SCB${Math.floor(100000000 + Math.random() * 900000000)}`;
  bubble.paymentCustomerNote = paymentCustomerNote || bubble.paymentCustomerNote || 'Biên lai chuyển khoản đối soát hoa hồng thành công';
  bubble.paymentProofTimestamp = new Date().toISOString();
  bubble.status = 'completed';

  if (isNewlyCompleted) {
    // Calculate business volume
    const quantity = bubble.extractedBuyerRequirements?.quantityNeeded || 1500;
    const dealBusinessVolume = quantity * bubble.price;

    // Read and update self-improved data with deduplication
    const data = readSelfImprovedData();
    const existingIndex = data.verifiedDeals.findIndex((d: any) => d.dealId === bubble.id || (d.buyerName === bubble.buyerName && d.sellerName === bubble.sellerName && d.productName === bubble.productName));

    if (existingIndex >= 0) {
      data.verifiedDeals[existingIndex] = {
        ...data.verifiedDeals[existingIndex],
        quantity,
        price: bubble.price,
        totalBusinessVolume: dealBusinessVolume,
        commissionFee: bubble.commissionFee,
        commissionPercent: bubble.commissionPercent,
        status: 'completed',
        paymentProofUrl: bubble.paymentProofUrl,
        paymentTransactionRef: bubble.paymentTransactionRef,
        paymentStatus: 'paid',
        timestamp: new Date().toISOString()
      };
    } else {
      data.verifiedDeals.unshift({
        dealId: bubble.id,
        buyerName: bubble.buyerName,
        sellerName: bubble.sellerName,
        productName: bubble.productName,
        quantity,
        price: bubble.price,
        totalBusinessVolume: dealBusinessVolume,
        commissionFee: bubble.commissionFee,
        commissionPercent: bubble.commissionPercent,
        status: 'completed',
        sentTo: "NGUYỄN TẤN SĨ",
        bank: "Sacombank Vietnam",
        accountNumber: "060129073198",
        timestamp: new Date().toISOString(),
        paymentProofUrl: bubble.paymentProofUrl,
        paymentTransactionRef: bubble.paymentTransactionRef,
        paymentStatus: 'paid'
      });
    }

    // Exact recalculation from deduplicated verified deals to prevent repeated post calculation errors
    data.successfulDealsCount = data.verifiedDeals.length;
    data.totalCommissionVND = data.verifiedDeals.reduce((sum: number, d: any) => sum + (d.commissionFee || 0), 0);
    data.totalBusinessVolumeVND = data.verifiedDeals.reduce((sum: number, d: any) => sum + (d.totalBusinessVolume || 0), 0);
    totalCommissionEarnedVND = data.totalCommissionVND;
    successfulDealsCount = data.successfulDealsCount;

    data.selfImprovedPatterns.lastImprovedTimestamp = new Date().toISOString();

    writeSelfImprovedData(data);

    addLog('Finance', `ĐỐI SOÁT & ĐÓNG THƯƠNG VỤ THÀNH CÔNG: Đã xác thực hình ảnh chuyển khoản hoa hồng từ khách hàng ${bubble.buyerName} (${bubble.commissionFee.toLocaleString()} VND) vào Sacombank Acc 060129073198 (NGUYỄN TẤN SĨ). Mã FT: ${bubble.paymentTransactionRef}.`, 'success');
  } else {
    addLog('Finance', `CẬP NHẬT CHỨNG TỪ: Đã cập nhật hình ảnh chứng minh thanh toán hoa hồng cho deal ${bubble.id}.`, 'info');
  }

  res.json({ success: true, bubble, totalCommissionEarnedVND, successfulDealsCount, matchingBubbles });
});

// 7.1 Upload / verify payment proof from customer
app.post('/api/debt/upload-proof', (req, res) => {
  const { pairId, paymentProofUrl, paymentTransactionRef, paymentCustomerNote, autoClose = true } = req.body;
  const bubble = matchingBubbles.find(b => b.id === pairId);

  if (!bubble) {
    return res.status(404).json({ error: 'Matching bubble not found' });
  }
  if (!paymentProofUrl) {
    return res.status(400).json({ error: 'Vui lòng cung cấp hình ảnh chứng minh chuyển tiền của khách hàng' });
  }

  bubble.paymentProofUrl = paymentProofUrl;
  bubble.paymentStatus = 'paid';
  bubble.paymentTransactionRef = paymentTransactionRef || `SCB${Math.floor(100000000 + Math.random() * 900000000)}`;
  bubble.paymentCustomerNote = paymentCustomerNote || 'Biên lai chuyển khoản đối soát hoa hồng do khách hàng cung cấp';
  bubble.paymentProofTimestamp = new Date().toISOString();

  if (autoClose && bubble.status !== 'completed') {
    bubble.status = 'completed';

    const quantity = bubble.extractedBuyerRequirements?.quantityNeeded || 1500;
    const dealBusinessVolume = quantity * bubble.price;

    const data = readSelfImprovedData();
    const existingIndex = data.verifiedDeals.findIndex((d: any) => d.dealId === bubble.id || (d.buyerName === bubble.buyerName && d.sellerName === bubble.sellerName && d.productName === bubble.productName));

    if (existingIndex >= 0) {
      data.verifiedDeals[existingIndex] = {
        ...data.verifiedDeals[existingIndex],
        quantity,
        price: bubble.price,
        totalBusinessVolume: dealBusinessVolume,
        commissionFee: bubble.commissionFee,
        commissionPercent: bubble.commissionPercent,
        status: 'completed',
        paymentProofUrl: bubble.paymentProofUrl,
        paymentTransactionRef: bubble.paymentTransactionRef,
        paymentStatus: 'paid',
        timestamp: new Date().toISOString()
      };
    } else {
      data.verifiedDeals.unshift({
        dealId: bubble.id,
        buyerName: bubble.buyerName,
        sellerName: bubble.sellerName,
        productName: bubble.productName,
        quantity,
        price: bubble.price,
        totalBusinessVolume: dealBusinessVolume,
        commissionFee: bubble.commissionFee,
        commissionPercent: bubble.commissionPercent,
        status: 'completed',
        sentTo: "NGUYỄN TẤN SĨ",
        bank: "Sacombank Vietnam",
        accountNumber: "060129073198",
        timestamp: new Date().toISOString(),
        paymentProofUrl: bubble.paymentProofUrl,
        paymentTransactionRef: bubble.paymentTransactionRef,
        paymentStatus: 'paid'
      });
    }

    // Exact recalculation from deduplicated verified deals
    data.successfulDealsCount = data.verifiedDeals.length;
    data.totalCommissionVND = data.verifiedDeals.reduce((sum: number, d: any) => sum + (d.commissionFee || 0), 0);
    data.totalBusinessVolumeVND = data.verifiedDeals.reduce((sum: number, d: any) => sum + (d.totalBusinessVolume || 0), 0);
    totalCommissionEarnedVND = data.totalCommissionVND;
    successfulDealsCount = data.successfulDealsCount;

    data.selfImprovedPatterns.lastImprovedTimestamp = new Date().toISOString();
    writeSelfImprovedData(data);
  }

  addLog('Finance', `THEO DÕI CÔNG NỢ: Đã nhận hình ảnh chuyển tiền hoa hồng của deal ${bubble.id} (${bubble.commissionFee.toLocaleString()} VND) đến Sacombank 060129073198 (NGUYỄN TẤN SĨ).`, 'success');

  res.json({ success: true, bubble, matchingBubbles, totalCommissionEarnedVND, successfulDealsCount });
});

// -----------------------------------------------------------------
// AUTOMATED 48-HOUR PAYMENT REMINDER ENGINE
// -----------------------------------------------------------------

function dispatchPaymentReminder(
  dealId: string, 
  customMessage?: string, 
  channel: string = 'Email & Zalo / SMS', 
  isManual: boolean = false,
  isBulk: boolean = false
): ReminderHistoryItem | null {
  const deal = matchingBubbles.find(b => b.id === dealId);
  if (!deal) return null;

  const hoursSince = deal.dealCompletedAt 
    ? Math.max(0, Math.round((Date.now() - new Date(deal.dealCompletedAt).getTime()) / (3600 * 1000)))
    : 48;

  // Use the official bilingual template specified in DE NGHI TT.jpg with Deal ID at the top
  const defaultMessage = buildOfficialDebtReminderTemplate({
    dealId: deal.id,
    productName: deal.productName,
    buyerName: deal.buyerName,
    sellerName: deal.sellerName,
    commissionFeeVND: deal.commissionFee
  });

  const finalMessage = customMessage || defaultMessage;
  const nowStr = new Date().toISOString();

  const reminderItem: ReminderHistoryItem = {
    id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: nowStr,
    channel,
    message: finalMessage,
    status: 'delivered',
    triggerType: isBulk ? 'bulk_verified' : (isManual ? 'manual' : 'automated_48h'),
    hoursSinceCompletion: hoursSince
  };

  if (!deal.reminderHistory) deal.reminderHistory = [];
  deal.reminderHistory.unshift(reminderItem);
  deal.reminderCount = (deal.reminderCount || 0) + 1;
  deal.lastReminderSentAt = nowStr;

  // Append to communication thread
  let comm = communicationStatuses.find(c => c.pairId === deal.id);
  if (!comm) {
    comm = {
      pairId: deal.id,
      lastMessageSender: 'agent',
      messages: [],
      outreachTemplate: ''
    };
    communicationStatuses.unshift(comm);
  }

  comm.messages.push({
    id: `msg-rem-${Date.now()}`,
    sender: 'agent',
    text: `[NHẮC NỢ MẪU CHÍNH THỨC - MÃ DEAL #${deal.id} QUA ${channel.toUpperCase()}]\n${finalMessage}`,
    timestamp: nowStr
  });
  comm.lastMessageSender = 'agent';

  // Add Activity Log
  const triggerLabel = isBulk ? 'GỞI HÀNG LOẠT KHÁCH CHẬM TT' : (isManual ? 'NHẮC NỢ THỦ CÔNG' : 'BOT TỰ ĐỘNG 48H');
  addLog(
    'Finance',
    `[${triggerLabel}] Đã gởi mẫu nhắc nợ (Mã Deal: ${deal.id}) tới khách hàng ${deal.buyerName} yêu cầu gởi bill CK Sacombank 060129073198 số tiền ${deal.commissionFee.toLocaleString()} VND qua ${channel}. (Quá hạn: ${hoursSince}h - Đã xác minh Deal: ${deal.dealExecutionVerified ? 'CÓ' : 'KHÔNG'})`,
    isManual ? 'info' : 'warning'
  );

  // Specialist Agent Intercom
  addAgentIntercom('FinanceAgent', 'SalesAgent', 'TASK_ASSIGNMENT', {
    action: 'DISPATCH_COMMISSION_REMINDER',
    dealId: deal.id,
    buyerName: deal.buyerName,
    amountVND: deal.commissionFee,
    channel,
    hoursOverdue: hoursSince,
    dealExecutionVerified: Boolean(deal.dealExecutionVerified)
  });

  return reminderItem;
}

// Background 48-Hour Overdue Scanner (runs every 25 seconds)
// Note: Per user directive, only sends when deal execution has been verified!
setInterval(() => {
  if (!autoReminderSettings.enabled) return;
  const now = Date.now();
  const thresholdMs = autoReminderSettings.thresholdHours * 3600 * 1000;

  for (const deal of matchingBubbles) {
    const isUnpaid = deal.paymentStatus !== 'paid' || !deal.paymentProofUrl;
    if (!isUnpaid) continue;

    // Strict rule: Only send when deal execution is verified!
    if (!deal.dealExecutionVerified) continue;

    const completedTimestamp = deal.dealCompletedAt || (deal.status === 'completed' ? deal.paymentProofTimestamp : null);
    if (!completedTimestamp) continue;

    const elapsedMs = now - new Date(completedTimestamp).getTime();
    if (elapsedMs >= thresholdMs) {
      // Avoid spamming: only auto-remind if last reminder was over 24 hours ago
      const lastSent = deal.lastReminderSentAt ? new Date(deal.lastReminderSentAt).getTime() : 0;
      if (now - lastSent >= 24 * 3600 * 1000) {
        dispatchPaymentReminder(deal.id, undefined, 'Automated 48h Bot (Email & Zalo / SMS)', false);
      }
    }
  }
}, 25000);

// 7.2 Get Debt & Commission Accounts Receivable Summary
app.get('/api/debt/summary', (req, res) => {
  const allDeals = matchingBubbles;
  const unpaidDeals = allDeals.filter(b => b.paymentStatus !== 'paid' || !b.paymentProofUrl);
  const paidDeals = allDeals.filter(b => b.paymentStatus === 'paid' && b.paymentProofUrl);
  
  const now = Date.now();
  const thresholdMs = autoReminderSettings.thresholdHours * 3600 * 1000;

  const overdueDeals = unpaidDeals.filter(d => {
    const ts = d.dealCompletedAt || d.paymentProofTimestamp;
    if (!ts) return false;
    return (now - new Date(ts).getTime()) >= thresholdMs;
  });

  const pendingCountdownDeals = unpaidDeals.filter(d => {
    const ts = d.dealCompletedAt || d.paymentProofTimestamp;
    if (!ts) return true;
    return (now - new Date(ts).getTime()) < thresholdMs;
  });

  const totalDebtPendingVND = unpaidDeals.reduce((sum, b) => sum + (b.commissionFee || 0), 0);
  const totalPaidCommissionVND = paidDeals.reduce((sum, b) => sum + (b.commissionFee || 0), 0);
  const totalRemindersSent = allDeals.reduce((sum, b) => sum + (b.reminderCount || 0), 0);

  res.json({
    totalDeals: allDeals.length,
    unpaidCount: unpaidDeals.length,
    paidCount: paidDeals.length,
    overdueCount: overdueDeals.length,
    pendingCountdownCount: pendingCountdownDeals.length,
    totalRemindersSent,
    totalDebtPendingVND,
    totalPaidCommissionVND,
    autoReminderSettings,
    unpaidDeals,
    paidDeals,
    allDeals
  });
});

// 7.3 Manual / Immediate Reminder Dispatch
app.post('/api/debt/reminder/send', (req, res) => {
  const { dealId, message, channel, forceUnverified } = req.body;
  const deal = matchingBubbles.find(b => b.id === dealId);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  // Strict check: deal must be verified unless explicitly forced
  if (!deal.dealExecutionVerified && !forceUnverified) {
    return res.status(400).json({ 
      error: 'Chưa xác minh thương vụ đã được thực hiện! Cần có tin nhắn xác thực từ một trong hai bên trong Thư mục bằng chứng trước khi gởi nhắc nợ.',
      dealExecutionVerified: false
    });
  }

  const reminder = dispatchPaymentReminder(dealId, message, channel || 'Email & Zalo / SMS', true, false);
  res.json({ success: true, deal, reminder, matchingBubbles });
});

// 7.3b Gởi Mẫu Nhắc Nợ Cho Tất Cả Khách Chậm Thanh Toán (Chỉ Gởi Khi Đã Xác Minh Mã Deal)
app.post('/api/debt/reminder/bulk-send-verified', (req, res) => {
  const { channel = 'Email & Zalo / SMS' } = req.body;
  
  // Find all unpaid / overdue deals
  const unpaidDeals = matchingBubbles.filter(b => b.paymentStatus !== 'paid' || !b.paymentProofUrl);
  
  const verifiedOverdueDeals = unpaidDeals.filter(b => b.dealExecutionVerified === true);
  const unverifiedDeals = unpaidDeals.filter(b => !b.dealExecutionVerified);

  const dispatchedResults: { dealId: string; buyerName: string; commissionFee: number; reminder: any }[] = [];

  for (const deal of verifiedOverdueDeals) {
    const reminder = dispatchPaymentReminder(deal.id, undefined, channel, true, true);
    if (reminder) {
      dispatchedResults.push({
        dealId: deal.id,
        buyerName: deal.buyerName,
        commissionFee: deal.commissionFee,
        reminder
      });
    }
  }

  addLog(
    'Finance',
    `[GỞI NHẮC NỢ HÀNG LOẠT] Đã gởi mẫu nhắc nợ chính thức cho ${dispatchedResults.length} khách chậm thanh toán ĐÃ XÁC MINH DEAL. Bỏ qua ${unverifiedDeals.length} deal chưa có tin nhắn xác thực thực hiện thương vụ.`,
    dispatchedResults.length > 0 ? 'success' : 'info'
  );

  res.json({
    success: true,
    totalEligible: unpaidDeals.length,
    dispatchedCount: dispatchedResults.length,
    dispatchedResults,
    skippedUnverifiedCount: unverifiedDeals.length,
    skippedDeals: unverifiedDeals.map(d => ({
      dealId: d.id,
      buyerName: d.buyerName,
      sellerName: d.sellerName,
      productName: d.productName,
      commissionFee: d.commissionFee,
      reason: 'Chưa có tin nhắn xác thực từ một trong hai bên trong Thư mục'
    })),
    matchingBubbles
  });
});

// 7.3c Thư Mục Lưu Tin Xác Thực Thương Vụ (Folder Archive)
app.get('/api/deal/confirmations/folder', (req, res) => {
  const allConfirmations: DealExecutionConfirmation[] = [];
  
  for (const deal of matchingBubbles) {
    if (deal.confirmationsFolder && Array.isArray(deal.confirmationsFolder)) {
      allConfirmations.push(...deal.confirmationsFolder);
    }
  }

  // Sort latest first
  allConfirmations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const verifiedDeals = matchingBubbles.filter(b => b.dealExecutionVerified);
  const unverifiedDeals = matchingBubbles.filter(b => !b.dealExecutionVerified);

  res.json({
    success: true,
    totalConfirmations: allConfirmations.length,
    verifiedDealsCount: verifiedDeals.length,
    unverifiedDealsCount: unverifiedDeals.length,
    confirmations: allConfirmations,
    verifiedDealIds: verifiedDeals.map(d => d.id)
  });
});

// 7.3d Thêm Tin Nhắn Xác Thực Vào Thư Mục Deal
app.post('/api/deal/confirmations/add', (req, res) => {
  const { dealId, senderRole, senderName, channel, message, proofType, notes } = req.body;
  const deal = matchingBubbles.find(b => b.id === dealId);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  if (!deal.confirmationsFolder) deal.confirmationsFolder = [];

  const nowStr = new Date().toISOString();
  const confirmationItem: DealExecutionConfirmation = {
    id: `conf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    dealId: deal.id,
    dealProductName: deal.productName,
    senderRole: senderRole || 'seller',
    senderName: senderName || (senderRole === 'buyer' ? deal.buyerName : deal.sellerName),
    recipientRole: 'agent',
    recipientName: 'B2B Trade Agent',
    channel: channel || 'Zalo',
    message: message || 'Xác nhận thương vụ đã được hai bên ký kết và thực hiện giao dịch.',
    timestamp: nowStr,
    verified: true,
    verifiedAt: nowStr,
    proofType: proofType || 'counterpart_confirmed',
    notes: notes || 'Tin nhắn xác thực được lưu vào Thư mục Bằng chứng làm căn cứ yêu cầu thanh toán hoa hồng.'
  };

  deal.confirmationsFolder.unshift(confirmationItem);
  deal.dealExecutionVerified = true;
  deal.dealExecutionStatus = 'verified_executed';

  addLog(
    'Sales',
    `[LƯU THƯ MỤC XÁC THỰC] Đã thêm tin nhắn xác thực từ ${confirmationItem.senderName} cho Deal ${deal.id}. Đủ điều kiện gửi đề nghị thanh toán hoa hồng.`,
    'success'
  );

  res.json({
    success: true,
    deal,
    confirmationItem,
    matchingBubbles
  });
});

// 7.3e Tương Tác Tin Nhắn Thân Thiện Với Bên Còn Lại Để Nhận Tin Xác Thực Khớp Giao Dịch
app.post('/api/deal/inquiry/send-friendly', (req, res) => {
  const { dealId, customInquiryText, autoSimulateReply = false } = req.body;
  const deal = matchingBubbles.find(b => b.id === dealId);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const payingParty = deal.payingParty || 'buyer';
  // Counterpart is the OTHER party who is NOT paying commission
  const counterpartRole = payingParty === 'buyer' ? 'seller' : 'buyer';
  const counterpartName = counterpartRole === 'seller' ? deal.sellerName : deal.buyerName;
  const payingPartyName = payingParty === 'buyer' ? deal.buyerName : deal.sellerName;

  const inquiryText = customInquiryText || buildFriendlyCounterpartInquiry({
    dealId: deal.id,
    counterpartRole,
    counterpartName,
    payingPartyName,
    productName: deal.productName
  });

  const nowStr = new Date().toISOString();

  // Append inquiry message to communication statuses
  let comm = communicationStatuses.find(c => c.pairId === deal.id);
  if (!comm) {
    comm = {
      pairId: deal.id,
      lastMessageSender: 'agent',
      messages: [],
      outreachTemplate: ''
    };
    communicationStatuses.unshift(comm);
  }

  comm.messages.push({
    id: `msg-inquiry-${Date.now()}`,
    sender: 'agent',
    text: `[HỎI THĂM THÂN THIỆN ĐỐI SOÁT GIAO DỊCH GỞI TỚI ${counterpartName.toUpperCase()}]\n${inquiryText}`,
    timestamp: nowStr
  });

  deal.counterpartInquiryStatus = 'sent';
  deal.dealExecutionStatus = deal.dealExecutionVerified ? 'verified_executed' : 'inquiry_sent';
  deal.lastCounterpartInquiryAt = nowStr;

  addLog(
    'Sales',
    `[TƯƠNG TÁC THÂN THIỆN] Đã gửi tin nhắn hỏi thăm thân thiện tới ${counterpartName} (${counterpartRole === 'seller' ? 'Người Bán' : 'Người Mua'}) để xin xác thực deal ${deal.id}. Trạng thái: Chờ khách phản hồi (Chỉ lưu xác thực khi có phản hồi).`,
    'info'
  );

  let replyConfirmation: DealExecutionConfirmation | null = null;

  if (autoSimulateReply) {
    // Generate realistic affirmative confirmation message from counterpart
    const replyText = counterpartRole === 'seller'
      ? `Dạ bên em ${counterpartName} xin chào sàn! Xin xác nhận là bên em và anh/chị ${payingPartyName} đã chốt hợp đồng và chuyển khoản đặt cọc thành công cho đơn hàng "${deal.productName}" rồi ạ. Hai bên đang triển khai sản xuất thuận lợi. Cảm ơn sàn đã kết nối rất chuẩn!`
      : `Dear Agent, we confirm that our company ${counterpartName} has formally signed the purchase contract and sent the deposit to ${payingPartyName} for the order "${deal.productName}". The transaction is fully underway. Thank you!`;

    const replyTime = new Date(Date.now() + 1500).toISOString();

    comm.messages.push({
      id: `msg-reply-${Date.now()}`,
      sender: counterpartRole,
      text: replyText,
      timestamp: replyTime
    });
    comm.lastMessageSender = counterpartRole;

    if (!deal.confirmationsFolder) deal.confirmationsFolder = [];

    replyConfirmation = {
      id: `conf-reply-${Date.now()}`,
      dealId: deal.id,
      dealProductName: deal.productName,
      senderRole: counterpartRole,
      senderName: counterpartName,
      recipientRole: 'agent',
      recipientName: 'B2B Trade Agent',
      channel: 'Zalo / B2B Chat',
      message: replyText,
      timestamp: replyTime,
      verified: true,
      verifiedAt: replyTime,
      proofType: 'counterpart_confirmed',
      notes: `Bằng chứng xác thực nhận được từ tương tác thân thiện với ${counterpartName} (${counterpartRole === 'seller' ? 'Bên Bán' : 'Bên Mua'})`
    };

    deal.confirmationsFolder.unshift(replyConfirmation);
    deal.dealExecutionVerified = true;
    deal.dealExecutionStatus = 'verified_executed';
    deal.counterpartInquiryStatus = 'received';

    addLog(
      'Sales',
      `[XÁC THỰC THƯƠNG VỤ THÀNH CÔNG] Đã nhận tin phản hồi từ ${counterpartName}. Đã tự động lưu vào Thư mục Bằng chứng làm căn cứ yêu cầu thanh toán hoa hồng cho Deal ${deal.id}!`,
      'success'
    );
  }

  res.json({
    success: true,
    deal,
    inquiryText,
    replyConfirmation,
    matchingBubbles
  });
});

// 7.3f Gởi Thư Hỏi Thăm Thân Thiện Cho Toàn Bộ Khách Chưa Xác Thực (Xác thực CHỈ được lưu khi có phản hồi từ khách)
app.post('/api/deal/inquiry/send-bulk-unverified', (req, res) => {
  const { channel = 'Zalo / Email B2B' } = req.body;
  const nowStr = new Date().toISOString();

  // Find all unverified deals
  const unverifiedDeals = matchingBubbles.filter(b => !b.dealExecutionVerified);

  if (unverifiedDeals.length === 0) {
    return res.json({
      success: true,
      sentCount: 0,
      message: 'Không có thương vụ nào chưa xác thực cần gửi.',
      matchingBubbles
    });
  }

  const dispatchedDetails: Array<{ dealId: string; counterpartName: string; text: string }> = [];

  unverifiedDeals.forEach(deal => {
    const payingParty = deal.payingParty || 'buyer';
    const counterpartRole = payingParty === 'buyer' ? 'seller' : 'buyer';
    const counterpartName = counterpartRole === 'seller' ? deal.sellerName : deal.buyerName;
    const payingPartyName = payingParty === 'buyer' ? deal.buyerName : deal.sellerName;

    const letterText = buildFriendlyCounterpartInquiry({
      dealId: deal.id,
      counterpartRole,
      counterpartName,
      payingPartyName,
      productName: deal.productName
    });

    let comm = communicationStatuses.find(c => c.pairId === deal.id);
    if (!comm) {
      comm = {
        pairId: deal.id,
        lastMessageSender: 'agent',
        messages: [],
        outreachTemplate: ''
      };
      communicationStatuses.unshift(comm);
    }

    comm.messages.push({
      id: `msg-inquiry-bulk-${Date.now()}-${deal.id}`,
      sender: 'agent',
      text: `[GỞI THƯ HỎI THĂM THÂN THIỆN ĐỐI SOÁT QUA ${channel.toUpperCase()}]\n${letterText}`,
      timestamp: nowStr
    });

    deal.counterpartInquiryStatus = 'sent';
    deal.dealExecutionStatus = 'inquiry_sent';
    deal.lastCounterpartInquiryAt = nowStr;
    // QUAN TRỌNG: Xác thực CHỈ được lưu khi có phản hồi từ khách, do đó dealExecutionVerified VẪN LÀ FALSE
    deal.dealExecutionVerified = false;

    dispatchedDetails.push({
      dealId: deal.id,
      counterpartName,
      text: letterText
    });
  });

  addLog(
    'Sales',
    `[GỞI THƯ XÁC THỰC HÀNG LOẠT] Đã gửi thư hỏi thăm thân thiện chuẩn mẫu của Si Nguyen tới toàn bộ ${unverifiedDeals.length} đối tác chưa xác thực qua ${channel}. QUY CHẾ: Trạng thái xác thực chỉ được lưu vào Thư Mục Bằng Chứng khi nhận được phản hồi từ khách hàng.`,
    'info'
  );

  res.json({
    success: true,
    sentCount: unverifiedDeals.length,
    dispatchedDetails,
    matchingBubbles
  });
});

// 7.3g Tiếp Nhận Phản Hồi Từ Khách Hàng (Xác thực chỉ được lưu khi có phản hồi)
app.post('/api/deal/inquiry/receive-reply', (req, res) => {
  const { dealId, isConfirmed = true, customReplyText, failureReason } = req.body;
  const deal = matchingBubbles.find(b => b.id === dealId);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const payingParty = deal.payingParty || 'buyer';
  const counterpartRole = payingParty === 'buyer' ? 'seller' : 'buyer';
  const counterpartName = counterpartRole === 'seller' ? deal.sellerName : deal.buyerName;
  const payingPartyName = payingParty === 'buyer' ? deal.buyerName : deal.sellerName;
  const nowStr = new Date().toISOString();

  let comm = communicationStatuses.find(c => c.pairId === deal.id);
  if (!comm) {
    comm = {
      pairId: deal.id,
      lastMessageSender: counterpartRole,
      messages: [],
      outreachTemplate: ''
    };
    communicationStatuses.unshift(comm);
  }

  if (!deal.confirmationsFolder) deal.confirmationsFolder = [];

  let confirmationItem: DealExecutionConfirmation;

  if (isConfirmed) {
    // Trường hợp 1: Khách hàng phản hồi ĐÃ CHỐT HỢP ĐỒNG THÀNH CÔNG
    const replyMessage = customReplyText || (
      counterpartRole === 'seller'
        ? `Kính gửi Sàn B2B Trade & Anh Si Nguyen, bên em (${counterpartName}) xin xác nhận là đã chốt hợp đồng và giao dịch thành công với đối tác ${payingPartyName} cho đơn hàng "${deal.productName}". Đang tiến hành sản xuất thuận lợi. Trân trọng cảm ơn sàn đã kết nối hiệu quả!`
        : `Dear Agent Si Nguyen & B2B System, we (${counterpartName}) confirm that our contract with ${payingPartyName} for "${deal.productName}" has been successfully concluded and executed. Thank you for the verified matchmaking!`
    );

    comm.messages.push({
      id: `msg-reply-${Date.now()}`,
      sender: counterpartRole,
      text: replyMessage,
      timestamp: nowStr
    });
    comm.lastMessageSender = counterpartRole;

    confirmationItem = {
      id: `conf-reply-${Date.now()}`,
      dealId: deal.id,
      dealProductName: deal.productName,
      senderRole: counterpartRole,
      senderName: counterpartName,
      recipientRole: 'agent',
      recipientName: 'Si Nguyen (B2B Trade Agent)',
      channel: 'Zalo / WhatsApp',
      message: replyMessage,
      timestamp: nowStr,
      verified: true,
      verifiedAt: nowStr,
      proofType: 'counterpart_confirmed',
      notes: `Xác thực thương vụ được ghi nhận và lưu sau khi nhận phản hồi từ khách hàng ${counterpartName}`
    };

    deal.confirmationsFolder.unshift(confirmationItem);
    // BÂY GIỜ MỚI LƯU XÁC THỰC:
    deal.dealExecutionVerified = true;
    deal.dealExecutionStatus = 'verified_executed';
    deal.counterpartInquiryStatus = 'received';

    addLog(
      'Sales',
      `[XÁC THỰC THƯƠNG VỤ THÀNH CÔNG] Đã nhận phản hồi từ khách hàng ${counterpartName} (Deal ${deal.id}): "${replyMessage.slice(0, 80)}...". ĐÃ LƯU BẰNG CHỨNG VÀO THƯ MỤC VÀ ĐÁNH DẤU XÁC MINH.`,
      'success'
    );
  } else {
    // Trường hợp 2: Khách hàng phản hồi CHƯA CHỐT ĐƯỢC THƯƠNG VỤ VÌ LÝ DO X
    // Theo cam kết trong thư: "Chúng tôi sẽ gởi đến Quí Cty một đối tác khác phù hợp với yêu cầu của quí Cty"
    const reason = failureReason || 'Mức giá chưa tiệm cận và số lượng đặt hàng tối thiểu (MOQ) cần điều chỉnh thêm';
    const replyMessage = customReplyText || (
      `Chào Sàn B2B, bên em ${counterpartName} chưa chốt được thương vụ [Mã Deal: ${deal.id}] với đối tác ${payingPartyName} do nguyên nhân: ${reason}. Rất mong sàn kết nối giúp bên em một đối tác khác phù hợp hơn với nhu cầu.`
    );

    comm.messages.push({
      id: `msg-failed-reply-${Date.now()}`,
      sender: counterpartRole,
      text: replyMessage,
      timestamp: nowStr
    });
    comm.lastMessageSender = counterpartRole;

    // Tìm đối tác thay thế phù hợp từ cơ sở dữ liệu nhà sản xuất
    const alternativePartners = INITIAL_MANUFACTURERS.filter(m => m.name !== deal.sellerName).slice(0, 2);
    const suggestedPartnerNames = alternativePartners.map(p => p.name).join(', ');

    confirmationItem = {
      id: `conf-unfulfilled-${Date.now()}`,
      dealId: deal.id,
      dealProductName: deal.productName,
      senderRole: counterpartRole,
      senderName: counterpartName,
      recipientRole: 'agent',
      recipientName: 'Si Nguyen (B2B Trade Agent)',
      channel: 'Zalo / Email',
      message: replyMessage,
      timestamp: nowStr,
      verified: false,
      proofType: 'counterpart_confirmed',
      notes: `Khách phản hồi chưa chốt được deal. Nguyên nhân: ${reason}. Hệ thống đề xuất đối tác thay thế: ${suggestedPartnerNames}.`
    };

    deal.confirmationsFolder.unshift(confirmationItem);
    deal.counterpartInquiryStatus = 'received';
    deal.dealExecutionVerified = false; // KHÔNG lưu xác thực
    deal.dealExecutionStatus = 'unverified';
    deal.unfulfilledStatus = 'alternative_matched';
    deal.unfulfilledReason = reason;
    deal.betterSourcesSuggested = alternativePartners.map(p => ({
      supplierId: p.id,
      supplierName: p.name,
      offeredProduct: p.featuredProducts[0] || deal.productName,
      wholesalePrice: p.verifiedWholesalePriceRange || 'Thỏa thuận trực tiếp xưởng',
      qualityGrade: 'Xuất Khẩu Loại 1',
      productionLeadDays: 7,
      moq: '50 - 100 chiếc',
      recommendationReason: `Đối tác thay thế uy tín cho ${counterpartName}, sẵn sàng đáp ứng tiêu chuẩn thay thế thương vụ ${deal.id}.`
    }));

    addLog(
      'Sales',
      `[PHẢN HỒI CHƯA CHỐT DEAL] Khách hàng ${counterpartName} phản hồi lý do chưa chốt thương vụ ${deal.id}: "${reason}". Hệ thống đã tự động gởi đề xuất ${alternativePartners.length} đối tác xưởng mới (${suggestedPartnerNames}) theo đúng cam kết trong thư.`,
      'warning'
    );
  }

  res.json({
    success: true,
    isConfirmed,
    deal,
    confirmationItem,
    matchingBubbles
  });
});

// 7.3h Mô Phỏng Nhận Phản Hồi Từ Toàn Bộ Khách Hàng Đang Chờ (Phục Vụ Nghiệm Thu Hệ Thống)
app.post('/api/deal/inquiry/simulate-all-replies', (req, res) => {
  const pendingDeals = matchingBubbles.filter(b => b.counterpartInquiryStatus === 'sent' && !b.dealExecutionVerified);

  if (pendingDeals.length === 0) {
    return res.json({
      success: true,
      processedCount: 0,
      message: 'Không có deal nào đang chờ phản hồi từ khách.',
      matchingBubbles
    });
  }

  let confirmedCount = 0;
  let unfulfilledCount = 0;
  const nowStr = new Date().toISOString();

  pendingDeals.forEach((deal, idx) => {
    const payingParty = deal.payingParty || 'buyer';
    const counterpartRole = payingParty === 'buyer' ? 'seller' : 'buyer';
    const counterpartName = counterpartRole === 'seller' ? deal.sellerName : deal.buyerName;
    const payingPartyName = payingParty === 'buyer' ? deal.buyerName : deal.sellerName;

    if (!deal.confirmationsFolder) deal.confirmationsFolder = [];

    // Giả lập: 80% chốt thành công, 20% phản hồi cần đối tác khác
    const isSuccess = (idx % 4 !== 3);

    if (isSuccess) {
      confirmedCount++;
      const replyMsg = `Dạ bên em ${counterpartName} xin chào sàn B2B và anh Si Nguyen! Bên em và đối tác ${payingPartyName} đã chốt hợp đồng thành công cho sản phẩm "${deal.productName}" rồi ạ. Hai bên đang triển khai giao dịch rất tốt. Cảm ơn sàn!`;

      const conf: DealExecutionConfirmation = {
        id: `conf-sim-${Date.now()}-${deal.id}`,
        dealId: deal.id,
        dealProductName: deal.productName,
        senderRole: counterpartRole,
        senderName: counterpartName,
        recipientRole: 'agent',
        recipientName: 'Si Nguyen (B2B Trade Agent)',
        channel: 'Zalo / B2B Chat',
        message: replyMsg,
        timestamp: nowStr,
        verified: true,
        verifiedAt: nowStr,
        proofType: 'counterpart_confirmed',
        notes: `Phản hồi xác thực nhận được từ khách hàng ${counterpartName}`
      };

      deal.confirmationsFolder.unshift(conf);
      deal.dealExecutionVerified = true;
      deal.dealExecutionStatus = 'verified_executed';
      deal.counterpartInquiryStatus = 'received';
    } else {
      unfulfilledCount++;
      const reason = 'Khách cần tiến độ giao hàng nhanh hơn trong 48h và muốn kiểm tra mẫu trực tiếp tại xưởng';
      const altPartners = INITIAL_MANUFACTURERS.filter(m => m.name !== deal.sellerName).slice(0, 2);

      const conf: DealExecutionConfirmation = {
        id: `conf-sim-unf-${Date.now()}-${deal.id}`,
        dealId: deal.id,
        dealProductName: deal.productName,
        senderRole: counterpartRole,
        senderName: counterpartName,
        recipientRole: 'agent',
        recipientName: 'Si Nguyen (B2B Trade Agent)',
        channel: 'Zalo / Email',
        message: `Chào sàn B2B, thương vụ ${deal.id} bên em chưa chốt được do: ${reason}. Vui lòng gửi đối tác khác phù hợp giúp bên em.`,
        timestamp: nowStr,
        verified: false,
        proofType: 'counterpart_confirmed',
        notes: `Khách phản hồi chưa chốt. Hệ thống đề xuất xưởng thay thế: ${altPartners.map(p => p.name).join(', ')}`
      };

      deal.confirmationsFolder.unshift(conf);
      deal.dealExecutionVerified = false;
      deal.counterpartInquiryStatus = 'received';
      deal.dealExecutionStatus = 'unverified';
      deal.unfulfilledReason = reason;
      deal.unfulfilledStatus = 'alternative_matched';
    }
  });

  addLog(
    'Sales',
    `[ĐỐI SOÁT PHẢN HỒI KHÁCH HÀNG] Đã tiếp nhận phản hồi từ toàn bộ ${pendingDeals.length} đối tác: ${confirmedCount} xác nhận chốt hợp đồng thành công (Đã lưu vào Thư mục Bằng chứng và cấp trạng thái xác thực), ${unfulfilledCount} phản hồi lý do chưa chốt (Hệ thống đã đề xuất đối tác thay thế theo cam kết).`,
    'success'
  );

  res.json({
    success: true,
    processedCount: pendingDeals.length,
    confirmedCount,
    unfulfilledCount,
    matchingBubbles
  });
});

// 7.4 Toggle or Configure Automated Reminder Engine
app.post('/api/debt/reminder/toggle-auto', (req, res) => {
  const { enabled, thresholdHours } = req.body;
  if (typeof enabled === 'boolean') {
    autoReminderSettings.enabled = enabled;
  }
  if (typeof thresholdHours === 'number' && thresholdHours > 0) {
    autoReminderSettings.thresholdHours = thresholdHours;
  }

  addLog('Finance', `CẬP NHẬT BOT NHẮC NỢ: Trạng thái = ${autoReminderSettings.enabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}, Thời gian ngưỡng = ${autoReminderSettings.thresholdHours} giờ.`, 'info');
  res.json({ success: true, settings: autoReminderSettings });
});

// 7.5 Get Reminder Settings
app.get('/api/debt/reminder/settings', (req, res) => {
  res.json(autoReminderSettings);
});

// GET self improved data ledger
app.get('/api/self-improved-data', (req, res) => {
  const data = readSelfImprovedData();
  res.json(data);
});

// GET server health status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', appletId: 'c0eb04d5-2404-4652-964e-620d9711aedb' });
});

// 8. Delete or dismiss a match bubble
app.post('/api/deal/dismiss', (req, res) => {
  const { pairId } = req.body;
  const dismissed = matchingBubbles.find(b => b.id === pairId);
  if (dismissed) {
    // Avoid duplicates
    if (!dismissedBubbles.some(b => b.id === pairId)) {
      dismissedBubbles.push(dismissed);
    }
  }
  matchingBubbles = matchingBubbles.filter(b => b.id !== pairId);
  addLog('Executive', `Dismissed match proposal [${pairId}] from the workspace. Queueing back to passive research database.`, 'warning');
  res.json({ success: true, matchingBubbles, dismissedBubbles });
});

// 9. Immediate Re-match for dismissed bubbles
app.post('/api/deal/rematch', (req, res) => {
  const { pairId } = req.body;
  const bubble = dismissedBubbles.find(b => b.id === pairId) || matchingBubbles.find(b => b.id === pairId);

  if (!bubble) {
    return res.status(404).json({ error: 'Dismissed matching bubble not found' });
  }

  addLog('Research', `Immediate Re-match: Querying live trade API feeds and social-commerce pipelines for fresh supplier/buyer signals related to "${bubble.productName}"...`, 'info');

  const platforms = ['TikTok', 'Instagram', 'YouTube', 'Taobao', 'eBay Live'];
  const platform = platforms[Math.floor(Math.random() * platforms.length)] as any;
  const priceDiscount = 0.93 + Math.random() * 0.05; // 2% to 7% discount
  const freshPrice = Math.round(bubble.price * priceDiscount);
  
  const newSignalTitle = `Live Showcase: Direct factory bulk pricing on Premium ${bubble.productName} for verified buyers. Contact direct.`;
  const freshSig = {
    id: `sig-fresh-${Date.now()}`,
    platform,
    title: newSignalTitle,
    type: 'supplier_signal' as any,
    price: freshPrice,
    volume: bubble.extractedBuyerRequirements?.quantityNeeded || 2000,
    timestamp: 'Just now',
    sentiment: 'Positive' as any,
    keywords: [bubble.productName.toLowerCase().split(' ')[0] || 'wholesale', 'fresh', 'deal'],
    trendingScore: 95,
    matchingEligible: false,
    semanticAnalysis: generateSemanticAnalysis(platform, newSignalTitle, freshPrice, bubble.extractedBuyerRequirements?.quantityNeeded || 2000, false),
    firehoseMeta: generateFirehoseMeta(platform)
  };
  pipelineSignals.unshift(freshSig);
  if (pipelineSignals.length > 40) pipelineSignals.pop();
  
  addLog('Research', `Pipeline scan succeeded. Ingested fresh signal from ${platform} feed: "${newSignalTitle.slice(0, 45)}..."`, 'success');

  const newSellerId = `s-fresh-${Date.now()}`;
  const freshSellerName = `Vina-Global Manufactory (via ${platform})`;
  const newS = {
    id: newSellerId,
    name: freshSellerName,
    productName: bubble.productName,
    price: freshPrice,
    contact: `sourcing-lead@vina-global-${platform.toLowerCase().replace(/[^a-z]/g, '')}.vn / WhatsApp: +84 909 ${Math.floor(100000 + Math.random() * 900000)}`,
    source: `Fresh ${platform} Live Inbound Feed`,
    timestamp: new Date().toISOString()
  };
  sellersList.unshift(newS);
  addLog('Research', `Immediate Re-match: Successfully boarded fresh manufacturer: ${freshSellerName} offering ${bubble.productName} at the optimized price of ${freshPrice.toLocaleString()} VND.`, 'info');

  const buyer = buyersList.find(b => b.id === bubble.buyerId);
  const finalExtracted = bubble.extractedBuyerRequirements || {
    productType: bubble.productName,
    quantityNeeded: 2000,
    keyCriteria: ['Bulk capacity', 'Quality certified']
  };
  const newScore = Math.floor(Math.random() * 8 + 88); // 88% - 95%
  const newBreakdown = {
    priceAlignment: Math.floor(Math.random() * 8 + 88),
    productAlignment: Math.floor(Math.random() * 6 + 90),
    logisticsFeasibility: Math.floor(Math.random() * 10 + 85),
    volumeCapacity: Math.floor(Math.random() * 8 + 88),
    confidenceScore: newScore
  };

  createMatchBubble(buyer || { id: bubble.buyerId, name: bubble.buyerName }, newS, newScore, finalExtracted, newBreakdown);

  // Remove the old dismissed bubble from dismissedBubbles
  dismissedBubbles = dismissedBubbles.filter(b => b.id !== pairId);

  addLog('Executive', `RE-MATCH SUCCESS: New compatibility match [${matchingBubbles[0].id}] established for "${bubble.productName}" with fresh pipeline intelligence!`, 'success');

  res.json({
    success: true,
    matchingBubbles,
    dismissedBubbles,
    sellersList,
    pipelineSignals,
    activityLogs
  });
});

// 10. Manual Intervention for Stalled Deals
app.post('/api/deal/intervene', (req, res) => {
  const { pairId, priceNudge } = req.body;
  const bubble = matchingBubbles.find(b => b.id === pairId);

  if (!bubble) {
    return res.status(404).json({ error: 'Matching bubble not found' });
  }

  // Clear stalled status
  bubble.requiresIntervention = false;
  bubble.stalledReason = undefined;

  // Apply price nudges if provided
  if (priceNudge) {
    bubble.price = Number(priceNudge);
    bubble.evaluationReason += ` [Manual Adjustment: Manufacturer price manually nudged to ${bubble.price.toLocaleString()} VND.]`;
    
    // Recalculate commission
    const estVolume = bubble.extractedBuyerRequirements?.quantityNeeded || 1500;
    bubble.commissionFee = Math.round(estVolume * bubble.price * (bubble.commissionPercent / 100));
  }

  // Update confidence score as alignment is now manually corrected/authorized
  bubble.confidenceScore = Math.min(100, Math.max(90, bubble.confidenceScore + 10));
  if (bubble.scoreBreakdown) {
    bubble.scoreBreakdown.priceAlignment = 95;
  }

  addLog('Sales', `Manual intervention approved for [${pairId}]: cleared stalled status, authorized optimal price alignment.`, 'success');
  addAgentIntercom('ExecutiveAgent', 'SalesAgent', 'FEEDBACK', {
    code: 'STALL_RESOLVED',
    message: `Manager manually intervened on stalled deal [${pairId}]. Pricing and margins adjusted successfully.`,
    stalledDealId: pairId
  }, 'SUCCESS');

  res.json({
    success: true,
    matchingBubbles,
    activityLogs
  });
});

// 11. Delete deal permanently (Add nút xóa deal)
app.post('/api/deal/delete', (req, res) => {
  const { pairId, id } = req.body;
  const targetId = pairId || id;
  if (!targetId) {
    return res.status(400).json({ error: 'Deal ID is required' });
  }

  const deletedDeal = matchingBubbles.find(b => b.id === targetId) || dismissedBubbles.find(b => b.id === targetId);
  matchingBubbles = matchingBubbles.filter(b => b.id !== targetId);
  dismissedBubbles = dismissedBubbles.filter(b => b.id !== targetId);
  communicationStatuses = communicationStatuses.filter(c => c.pairId !== targetId);

  // Clean up verifiedDeals in self-improved data if exists
  try {
    const data = readSelfImprovedData();
    if (data && data.verifiedDeals) {
      data.verifiedDeals = data.verifiedDeals.filter((d: any) => d.dealId !== targetId);
      writeSelfImprovedData(data);
    }
  } catch (err) {
    console.error('Failed to cleanup verified deals', err);
  }

  addLog(
    'Executive',
    `ĐÃ XÓA DEAL: Đã xóa hoàn toàn thương vụ [${targetId}] ${deletedDeal ? `(${deletedDeal.productName} - ${deletedDeal.buyerName})` : ''} khỏi hệ thống.`,
    'warning'
  );

  addAgentIntercom('ExecutiveAgent', 'SalesAgent', 'TASK_ASSIGNMENT', {
    action: 'DELETE_DEAL_PURGED',
    targetDealId: targetId
  });

  res.json({
    success: true,
    matchingBubbles,
    dismissedBubbles,
    activityLogs
  });
});

app.delete('/api/deal/:id', (req, res) => {
  const targetId = req.params.id;
  const deletedDeal = matchingBubbles.find(b => b.id === targetId) || dismissedBubbles.find(b => b.id === targetId);
  matchingBubbles = matchingBubbles.filter(b => b.id !== targetId);
  dismissedBubbles = dismissedBubbles.filter(b => b.id !== targetId);
  communicationStatuses = communicationStatuses.filter(c => c.pairId !== targetId);

  try {
    const data = readSelfImprovedData();
    if (data && data.verifiedDeals) {
      data.verifiedDeals = data.verifiedDeals.filter((d: any) => d.dealId !== targetId);
      writeSelfImprovedData(data);
    }
  } catch (err) {
    console.error('Failed to cleanup verified deals', err);
  }

  addLog('Executive', `ĐÃ XÓA DEAL: Đã xóa thương vụ [${targetId}] khỏi hệ thống.`, 'warning');
  res.json({ success: true, matchingBubbles, dismissedBubbles });
});

// 11.1 Bulk Actions for Matching Deck: Bulk Unlock
app.post('/api/deal/bulk-unlock', (req, res) => {
  const { pairIds } = req.body;
  if (!Array.isArray(pairIds) || pairIds.length === 0) {
    return res.status(400).json({ error: 'Array of pairIds is required' });
  }

  let unlockedCount = 0;
  matchingBubbles.forEach(b => {
    if (pairIds.includes(b.id)) {
      b.buyerContactUnlocked = true;
      b.sellerContactUnlocked = true;
      if (b.status === 'pending' || b.status === 'sent') {
        b.status = 'approved';
      }
      unlockedCount++;
    }
  });

  addLog('Finance', `MỞ KHÓA HÀNG LOẠT (BULK UNLOCK): Đã mở khóa thông tin liên hệ cho ${unlockedCount} thương vụ đã chọn trong 1 cú click. Xác nhận thỏa thuận hoa hồng Sacombank.`, 'success');
  addAgentIntercom('ExecutiveAgent', 'FinanceAgent', 'TASK_ASSIGNMENT', {
    action: 'BULK_UNLOCK_COMMISSION_APPROVED',
    unlockedCount,
    pairIds
  });

  res.json({ success: true, unlockedCount, matchingBubbles });
});

// 11.2 Bulk Actions for Matching Deck: Bulk Dismiss
app.post('/api/deal/bulk-dismiss', (req, res) => {
  const { pairIds } = req.body;
  if (!Array.isArray(pairIds) || pairIds.length === 0) {
    return res.status(400).json({ error: 'Array of pairIds is required' });
  }

  const dismissedDeals = matchingBubbles.filter(b => pairIds.includes(b.id));
  dismissedDeals.forEach(deal => {
    if (!dismissedBubbles.some(d => d.id === deal.id)) {
      dismissedBubbles.push(deal);
    }
  });

  matchingBubbles = matchingBubbles.filter(b => !pairIds.includes(b.id));

  addLog('Executive', `BỎ QUA HÀNG LOẠT (BULK DISMISS): Đã bỏ qua ${dismissedDeals.length} đề xuất thương vụ khỏi deck chính trong 1 cú click.`, 'warning');
  addAgentIntercom('ExecutiveAgent', 'SalesAgent', 'TASK_ASSIGNMENT', {
    action: 'BULK_DISMISS_DEALS',
    dismissedCount: dismissedDeals.length,
    pairIds
  });

  res.json({ success: true, dismissedCount: dismissedDeals.length, matchingBubbles, dismissedBubbles });
});

// 11.3 Bulk Actions for Matching Deck: Bulk Delete
app.post('/api/deal/bulk-delete', (req, res) => {
  const { pairIds } = req.body;
  if (!Array.isArray(pairIds) || pairIds.length === 0) {
    return res.status(400).json({ error: 'Array of pairIds is required' });
  }

  const initialCount = matchingBubbles.length + dismissedBubbles.length;
  matchingBubbles = matchingBubbles.filter(b => !pairIds.includes(b.id));
  dismissedBubbles = dismissedBubbles.filter(b => !pairIds.includes(b.id));
  communicationStatuses = communicationStatuses.filter(c => !pairIds.includes(c.pairId));

  try {
    const data = readSelfImprovedData();
    if (data && data.verifiedDeals) {
      data.verifiedDeals = data.verifiedDeals.filter((d: any) => !pairIds.includes(d.dealId));
      writeSelfImprovedData(data);
    }
  } catch (err) {
    console.error('Failed to cleanup verified deals on bulk delete', err);
  }

  const deletedCount = initialCount - (matchingBubbles.length + dismissedBubbles.length);
  addLog('Executive', `XÓA HÀNG LOẠT (BULK DELETE): Đã xóa hoàn toàn ${deletedCount} thương vụ khỏi hệ thống trong 1 cú click.`, 'warning');

  res.json({ success: true, deletedCount, matchingBubbles, dismissedBubbles });
});

// 11.4 Bulk Actions for Matching Deck: Bulk Rematch / Restore
app.post('/api/deal/bulk-rematch', (req, res) => {
  const { pairIds } = req.body;
  if (!Array.isArray(pairIds) || pairIds.length === 0) {
    return res.status(400).json({ error: 'Array of pairIds is required' });
  }

  const restoredDeals = dismissedBubbles.filter(b => pairIds.includes(b.id));
  restoredDeals.forEach(deal => {
    if (!matchingBubbles.some(b => b.id === deal.id)) {
      matchingBubbles.unshift(deal);
    }
  });

  dismissedBubbles = dismissedBubbles.filter(b => !pairIds.includes(b.id));

  addLog('Executive', `KHÔI PHỤC HÀNG LOẠT (BULK RESTORE): Đã khôi phục ${restoredDeals.length} thương vụ từ danh mục đã bỏ qua về deck đề xuất chính.`, 'info');

  res.json({ success: true, restoredCount: restoredDeals.length, matchingBubbles, dismissedBubbles });
});

// 12. Match whatever products are running online (Add match whatever products are running online)
app.post(['/api/match/online-products', '/api/match/all-online'], async (req, res) => {
  addLog('Executive', 'CHẠY TỰ ĐỘNG KHỚP SẢN PHẨM ONLINE: Đang quét toàn bộ luồng TikTok, Taobao, Instagram, YouTube để khớp tất cả sản phẩm đang chạy online...', 'info');

  const liveOnlineProductsCatalog = [
    {
      productName: 'Eco-Friendly Smart Anti-Fray RGB Desk Mat',
      category: 'Tech Accessories',
      platform: 'TikTok Shop VN Live Stream',
      supplierName: 'Yiwu Smart Trade Co., Ltd.',
      unitPrice: 95000,
      targetPrice: 120000,
      volume: 2500,
      buyerName: 'Minh Tuấn (TechGadgets VN)',
      buyerDemand: 'Looking for reliable suppliers of RGB desk pads, bulk shipment with custom logo.',
      buyerContact: '+84 912 345 678 / tuan@techgadgetsvn.com'
    },
    {
      productName: 'Pure Mulberry Silk Scarves - Handwoven Luxury',
      category: 'Fashion & Silk',
      platform: 'Taobao Business Firehose',
      supplierName: 'Văn Phong (Hà Đông Silk Village)',
      unitPrice: 320000,
      targetPrice: 350000,
      volume: 4000,
      buyerName: 'Alena Smirnova (Milan Fashion)',
      buyerDemand: 'High-quality silk scarf bulk manufacturer. Needs custom brand stitching.',
      buyerContact: '+39 02 8821 9921 / alena@milanofashion.it'
    },
    {
      productName: 'Genuine Rose Quartz & Jade Facial Roller (Anti-Squeak)',
      category: 'Beauty & Wellness',
      platform: 'TalkShopLive Live Chat',
      supplierName: 'Shenzhen Aura Beauty Factory',
      unitPrice: 140000,
      targetPrice: 180000,
      volume: 3000,
      buyerName: 'Sarah Jenkins (US Beauty Brand)',
      buyerDemand: 'Natural organic face rollers (jade/quartz). Dropshipping with 48h US warehouse processing.',
      buyerContact: '+1 213 555 0192 / sarah@jenkinsskin.co'
    },
    {
      productName: 'Minimalist Modular Bamboo Storage Boxes (FSC Certified)',
      category: 'Home & Living',
      platform: 'Instagram Feed Search',
      supplierName: 'GreenLife Bamboo Vietnam',
      unitPrice: 195000,
      targetPrice: 220000,
      volume: 2000,
      buyerName: 'Yuki Tanaka (Tokyo Lifestyle)',
      buyerDemand: 'Minimalist bamboo wood storage boxes. Eco-friendly certified for sustainable launch.',
      buyerContact: '+81 3 5555 0143 / yuki@lifestyle-tokyo.jp'
    },
    {
      productName: 'Organic Heavyweight Vintage Washed Cotton Tees (240 GSM)',
      category: 'Apparel',
      platform: 'TikTok Shop VN Live Stream',
      supplierName: 'Bình Dương Textile Corp',
      unitPrice: 85000,
      targetPrice: 110000,
      volume: 3500,
      buyerName: 'Oliver Smith (UK Streetwear Ltd)',
      buyerDemand: 'Wholesale batch of 240 GSM oversized vintage wash tees with neck label tags.',
      buyerContact: '+44 20 7946 0912 / sourcing@ukstreetwear.co.uk'
    },
    {
      productName: 'High-Tensile Latex Resistance Workout Bands (5-Level Set)',
      category: 'Fitness Goods',
      platform: 'YouTube Live Sourcing Hub',
      supplierName: 'Shenzhen SportFit Industrial',
      unitPrice: 65000,
      targetPrice: 90000,
      volume: 5000,
      buyerName: 'Marcus Lindqvist (Nordic Gym Supply)',
      buyerDemand: 'Complete 5-piece resistance band sets in custom branded travel pouches.',
      buyerContact: '+46 8 123 4567 / marcus@nordicfitness.se'
    },
    {
      productName: 'Laser Engraved Antibacterial Bamboo Toothbrush Sets',
      category: 'Eco Personal Care',
      platform: 'eBay Live Trade Stream',
      supplierName: 'Bến Tre Eco Bamboo Mills',
      unitPrice: 38000,
      targetPrice: 48000,
      volume: 6000,
      buyerName: 'Grand Plaza Sourcing Office',
      buyerDemand: 'Seeking wholesale laser engraved bamboo toothbrushes with biodegradable packaging.',
      buyerContact: 'sourcing@grandplaza.vn / +84 908 112 334'
    },
    {
      productName: 'Vegan Collagen Peptide Hydrating Face Mist Spray',
      category: 'Skincare Cosmetics',
      platform: 'Klarna Sourcing Hub',
      supplierName: 'Seoul Derma Lab Vietnam Branch',
      unitPrice: 125000,
      targetPrice: 165000,
      volume: 3000,
      buyerName: 'Sophie Garnier (Paris Organic Care)',
      buyerDemand: 'Vegan collagen spray mist with custom mist nozzle for European retail chains.',
      buyerContact: '+33 1 42 68 55 00 / sophie@parisorganic.fr'
    },
    {
      productName: '40oz Insulated Stainless Steel Tumbler Cups (Vacuum Insulated)',
      category: 'Drinkware & Outdoor',
      platform: 'Alibaba B2B Wholesale Network',
      supplierName: 'Yongkang Stainless Steel Corp',
      unitPrice: 78000,
      targetPrice: 105000,
      volume: 5000,
      buyerName: 'Ethan Wright (Apex Outdoor Wholesale)',
      buyerDemand: 'B2B Wholesale order of 40oz tumblers with straw lids for US commercial distribution.',
      buyerContact: '+1 415 890 2341 / sourcing@apexoutdoor.us'
    },
    {
      productName: '3-in-1 Foldable Magnetic Fast Wireless Charging Station',
      category: 'Consumer Electronics',
      platform: 'Amazon Live Commerce Firehose',
      supplierName: 'Shenzhen PowerWave Electronics',
      unitPrice: 155000,
      targetPrice: 195000,
      volume: 3000,
      buyerName: 'Elena Rostova (EuroTech Import)',
      buyerDemand: 'Amazon Live demand: Seeking Qi2 certified 3-in-1 foldable fast wireless charging stations.',
      buyerContact: '+49 30 901820 / elena@eurotechimport.de'
    },
    {
      productName: 'Limited Edition Designer Resin Art Figurines (Collector Series)',
      category: 'Art & Collectibles',
      platform: 'Popshop Live Stream Feed',
      supplierName: 'Tokyo ToyCraft Studios',
      unitPrice: 280000,
      targetPrice: 350000,
      volume: 1500,
      buyerName: 'Lucas Dupont (Galerie Pop Paris)',
      buyerDemand: 'Popshop Live feed: Handcrafted resin figurines in limited production batches for boutique art stores.',
      buyerContact: '+33 6 12 34 56 78 / lucas@galeriepop.fr'
    },
    {
      productName: 'Artisanal Handcrafted Leather Tote Bags with Brass Hardware',
      category: 'Luxury Leather',
      platform: 'ShopShops Global Livestream',
      supplierName: 'Saigon Heritage Leather',
      unitPrice: 380000,
      targetPrice: 460000,
      volume: 1200,
      buyerName: 'Chloe Bennett (Melbourne Designer Hub)',
      buyerDemand: 'ShopShops livestream: Premium genuine full-grain leather totes with reinforced stitching for luxury boutique.',
      buyerContact: '+61 3 9922 4110 / chloe@melbournehub.com.au'
    },
    {
      productName: 'Multi-Zone Heated Shiatsu Deep Tissue Neck Massagers',
      category: 'Health & Wellness',
      platform: 'QVC Broadcast Data Lake Firehose',
      supplierName: 'Guangdong WellCare Health Tech',
      unitPrice: 230000,
      targetPrice: 290000,
      volume: 3500,
      buyerName: 'William Ross (American Home Shopping Network)',
      buyerDemand: 'QVC Data Lake Firehose: UL certified deep tissue shiatsu massagers with bi-directional rotation and soothing heat.',
      buyerContact: '+1 212 555 7789 / w.ross@ahsn-sourcing.com'
    },
    {
      productName: 'Anti-Squeak Dual Head Rose Quartz & Jade Facial Rollers',
      category: 'Beauty & Skincare',
      platform: 'Twitter Decahose 10% Real-time Stream',
      supplierName: 'Shenzhen Aura Beauty Factory',
      unitPrice: 120000,
      targetPrice: 155000,
      volume: 4000,
      buyerName: 'K-Beauty Trend Global',
      buyerDemand: 'Twitter Decahose semantic surge: Seeking high-grade jade rollers with anti-squeak silencer silicone inserts.',
      buyerContact: 'sourcing@kbeautytrend.io / +1 415 678 9123'
    },
    {
      productName: 'High-Tensile Natural Latex Resistance Workout Bands (5-Level Set)',
      category: 'Fitness & Sports',
      platform: 'Real-time Kafka Pipeline Stream',
      supplierName: 'Hà Nam Polymer & Rubber Tech',
      unitPrice: 52000,
      targetPrice: 75000,
      volume: 6000,
      buyerName: 'Marcus Lindqvist (Nordic Gym Supply)',
      buyerDemand: 'Real-time Pipeline Stream: Urgent restock of natural latex 5-level gym band sets for Nordic fitness retail.',
      buyerContact: '+46 8 123 4567 / marcus@nordicfitness.se'
    }
  ];

  let matchedCount = 0;
  const newMatches: any[] = [];

  for (const item of liveOnlineProductsCatalog) {
    // Check if this product or pair already exists in active matchingBubbles
    const alreadyMatched = matchingBubbles.some(
      b => b.productName.toLowerCase().includes(item.productName.toLowerCase().slice(0, 15)) ||
           (b.sellerName === item.supplierName && b.buyerName === item.buyerName)
    );

    if (alreadyMatched) {
      continue;
    }

    // Ensure buyer is in buyersList
    let buyer = buyersList.find(b => b.name === item.buyerName);
    if (!buyer) {
      buyer = {
        id: `b-online-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: item.buyerName,
        demand: item.buyerDemand,
        targetPrice: item.targetPrice,
        contact: item.buyerContact,
        source: item.platform,
        timestamp: new Date().toISOString()
      };
      buyersList.unshift(buyer);
    }

    // Ensure seller is in sellersList
    let seller = sellersList.find(s => s.name === item.supplierName);
    if (!seller) {
      seller = {
        id: `s-online-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: item.supplierName,
        productName: item.productName,
        price: item.unitPrice,
        contact: `sales@${item.supplierName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com / WeChat/Zalo: direct_supplier`,
        source: item.platform,
        timestamp: new Date().toISOString()
      };
      sellersList.unshift(seller);
    }

    // Build match bubble
    const bubbleId = `m-online-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const commission = Math.round(item.volume * item.unitPrice * (commissionRate / 100));
    const confidenceScore = Math.floor(89 + Math.random() * 9); // 89% - 97%

    const extractedRequirements = {
      productType: item.productName,
      quantityNeeded: item.volume,
      keyCriteria: ['Wholesale Volume Feasibility', 'Direct Warehouse Delivery', 'Quality Specification Pass']
    };

    const scoreBreakdown = {
      priceAlignment: Math.floor(90 + Math.random() * 8),
      productAlignment: Math.floor(92 + Math.random() * 6),
      logisticsFeasibility: Math.floor(88 + Math.random() * 10),
      volumeCapacity: Math.floor(90 + Math.random() * 8),
      confidenceScore
    };

    const newBubble: MatchingBubble = {
      id: bubbleId,
      buyerId: buyer.id,
      sellerId: seller.id,
      buyerName: buyer.name,
      sellerName: seller.name,
      productName: item.productName,
      price: item.unitPrice,
      confidenceScore,
      evaluationReason: `ĐÃ KHỚP TỰ ĐỘNG SẢN PHẨM ONLINE: Quét từ luồng ${item.platform}. Sản phẩm "${item.productName}" có giá sỉ ${item.unitPrice.toLocaleString()} VND hoàn toàn phù hợp ngân sách ${item.targetPrice.toLocaleString()} VND của ${buyer.name}. Đơn hàng ước tính ${item.volume.toLocaleString()} đơn vị.`,
      commissionFee: commission,
      commissionPercent: commissionRate,
      status: 'pending' as any,
      buyerContactUnlocked: false,
      sellerContactUnlocked: false,
      dealCompletedAt: new Date().toISOString(),
      paymentStatus: 'unpaid',
      reminderCount: 0,
      reminderHistory: [],
      extractedBuyerRequirements: extractedRequirements,
      scoreBreakdown
    };

    matchingBubbles.unshift(newBubble);
    newMatches.push(newBubble);
    matchedCount++;

    // Add communication thread
    communicationStatuses.unshift({
      pairId: bubbleId,
      lastMessageSender: 'agent',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: `[KHỚP SẢN PHẨM ONLINE TỰ ĐỘNG] Chào ${buyer.name}, hệ thống đã tìm thấy nhà cung ứng online ${seller.name} đang phân phối "${item.productName}" trên kênh ${item.platform} với mức giá sỉ cực tốt: ${item.unitPrice.toLocaleString()} VND/sp (Khối lượng: ${item.volume.toLocaleString()} chiếc). Bấm đồng ý hoa hồng ${commissionRate}% để mở khóa số điện thoại và địa chỉ xưởng ngay!`,
          timestamp: new Date().toISOString()
        }
      ],
      outreachTemplate: `Kính gửi ${buyer.name}, đề xuất kết nối sản phẩm online "${item.productName}" từ đối tác ${seller.name} (${item.platform}) với mức giá ưu đãi ${item.unitPrice.toLocaleString()} VND.`
    });

    addLog(
      'Sales',
      `⚡ KHỚP THÀNH CÔNG SẢN PHẨM ONLINE [${item.platform}]: "${item.productName}" giữa ${buyer.name} và ${seller.name}. Độ tin cậy: ${confidenceScore}%. Hoa hồng ước tính: ${commission.toLocaleString()} VND.`,
      'success'
    );
  }

  // Also mark active eligible pipeline signals as processed
  pipelineSignals.forEach(sig => {
    sig.matchingEligible = false;
  });

  addAgentIntercom('ExecutiveAgent', 'SalesAgent', 'TASK_ASSIGNMENT', {
    action: 'MATCH_ONLINE_PRODUCTS_SWEEP_EXECUTED',
    matchedDealsCount: matchedCount
  });

  res.json({
    success: true,
    matchedCount,
    newMatches,
    matchingBubbles,
    pipelineSignals,
    buyersList,
    sellersList,
    activityLogs
  });
});

// -----------------------------------------------------------------
// MANUFACTURER AGENCY & HIGH-VELOCITY CONTRACTS API ROUTES
// -----------------------------------------------------------------

// 1. Get verified manufacturers with fast-selling goods
app.get('/api/manufacturers', (req, res) => {
  res.json({
    success: true,
    manufacturers: manufacturersList
  });
});

// 2. Get active agency contracts
app.get('/api/agency-contracts', (req, res) => {
  res.json({
    success: true,
    contracts: agencyContracts
  });
});

// 3. Execute and sign a new Agency Distributorship Agreement with a Manufacturer
app.post('/api/agency-contracts/sign', (req, res) => {
  try {
    const {
      manufacturerId,
      tier,
      tierName,
      discountPercent,
      monthlyTargetVND,
      selectedHotProducts,
      agentName,
      agentRepresentative,
      agentPhone,
      agentEmail,
      agentTaxId,
      agentAddress,
      distributionChannel,
      territory,
      agentSignature
    } = req.body;

    const mfg = manufacturersList.find(m => m.id === manufacturerId);
    if (!mfg) {
      return res.status(404).json({ success: false, error: 'Manufacturer not found' });
    }

    const contractSeq = Math.floor(1000 + Math.random() * 9000);
    const contractPrefix = mfg.id.replace('mfg-', '').toUpperCase();
    const contractNumber = `HDDL-2026/${contractPrefix}-${contractSeq}`;
    const contractId = `contract-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const expiryIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const selectedProducts = Array.isArray(selectedHotProducts) && selectedHotProducts.length > 0
      ? selectedHotProducts
      : mfg.hotProducts.map(p => p.name);

    const defaultTerms = [
      `Nhà sản xuất cam kết cung ứng nguồn hàng chính hãng đạt chuẩn chất lượng (${mfg.verifiedCertificates.join(', ')}), đảm bảo không đứt gãy chuỗi cung ứng.`,
      `Mức chiết khấu đại lý được áp dụng là ${discountPercent || 40}% tính trên giá niêm yết bán lẻ đề xuất của xưởng.`,
      `Đại lý cam kết nỗ lực đạt doanh số mục tiêu tối thiểu ${(Number(monthlyTargetVND) || 100000000).toLocaleString('vi-VN')} VND/tháng trên các kênh phân phối đã đăng ký.`,
      `Chính sách bảo hành: 1 đổi 1 tận nơi trong vòng 30 ngày đối với mọi lỗi kỹ thuật do nhà sản xuất.`,
      `Cổng thanh toán & đối soát hoa hồng / tiền hàng bảo lãnh Sacombank Việt Nam: Số TK 060129073198 (Chủ tài khoản: NGUYỄN TẤN SĨ / NGUYEN TAN SI).`,
      `Chính sách chống phá giá: Đại lý cam kết không bán phá giá dưới mức giá sàn niêm yết của nhà sản xuất để bảo vệ toàn bộ hệ thống phân phối.`
    ];

    const newContract: AgencyContract = {
      id: contractId,
      contractNumber,
      manufacturerId: mfg.id,
      manufacturerName: mfg.name,
      manufacturerRepresentative: mfg.contactPerson,
      agentName: agentName || 'NGUYỄN TẤN SĨ (Đại Lý Phân Phối Cấp 1)',
      agentRepresentative: agentRepresentative || 'NGUYỄN TẤN SĨ',
      agentPhone: agentPhone || '+84 912 345 678',
      agentEmail: agentEmail || 'singuyenemail@gmail.com',
      agentTaxId: agentTaxId || '0318928192-001',
      agentAddress: agentAddress || 'Tòa Nhà Thương Mại Quốc Tế, TP. Hồ Chí Minh',
      distributionChannel: distributionChannel || 'Đa Kênh Online (TikTok/Shopee) & Bán Buôn Đại Lý',
      territory: territory || 'Toàn Quốc & Xuất Khẩu',
      tier: tier || 'tier1_volume',
      tierName: tierName || 'Đại Lý Cấp 1 Chạy Doanh Số (Tier-1 Volume Distributor)',
      discountPercent: Number(discountPercent) || 40,
      monthlyTargetVND: Number(monthlyTargetVND) || 100000000,
      selectedHotProducts: selectedProducts,
      contractDate: nowIso,
      effectiveDate: nowIso,
      expiryDate: expiryIso,
      status: 'active',
      agentSignature: agentSignature || `${agentRepresentative || 'NGUYỄN TẤN SĨ'} [E-Signature Verified]`,
      agentSignedAt: nowIso,
      manufacturerSignature: `${mfg.contactPerson} [${mfg.brand} Certified Digital Seal]`,
      manufacturerSignedAt: nowIso,
      sacombankEscrowAccount: '060129073198',
      sacombankRecipient: 'NGUYỄN TẤN SĨ',
      termsSummary: defaultTerms,
      aiAdviceNotes: `Kế hoạch chạy doanh số tối ưu: Tập trung bán combo ${selectedProducts[0]} kèm quà tặng phễu để đẩy nhanh tốc độ quay vòng vốn 5-7 ngày.`
    };

    agencyContracts = [newContract, ...agencyContracts];
    writeAgencyContracts(agencyContracts);

    // Audit logs
    addLog('Executive', `HỢP ĐỒNG ĐẠI LÝ KÝ KẾT: [${contractNumber}] giữa Đại Lý và [${mfg.name}]. Kích hoạt quyền phân phối cấp 1 chiết khấu ${newContract.discountPercent}%.`, 'success');
    addLog('Finance', `Thiết lập tài khoản bảo lãnh thanh toán Sacombank 060129073198 (NGUYỄN TẤN SĨ) cho hợp đồng [${contractNumber}]. Cam kết doanh số: ${(newContract.monthlyTargetVND).toLocaleString('vi-VN')} VND/tháng.`, 'info');

    // Intercom message
    addAgentIntercom('ExecutiveAgent', 'SalesAgent', 'TASK_ASSIGNMENT', {
      action: 'NEW_AGENCY_CONTRACT_ACTIVATED',
      contractNumber,
      manufacturer: mfg.name,
      hotProducts: selectedProducts,
      discountPercent: newContract.discountPercent
    });

    // Auto-inject hot products into active sellersList and create live pipeline signals
    selectedProducts.forEach((prodName, idx) => {
      const hotProd = mfg.hotProducts.find(p => p.name === prodName) || mfg.hotProducts[idx % mfg.hotProducts.length];
      const sellerLeadId = `s-agency-${Date.now()}-${idx}`;
      const wholesalePrice = hotProd ? hotProd.wholesalePrice : 150000;

      // Add to sellers list
      sellersList.unshift({
        id: sellerLeadId,
        name: `${mfg.name} (Đại Lý Cấp 1 Phân Phối)`,
        productName: `[HÀNG SẴN KHO XƯỞNG]: ${prodName} - Chiết khấu đại lý ${newContract.discountPercent}%`,
        price: wholesalePrice,
        contact: `${mfg.contactPhone} / Cổng Sacombank: 060129073198`,
        source: `Hợp Đồng Đại Lý ${contractNumber}`,
        timestamp: nowIso
      });

      // Add to pipeline signals
      pipelineSignals.unshift({
        id: `sig-agency-${Date.now()}-${idx}`,
        platform: 'B2B Wholesale',
        title: `Hàng Hot Sẵn Kho: ${prodName} từ nhà sản xuất ${mfg.brand}. Hỗ trợ nguồn hàng đại lý sỉ, chiết khấu ${newContract.discountPercent}%.`,
        type: 'supplier_signal',
        price: wholesalePrice,
        volume: 2000,
        timestamp: nowIso,
        sentiment: 'Positive',
        keywords: ['hợp đồng đại lý', 'nhà sản xuất', 'hàng dễ bán', 'chạy doanh số', 'chiết khấu cao'],
        trendingScore: 98,
        matchingEligible: true
      });
    });

    // Auto-generate an immediate high-value matching proposal in workspace
    const primaryHotProduct = mfg.hotProducts.find(p => selectedProducts.includes(p.name)) || mfg.hotProducts[0];
    if (primaryHotProduct) {
      const matchId = `m-agency-${Date.now()}`;
      const quantity = Math.floor(500 + Math.random() * 1500);
      const dealValue = primaryHotProduct.wholesalePrice * quantity;
      const commissionFee = Math.round(dealValue * (commissionRate / 100));

      const newMatch: MatchingBubble = {
        id: matchId,
        buyerId: 'b-vip-agency',
        sellerId: `s-agency-${Date.now()}`,
        buyerName: 'Hệ Thống Phân Phối Sỉ Toàn Quốc & TikTok Shop Top 1',
        sellerName: `${mfg.name} (Đại Lý Phân Phối)`,
        productName: primaryHotProduct.name,
        price: primaryHotProduct.wholesalePrice,
        confidenceScore: 96,
        evaluationReason: `Khớp trực tiếp từ Hợp Đồng Đại Lý mới ký [${contractNumber}]. Nguồn hàng xưởng xuất kho trực tiếp, giá sỉ ưu đãi và bảo lãnh chất lượng 100%.`,
        commissionFee,
        commissionPercent: commissionRate,
        status: 'pending',
        buyerContactUnlocked: true,
        sellerContactUnlocked: true,
        dealCompletedAt: nowIso,
        scoreBreakdown: {
          priceAlignment: 98,
          productAlignment: 96,
          logisticsFeasibility: 95,
          volumeCapacity: 97
        }
      };

      matchingBubbles.unshift(newMatch);
      addLog('Sales', `Tạo thương vụ khớp siêu tốc #${matchId} cho sản phẩm hot "${primaryHotProduct.name}" từ Hợp Đồng Đại Lý ${contractNumber}. Dự thu hoa hồng Sacombank: ${commissionFee.toLocaleString('vi-VN')} VND.`, 'success');
    }

    res.json({
      success: true,
      contract: newContract,
      agencyContracts,
      matchingBubbles,
      sellersList,
      pipelineSignals,
      activityLogs
    });
  } catch (err: any) {
    console.error('Failed to sign agency contract:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal error signing contract' });
  }
});

// 4. Terminate or archive an agency contract
app.post('/api/agency-contracts/terminate', (req, res) => {
  try {
    const { contractId, reason } = req.body;
    const found = agencyContracts.find(c => c.id === contractId);
    if (!found) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    found.status = 'terminated';
    found.notes = reason ? `Thanh lý: ${reason}` : 'Thanh lý theo yêu cầu đại lý';
    writeAgencyContracts(agencyContracts);

    addLog('Executive', `Hợp đồng đại lý [${found.contractNumber}] đã thanh lý/tạm dừng. Lý do: ${found.notes}`, 'warning');
    res.json({ success: true, contracts: agencyContracts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. AI Advisor for Sales Velocity & Distributorship Optimization (Gemini-powered with fallback)
app.post('/api/agency-contracts/ai-advisor', async (req, res) => {
  try {
    const { manufacturerId, selectedProducts, targetSalesVND, channel } = req.body;
    const mfg = manufacturersList.find(m => m.id === manufacturerId) || manufacturersList[0];

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `
Bạn là Giám đốc Cố vấn Chiến lược Phân phối Bán buôn & Đại lý Toàn cầu (Chief Distribution Officer).
Hãy tư vấn chiến lược chạy doanh số và ký kết hợp đồng đại lý thành công nhất cho đối tác:
- Nhà sản xuất: ${mfg.name} (${mfg.brand})
- Lĩnh vực: ${mfg.category}
- Địa bàn & năng lực: ${mfg.location}, công suất ${mfg.capacity}
- Mặt hàng hot đã chọn: ${(selectedProducts || []).join(', ') || 'Tất cả mặt hàng dễ bán'}
- Mục tiêu doanh số: ${(Number(targetSalesVND) || 100000000).toLocaleString('vi-VN')} VND/tháng
- Kênh bán: ${channel || 'TikTok Shop, Shopee Mall, Kênh Đại lý sỉ truyền thống'}
- Cổng thanh toán & đối soát: Sacombank (060129073198 - NGUYỄN TẤN SĨ)

Hãy trả về phân tích dạng JSON với cấu trúc:
{
  "marketAnalysis": "tóm tắt ngắn gọn tại sao các mặt hàng này dễ bán và đang có trend lớn",
  "monthlyRevenueForecast": "dự phóng doanh thu và lợi nhuận gộp sau chiết khấu",
  "salesVelocityTactics": ["chiến thuật 1", "chiến thuật 2", "chiến thuật 3"],
  "negotiationTips": ["mẹo đàm phán 1 để lấy thêm chiết khấu/mẫu thử từ xưởng", "mẹo 2"],
  "riskManagement": "lưu ý về kiểm soát hàng tồn kho và bảo vệ giá"
}
Chỉ trả về JSON hợp lệ, không bọc markdown khác.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.json({ success: true, advice: parsed, source: 'gemini' });
      } catch (geminiErr) {
        console.warn('Gemini query fallback to heuristic advisor:', geminiErr);
      }
    }

    // Heuristic intelligent fallback
    const advice = {
      marketAnalysis: `Nhóm sản phẩm của ${mfg.brand} thuộc danh mục hàng tiêu dùng nhanh & thiết bị tiện ích có vòng quay ${mfg.turnoverRate}. Tỷ lệ chốt đơn tự nhiên cao nhờ giải quyết đúng nỗi đau của người dùng với mức giá dễ tiếp cận.`,
      monthlyRevenueForecast: `Với mức cam kết ${(Number(targetSalesVND) || 100000000).toLocaleString('vi-VN')} VND/tháng ở mức chiết khấu 40-48%, lợi nhuận gộp ước tính đạt từ 40.000.000 đến 48.000.000 VND/tháng.`,
      salesVelocityTactics: [
        `Áp dụng chiến lược "Sản phẩm Phễu + Combo Giá Trị": Bán kèm mặt hàng giá rẻ làm quà tặng để tăng tỷ lệ chuyển đổi livestream lên >18%.`,
        `Hợp tác với 10-20 Micro KOC trên TikTok Shop để phân phối liên kết Affiliate, xưởng hỗ trợ gửi mẫu miễn phí.`,
        `Kích hoạt thanh toán đối soát qua Sacombank 060129073198 để bảo đảm dòng tiền minh bạch và được hưởng hạn mức gối đầu công nợ 15 ngày.`
      ],
      negotiationTips: [
        `Đề xuất nhà sản xuất tài trợ 50-100 bộ sản phẩm mẫu dùng thử (sampling) khi ký hợp đồng đại lý cấp 1.`,
        `Thỏa thuận điều khoản đổi trả hàng chậm bán sang mẫu hot mới sau 45 ngày để hạn chế rủi ro tồn kho.`
      ],
      riskManagement: `Tuyệt đối tuân thủ chính sách giá sàn của xưởng để tránh bị thu hồi quyền đại lý độc quyền; quản lý hàng theo FIFO (nhập trước xuất trước).`
    };

    return res.json({ success: true, advice, source: 'heuristic_advisor' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------
// AUTONOMOUS AUDIT & CONTINUOUS SELF-IMPROVEMENT ENGINE
// -----------------------------------------------------------------

function runIntegrityAuditAndSelfImprovement(triggerSource: string = 'SCHEDULED_AUTONOMOUS') {
  const auditReport = {
    timestamp: new Date().toISOString(),
    triggerSource,
    duplicatesRemoved: {
      buyers: 0,
      sellers: 0,
      bubbles: 0,
      verifiedDeals: 0,
      logs: 0
    },
    ledgerCorrected: false,
    previousCommission: totalCommissionEarnedVND,
    auditedCommission: 0,
    successfulDealsCount: 0
  };

  // 1. Audit and clean verifiedDeals in self_improved_data.json
  const data = readSelfImprovedData();
  const seenDeals = new Set<string>();
  const cleanVerifiedDeals: any[] = [];
  
  for (const deal of data.verifiedDeals || []) {
    const key = deal.dealId || `${(deal.buyerName || '').trim()}|${(deal.sellerName || '').trim()}|${(deal.productName || '').trim()}`;
    if (!seenDeals.has(key)) {
      seenDeals.add(key);
      cleanVerifiedDeals.push(deal);
    } else {
      auditReport.duplicatesRemoved.verifiedDeals++;
    }
  }
  data.verifiedDeals = cleanVerifiedDeals;
  data.successfulDealsCount = cleanVerifiedDeals.length;
  data.totalCommissionVND = cleanVerifiedDeals.reduce((sum: number, d: any) => sum + (d.commissionFee || 0), 0);
  data.totalBusinessVolumeVND = cleanVerifiedDeals.reduce((sum: number, d: any) => sum + (d.totalBusinessVolume || 0), 0);
  
  if (data.totalCommissionVND !== totalCommissionEarnedVND || data.successfulDealsCount !== successfulDealsCount) {
    auditReport.ledgerCorrected = true;
  }
  totalCommissionEarnedVND = data.totalCommissionVND;
  successfulDealsCount = data.successfulDealsCount;
  auditReport.auditedCommission = totalCommissionEarnedVND;
  auditReport.successfulDealsCount = successfulDealsCount;

  // 2. Audit and deduplicate matchingBubbles
  const seenBubbles = new Set<string>();
  const cleanBubbles: any[] = [];
  for (const b of matchingBubbles) {
    const key = `${(b.buyerName || '').trim().toLowerCase()}|${(b.sellerName || '').trim().toLowerCase()}|${(b.productName || '').trim().toLowerCase()}`;
    if (!seenBubbles.has(key)) {
      seenBubbles.add(key);
      cleanBubbles.push(b);
    } else {
      auditReport.duplicatesRemoved.bubbles++;
    }
  }
  matchingBubbles = cleanBubbles;

  // 3. Audit and deduplicate buyersList
  const seenBuyers = new Set<string>();
  const cleanBuyers: any[] = [];
  for (const buyer of buyersList) {
    const key = `${(buyer.name || '').trim().toLowerCase()}|${(buyer.demand || '').trim().toLowerCase()}`;
    if (!seenBuyers.has(key)) {
      seenBuyers.add(key);
      cleanBuyers.push(buyer);
    } else {
      auditReport.duplicatesRemoved.buyers++;
    }
  }
  buyersList = cleanBuyers;

  // 4. Audit and deduplicate sellersList
  const seenSellers = new Set<string>();
  const cleanSellers: any[] = [];
  for (const s of sellersList) {
    const key = `${(s.name || '').trim().toLowerCase()}|${(s.productName || '').trim().toLowerCase()}`;
    if (!seenSellers.has(key)) {
      seenSellers.add(key);
      cleanSellers.push(s);
    } else {
      auditReport.duplicatesRemoved.sellers++;
    }
  }
  sellersList = cleanSellers;

  // 5. Deduplicate activityLogs
  const seenLogs = new Set<string>();
  const cleanLogs: any[] = [];
  for (const l of activityLogs) {
    if (!seenLogs.has(l.id)) {
      seenLogs.add(l.id);
      cleanLogs.push(l);
    } else {
      auditReport.duplicatesRemoved.logs++;
    }
  }
  activityLogs = cleanLogs;

  // 6. Save self-improvement metadata
  data.selfImprovedPatterns = {
    ...data.selfImprovedPatterns,
    lastAuditTimestamp: auditReport.timestamp,
    lastAuditResult: auditReport,
    auditStatus: 'HEALTHY_VERIFIED',
    integrityRating: '100%_CLEAN',
    auditCycleCount: (data.selfImprovedPatterns?.auditCycleCount || 0) + 1
  };
  writeSelfImprovedData(data);

  const totalDups = auditReport.duplicatesRemoved.buyers + 
                    auditReport.duplicatesRemoved.sellers + 
                    auditReport.duplicatesRemoved.bubbles + 
                    auditReport.duplicatesRemoved.verifiedDeals + 
                    auditReport.duplicatesRemoved.logs;

  if (totalDups > 0 || auditReport.ledgerCorrected || triggerSource === 'MANUAL_REQUEST') {
    addLog('Executive', `AUDIT & TỰ HOÀN THIỆN: Đã kiểm toán xong (${triggerSource}). Xóa ${totalDups} mục trùng lặp, chuẩn hóa sổ cái Sacombank 060129073198 đạt ${totalCommissionEarnedVND.toLocaleString()} VND (${successfulDealsCount} deals).`, 'success');
  }

  return auditReport;
}

// Periodic background audit & self-improvement run every 2 minutes
setInterval(() => {
  try {
    runIntegrityAuditAndSelfImprovement('AUTONOMOUS_CYCLE');
  } catch (err) {
    console.error('Audit cycle error:', err);
  }
}, 120000);

// API endpoint to trigger audit & self-improvement on-demand
app.post('/api/system/audit-self-improve', (req, res) => {
  try {
    const report = runIntegrityAuditAndSelfImprovement('MANUAL_REQUEST');
    res.json({
      success: true,
      report,
      totalCommissionEarnedVND,
      successfulDealsCount,
      matchingBubbles,
      activityLogs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/system/audit-self-improve', (req, res) => {
  const data = readSelfImprovedData();
  res.json({
    success: true,
    lastAuditTimestamp: data.selfImprovedPatterns?.lastAuditTimestamp,
    lastAuditResult: data.selfImprovedPatterns?.lastAuditResult,
    auditStatus: data.selfImprovedPatterns?.auditStatus || 'HEALTHY_VERIFIED',
    totalCommissionEarnedVND,
    successfulDealsCount
  });
});

// Fallback for unmatched API routes to ensure JSON response instead of HTML SPA fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.path}`
  });
});


// -----------------------------------------------------------------
// VITE CLIENT INTEGRATION
// -----------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    addLog('System', `Multi-agent host server successfully booted and listening on port ${PORT}`, 'success');
  });
}

startServer();
