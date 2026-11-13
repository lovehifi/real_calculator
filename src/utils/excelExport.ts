import * as XLSX from 'xlsx';
import { AppPreferences, CalculationResult, ModelInputs, ProductCode } from '../types/model';
import { PRODUCT_NAMES, t } from '../data/i18n';

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function round0(n: number): number {
  return Math.round(Number(n) || 0);
}

export function exportProjectToExcel(
  inputs: ModelInputs,
  result: CalculationResult,
  prefs: AppPreferences
): void {
  const { lang } = prefs;
  const { planning, dev, pl, financing, debtMetrics, summary, cf, tornado, sens, checks } = result;
  const wb = XLSX.utils.book_new();
  const startYear = inputs.model_start_year;

  // Sheet 1: Executive Summary & P&L
  const summaryRows: (string | number)[][] = [
    [t(lang, 'HỒ SƠ THẨM ĐỊNH TÀI CHÍNH DỰ ÁN BĐS (40 QUÝ)', 'REAL ESTATE FINANCIAL APPRAISAL (40Q)')],
    [t(lang, 'Tên dự án', 'Project Name'), inputs.projectName],
    [t(lang, 'Năm bắt đầu mô hình', 'Model Start Year'), startYear],
    [t(lang, 'Đơn vị tiền tệ gốc', 'Base Currency Unit'), t(lang, 'Triệu đồng (VNDm)', 'VND Million')],
    [],
    [t(lang, 'I. CHỈ SỐ HIỆU QUẢ ĐẦU TƯ CHÍNH', 'I. KEY INVESTMENT KPIs'), t(lang, 'Giá trị', 'Value'), t(lang, 'Đơn vị', 'Unit')],
    [t(lang, 'Tổng doanh thu hợp đồng (chưa VAT)', 'Contracted Revenue (ex. VAT)'), round0(pl.revenue), 'VNDm'],
    [t(lang, 'Tổng chi phí đầu tư (chưa VAT, gồm lãi vay)', 'Total Project Cost (ex. CIT)'), round0(summary.perf.cost), 'VNDm'],
    [t(lang, 'Lợi nhuận sau thuế (LNST / PAT)', 'Profit After Tax (PAT)'), round0(pl.pat), 'VNDm'],
    [t(lang, 'Biên lợi nhuận sau thuế', 'Net Profit Margin'), round2(pl.patMargin * 100), '%'],
    [t(lang, 'Vốn chủ sở hữu yêu cầu', 'Required Shareholder Equity'), round0(financing.equity), 'VNDm'],
    [t(lang, 'ROE dự án', 'Project ROE'), round2(summary.perf.roe * 100), '%'],
    [t(lang, 'IRR vốn chủ sở hữu (năm)', 'Annual Equity IRR'), round2(summary.perf.irr * 100), '%'],
    [t(lang, 'NPV (@ tỷ lệ chiết khấu)', 'Project NPV'), round0(summary.perf.npv), 'VNDm'],
    [t(lang, 'Thời gian hoàn vốn', 'Payback Period'), summary.perf.paybackYears !== null ? round2(summary.perf.paybackYears) : '-', t(lang, 'năm', 'years')],
    [],
    [t(lang, 'II. AN TOÀN NỢ & ĐỘ PHỦ DÒNG TIỀN (DSCR)', 'II. DEBT SAFETY & COVERAGE'), t(lang, 'Giá trị', 'Value'), t(lang, 'Đơn vị', 'Unit')],
    [t(lang, 'Tổng vay giải ngân', 'Total Debt Drawn'), round0(financing.totalLoan), 'VNDm'],
    [t(lang, 'Đỉnh dư nợ vay tại một thời điểm', 'Peak Debt Balance'), round0(debtMetrics.peakDebt), debtMetrics.peakDebtQuarter ? `Q${debtMetrics.peakDebtQuarter}` : '-'],
    [t(lang, 'Đỉnh giải ngân âm lũy kế VCSH', 'Peak Equity Exposure'), round0(debtMetrics.peakEquityExposure), debtMetrics.peakEquityQuarter ? `Q${debtMetrics.peakEquityQuarter}` : '-'],
    [t(lang, 'DSCR tối thiểu giai đoạn trả gốc', 'Minimum Repayment DSCR'), debtMetrics.minDscr !== null ? round2(debtMetrics.minDscr) : '-', 'x'],
    [t(lang, 'DSCR bình quân giai đoạn trả nợ', 'Average Repayment DSCR'), debtMetrics.avgDscr !== null ? round2(debtMetrics.avgDscr) : '-', 'x'],
    [],
    [t(lang, 'III. BÁO CÁO KẾT QUẢ KINH DOANH (P&L)', 'III. PROFIT & LOSS STATEMENT'), t(lang, 'Triệu đồng', 'VNDm'), t(lang, '% Doanh thu', '% Rev')],
    [t(lang, 'Doanh thu thuần hợp đồng', 'Net Contracted Revenue'), round0(pl.revenue), 100],
    [t(lang, 'Giá vốn (Đất + Xây dựng + Tư vấn + Dự phòng)', 'Cost of Goods Sold'), round0(-pl.cogs), round2(pl.revenue > 0 ? (-pl.cogs / pl.revenue) * 100 : 0)],
    [t(lang, 'Lợi nhuận gộp', 'Gross Profit'), round0(pl.gp), round2(pl.gpMargin * 100)],
    [t(lang, 'Chi phí bán hàng, nhà mẫu, pháp lý & QLDN', 'Operating & Selling Expenses'), round0(-pl.opex), round2(pl.revenue > 0 ? (-pl.opex / pl.revenue) * 100 : 0)],
    [t(lang, 'Lợi nhuận hoạt động (EBIT)', 'Operating Profit (EBIT)'), round0(pl.ebit), round2(pl.ebitMargin * 100)],
    [t(lang, 'Chi phí lãi vay', 'Interest Expense'), round0(-pl.interest), round2(pl.revenue > 0 ? (-pl.interest / pl.revenue) * 100 : 0)],
    [t(lang, 'Lợi nhuận trước thuế (PBT)', 'Profit Before Tax (PBT)'), round0(pl.pbt), round2(pl.revenue > 0 ? (pl.pbt / pl.revenue) * 100 : 0)],
    [t(lang, 'Thuế TNDN (CIT)', 'Corporate Income Tax (CIT)'), round0(-pl.cit), round2(pl.revenue > 0 ? (-pl.cit / pl.revenue) * 100 : 0)],
    [t(lang, 'Lợi nhuận sau thuế (PAT)', 'Profit After Tax (PAT)'), round0(pl.pat), round2(pl.patMargin * 100)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 48 }, { wch: 22 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '1_TongQuan_KPI');

  // Sheet 2: Assumptions & Planning Output
  const assumptionRows: (string | number)[][] = [
    [t(lang, 'NHÓM', 'SECTION'), t(lang, 'THÔNG SỐ GIẢ ĐỊNH', 'INPUT PARAMETER'), t(lang, 'GIÁ TRỊ', 'VALUE'), t(lang, 'ĐƠN VỊ', 'UNIT')],
    ['A. Land', t(lang, 'Đất cao tầng', 'High-rise land area'), inputs.highrise_land_area, 'm²'],
    ['A. Land', t(lang, 'Đất Shophouse thấp tầng', 'Low-rise shop land'), inputs.lowrise_shop_land, 'm²'],
    ['A. Land', t(lang, 'Đất Nhà liên kế', 'Townhouse land'), inputs.townhouse_land, 'm²'],
    ['A. Land', t(lang, 'Đất Biệt thự', 'Villa land'), inputs.villa_land, 'm²'],
    ['A. Land', t(lang, 'Đất giao thông & cây xanh thấp tầng', 'Low-rise road & green'), inputs.lowrise_road_green, 'm²'],
    ['A. Land', t(lang, 'Tổng diện tích đất dự án (tính toán)', 'Total project land (calc)'), planning.land.total, 'm²'],
    ['B. High-Rise', t(lang, 'Phương pháp quy hoạch', 'Sizing method'), inputs.design_method, '-'],
    ['B. High-Rise', t(lang, 'Dân số cao tầng', 'High-rise population'), round0(planning.high.population), t(lang, 'người', 'ppl')],
    ['B. High-Rise', t(lang, 'Tổng FAR cao tầng', 'Total High-rise FAR'), round2(planning.high.far), 'x'],
    ['B. High-Rise', t(lang, 'Tổng diện tích sàn XD (CFA)', 'Total High-rise CFA'), round0(planning.high.cfa), 'm²'],
    ['B. High-Rise', t(lang, 'Tổng diện tích thương phẩm cao tầng', 'High-rise Saleable Area'), round0(planning.high.nsa), 'm²'],
    ['B. High-Rise', t(lang, 'Số tầng hầm / tầng nổi', 'Basement / Above-ground storeys'), `${planning.high.basementLevels} / ${planning.high.storeys}`, t(lang, 'tầng', 'fl')],
    ['D. Cost', t(lang, 'Đơn giá nhận chuyển nhượng đất', 'Land transfer unit price'), inputs.land_transfer_unit_price, 'VNDm/m²'],
    ['D. Cost', t(lang, 'Tiền sử dụng đất (LUF)', 'Land use fee (LUF)'), inputs.land_use_fee, 'VNDm'],
    ['D. Cost', t(lang, 'Suất đầu tư hạ tầng', 'Infrastructure unit rate'), inputs.infrastructure_unit_rate, 'VNDm/m²'],
    ['D. Cost', t(lang, 'Suất đầu tư xây dựng cao tầng', 'High-rise build cost rate'), inputs.highrise_build_cost_rate, 'VNDm/m²'],
    ['D. Cost', t(lang, 'Suất đầu tư XD Shophouse / LK / BT', 'Low-rise build cost rates'), `${inputs.lowrise_shop_build_cost_rate} / ${inputs.townhouse_build_cost_rate} / ${inputs.villa_build_cost_rate}`, 'VNDm/m²'],
    ['D. Cost', t(lang, 'Tổng chi phí phát triển (chưa VAT)', 'Total Dev Cost (ex. VAT)'), round0(dev.totalExVat), 'VNDm'],
    ['E. Pricing', t(lang, 'Giá bán gốc căn hộ', 'Apartment base price'), inputs.apartment_base_selling_price, 'VNDm/m²'],
    ['E. Pricing', t(lang, 'Giá bán gốc shophouse khối đế', 'Podium shop base price'), inputs.podium_shop_base_selling_price, 'VNDm/m²'],
    ['E. Pricing', t(lang, 'Tăng giá bán theo năm', 'Annual price escalation'), round2(inputs.selling_price_escalation * 100), '%'],
    ['F. Finance', t(lang, 'Tỷ lệ vay đất / vay xây dựng', 'Land / Constr loan ratio'), `${round2(inputs.land_loan_ratio * 100)}% / ${round2(inputs.constr_loan_ratio * 100)}%`, '%'],
    ['F. Finance', t(lang, 'Lãi suất vay năm / Chiết khấu VCSH', 'Interest rate / Discount rate'), `${round2(inputs.annual_loan_interest_rate * 100)}% / ${round2(inputs.equity_discount_rate * 100)}%`, '%'],
    ['F. Tax', t(lang, 'Thuế TNDN / Thuế GTGT', 'CIT / VAT rate'), `${round2(inputs.cit_rate * 100)}% / ${round2(inputs.vat_rate * 100)}%`, '%'],
  ];
  const wsAssumptions = XLSX.utils.aoa_to_sheet(assumptionRows);
  wsAssumptions['!cols'] = [{ wch: 14 }, { wch: 42 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsAssumptions, '2_GiaDinh_ThietKe');

  // Sheet 3: 40-Quarter Schedule (%)
  const qHeaders = Array.from({ length: 40 }, (_, q) => `Q${q + 1} (${startYear + Math.floor(q / 4)})`);
  const tlRows: (string | number)[][] = [
    [t(lang, 'Hạng mục tiến độ (%)', 'Schedule Row (%)'), t(lang, 'Tổng (%)', 'Total (%)'), ...qHeaders],
  ];
  const pushTl = (label: string, arr: number[]) => {
    const sumPct = round2(arr.reduce((a, b) => a + b, 0) * 100);
    tlRows.push([label, sumPct, ...arr.map((v) => round2(v * 100))]);
  };
  pushTl(t(lang, 'Thanh toán tiền đất', 'Land Payment'), inputs.timeline.land);
  pushTl(t(lang, 'Nộp Tiền sử dụng đất (LUF)', 'LUF Payment'), inputs.timeline.luf);
  pushTl(t(lang, 'Thiết kế & Pháp lý', 'Design & Legal'), inputs.timeline.design_legal);
  pushTl(t(lang, 'Nhà mẫu (Sales Gallery)', 'Sales Gallery'), inputs.timeline.gallery);
  pushTl(t(lang, 'Hạ tầng kỹ thuật', 'Site Infrastructure'), inputs.timeline.infra);
  const prods: ProductCode[] = ['ls', 'th', 'vl', 'ps', 'ap'];
  for (const p of prods) {
    const pName = lang === 'vi' ? PRODUCT_NAMES[p].vi : PRODUCT_NAMES[p].en;
    pushTl(`${t(lang, 'Xây dựng', 'Construction')} - ${pName}`, inputs.timeline.construction[p]);
  }
  for (const p of prods) {
    const pName = lang === 'vi' ? PRODUCT_NAMES[p].vi : PRODUCT_NAMES[p].en;
    pushTl(`${t(lang, 'Bán hàng', 'Sales')} - ${pName}`, inputs.timeline.sales[p]);
  }
  for (const p of prods) {
    const pName = lang === 'vi' ? PRODUCT_NAMES[p].vi : PRODUCT_NAMES[p].en;
    pushTl(`${t(lang, 'Thu tiền', 'Collection')} - ${pName}`, inputs.timeline.collection[p]);
  }
  const wsTimeline = XLSX.utils.aoa_to_sheet(tlRows);
  wsTimeline['!cols'] = [{ wch: 36 }, { wch: 11 }, ...Array.from({ length: 40 }, () => ({ wch: 10 }))];
  XLSX.utils.book_append_sheet(wb, wsTimeline, '3_TienDo_40Quy');

  // Full Cash Flow line definitions (used for both 40Q and 10Y sheets)
  const cfLines: [string, string, { q: number[]; years: number[]; total: number }][] = [
    ['I. TỔNG DÒNG TIỀN THU VÀO', 'I. TOTAL CASH INFLOW', cf.inflow],
    ['1. Tiền thu bán hàng (chưa VAT)', '1. Customer Sales Collections (ex. VAT)', cf.revenue],
    ['2. Thuế GTGT đầu ra thu từ KH', '2. Output VAT Collected', cf.outVat],
    ['3. Dòng tiền huy động vốn', '3. Financing Inflows', cf.finIn],
    ['  - Giải ngân vay mua đất', '  - Land loan drawdown', cf.ldraw],
    ['  - Giải ngân vay xây dựng', '  - Construction loan drawdown', cf.cdraw],
    ['  - Góp vốn chủ sở hữu', '  - Shareholder equity contribution', cf.equity],
    ['II. TỔNG DÒNG TIỀN CHI RA', 'II. TOTAL CASH OUTFLOW', cf.outflow],
    ['1. Chi phí đất & TSDĐ', '1. Land Acquisition & LUF', cf.landAcq],
    ['  - Tiền chuyển nhượng đất', '  - Land transfer payment', cf.landTransfer],
    ['  - Tiền sử dụng đất (LUF)', '  - Land use fee payment', cf.luf],
    ['2. Xây dựng, hạ tầng, tư vấn & dự phòng', '2. Construction & Soft Costs', cf.dev],
    ['  - Hạ tầng kỹ thuật', '  - Site infrastructure', cf.infra],
    ['  - XD Shophouse thấp tầng', '  - Low-rise shophouse build', cf.constrLs],
    ['  - XD Nhà liên kế', '  - Townhouse build', cf.constrTh],
    ['  - XD Biệt thự', '  - Villa build', cf.constrVl],
    ['  - XD Shophouse khối đế', '  - Podium shophouse build', cf.constrPs],
    ['  - XD Căn hộ chung cư', '  - Apartment build', cf.constrAp],
    ['  - Tư vấn thiết kế', '  - Design fee', cf.design],
    ['  - Quản lý dự án & giám sát', '  - Project management', cf.pm],
    ['  - Dự phòng xây dựng', '  - Contingency', cf.cont],
    ['3. Hoạt động, bán hàng & pháp lý', '3. Operating, Selling & Legal', cf.opex],
    ['  - Chi phí pháp lý', '  - Legal & permits', cf.legal],
    ['  - Nhà mẫu (Sales Gallery)', '  - Sales gallery', cf.gallery],
    ['  - Hoa hồng bán hàng', '  - Sales commission', cf.comm],
    ['  - Tiếp thị & truyền thông', '  - Marketing', cf.mkt],
    ['  - Quản lý doanh nghiệp (G&A)', '  - G&A', cf.ga],
    ['4. Thuế nộp ngân sách', '4. Taxes Paid', cf.taxes],
    ['  - Thuế GTGT đầu vào', '  - Input VAT paid', cf.inVat],
    ['  - Thuế GTGT thực nộp', '  - Net VAT remitted', cf.vatPaid],
    ['  - Thuế TNDN (CIT)', '  - Corporate income tax', cf.cit],
    ['5. Nghĩa vụ nợ & Cổ tức', '5. Debt Service & Dividends', cf.finOut],
    ['  - Trả lãi vay', '  - Interest paid', cf.interest],
    ['  - Trả nợ gốc vay', '  - Principal repayment', cf.principal],
    ['  - Chia cổ tức & hoàn vốn CSH', '  - Dividend distribution', cf.dist],
    ['III. DÒNG TIỀN RÒNG TRONG KỲ', 'III. NET CASH FLOW', cf.net],
    ['Số dư tiền mặt đầu kỳ', 'Opening Cash Balance', cf.open],
    ['Số dư tiền mặt cuối kỳ', 'Ending Cash Balance', cf.end],
    ['IV. DÒNG TIỀN VỐN CHỦ SỞ HỮU (FCFE)', 'IV. FREE CASH FLOW TO EQUITY (FCFE)', cf.fcfe],
    ['Lũy kế FCFE', 'Cumulative FCFE', cf.cumFcfe],
    ['Dư nợ vay cuối kỳ', 'Ending Debt Balance', cf.debtBalance],
  ];

  // Sheet 4: 40-Quarter Cash Flow
  const cf40Rows: (string | number)[][] = [
    [t(lang, 'Khoản mục Dòng tiền (Triệu đồng)', 'Cash Flow Line Item (VNDm)'), t(lang, 'Tổng cộng', 'Total'), ...qHeaders],
    ...cfLines.map(([vi, en, row]) => [
      lang === 'vi' ? vi : en,
      round0(row.total),
      ...row.q.map(round0),
    ]),
  ];
  const wsCf40 = XLSX.utils.aoa_to_sheet(cf40Rows);
  wsCf40['!cols'] = [{ wch: 40 }, { wch: 15 }, ...Array.from({ length: 40 }, () => ({ wch: 13 }))];
  XLSX.utils.book_append_sheet(wb, wsCf40, '4_DongTien_40Quy');

  // Sheet 5: 10-Year Annual Cash Flow
  const yHeaders = Array.from({ length: 10 }, (_, y) => `${t(lang, 'Năm', 'Year')} ${y + 1} (${startYear + y})`);
  const cf10Rows: (string | number)[][] = [
    [t(lang, 'Khoản mục Dòng tiền (Triệu đồng)', 'Cash Flow Line Item (VNDm)'), t(lang, 'Tổng cộng', 'Total'), ...yHeaders],
    ...cfLines.map(([vi, en, row]) => [
      lang === 'vi' ? vi : en,
      round0(row.total),
      ...row.years.map(round0),
    ]),
  ];
  const wsCf10 = XLSX.utils.aoa_to_sheet(cf10Rows);
  wsCf10['!cols'] = [{ wch: 40 }, { wch: 15 }, ...Array.from({ length: 10 }, () => ({ wch: 15 }))];
  XLSX.utils.book_append_sheet(wb, wsCf10, '5_DongTien_10Nam');

  // Sheet 6: Audit Checks & Sensitivity
  const auditRows: (string | number)[][] = [
    [t(lang, 'I. KIỂM TOÁN QUY CHUẨN & CÂN ĐỐI', 'I. REGULATORY & SOLVENCY CHECKS')],
    ['ID', t(lang, 'Trạng thái', 'Status'), t(lang, 'Hạng mục', 'Check'), t(lang, 'Chi tiết', 'Detail')],
    ...checks.map((c) => [
      c.id,
      c.status,
      lang === 'vi' ? c.titleVi : c.titleEn,
      lang === 'vi' ? c.detailVi : c.detailEn,
    ]),
    [],
    [t(lang, 'II. PHÂN TÍCH ĐỘ NHẠY TORNADO (±10%)', 'II. TORNADO SENSITIVITY (±10%)')],
    [
      t(lang, 'Biến số tác động', 'Driver'),
      t(lang, 'LNST tại -10% (VNDm)', 'PAT @ -10%'),
      t(lang, 'LNST Cơ sở (VNDm)', 'Base PAT'),
      t(lang, 'LNST tại +10% (VNDm)', 'PAT @ +10%'),
      'IRR @ -10% (%)',
      'Base IRR (%)',
      'IRR @ +10% (%)',
    ],
    ...tornado.map((tr) => [
      lang === 'vi' ? tr.labelVi : tr.labelEn,
      round0(tr.lowPat),
      round0(tr.basePat),
      round0(tr.highPat),
      round2(tr.lowIrr * 100),
      round2(tr.baseIrr * 100),
      round2(tr.highIrr * 100),
    ]),
    [],
    [t(lang, 'III. MA TRẬN ĐỘ NHẠY 7×7 (LNST - TRIỆU ĐỒNG)', 'III. 7×7 SENSITIVITY MATRIX (PAT - VNDm)')],
    [
      t(lang, 'Giá căn hộ \\ Giá đất (tr/m²)', 'Apt Price \\ Land (VNDm/m²)'),
      ...sens.landPrices.map((lp) => round2(lp)),
    ],
    ...sens.aptPrices.map((ap, i) => [
      round2(ap),
      ...(sens.pat[i] || []).map(round0),
    ]),
  ];
  const wsAudit = XLSX.utils.aoa_to_sheet(auditRows);
  wsAudit['!cols'] = [{ wch: 36 }, { wch: 16 }, { wch: 34 }, { wch: 46 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsAudit, '6_KiemToan_DoNhay');

  const safeSlug = inputs.projectName.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'RealCalculator';
  XLSX.writeFile(wb, `${safeSlug}_40Q_Financial_Model.xlsx`);
}
