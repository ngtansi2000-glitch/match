/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ManufacturerItem } from '../types';

export const INITIAL_MANUFACTURERS: ManufacturerItem[] = [
  {
    id: 'mfg-1',
    name: 'Công Ty Cổ Phần Công Nghệ Gia Dụng Thông Minh SmartHome Tech',
    brand: 'SmartHome Pro™ Vietnam',
    category: 'Thiết Bị Gia Dụng Thông Minh & Tiện Ích Đời Sống',
    location: 'Khu Công Nghệ Cao Hòa Lạc, Hà Nội',
    verificationBadge: 'Verified Direct Factory • ISO 9001:2015',
    rating: 4.96,
    turnoverRate: 'Vòng quay 5-7 ngày • Top 1 TikTok Shop Gia Dụng',
    capacity: '80.000 sản phẩm / tháng',
    contactPerson: 'Trần Văn Cường (Giám Đốc Cung Ứng & Phân Phối Đại Lý)',
    contactPhone: '+84 945 882 119',
    contactEmail: 'agency@smarthometech.vn',
    verifiedCertificates: ['ISO 9001:2015', 'CE Certified', 'RoHS Green', 'Quatest 1 Phê Duyệt'],
    hotProducts: [
      {
        id: 'hp-1',
        name: 'Nồi Chiên Không Dầu Hơi Nước Kép 15L Smart Steam Pro',
        category: 'Gia Dụng Bếp',
        wholesalePrice: 850000,
        suggestedRetailPrice: 1590000,
        marginPercent: 46.5,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Công nghệ hơi nước đối lưu kép 360°', 'Màn hình cảm ứng OLED tiếng Việt', '16 chế độ nấu tự động', 'Bảo hành đổi mới 12 tháng'],
        monthlySalesUnits: 14500
      },
      {
        id: 'hp-2',
        name: 'Máy Hút Bụi Cầm Tay Không Dây Siêu Hút 16000Pa Cyclone',
        category: 'Vệ Sinh Nhà Cửa',
        wholesalePrice: 280000,
        suggestedRetailPrice: 590000,
        marginPercent: 52.5,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Động cơ không chổi than 120W', 'Lọc HEPA 3 lớp rửa được', 'Pin Lithium 4000mAh dùng 45 phút', 'Đầu hút đa năng hút khe cửa & ô tô'],
        monthlySalesUnits: 28000
      },
      {
        id: 'hp-3',
        name: 'Bộ Cốc Sưởi Thông Minh Giữ Ấm 55°C Kèm Đế Sạc Không Dây 15W',
        category: 'Văn Phòng & Quà Tặng',
        wholesalePrice: 135000,
        suggestedRetailPrice: 289000,
        marginPercent: 53.3,
        salesVelocity: 'Bán Chạy Cực Nhanh',
        features: ['Tự động giữ nhiệt 55°C chuẩn vị', 'Đế sạc nhanh không dây chuẩn Qi', 'Sứ xương cao cấp nắp đậy sang trọng', 'Hộp quà tặng cao cấp có quai xách'],
        monthlySalesUnits: 19500
      }
    ],
    discountTiers: [
      {
        tier: 'regional_exclusive',
        tierName: 'Đại Lý Độc Quyền Khu Vực (Exclusive Regional Master)',
        minMonthlySalesVND: 300000000,
        discountPercent: 48,
        supportPolicy: 'Bảo hộ độc quyền khu vực địa bàn, nhà máy không bán lẻ trực tiếp, hỗ trợ 100% chi phí biển bảng & banner marketing.'
      },
      {
        tier: 'tier1_volume',
        tierName: 'Đại Lý Cấp 1 Chạy Doanh Số (Tier-1 Volume Distributor)',
        minMonthlySalesVND: 100000000,
        discountPercent: 40,
        supportPolicy: 'Thưởng bậc thang 3% khi vượt KPI tháng, gối đầu thanh toán 15 ngày qua bảo lãnh ngân hàng Sacombank, 1 đổi 1 trong 30 ngày.'
      },
      {
        tier: 'online_dropship',
        tierName: 'Đại Lý Bán Hàng Online / Affiliate Hàng Sẵn (Direct Online Agent)',
        minMonthlySalesVND: 25000000,
        discountPercent: 32,
        supportPolicy: 'Kho xưởng đóng gói gửi hàng hộ trong 2 giờ (Fulfillment by Factory), cung cấp sẵn video review TikTok triệu view & hình ảnh mẫu.'
      }
    ]
  },
  {
    id: 'mfg-2',
    name: 'Công Ty Dược Mỹ Phẩm & Chăm Sóc Sức Khỏe Sinh Học BioCosm Lab',
    brand: 'BioCosm Botanical Pharma',
    category: 'Mỹ Phẩm & Chăm Sóc Cá Nhân Hot Trend',
    location: 'Khu Công Nghiệp VSIP 1, Bình Dương',
    verificationBadge: 'CGMP-ASEAN • Bộ Y Tế Cấp Phép',
    rating: 4.98,
    turnoverRate: 'Vòng quay 4-6 ngày • Tỷ lệ mua lại 68%',
    capacity: '150.000 sản phẩm / tháng',
    contactPerson: 'Dược sĩ Nguyễn Thảo Linh (Trưởng Ban Hợp Tác Đại Lý)',
    contactPhone: '+84 918 234 567',
    contactEmail: 'partners@biocosmlab.vn',
    verifiedCertificates: ['CGMP ASEAN', 'ISO 22716', 'FDA Export Registered', 'Phiếu Công Bố Mỹ Phẩm BYT'],
    hotProducts: [
      {
        id: 'hp-4',
        name: 'Serum Tế Bào Gốc Thực Vật Niacinamide 10% Bọc Vi Nang 30ml',
        category: 'Serum Dưỡng Trắng & Mờ Thâm',
        wholesalePrice: 95000,
        suggestedRetailPrice: 285000,
        marginPercent: 66.7,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Công nghệ bọc vi nang Liposome thẩm thấu sâu', '10% Niacinamide tinh khiết Thụy Sĩ', 'Làm sáng da sau 14 ngày', 'Đầy đủ giấy kiểm nghiệm không Corticoid'],
        monthlySalesUnits: 42000
      },
      {
        id: 'hp-5',
        name: 'Máy Massage Cổ Vai Gáy Xung Điện 4D Nhiệt Hồng Ngoại EMS Relax',
        category: 'Thiết Bị Chăm Sóc Sức Khỏe',
        wholesalePrice: 230000,
        suggestedRetailPrice: 550000,
        marginPercent: 58.2,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['4 điện cực xoay ôm sát đường cong đốt sống cổ', 'Chườm ấm hồng ngoại 42°C', '6 chế độ rung và xung điện xung tần kép', 'Pin sạc Type-C dùng cả tuần'],
        monthlySalesUnits: 31000
      },
      {
        id: 'hp-6',
        name: 'Thỏi Kem Chống Nắng Phổ Rộng SPF50+ PA++++ Kháng Nước Kiềm Dầu',
        category: 'Chống Nắng & Make-up',
        wholesalePrice: 85000,
        suggestedRetailPrice: 220000,
        marginPercent: 61.4,
        salesVelocity: 'Bán Chạy Cực Nhanh',
        features: ['Dạng thỏi lăn tiện lợi không bết dính', 'Chống tia UVA/UVB và ánh sáng xanh', 'Kháng nước 80 phút thích hợp thể thao', 'Bảo quản tiện mang theo du lịch'],
        monthlySalesUnits: 26500
      }
    ],
    discountTiers: [
      {
        tier: 'regional_exclusive',
        tierName: 'Đại Lý Độc Quyền Tỉnh/Thành Phố',
        minMonthlySalesVND: 250000000,
        discountPercent: 52,
        supportPolicy: 'Độc quyền phân phối khu vực, tài trợ tủ kệ quầy thuốc/spa/cửa hàng mỹ phẩm, bảo hiểm trách nhiệm sản phẩm 2 tỷ đồng.'
      },
      {
        tier: 'tier1_volume',
        tierName: 'Đại Lý Phân Phối Cấp 1 (Chuỗi Nhà Thuốc / Spa / Bán Lẻ)',
        minMonthlySalesVND: 80000000,
        discountPercent: 44,
        supportPolicy: 'Cung cấp toàn bộ tài liệu lâm sàng, hồ sơ công bố BYT có dấu đỏ, hỗ trợ đào tạo chuyên môn định kỳ hàng tuần.'
      },
      {
        tier: 'online_dropship',
        tierName: 'Đại Lý Bán Lẻ Online & Livestream KOC/KOL',
        minMonthlySalesVND: 20000000,
        discountPercent: 35,
        supportPolicy: 'Tài trợ mẫu thử test sản phẩm miễn phí cho KOC livestream, kho xuất hóa đơn điện tử VAT từng đơn hàng.'
      }
    ]
  },
  {
    id: 'mfg-3',
    name: 'Tập Đoàn Chế Biến Thực Phẩm Sức Khỏe & Healthy Snacks NutriFarm',
    brand: 'NutriFarm Organic Vietnam',
    category: 'Thực Phẩm Tiêu Dùng Nhanh (FMCG) & Healthy Snacks',
    location: 'Khu Công Nghiệp Long Hậu, Cần Giuộc, Long An',
    verificationBadge: 'HACCP • ISO 22000 • FDA USA',
    rating: 4.95,
    turnoverRate: 'Vòng quay 7-10 ngày • Hàng tiêu dùng ngày',
    capacity: '120 tấn thành phẩm / tháng',
    contactPerson: 'Võ Minh Nhật (Giám Đốc Khối B2B & Đại Lý Toàn Quốc)',
    contactPhone: '+84 909 334 889',
    contactEmail: 'b2b@nutrifarmfood.com',
    verifiedCertificates: ['HACCP Certified', 'ISO 22000:2018', 'FDA Food Facility Registration', 'Chứng nhận OCOP 4 sao'],
    hotProducts: [
      {
        id: 'hp-7',
        name: 'Thanh Hạt Granola Nướng Mật Ong Hoa Nhãn Sấy Thăng Hoa Hộp 500g',
        category: 'Healthy Diet Snack',
        wholesalePrice: 68000,
        suggestedRetailPrice: 145000,
        marginPercent: 53.1,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['85% hạt dinh dưỡng (Hạnh nhân, óc chó, hạt điều, hạt bí)', 'Không đường tinh luyện - ngọt từ mật ong hoa nhãn', 'Bổ sung chất xơ hòa tan tốt cho tiêu hóa', 'Hũ nắp nhôm giật bảo quản giòn rụm 12 tháng'],
        monthlySalesUnits: 55000
      },
      {
        id: 'hp-8',
        name: 'Hạt Điều Lụa Rang Muối Củi Xuất Khẩu Loại A+ Hộp 500g',
        category: 'Đặc Sản Xuất Khẩu',
        wholesalePrice: 92000,
        suggestedRetailPrice: 175000,
        marginPercent: 47.4,
        salesVelocity: 'Bán Chạy Cực Nhanh',
        features: ['100% hạt điều Bình Phước tuyển chọn hạt to đều', 'Rang củi thủ công giữ trọn vị bùi ngậy thơm lừng', 'Hút chân không kèm tem chống hàng giả', 'Đạt chuẩn xuất khẩu Châu Âu & Mỹ'],
        monthlySalesUnits: 38000
      },
      {
        id: 'hp-9',
        name: 'Trà Dưỡng Nhan Đông Trùng Tứ Vị Túi Lọc Cao Cấp Hộp 30 Gói',
        category: 'Trà Thảo Mộc Sức Khỏe',
        wholesalePrice: 55000,
        suggestedRetailPrice: 135000,
        marginPercent: 59.3,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Đông trùng hạ thảo, táo đỏ tân cương, kỷ tử, hoa cúc vàng', 'Túi lọc tam giác màng ngô sinh học an toàn', 'Vị thanh ngọt tự nhiên không gắt', 'Bán cực chạy trên sàn TMĐT'],
        monthlySalesUnits: 48000
      }
    ],
    discountTiers: [
      {
        tier: 'regional_exclusive',
        tierName: 'Tổng Đại Lý Phân Phối Độc Quyền Miền/Tỉnh',
        minMonthlySalesVND: 350000000,
        discountPercent: 45,
        supportPolicy: 'Chiết khấu cao nhất, độc quyền kênh siêu thị/tạp hóa/cửa hàng thực phẩm sạch, hỗ trợ cước vận chuyển container toàn quốc.'
      },
      {
        tier: 'tier1_volume',
        tierName: 'Đại Lý Cấp 1 Phân Phối Doanh Số Sỉ',
        minMonthlySalesVND: 90000000,
        discountPercent: 38,
        supportPolicy: 'Thưởng doanh số quý tới 5%, hỗ trợ đổi trả hàng cận date trước 60 ngày, đóng gói theo yêu cầu thương hiệu đại lý.'
      },
      {
        tier: 'online_dropship',
        tierName: 'Đại Lý Bán Lẻ TikTok Shop & E-Commerce',
        minMonthlySalesVND: 20000000,
        discountPercent: 30,
        supportPolicy: 'Kho trung tâm Long An & Hà Nội xử lý đơn ship hỏa tốc, cung cấp hình ảnh/video unboxing chuyên nghiệp.'
      }
    ]
  },
  {
    id: 'mfg-4',
    name: 'Xưởng Điện Tử & Phụ Kiện Tiện Ích Công Nghệ MegaCharge',
    brand: 'MegaCharge Innovation',
    category: 'Phụ Kiện Công Nghệ & Tiện Ích Livestream',
    location: 'Khu Công Nghiệp Quế Võ, Bắc Ninh',
    verificationBadge: 'Verified Supplier • Bảo Hành 1 Đổi 1 12 Tháng',
    rating: 4.94,
    turnoverRate: 'Vòng quay 5-8 ngày • Chốt đơn livestream cực dễ',
    capacity: '200.000 phụ kiện / tháng',
    contactPerson: 'Đặng Quốc Huy (Trưởng Phòng Kinh Doanh Phân Phối)',
    contactPhone: '+84 972 556 778',
    contactEmail: 'distribution@megacharge.vn',
    verifiedCertificates: ['FCC', 'CE', 'RoHS', 'QC Pass 100%'],
    hotProducts: [
      {
        id: 'hp-10',
        name: 'Củ Sạc Nhanh GaN 65W Pro 3 Cổng (2 Type-C + 1 USB) Sạc Laptop & Điện Thoại',
        category: 'Phụ Kiện Điện Tử',
        wholesalePrice: 165000,
        suggestedRetailPrice: 380000,
        marginPercent: 56.6,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Công nghệ bán dẫn GaN thế hệ mới tản nhiệt mát lạnh', 'Công suất 65W sạc được MacBook và mọi điện thoại', 'Bảo vệ quá dòng, quá nhiệt, quá tải 8 lớp', 'Kích thước siêu nhỏ gọn đút vừa túi áo'],
        monthlySalesUnits: 45000
      },
      {
        id: 'hp-11',
        name: 'Giá Đỡ Điện Thoại Xoay 360° AI Nhận Diện Khuôn Mặt Tự Động Quay Video',
        category: 'Dụng Cụ Livestream & Sáng Tạo Nội Dung',
        wholesalePrice: 185000,
        suggestedRetailPrice: 420000,
        marginPercent: 55.9,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Camera AI tích hợp tự nhận diện và xoay theo mặt', 'Không cần tải app, tương thích mọi điện thoại và app', 'Chân đế có ren bắt tripod tiện lợi', 'Pin dùng liên tục 8 giờ sáng tạo nội dung'],
        monthlySalesUnits: 36000
      },
      {
        id: 'hp-12',
        name: 'Cáp Sạc Nhanh Đa Năng Từ Tính 3 Trong 1 (Lightning / Type-C / Micro)',
        category: 'Cáp Dây Sạc',
        wholesalePrice: 42000,
        suggestedRetailPrice: 120000,
        marginPercent: 65.0,
        salesVelocity: 'Bán Chạy Cực Nhanh',
        features: ['Đầu nam châm hít cực mạnh chống đứt gãy chân sạc', 'Dây bọc dù bện sợi Kevlar chịu kéo 50kg', 'Đèn LED báo trạng thái ban đêm', 'Sản phẩm mồi câu phễu bán số lượng lớn'],
        monthlySalesUnits: 72000
      }
    ],
    discountTiers: [
      {
        tier: 'regional_exclusive',
        tierName: 'Nhà Phân Phối Độc Quyền Tỉnh Thành',
        minMonthlySalesVND: 200000000,
        discountPercent: 45,
        supportPolicy: 'Chính sách bảo hành 1 đổi 1 tận nơi trong 12 tháng, bảo hộ kênh chuỗi cửa hàng điện máy, in logo đại lý miễn phí với đơn lớn.'
      },
      {
        tier: 'tier1_volume',
        tierName: 'Đại Lý Cấp 1 Phân Phối Cửa Hàng Phụ Kiện',
        minMonthlySalesVND: 50000000,
        discountPercent: 38,
        supportPolicy: 'Thanh toán linh hoạt qua cổng Sacombank, cung cấp giá kệ trưng bày mica đèn LED sang trọng.'
      },
      {
        tier: 'online_dropship',
        tierName: 'Đại Lý Online & Sàn Thương Mại Điện Tử',
        minMonthlySalesVND: 15000000,
        discountPercent: 28,
        supportPolicy: 'Tự động đồng bộ tồn kho API, cung cấp bộ video 4K quay sản phẩm phục vụ chạy Ads.'
      }
    ]
  },
  {
    id: 'mfg-5',
    name: 'Hợp Tác Xã Dệt May Lụa Tơ Tằm Thủ Công Truyền Thống Vạn Phúc - Hà Đông',
    brand: 'Ha Dong Silk Craft Heritage',
    category: 'Thời Trang Lụa Tự Nhiên & Thời Trang Thiết Kế',
    location: 'Làng Nghề Vạn Phúc, Hà Đông, Hà Nội',
    verificationBadge: 'Di Sản Làng Nghề • 100% Tơ Tằm Tự Nhiên',
    rating: 4.97,
    turnoverRate: 'Vòng quay 8-12 ngày • Giá trị đơn hàng cao',
    capacity: '25.000 sản phẩm / tháng',
    contactPerson: 'Nghệ nhân Phạm Văn Phong (Chủ Nhiệm Hợp Tác Xã)',
    contactPhone: '+84 983 112 233',
    contactEmail: 'phong@hadongsilk.vn',
    verifiedCertificates: ['Chứng nhận Làng nghề Truyền thống Hà Nội', 'Kiểm nghiệm 100% Tơ Tằm Viện Dệt May', 'CO Xuất Xứ Hàng Hóa'],
    hotProducts: [
      {
        id: 'hp-13',
        name: 'Khăn Lụa Tơ Tằm Dệt Tay Họa Tiết Vân Sen Truyền Thống 180x90cm',
        category: 'Khăn Lụa Quà Tặng Cao Cấp',
        wholesalePrice: 280000,
        suggestedRetailPrice: 650000,
        marginPercent: 56.9,
        salesVelocity: 'Bán Chạy Cực Nhanh',
        features: ['100% tơ tằm Bảo Lộc dệt tay mềm mướt bay bổng', 'Nhuộm màu tự nhiên không kích ứng da', 'Hộp quà nắp nam châm kèm thiệp cảm ơn', 'Mặt hàng quà tặng doanh nghiệp bán chạy quanh năm'],
        monthlySalesUnits: 12000
      },
      {
        id: 'hp-14',
        name: 'Áo Thun Nam Nữ Compact Cotton 100% Kháng Khuẩn Không Bai Xù',
        category: 'Thời Trang Cơ Bản Hàng Ngày',
        wholesalePrice: 85000,
        suggestedRetailPrice: 195000,
        marginPercent: 56.4,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Sợi Compact Cotton chải kỹ định lượng 230gsm', 'Công nghệ dệt tròn không đường may sườn hông', 'Xử lý kháng khuẩn Nano Bạc ngăn mùi mồ hôi', 'Màu sắc basic dễ bán, tỷ lệ đổi trả < 1%'],
        monthlySalesUnits: 38000
      }
    ],
    discountTiers: [
      {
        tier: 'regional_exclusive',
        tierName: 'Đại Lý Độc Quyền Showroom / Boutique Thời Trang',
        minMonthlySalesVND: 180000000,
        discountPercent: 42,
        supportPolicy: 'Bảo hộ thiết kế độc quyền, nhận gia công thêu logo doanh nghiệp quà tặng, miễn phí đổi mẫu mã chậm bán sau 45 ngày.'
      },
      {
        tier: 'tier1_volume',
        tierName: 'Đại Lý Phân Phối Cửa Hàng Thời Trang',
        minMonthlySalesVND: 60000000,
        discountPercent: 35,
        supportPolicy: 'Cung cấp ảnh lookbook người mẫu chuẩn studio, hỗ trợ trả hàng lỗi đường may 100% vô điều kiện.'
      },
      {
        tier: 'online_dropship',
        tierName: 'Đại Lý Online & Bán Lẻ Mạng Xã Hội',
        minMonthlySalesVND: 15000000,
        discountPercent: 26,
        supportPolicy: 'Hỗ trợ đóng hộp quà nơ sang trọng gửi thẳng đến người nhận của khách hàng.'
      }
    ]
  },
  {
    id: 'mfg-6',
    name: 'Công Ty Sản Xuất Gia Dụng Sinh Học & Đồ Tre GreenLife Vietnam',
    brand: 'GreenLife Eco Bamboo',
    category: 'Gia Dụng Bền Vững & Đồ Dùng Thân Thiện Môi Trường',
    location: 'Cụm Công Nghiệp An Hiệp, Châu Thành, Bến Tre',
    verificationBadge: 'FSC Certified • Xuất Khẩu Nhật Bản & Hàn Quốc',
    rating: 4.93,
    turnoverRate: 'Vòng quay 7-10 ngày • Xu hướng sống xanh thịnh hành',
    capacity: '60.000 bộ sản phẩm / tháng',
    contactPerson: 'Lê Hoàng Nam (Phụ Trách Kênh Đại Lý B2B)',
    contactPhone: '+84 934 778 990',
    contactEmail: 'contact@greenlifebamboo.vn',
    verifiedCertificates: ['FSC-CoC Chứng chỉ Tre Bền Vững', 'SGS Test Kháng Khuẩn Tự Nhiên', 'FDA Food Contact Safe'],
    hotProducts: [
      {
        id: 'hp-15',
        name: 'Bộ 4 Hộp Bảo Quản Thực Phẩm Sợi Tre Nắp Chân Không Chống Trào',
        category: 'Hộp Đựng Thực Phẩm',
        wholesalePrice: 145000,
        suggestedRetailPrice: 320000,
        marginPercent: 54.7,
        salesVelocity: 'Viral Hot (Cháy Hàng)',
        features: ['Vật liệu sợi tre sinh học tự phân hủy', 'Gioăng silicone nắp cài 4 cạnh kín khí 100%', 'Dùng được lò vi sóng và máy rửa bát', 'Kháng nấm mốc tự nhiên không bám mùi thức ăn'],
        monthlySalesUnits: 24000
      },
      {
        id: 'hp-16',
        name: 'Bộ Dụng Cụ Bếp Nấu Ăn Gỗ Muồng & Tre Tự Nhiên 7 Món Kèm Giá Cắm',
        category: 'Dụng Cụ Phòng Bếp',
        wholesalePrice: 115000,
        suggestedRetailPrice: 260000,
        marginPercent: 55.8,
        salesVelocity: 'Bán Chạy Cực Nhanh',
        features: ['Gỗ nguyên khối tiện thủ công mài nhẵn mịn', 'Không sơn phủ hóa chất độc hại', 'Chịu nhiệt độ cao không làm trầy chảo chống dính', 'Kèm ống cắm thoát nước tiện lợi'],
        monthlySalesUnits: 18500
      }
    ],
    discountTiers: [
      {
        tier: 'regional_exclusive',
        tierName: 'Đại Lý Độc Quyền Khu Vực Phân Phối Chuỗi Xanh',
        minMonthlySalesVND: 150000000,
        discountPercent: 40,
        supportPolicy: 'Tài trợ quầy kệ trưng bày phong cách eco-friendly, bảo hộ thị trường các siêu thị xanh và chuỗi homestay/resort.'
      },
      {
        tier: 'tier1_volume',
        tierName: 'Đại Lý Cấp 1 Phân Phối Gia Dụng',
        minMonthlySalesVND: 50000000,
        discountPercent: 32,
        supportPolicy: 'Hỗ trợ in khắc laser logo đại lý/doanh nghiệp làm quà tặng sự kiện miễn phí, thanh toán linh hoạt Sacombank.'
      },
      {
        tier: 'online_dropship',
        tierName: 'Đại Lý Online & Bán Hàng Xã Hội',
        minMonthlySalesVND: 15000000,
        discountPercent: 24,
        supportPolicy: 'Hỗ trợ tư liệu truyền thông lối sống xanh, video viral câu chuyện xưởng nghề mộc tre.'
      }
    ]
  }
];
