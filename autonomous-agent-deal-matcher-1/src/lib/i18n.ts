/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'vi';
export type Currency = 'VND' | 'USD';

// Configurable exchange rate (default: 1 USD = 25,000 VND)
export const DEFAULT_EXCHANGE_RATE = 25000;

export interface TranslationDictionary {
  // Header
  appTitle: string;
  activeStatus: string;
  appSubtitle: string;
  commissionCleared: string;
  successfulDeals: string;
  contracts: string;
  neuralLogic: string;
  readyActive: string;
  
  // Tabs & Panels
  agentArch: string;
  performanceAnalytics: string;
  streamingFeeds: string;
  bubbleCaptures: string;
  dealWorkspace: string;
  allSignals: string;
  
  // Performance Analytics
  specialistHealth: string;
  telemetryDesc: string;
  optimizeLatency: string;
  calibrating: string;
  lowerBetter: string;
  targetSuccess: string;
  pipelineDiagnostics: string;
  latencyAlert: string;
  networkHealthy: string;
  latencyTitle: string;
  successRateTitle: string;
  floorLabel: string;
  calibrationCompleted: string;
  dealConversionRateTitle: string;
  dealConversionRateDesc: string;
  conversionRateAxis: string;
  conversionTimeline: string;
  performanceSummaryTitle: string;
  performanceSummaryDesc: string;
  avgTimeIngestionToMatch: string;
  avgTimeIngestionToMatchDesc: string;

  // Streaming Feeds
  addLead: string;
  addLeadDesc: string;
  leadName: string;
  leadDemand: string;
  targetPrice: string;
  contactInfo: string;
  leadType: string;
  buyerType: string;
  sellerType: string;
  leadSource: string;
  submitting: string;
  submitLead: string;
  cancel: string;
  ingestedSignals: string;
  noSignals: string;
  ingestBtn: string;
  ingestedBtn: string;
  activeBuyers: string;
  activeSellers: string;
  noBuyers: string;
  noSellers: string;
  wholesalePrice: string;

  // Bubble Captures
  noBubbleSelected: string;
  selectPairDesc: string;
  autonomousMatch: string;
  buyerClient: string;
  manufacturer: string;
  commissionLabel: string;
  confidenceScore: string;
  passedStatus: string;
  lowStatus: string;
  dealConfidenceBreakdown: string;
  sellerReputation: string;
  matchAccuracy: string;
  historicalTrend: string;
  priceAlignment: string;
  mobileCapture: string;
  desktopCapture: string;

  // Workspace
  pipelineMatcher: string;
  pipelineMatcherDesc: string;
  activeProposals: string;
  dismissedProposals: string;
  noProposals: string;
  noDismissedProposals: string;
  commissionRateSetting: string;
  minToastThreshold: string;
  saveRate: string;
  interventionDesk: string;
  resolvingBottleneck: string;
  diagnostics: string;
  authPrice: string;
  nudgePriceBtn: string;
  outreachThread: string;
  negotiationActive: string;
  negotiationPending: string;
  improveOutreach: string;
  toneProfessional: string;
  toneFriendly: string;
  toneUrgent: string;
  optimizing: string;
  optimizeWithGemini: string;
  sendMessagePlaceholder: string;
  sendBtn: string;
  completeDealBtn: string;
  unlockContactsBtn: string;
  dismissBtn: string;
  rematchBtn: string;
  agentAuditLog: string;
  auditLogDesc: string;
  searchLogsPlaceholder: string;
  jsonView: string;
  tableView: string;
  allAgentsFilter: string;
  allSeveritiesFilter: string;
  realDateOnly: string;
  sourcingLake: string;
  socialBrokerDesc: string;
  socialLiveFeed: string;
  manualInbound: string;
  trendingStreams: string;
  liveCrawling: string;
  waitingSignals: string;
  ingest: string;
  ingested: string;
  managerIntervention: string;
  bottleneckDiagnostics: string;
  estCommission: string;
  dictateTooltip: string;
  listeningStatus: string;
  speechNotSupported: string;
  speechError: string;
  geographicFilterLabel: string;
  regionAll: string;
  regionVn: string;
  regionApac: string;
  regionNa: string;
  regionEu: string;
  deleteDealBtn: string;
  deleteDealConfirm: string;
  matchOnlineProductsBtn: string;
  matchOnlineProductsDesc: string;
  exportCsvBtn: string;
  bulkActions: string;
  bulkUnlockBtn: string;
  bulkDismissBtn: string;
  bulkDeleteBtn: string;
  bulkRestoreBtn: string;
  selectAll: string;
  deselectAll: string;
  selectedDealsCount: string;
  agencyContractsTitle: string;
  agencyContractsSubtitle: string;
  signAgencyContractBtn: string;
  signedContractsTab: string;
  manufacturersCatalogTab: string;
  aiContractAdvisorBtn: string;
  fastSellingBadge: string;
  retailPrice: string;
  marginDiscount: string;
  monthlyTarget: string;
  eSignature: string;
  signNow: string;
  downloadContract: string;
  contractActive: string;

  // Audit Log Grouping
  groupLogsByCategory: string;
  ungroupLogs: string;
  logCategoryAll: string;
  logCategoryMatching: string;
  logCategoryOutreach: string;
  logCategoryPayments: string;
  logCategoryResearch: string;
  logCategorySystem: string;
  expandAllGroups: string;
  collapseAllGroups: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: "Autonomous Agent Deal Matcher",
    activeStatus: "24/7 ACTIVE",
    appSubtitle: "Autonomous bulk supply-chain brokering and global manufacturing trade matcher.",
    commissionCleared: "Sacombank Commission Cleared",
    successfulDeals: "Successful Deals",
    contracts: "Contracts",
    neuralLogic: "Neural Logic (Gemini)",
    readyActive: "Ready & Active",
    
    agentArch: "Agent Architecture",
    performanceAnalytics: "Performance Analytics",
    streamingFeeds: "Streaming Sourcing Feeds",
    bubbleCaptures: "Cross-Device Captures",
    dealWorkspace: "Deal Workspace Desk",
    allSignals: "All Signals",

    specialistHealth: "Specialist Network Health Ledger",
    telemetryDesc: "Real-time telemetry processed from active agent network sockets.",
    optimizeLatency: "Optimize Latency",
    calibrating: "Calibrating...",
    lowerBetter: "Lower is better",
    targetSuccess: "Target ≥ 80%",
    pipelineDiagnostics: "Real-time Pipeline Diagnostics",
    latencyAlert: "Sales Agent Latency Alert: Response delays detected.",
    networkHealthy: "Specialist network healthy: All active agents are responding within acceptable latency parameters.",
    latencyTitle: "Response Latency (ms)",
    successRateTitle: "Quality Success Rate (%)",
    floorLabel: "Floor",
    calibrationCompleted: "OPTIMIZATION COMPLETED: Sockets calibrated. Specialist pipelines are synchronized.",
    dealConversionRateTitle: "Deal Conversion Rate over Time (%)",
    dealConversionRateDesc: "The historical and real-time percentage of matched buyer-seller bubbles successfully finalized.",
    conversionRateAxis: "Conversion Rate (%)",
    conversionTimeline: "Conversion Timeline",
    performanceSummaryTitle: "System Performance Summary",
    performanceSummaryDesc: "Aggregate operational metrics reflecting overall automation and orchestration speed.",
    avgTimeIngestionToMatch: "Average Completion Velocity",
    avgTimeIngestionToMatchDesc: "The average time elapsed from a raw social lead ingestion to a finalized trade match agreement.",

    addLead: "Ingest Sourcing Lead",
    addLeadDesc: "Submit manual request or allow the autonomous social streams to automatically scrap the signals.",
    leadName: "Client / Lead Name",
    leadDemand: "Product Requirement / Demand",
    targetPrice: "Target Price Limit (VND)",
    contactInfo: "Contact Details (Secure)",
    leadType: "Lead Stream Type",
    buyerType: "Buyer (Bulk Order)",
    sellerType: "Manufacturer (Factory Supplier)",
    leadSource: "Traffic Source (TikTok, IG, etc)",
    submitting: "Ingesting Lead...",
    submitLead: "Submit and Auto-Match Sourcing Lead",
    cancel: "Cancel",
    ingestedSignals: "Social Sourcing Feed Signals",
    noSignals: "No incoming signals found in this sequence.",
    ingestBtn: "Ingest Signal",
    ingestedBtn: "Ingested",
    activeBuyers: "Active Buyers Stream",
    activeSellers: "Active Manufacturers Stream",
    noBuyers: "No active buyer leads registered.",
    noSellers: "No manufacturer factories available in ledger.",
    wholesalePrice: "Wholesale Price",

    noBubbleSelected: "No Matching Bubble Selected",
    selectPairDesc: "Select an active pair from the transaction list to render its 3 cross-device interface captures.",
    autonomousMatch: "Autonomous Match",
    buyerClient: "Buyer Client",
    manufacturer: "Manufacturer",
    commissionLabel: "Commission",
    confidenceScore: "Confidence Score",
    passedStatus: "Passed",
    lowStatus: "Low",
    dealConfidenceBreakdown: "Deal Confidence Breakdown",
    sellerReputation: "Seller Reputation Weight",
    matchAccuracy: "Demand-Supply Match Accuracy",
    historicalTrend: "Historical Trend Weight",
    priceAlignment: "Price Alignment Accuracy",
    mobileCapture: "Mobile Capture",
    desktopCapture: "Desktop Capture",

    pipelineMatcher: "Autonomous Pipeline Matcher",
    pipelineMatcherDesc: "Real-time broker matchmaking between Vietnam manufacturers and global buyers.",
    activeProposals: "Active Matches",
    dismissedProposals: "Dismissed Matches",
    noProposals: "No active transaction bubbles found.",
    noDismissedProposals: "No dismissed matches currently in archive.",
    commissionRateSetting: "Platform Commission",
    minToastThreshold: "Min Alert Commission",
    saveRate: "Save",
    interventionDesk: "Manager Intervention Desk",
    resolvingBottleneck: "Resolving bottleneck on Match",
    diagnostics: "Bottleneck Diagnostics",
    authPrice: "Authorize Discounted Factory Price (VND)",
    nudgePriceBtn: "Nudge Price & Clear Stall State",
    outreachThread: "Agent Outreach Intercom Thread",
    negotiationActive: "Negotiation Session Authorized & Active",
    negotiationPending: "Negotiation Session Locked (Unlock contacts first)",
    improveOutreach: "Improve Outreach Message with Gemini API",
    toneProfessional: "Professional",
    toneFriendly: "Friendly",
    toneUrgent: "Urgent",
    optimizing: "Optimizing...",
    optimizeWithGemini: "Optimize outreach tone using server-side Gemini",
    sendMessagePlaceholder: "Send message as Agent to negotiate...",
    sendBtn: "Send",
    completeDealBtn: "Finalize Deal & Collect Fees",
    unlockContactsBtn: "Unlock Contacts & Start Chat",
    dismissBtn: "Dismiss Match",
    rematchBtn: "Re-match Immediately",
    agentAuditLog: "Agent Audit Log Ledger",
    auditLogDesc: "Scrollable, searchable ledger of every automated execution and decision packet made by the active agent collective.",
    searchLogsPlaceholder: "Search audit logs by message, payload or parameters...",
    jsonView: "JSON Log Format",
    tableView: "Raw Table Format",
    allAgentsFilter: "All Specialists",
    allSeveritiesFilter: "All Severities",
    realDateOnly: "System-Verified Audited Date",
    sourcingLake: "Sourcing Data Lake",
    socialBrokerDesc: "Social commerce stream broker pulling live deals into matcher.",
    socialLiveFeed: "Social Live Feed",
    manualInbound: "Manual Inbound",
    trendingStreams: "Trending Ingestion Streams",
    liveCrawling: "Live Crawling",
    waitingSignals: "Waiting for incoming social stream signals...",
    ingest: "Ingest",
    ingested: "Ingested",
    managerIntervention: "Manager Intervention Desk",
    bottleneckDiagnostics: "Bottleneck Diagnostics",
    estCommission: "Est. Commission",
    dictateTooltip: "Dictate instruction verbally using browser microphone",
    listeningStatus: "Listening to your voice...",
    speechNotSupported: "Speech Recognition is not supported on this browser.",
    speechError: "Microphone/Speech Recognition failed.",
    geographicFilterLabel: "Geographic Region",
    regionAll: "All Regions (Vietnam & Global)",
    regionVn: "Vietnam (Domestic)",
    regionApac: "Asia-Pacific (APAC)",
    regionNa: "North America (NA)",
    regionEu: "European Union (EU)",
    deleteDealBtn: "Delete Deal",
    deleteDealConfirm: "Are you sure you want to permanently delete this deal from the system?",
    matchOnlineProductsBtn: "⚡ Match Whatever Products Are Running Online",
    matchOnlineProductsDesc: "Scan TikTok, Taobao, Instagram & auto-match live products with verified buyers",
    exportCsvBtn: "Export CSV Report",
    bulkActions: "Bulk Actions",
    bulkUnlockBtn: "Unlock Selected",
    bulkDismissBtn: "Dismiss Selected",
    bulkDeleteBtn: "Delete Selected",
    bulkRestoreBtn: "Restore Selected",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    selectedDealsCount: "selected",
    agencyContractsTitle: "Manufacturer Agency & High-Velocity Distributorship Agreements",
    agencyContractsSubtitle: "Direct factory partnerships for viral hot-selling products with high gross margins & guaranteed volume",
    signAgencyContractBtn: "Sign Agency Agreement",
    signedContractsTab: "Active Agency Agreements",
    manufacturersCatalogTab: "Hot-Velocity Manufacturers",
    aiContractAdvisorBtn: "AI Sales & Contract Advisor",
    fastSellingBadge: "Fast-Selling & High-Velocity",
    retailPrice: "Retail Price",
    marginDiscount: "Agency Margin",
    monthlyTarget: "Monthly Target Commitment",
    eSignature: "Digital E-Signature",
    signNow: "Confirm & Sign Contract",
    downloadContract: "Download Contract (PDF)",
    contractActive: "Legally Active & Verified",

    // Audit Log Grouping
    groupLogsByCategory: "Group by Action Category",
    ungroupLogs: "Ungrouped Stream",
    logCategoryAll: "All Categories",
    logCategoryMatching: "Matching & Scoring",
    logCategoryOutreach: "Outreach & Negotiation",
    logCategoryPayments: "Payments & Commissions",
    logCategoryResearch: "Market Research & Signals",
    logCategorySystem: "System & Governance",
    expandAllGroups: "Expand All",
    collapseAllGroups: "Collapse All"
  },
  vi: {
    appTitle: "Trình Ghép Nối Giao Dịch Agent Tự Động",
    activeStatus: "HOẠT ĐỘNG 24/7",
    appSubtitle: "Môi giới chuỗi cung ứng bán buôn tự động và kết nối thương mại sản xuất toàn cầu.",
    commissionCleared: "Hoa Hồng Sacombank Đã Thanh Toán",
    successfulDeals: "Giao Dịch Thành Công",
    contracts: "Hợp Đồng",
    neuralLogic: "Mã Nguồn Logic (Gemini)",
    readyActive: "Sẵn Sàng & Hoạt Động",
    
    agentArch: "Kiến Trúc Agent",
    performanceAnalytics: "Phân Tích Hiệu Năng",
    streamingFeeds: "Nguồn Cung Ứng Trực Tuyến",
    bubbleCaptures: "Chụp Giao Diện Thiết Bị",
    dealWorkspace: "Bàn Làm Việc Giao Dịch",
    allSignals: "Tất Cả Tín Hiệu",

    specialistHealth: "Sổ Cái Sức Khỏe Mạng Lưới Chuyên Gia",
    telemetryDesc: "Dữ liệu đo lường thời gian thực từ các cổng kết nối agent đang hoạt động.",
    optimizeLatency: "Tối Ưu Độ Trễ",
    calibrating: "Đang Hiệu Chuẩn...",
    lowerBetter: "Thấp hơn là tốt hơn",
    targetSuccess: "Mục tiêu ≥ 80%",
    pipelineDiagnostics: "Chẩn Đoán Đường Truyền Thời Gian Thực",
    latencyAlert: "Cảnh Báo Độ Trễ Agent Bán Hàng: Phát hiện phản hồi chậm.",
    networkHealthy: "Hệ thống chuyên gia khỏe mạnh: Tất cả agent hoạt động phản hồi trong phạm vi độ trễ cho phép.",
    latencyTitle: "Độ Trễ Phản Hồi (ms)",
    successRateTitle: "Tỷ Lệ Thành Công Chất Lượng (%)",
    floorLabel: "Sàn",
    calibrationCompleted: "HOÀN THÀNH TỐI ƯU: Hiệu chuẩn socket thành công. Các đường truyền chuyên gia đã đồng bộ.",
    dealConversionRateTitle: "Tỷ Lệ Chuyển Đổi Giao Dịch Thành Công Theo Thời Gian (%)",
    dealConversionRateDesc: "Tỷ lệ phần trăm thời gian thực và lịch sử các cặp ghép nối người mua - nhà máy được hoàn tất thành công.",
    conversionRateAxis: "Tỷ Lệ Chuyển Đổi (%)",
    conversionTimeline: "Mốc Thời Gian Đối Soát",
    performanceSummaryTitle: "Tóm Tắt Hiệu Năng Hệ Thống",
    performanceSummaryDesc: "Các chỉ số hoạt động tổng hợp phản ánh tốc độ tự động hóa và điều phối tổng thể.",
    avgTimeIngestionToMatch: "Tốc Độ Hoàn Thành Trung Bình",
    avgTimeIngestionToMatchDesc: "Thời gian trung bình trôi qua từ khi tiếp nhận nguồn cấp thô từ mạng xã hội cho đến khi hoàn tất thỏa thuận thương mại.",

    addLead: "Nhập Yêu Cầu Cung Ứng",
    addLeadDesc: "Gửi yêu cầu thủ công hoặc cho phép các luồng xã hội tự động quét tín hiệu.",
    leadName: "Tên Khách Hàng / Đầu Mối",
    leadDemand: "Yêu Cầu Sản Phẩm / Nhu Cầu",
    targetPrice: "Giá Mục Tiêu Giới Hạn (VND)",
    contactInfo: "Thông Tin Liên Hệ (Bảo Mật)",
    leadType: "Loại Luồng Đầu Mối",
    buyerType: "Người Mua (Đơn Hàng Sỉ)",
    sellerType: "Nhà Sản Xuất (Nhà Máy Cung Cấp)",
    leadSource: "Nguồn Lưu Lượng (TikTok, IG, v.v.)",
    submitting: "Đang nhập đầu mối...",
    submitLead: "Gửi và Tự Động Khớp Đầu Mối",
    cancel: "Hủy",
    ingestedSignals: "Tín Hiệu Nguồn Cung Mạng Xã Hội",
    noSignals: "Không tìm thấy tín hiệu mới nào trong chuỗi này.",
    ingestBtn: "Nhập Tín Hiệu",
    ingestedBtn: "Đã Nhập",
    activeBuyers: "Luồng Người Mua Hoạt Động",
    activeSellers: "Luồng Nhà Máy Hoạt Động",
    noBuyers: "Chưa có đầu mối người mua nào được đăng ký.",
    noSellers: "Không có nhà máy sản xuất nào sẵn sàng trong sổ cái.",
    wholesalePrice: "Giá Bán Sỉ",

    noBubbleSelected: "Chưa Chọn Giao Dịch Khớp Nối",
    selectPairDesc: "Chọn một cặp giao dịch đang hoạt động để hiển thị 3 ảnh chụp màn hình thiết bị chéo.",
    autonomousMatch: "Ghép Nối Tự Động",
    buyerClient: "Khách Hàng Mua",
    manufacturer: "Nhà Sản Xuất",
    commissionLabel: "Hoa Hồng",
    confidenceScore: "Điểm Tin Cậy",
    passedStatus: "Đạt",
    lowStatus: "Thấp",
    dealConfidenceBreakdown: "Chi Tiết Điểm Tin Cậy",
    sellerReputation: "Trọng Số Uy Tín Người Bán",
    matchAccuracy: "Độ Chính Xác Khớp Cầu-Cung",
    historicalTrend: "Trọng Số Xu Hướng Lịch Sử",
    priceAlignment: "Độ Chính Xác Khớp Giá",
    mobileCapture: "Chụp Di Động",
    desktopCapture: "Chụp Máy Tính",

    pipelineMatcher: "Hệ Thống Ghép Nối Đường Truyền Tự Động",
    pipelineMatcherDesc: "Kết nối môi giới thời gian thực giữa nhà sản xuất Việt Nam và người mua toàn cầu.",
    activeProposals: "Cặp Khớp Hoạt Động",
    dismissedProposals: "Cặp Khớp Đã Hủy",
    noProposals: "Không tìm thấy cặp giao dịch hoạt động nào.",
    noDismissedProposals: "Không có cặp khớp nào bị hủy trong lưu trữ.",
    commissionRateSetting: "Hoa Hồng Nền Tảng",
    minToastThreshold: "Mức Cảnh Báo Hoa Hồng",
    saveRate: "Lưu",
    interventionDesk: "Bàn Can Thiệp Của Quản Lý",
    resolvingBottleneck: "Giải quyết điểm nghẽn cho Cặp Khớp",
    diagnostics: "Chẩn Đoán Điểm Nghẽn",
    authPrice: "Ủy Quyền Giá Nhà Máy Đã Giảm (VND)",
    nudgePriceBtn: "Điều Chỉnh Giá & Khai Thông Nghẽn",
    outreachThread: "Luồng Chat Tiếp Cận Của Agent",
    negotiationActive: "Phiên Thương Lượng Được Phép & Hoạt Động",
    negotiationPending: "Phiên Thương Lượng Đang Khóa (Mở khóa liên hệ trước)",
    improveOutreach: "Tối Ưu Tin Nhắn Tiếp Cận bằng Gemini API",
    toneProfessional: "Chuyên Nghiệp",
    toneFriendly: "Thân Thiện",
    toneUrgent: "Khẩn Cấp",
    optimizing: "Đang tối ưu...",
    optimizeWithGemini: "Tối ưu hóa giọng điệu tin nhắn tiếp cận bằng Gemini máy chủ",
    sendMessagePlaceholder: "Gửi tin nhắn dưới dạng Agent để thương lượng...",
    sendBtn: "Gửi",
    completeDealBtn: "Hoàn Tất Giao Dịch & Thu Phí",
    unlockContactsBtn: "Mở Khóa Liên Hệ & Bắt Đầu Chat",
    dismissBtn: "Hủy Giao Dịch",
    rematchBtn: "Ghép Nối Lại Ngay",
    agentAuditLog: "Sổ Cái Nhật Ký Kiểm Toán Agent",
    auditLogDesc: "Sổ cái có thể cuộn, tìm kiếm cho mọi lệnh thực thi tự động và gói quyết định bởi tập hợp các agent đang hoạt động.",
    searchLogsPlaceholder: "Tìm nhật ký kiểm toán theo tin nhắn, gói tin hoặc tham số...",
    jsonView: "Định dạng JSON Log",
    tableView: "Định dạng Bảng Raw",
    allAgentsFilter: "Tất cả Chuyên gia",
    allSeveritiesFilter: "Tất cả Mức độ",
    realDateOnly: "Ngày Hệ Thống Đã Kiểm Toán",
    sourcingLake: "Hồ Dữ Liệu Nguồn Cung",
    socialBrokerDesc: "Môi giới luồng thương mại mạng xã hội đẩy giao dịch trực tiếp vào bộ khớp nối.",
    socialLiveFeed: "Nguồn Trực Tiếp Mạng Xã Hội",
    manualInbound: "Đầu Vào Thủ Công",
    trendingStreams: "Luồng Tiếp Nhận Xu Hướng",
    liveCrawling: "Quét Trực Tiếp",
    waitingSignals: "Đang chờ luồng tín hiệu mạng xã hội mới...",
    ingest: "Tiếp Nhận",
    ingested: "Đã Tiếp Nhận",
    managerIntervention: "Bàn Can Thiệp Của Quản Lý",
    bottleneckDiagnostics: "Chẩn Đoán Điểm Nghẽn",
    estCommission: "Hoa Hồng Dự Kiến",
    dictateTooltip: "Đọc chỉ thị trực tiếp bằng giọng nói",
    listeningStatus: "Hệ thống đang lắng nghe giọng nói...",
    speechNotSupported: "Ứng dụng Speech Recognition chưa hỗ trợ trình duyệt này.",
    speechError: "Lỗi thiết bị micro hoặc lỗi nhận diện giọng nói.",
    geographicFilterLabel: "Khu Vực Địa Lý",
    regionAll: "Tất cả khu vực (Việt Nam & Toàn cầu)",
    regionVn: "Việt Nam (Trong nước)",
    regionApac: "Châu Á - Thái Bình Dương (APAC)",
    regionNa: "Bắc Mỹ (NA)",
    regionEu: "Liên minh Châu Âu (EU)",
    deleteDealBtn: "Xóa Deal",
    deleteDealConfirm: "Bạn có chắc chắn muốn xóa vĩnh viễn thương vụ này khỏi hệ thống không?",
    matchOnlineProductsBtn: "⚡ Khớp Tất Cả Sản Phẩm Đang Chạy Online",
    matchOnlineProductsDesc: "Quét TikTok, Taobao, Instagram & tự động ghép nối sản phẩm online với người mua uy tín",
    exportCsvBtn: "Xuất Báo Cáo CSV",
    bulkActions: "Hành Động Hàng Loạt",
    bulkUnlockBtn: "Mở Khóa Đã Chọn",
    bulkDismissBtn: "Bỏ Qua Đã Chọn",
    bulkDeleteBtn: "Xóa Đã Chọn",
    bulkRestoreBtn: "Khôi Phục Đã Chọn",
    selectAll: "Chọn Tất Cả",
    deselectAll: "Bỏ Chọn Tất Cả",
    selectedDealsCount: "đã chọn",
    agencyContractsTitle: "Ký Kết Hợp Đồng Đại Lý Với Nhà Sản Xuất Hàng Dễ Bán & Chạy Doanh Số",
    agencyContractsSubtitle: "Liên kết trực tiếp xưởng gốc sản xuất các mặt hàng hot trend, vòng quay nhanh, chiết khấu cao và bảo lãnh chất lượng",
    signAgencyContractBtn: "Ký Hợp Đồng Đại Lý",
    signedContractsTab: "Hợp Đồng Đại Lý Đã Ký",
    manufacturersCatalogTab: "Xưởng Gốc & Hàng Dễ Bán",
    aiContractAdvisorBtn: "AI Cố Vấn Hợp Đồng & Chạy Số",
    fastSellingBadge: "Hàng Dễ Bán & Chạy Doanh Số",
    retailPrice: "Giá Bán Lẻ Đề Xuất",
    marginDiscount: "Chiết Khấu Đại Lý",
    monthlyTarget: "Cam Kết Doanh Số Tháng",
    eSignature: "Chữ Ký Điện Tử",
    signNow: "Xác Nhận & Ký Kết Hợp Đồng",
    downloadContract: "Tải Bản In Hợp Đồng (PDF)",
    contractActive: "Hợp Đồng Đã Ký & Có Hiệu Lực",

    // Audit Log Grouping
    groupLogsByCategory: "Nhóm Theo Danh Mục Hành Động",
    ungroupLogs: "Xem Luồng Liên Tục",
    logCategoryAll: "Tất Cả Danh Mục",
    logCategoryMatching: "Khớp Nối Thương Vụ (Matching)",
    logCategoryOutreach: "Giao Tiếp & Tiếp Cận (Outreach)",
    logCategoryPayments: "Thanh Toán & Hoa Hồng (Payments)",
    logCategoryResearch: "Nghiên Cứu & Tín Hiệu (Research)",
    logCategorySystem: "Hệ Thống & Điều Hành (System)",
    expandAllGroups: "Mở Rộng Tất Cả",
    collapseAllGroups: "Thu Gọn Tất Cả"
  }
};

/**
 * Format currency amount depending on selected currency, applying exchange rate if USD
 */
export function formatCurrency(amount: number, currency: Currency | string = 'VND', exchangeRate: number = DEFAULT_EXCHANGE_RATE): string {
  if (currency === 'USD') {
    const usdValue = amount / exchangeRate;
    return `$${usdValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  } else {
    return `${amount.toLocaleString('vi-VN')} VND`;
  }
}

/**
 * Automatically detects initial application language based on browser navigator settings,
 * inspecting navigator.languages, navigator.language, and user system locale with fallback.
 */
export function detectBrowserLanguage(): Language {
  try {
    // 1. Check if user explicitly set a saved preference in localStorage previously
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('app_language');
      if (saved === 'en' || saved === 'vi') {
        return saved;
      }
    }

    // 2. Check navigator.languages (ordered list of user's preferred languages) or navigator.language
    if (typeof navigator !== 'undefined') {
      const preferredLanguages: string[] = [];

      if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
        preferredLanguages.push(...navigator.languages);
      }
      if (navigator.language) {
        preferredLanguages.push(navigator.language);
      }
      const navAny = navigator as any;
      if (navAny.userLanguage) preferredLanguages.push(navAny.userLanguage);
      if (navAny.browserLanguage) preferredLanguages.push(navAny.browserLanguage);

      for (const lang of preferredLanguages) {
        if (!lang) continue;
        const normalized = lang.toLowerCase().trim();
        // Check for Vietnamese
        if (normalized === 'vi' || normalized.startsWith('vi-') || normalized.startsWith('vi_')) {
          return 'vi';
        }
        // Check for English
        if (normalized === 'en' || normalized.startsWith('en-') || normalized.startsWith('en_')) {
          return 'en';
        }
      }
    }

    // 3. Fallback check via Intl API if available
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const resolvedLocale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() || '';
      if (resolvedLocale === 'vi' || resolvedLocale.startsWith('vi-') || resolvedLocale.startsWith('vi_')) {
        return 'vi';
      }
    }
  } catch (err) {
    console.warn('Unable to detect browser language, falling back to default:', err);
  }

  // Default fallback language
  return 'en';
}
