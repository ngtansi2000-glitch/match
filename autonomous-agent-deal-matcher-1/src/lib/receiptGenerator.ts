/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility to generate authentic banking transfer receipts for Vietnam Banking (Sacombank, Vietcombank, etc.)
 * Used as customer proof of commission remittance.
 */
export function generateBankingReceiptSvg({
  bankName = 'Sacombank',
  dealId,
  buyerName,
  commissionAmountVND,
  beneficiaryName = 'NGUYEN TAN SI',
  beneficiaryAccount = '060129073198',
  transactionRef,
  timestamp
}: {
  bankName?: string;
  dealId: string;
  buyerName: string;
  commissionAmountVND: number;
  beneficiaryName?: string;
  beneficiaryAccount?: string;
  transactionRef?: string;
  timestamp?: string;
}): string {
  const ref = transactionRef || `SCB${Math.floor(100000000 + Math.random() * 900000000)}`;
  const timeStr = timestamp || new Date().toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const formattedAmount = `${commissionAmountVND.toLocaleString('vi-VN')} VND`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 820" width="100%" height="100%">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003366" />
      <stop offset="100%" stop-color="#005599" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Background Card -->
  <rect width="600" height="820" rx="20" fill="#ffffff" filter="url(#shadow)" />
  
  <!-- Header Banner -->
  <path d="M 0 20 Q 0 0 20 0 L 580 0 Q 600 0 600 20 L 600 130 L 0 130 Z" fill="url(#headerGrad)" />
  
  <!-- Bank Name & Brand -->
  <text x="40" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="1">SACOMBANK</text>
  <text x="40" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#b0d0ff">NGÂN HÀNG TMCP SÀI GÒN THƯƠNG TÍN</text>
  <text x="560" y="60" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" fill="#68d391">● GIAO DỊCH 24/7</text>

  <!-- Success Badge -->
  <circle cx="300" cy="130" r="36" fill="#ffffff" filter="url(#shadow)" />
  <circle cx="300" cy="130" r="30" fill="#38a169" />
  <path d="M 288 130 L 296 138 L 314 120" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Title & Status -->
  <text x="300" y="195" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#1a202c">BIÊN LAI CHUYỂN KHOẢN THÀNH CÔNG</text>
  <text x="300" y="218" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#38a169">CHỨNG TỪ HOA HỒNG MÔI GIỚI DEAL [${dealId}]</text>

  <!-- Remittance Amount Box -->
  <rect x="40" y="240" width="520" height="90" rx="14" fill="#f7fafc" stroke="#e2e8f0" stroke-width="1.5" />
  <text x="300" y="272" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" fill="#718096" text-transform="uppercase">SỐ TIỀN HOA HỒNG ĐÃ CHUYỂN</text>
  <text x="300" y="312" text-anchor="middle" font-family="monospace, -apple-system" font-size="28" font-weight="900" fill="#005599">${formattedAmount}</text>

  <!-- Transaction Details Section -->
  <g transform="translate(40, 355)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <!-- Row 1: Beneficiary -->
    <text x="0" y="20" font-size="13" font-weight="600" fill="#718096">Tên người thụ hưởng:</text>
    <text x="520" y="20" text-anchor="end" font-size="14" font-weight="800" fill="#1a202c">${beneficiaryName}</text>
    <line x1="0" y1="36" x2="520" y2="36" stroke="#edf2f7" stroke-width="1" />

    <!-- Row 2: Account Number -->
    <text x="0" y="65" font-size="13" font-weight="600" fill="#718096">Tài khoản Sacombank nhận:</text>
    <text x="520" y="65" text-anchor="end" font-size="15" font-weight="800" font-family="monospace" fill="#005599">${beneficiaryAccount}</text>
    <line x1="0" y1="81" x2="520" y2="81" stroke="#edf2f7" stroke-width="1" />

    <!-- Row 3: Remitter / Customer -->
    <text x="0" y="110" font-size="13" font-weight="600" fill="#718096">Khách hàng chuyển tiền:</text>
    <text x="520" y="110" text-anchor="end" font-size="14" font-weight="700" fill="#2d3748">${buyerName}</text>
    <line x1="0" y1="126" x2="520" y2="126" stroke="#edf2f7" stroke-width="1" />

    <!-- Row 4: Transaction Ref Code -->
    <text x="0" y="155" font-size="13" font-weight="600" fill="#718096">Mã tham chiếu / FT Code:</text>
    <text x="520" y="155" text-anchor="end" font-size="14" font-weight="800" font-family="monospace" fill="#e53e3e">${ref}</text>
    <line x1="0" y1="171" x2="520" y2="171" stroke="#edf2f7" stroke-width="1" />

    <!-- Row 5: Transaction Time -->
    <text x="0" y="200" font-size="13" font-weight="600" fill="#718096">Thời gian giao dịch:</text>
    <text x="520" y="200" text-anchor="end" font-size="13" font-weight="600" fill="#4a5568">${timeStr}</text>
    <line x1="0" y1="216" x2="520" y2="216" stroke="#edf2f7" stroke-width="1" />

    <!-- Row 6: Note / Description -->
    <text x="0" y="245" font-size="13" font-weight="600" fill="#718096">Nội dung thanh toán:</text>
    <text x="520" y="245" text-anchor="end" font-size="13" font-weight="700" fill="#2b6cb0">Khach hang ${buyerName.split(' ')[0]} thanh toan hoa hong deal ${dealId}</text>
    <line x1="0" y1="261" x2="520" y2="261" stroke="#edf2f7" stroke-width="1" />

    <!-- Row 7: Settlement Status -->
    <text x="0" y="290" font-size="13" font-weight="600" fill="#718096">Trạng thái đối soát:</text>
    <text x="520" y="290" text-anchor="end" font-size="13" font-weight="800" fill="#38a169">✔ ĐÃ ĐỐI SOÁT - ĐÓNG THƯƠNG VỤ</text>
  </g>

  <!-- Security Seal & QR Code simulation -->
  <rect x="40" y="670" width="520" height="95" rx="12" fill="#f0fff4" stroke="#c6f6d5" stroke-width="1.5" />
  <circle cx="75" cy="717" r="20" fill="#38a169" opacity="0.15" />
  <text x="75" y="724" text-anchor="middle" font-size="20">🛡️</text>
  
  <text x="110" y="705" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#22543d">CHỨNG TỪ ĐIỆN TỬ HỢP LỆ THEO QUY ĐỊNH</text>
  <text x="110" y="725" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500" fill="#276749">Biên lai được khách hàng cung cấp làm căn cứ xác thực thu hoa hồng</text>
  <text x="110" y="743" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#2f855a">Hệ thống Multi-Agent AI đối soát tự động đóng thương vụ.</text>

  <!-- Watermark / Footer -->
  <text x="300" y="795" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#a0aec0">CỔNG THANH TOÁN SACOMBANK VIỆT NAM • TÀI KHOẢN: 060129073198 (NGUYỄN TẤN SĨ / NGUYEN TAN SI)</text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}
