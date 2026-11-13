import React from 'react';
import { Printer, X, FileSpreadsheet } from 'lucide-react';
import { AppPreferences, CalculationResult, ModelInputs } from '../types/model';
import { PRODUCT_NAMES, t } from '../data/i18n';
import { formatMoney, formatNum, formatPct } from '../engine/formulaParser';

interface PrintReportModalProps {
  open: boolean;
  onClose: () => void;
  inputs: ModelInputs;
  result: CalculationResult;
  prefs: AppPreferences;
  onExportExcel: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  open,
  onClose,
  inputs,
  result,
  prefs,
  onExportExcel,
}) => {
  if (!open) return null;

  const { lang, unitDisplay } = prefs;
  const { planning, pl, financing, debtMetrics, summary, sales, cf, tornado, checks } = result;
  const unitLabel =
    unitDisplay === 'billion' ? t(lang, 'tỷ đồng', 'VND bn') : t(lang, 'triệu đồng', 'VNDm');
  const startYear = inputs.model_start_year;
  const todayStr = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');

  return (
    <div
      id="print-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="print-modal-shell"
        className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-900/15 dark:border-white/15 shadow-2xl overflow-hidden"
      >
        {/* Top Action Bar (hidden on print) */}
        <div className="no-print shrink-0 px-5 py-3 border-b border-slate-900/10 dark:border-white/10 bg-slate-50/90 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
              {t(lang, 'Xem trước Hồ sơ Thẩm định Đầu tư (In / Lưu PDF)', 'Executive Investment Memo Preview (Print / PDF)')}
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {t(
                lang,
                'Trình duyệt sẽ mở hộp thoại In — chọn "Lưu dưới dạng PDF" (Save as PDF) khổ A4 để xuất báo cáo sắc nét.',
                'Your browser print dialog opens — choose "Save as PDF" (A4) for a clean multi-page memo.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border border-slate-900/12 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 transition cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t(lang, 'Xuất Excel (.xlsx)', 'Export Excel')}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[var(--accent-primary)] text-white hover:brightness-105 transition cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t(lang, 'In / Lưu PDF', 'Print / Save PDF')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={t(lang, 'Đóng', 'Close')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Canvas (Crisp Paper Style) */}
        <div className="flex-1 overflow-y-auto bg-slate-200/70 dark:bg-slate-950 p-4 sm:p-6">
          <article
            id="print-report-sheet"
            className="mx-auto max-w-[920px] bg-white text-slate-900 rounded-xl shadow-md p-8 space-y-6 text-[12.5px] leading-relaxed"
          >
            {/* Header */}
            <header className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  {t(lang, 'BÁO CÁO THẨM ĐỊNH HIỆU QUẢ ĐẦU TƯ DỰ ÁN BẤT ĐỘNG SẢN', 'REAL ESTATE INVESTMENT APPRAISAL MEMORANDUM')}
                </div>
                <h1 className="text-[22px] font-bold tracking-tight text-slate-950 mt-1">
                  {inputs.projectName}
                </h1>
                <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-2">
                  <span>{t(lang, `Chu kỳ 40 Quý (${startYear}–${startYear + 9})`, `40-Quarter Horizon (${startYear}–${startYear + 9})`)}</span>
                  <span>·</span>
                  <span>{t(lang, `Đơn vị: ${unitLabel}`, `Unit: ${unitLabel}`)}</span>
                  <span>·</span>
                  <span>{t(lang, `Ngày lập: ${todayStr}`, `Date: ${todayStr}`)}</span>
                </div>
              </div>
              <div className="text-right font-tabular">
                <div className="text-[11px] text-slate-500">{t(lang, 'Tổng diện tích đất', 'Total Land Area')}</div>
                <div className="text-[16px] font-bold text-slate-900">
                  {formatNum(planning.land.total, 0, lang)} m²
                </div>
              </div>
            </header>

            {/* Section 1: Key Investment Metrics */}
            <section className="break-inside-avoid">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                {t(lang, '1. Chỉ số Hiệu quả & An toàn Tài chính Trọng tâm', '1. Executive Return & Debt Safety Metrics')}
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: t(lang, 'Tổng doanh thu', 'Total Revenue'),
                    val: `${formatMoney(pl.revenue, lang, unitDisplay)} ${unitLabel}`,
                  },
                  {
                    label: t(lang, 'Lợi nhuận sau thuế', 'Profit After Tax'),
                    val: `${formatMoney(pl.pat, lang, unitDisplay)} ${unitLabel}`,
                    sub: `${t(lang, 'Biên LNST', 'Margin')} ${formatPct(pl.patMargin, 1, lang)}`,
                  },
                  {
                    label: t(lang, 'IRR Vốn chủ sở hữu', 'Equity IRR (Annual)'),
                    val: formatPct(summary.perf.irr, 2, lang),
                    sub: `ROE ${formatPct(summary.perf.roe, 1, lang)}`,
                  },
                  {
                    label: `NPV (@ ${formatPct(summary.perf.discountRate, 0, lang)})`,
                    val: `${formatMoney(summary.perf.npv, lang, unitDisplay)} ${unitLabel}`,
                    sub: summary.perf.paybackYears
                      ? `${t(lang, 'Hoàn vốn', 'Payback')} ${formatNum(summary.perf.paybackYears, 2, lang)} ${t(lang, 'năm', 'yrs')}`
                      : undefined,
                  },
                  {
                    label: t(lang, 'Vốn CSH tối thiểu', 'Required Equity'),
                    val: `${formatMoney(financing.equity, lang, unitDisplay)} ${unitLabel}`,
                    sub: debtMetrics.peakEquityQuarter ? `${t(lang, 'Đỉnh âm tại', 'Peak at')} Q${debtMetrics.peakEquityQuarter}` : undefined,
                  },
                  {
                    label: t(lang, 'Tổng giải ngân vay', 'Total Debt Drawn'),
                    val: `${formatMoney(financing.totalLoan, lang, unitDisplay)} ${unitLabel}`,
                  },
                  {
                    label: t(lang, 'Đỉnh dư nợ vay', 'Peak Debt Balance'),
                    val: `${formatMoney(debtMetrics.peakDebt, lang, unitDisplay)} ${unitLabel}`,
                    sub: debtMetrics.peakDebtQuarter ? `Q${debtMetrics.peakDebtQuarter}` : undefined,
                  },
                  {
                    label: t(lang, 'DSCR Tối thiểu / BQ', 'Min / Avg DSCR'),
                    val:
                      debtMetrics.minDscr !== null
                        ? `${formatNum(debtMetrics.minDscr, 2, lang)}x / ${formatNum(debtMetrics.avgDscr ?? 0, 2, lang)}x`
                        : '—',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="text-[11px] text-slate-500">{item.label}</div>
                    <div className="font-tabular text-[14px] font-bold text-slate-950 mt-0.5">{item.val}</div>
                    {item.sub && <div className="font-tabular text-[11px] text-slate-500 mt-0.5">{item.sub}</div>}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: P&L + Sales Mix */}
            <div className="grid grid-cols-2 gap-5 break-inside-avoid">
              <section>
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t(lang, '2. Kết quả Kinh doanh (P&L)', '2. Profit & Loss Summary')}
                </h2>
                <table className="w-full border-collapse text-[11.5px] border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <th className="text-left py-1.5 px-2.5">{t(lang, 'Khoản mục', 'Line Item')}</th>
                      <th className="text-right py-1.5 px-2.5">{unitLabel}</th>
                      <th className="text-right py-1.5 px-2.5">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      [t(lang, 'Doanh thu hợp đồng (chưa VAT)', 'Contracted Revenue'), pl.revenue, 1, true],
                      [t(lang, 'Giá vốn (Đất + XD + Tư vấn)', 'COGS (Land & Build)'), -pl.cogs, pl.revenue > 0 ? pl.cogs / pl.revenue : 0, false],
                      [t(lang, 'Lợi nhuận gộp', 'Gross Profit'), pl.gp, pl.gpMargin, true],
                      [t(lang, 'Bán hàng, Pháp lý & QLDN', 'Opex & Selling'), -pl.opex, pl.revenue > 0 ? pl.opex / pl.revenue : 0, false],
                      [t(lang, 'Lãi vay ngân hàng', 'Loan Interest'), -pl.interest, pl.revenue > 0 ? pl.interest / pl.revenue : 0, false],
                      [t(lang, 'Thuế TNDN (CIT)', 'CIT'), -pl.cit, pl.revenue > 0 ? pl.cit / pl.revenue : 0, false],
                      [t(lang, 'Lợi nhuận sau thuế (PAT)', 'Profit After Tax'), pl.pat, pl.patMargin, true],
                    ].map(([lbl, val, pct, bold], i) => (
                      <tr key={i} className={bold ? 'font-semibold bg-slate-50/70' : ''}>
                        <td className="py-1.5 px-2.5">{lbl as string}</td>
                        <td className="py-1.5 px-2.5 text-right font-tabular">
                          {formatMoney(val as number, lang, unitDisplay)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-tabular text-slate-500">
                          {formatPct(pct as number, 1, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section>
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t(lang, '3. Cơ cấu Sản phẩm & Doanh thu', '3. Product Mix & Revenue')}
                </h2>
                <table className="w-full border-collapse text-[11.5px] border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <th className="text-left py-1.5 px-2.5">{t(lang, 'Sản phẩm', 'Product')}</th>
                      <th className="text-right py-1.5 px-2">{t(lang, 'SL', 'Units')}</th>
                      <th className="text-right py-1.5 px-2">{t(lang, 'DT (m²)', 'Area')}</th>
                      <th className="text-right py-1.5 px-2.5">{t(lang, 'Doanh thu', 'Revenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sales.map((s) => (
                      <tr key={s.p}>
                        <td className="py-1.5 px-2.5">{lang === 'vi' ? PRODUCT_NAMES[s.p].vi : PRODUCT_NAMES[s.p].en}</td>
                        <td className="py-1.5 px-2 text-right font-tabular">{formatNum(s.units, 0, lang)}</td>
                        <td className="py-1.5 px-2 text-right font-tabular">{formatNum(s.area, 0, lang)}</td>
                        <td className="py-1.5 px-2.5 text-right font-tabular">{formatMoney(s.contracted, lang, unitDisplay)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-slate-50">
                      <td className="py-1.5 px-2.5">{t(lang, 'Tổng cộng', 'Total')}</td>
                      <td className="py-1.5 px-2 text-right font-tabular">{formatNum(summary.totalUnits, 0, lang)}</td>
                      <td className="py-1.5 px-2 text-right font-tabular">{formatNum(summary.totalNSA, 0, lang)}</td>
                      <td className="py-1.5 px-2.5 text-right font-tabular">{formatMoney(summary.totalRevenue, lang, unitDisplay)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>

            {/* Section 3: 10-Year Cash Flow Summary */}
            <section className="break-inside-avoid">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                {t(lang, `4. Bảng Tổng hợp Dòng tiền 10 Năm (${unitLabel})`, `4. 10-Year Cash Flow Summary (${unitLabel})`)}
              </h2>
              <table className="w-full border-collapse text-[10.5px] border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="text-left py-1.5 px-2">{t(lang, 'Khoản mục', 'Line Item')}</th>
                    <th className="text-right py-1.5 px-1.5">{t(lang, 'Tổng', 'Total')}</th>
                    {Array.from({ length: 10 }, (_, y) => (
                      <th key={y} className="text-right py-1.5 px-1.5 font-tabular">
                        {startYear + y}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    [t(lang, 'Thu bán hàng (chưa VAT)', 'Sales Revenue'), cf.revenue, false],
                    [t(lang, 'Giải ngân vay + Vốn CSH', 'Debt & Equity In'), cf.finIn, false],
                    [t(lang, 'Tổng dòng tiền vào', 'Total Cash Inflow'), cf.inflow, true],
                    [t(lang, 'Chi phí đất & TSDĐ', 'Land & LUF'), cf.landAcq, false],
                    [t(lang, 'Xây dựng & Tư vấn', 'Build & Soft'), cf.dev, false],
                    [t(lang, 'Bán hàng, Pháp lý & QLDN', 'Opex & Selling'), cf.opex, false],
                    [t(lang, 'Thuế GTGT & TNDN', 'Taxes Paid'), cf.taxes, false],
                    [t(lang, 'Trả gốc, lãi & cổ tức', 'Debt Service & Div'), cf.finOut, false],
                    [t(lang, 'Tổng dòng tiền ra', 'Total Cash Outflow'), cf.outflow, true],
                    [t(lang, 'Số dư tiền cuối kỳ', 'Ending Cash'), cf.end, true],
                    [t(lang, 'Dòng tiền VCSH (FCFE)', 'Equity FCFE'), cf.fcfe, true],
                    [t(lang, 'Dư nợ vay cuối kỳ', 'Ending Debt'), cf.debtBalance, false],
                  ].map(([lbl, row, bold], idx) => {
                    const r = row as { years: number[]; total: number };
                    return (
                      <tr key={idx} className={bold ? 'font-semibold bg-slate-50' : ''}>
                        <td className="py-1 px-2 whitespace-nowrap">{lbl as string}</td>
                        <td className="py-1 px-1.5 text-right font-tabular">
                          {formatMoney(r.total, lang, unitDisplay, true)}
                        </td>
                        {r.years.map((v, y) => (
                          <td key={y} className="py-1 px-1.5 text-right font-tabular">
                            {formatMoney(v, lang, unitDisplay, true)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            {/* Section 4: Tornado Sensitivity & Checks */}
            <div className="grid grid-cols-2 gap-5 break-inside-avoid">
              <section>
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t(lang, '5. Độ nhạy Tornado (±10% các yếu tố)', '5. Tornado Sensitivity (±10% Drivers)')}
                </h2>
                <table className="w-full border-collapse text-[11px] border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <th className="text-left py-1.5 px-2">{t(lang, 'Biến số', 'Driver')}</th>
                      <th className="text-right py-1.5 px-2">IRR (-10%)</th>
                      <th className="text-right py-1.5 px-2">IRR (+10%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tornado.map((tr) => (
                      <tr key={tr.id}>
                        <td className="py-1.5 px-2">{lang === 'vi' ? tr.labelVi : tr.labelEn}</td>
                        <td className="py-1.5 px-2 text-right font-tabular">{formatPct(tr.lowIrr, 1, lang)}</td>
                        <td className="py-1.5 px-2 text-right font-tabular">{formatPct(tr.highIrr, 1, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section>
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t(lang, '6. Kiểm toán Quy chuẩn & Pháp lý', '6. Regulatory & Solvency Checks')}
                </h2>
                <div className="border border-slate-200 divide-y divide-slate-200 text-[11px]">
                  {checks.map((c) => (
                    <div key={c.id} className="py-1.5 px-2.5 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold">{c.id}:</span>{' '}
                        <span>{lang === 'vi' ? c.titleVi : c.titleEn}</span>
                      </div>
                      <span
                        className={`font-semibold shrink-0 ${
                          c.status === 'OK'
                            ? 'text-emerald-700'
                            : c.status === 'WARNING'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
