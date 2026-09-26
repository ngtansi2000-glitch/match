/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TemplateParams {
  dealId: string;
  productName?: string;
  buyerName?: string;
  sellerName?: string;
  commissionFeeVND?: number;
}

/**
 * Builds the exact bilingual debt reminder notification template specified in DE NGHI TT.jpg
 * with the Deal ID prominently placed at the top.
 */
export function buildOfficialDebtReminderTemplate(params: TemplateParams): string {
  const { dealId, productName, commissionFeeVND } = params;
  
  const headerParts = [`MÃ GIAO DỊCH / DEAL ID: ${dealId}`];
  if (productName || commissionFeeVND) {
    const subParts = [];
    if (productName) subParts.push(`Sản phẩm: ${productName}`);
    if (commissionFeeVND) subParts.push(`Số tiền hoa hồng: ${commissionFeeVND.toLocaleString()} VND`);
    headerParts.push(`(${subParts.join(' | ')})`);
  }

  const header = headerParts.join('\n');

  const body = `VUI LÒNG GỞI HÌNH ẢNH LỆNH CHUYỂN THANH TOÁN THÀNH CÔNG VÀO TÀI KHOẢN:
STK: 060129073198
Tên: NGUYỄN TẤN SĨ
tại Ngân hàng Sacombank. Việt Nam
(SỐ TIỀN HOA HỒNG ĐỂ ĐÓNG CÔNG NỢ MÃ GIAO DỊCH)

PLEASE SEND THE RECEIPT OF THE PAYMENT WHICH TRANSFERS THE SUM OF COMMISSION TO:
Beneficiary Name: NGUYEN TAN SI
ACC NO.: 0601 2907 3098 (060129073198)
The bank name: SACOMBANK
Country: VIETNAM

FOR FURTHER INFORMATION. PLEASE SEND EMAIL: singuyenemail@gmail.com or WhatsApp / Zalo No. +84702499445`;

  return `${header}\n\n${body}`;
}

/**
 * Builds a warm, friendly inquiry message to the OTHER party (who is not paying the commission)
 * to verify whether the transaction match actually occurred and was executed.
 */
export function buildFriendlyCounterpartInquiry(params: {
  dealId: string;
  counterpartRole?: 'buyer' | 'seller';
  counterpartName: string;
  payingPartyName: string;
  productName: string;
}): string {
  const { dealId, counterpartName, payingPartyName, productName } = params;
  return `Kính gửi Quý đối tác ${counterpartName || 'Supplier Factory via ShopShops'},
Hệ thống kết nối giao thương B2B xin được gửi lời chào trân trọng và hỏi thăm thân thiện đến Quý đối tác!
Liên quan đến thương vụ [Mã Deal: ${dealId}] - sản phẩm: "${productName}" kết nối với đối tác ${payingPartyName}:
Xin Quý đối tác vui lòng xác nhận giúp chúng tôi: Thương vụ này giữa hai bên đã được chốt hợp đồng / thực hiện giao dịch thuận lợi chưa ạ?
Tin nhắn phản hồi xác nhận của Quý đối tác sẽ được tự động lưu vào Thư Mục Bằng Chứng Thực Hiện Thương Vụ để làm căn cứ đối soát và yêu cầu thanh toán hoa hồng theo quy chế sàn.
Trường hợp vì lý do gì đó, chưa chốt thực hiện được thương vụ. Quí Cty vui lòng phản hồi nguyên nhân. Chúng tôi sẽ gởi đến Quí Cty một đối tác khác phù hợp với yêu cầu của quí Cty
Kính chúc Quý đối tác kinh doanh hồng phát và luôn thành công!
Trân trọng cảm ơn.
Si Nguyen
Email: singuyenemail@gmail.com
Whatsapp/ Zalo No. : +84702499445`;
}
