import React, { useState } from 'react';
import { AppPreferences, CalculationResult, ModelInputs } from '../types/model';
import { PRODUCT_NAMES, t } from '../data/i18n';
import { formatMoney, formatNum, formatPct } from '../engine/formulaParser';

interface DashboardViewProps {
  inputs: ModelInputs;
  result: CalculationResult;
  prefs: AppPreferences;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ inputs, result, prefs }) => {
  const { lang, unitDisplay } = prefs;
  const [hoveredQ, setHoveredQ] = useState<number | null>(null);
  const [sensMode, setSensMode] = useState<'pat' | 'irr'>('pat');

  const unitLabel =
    unitDisplay === 'billion'
      ? t(lang, 'tỷ đồng', 'VND bn')
      : t(lang, 'triệu đồng', 'VNDm');

  const { pl, dev, financing, sales, summary, cf, sens } = result;

  // Prepare 40-quarter chart scaling
  const inflowArr = cf.inflow.q;
  const outflowArr = cf.outflow.q; // negative
  const cumFcfeArr = cf.cumFcfe.q;

  const maxPos = Math.max(
    1,
    ...inflowArr,
    ...cumFcfeArr.map((v) => Math.max(0, v))
  );
  const maxNeg = Math.max(
    1,
    ...outflowArr.map((v) => Math.abs(v)),
    ...cumFcfeArr.map((v) => Math.abs(Math.min(0, v)))
  );
  const totalRange = maxPos + maxNeg;
  const chartHeight = 210;
  const zeroY = (maxPos / totalRange) * chartHeight;

  const cumPoints = cumFcfeArr
    .map((val, idx) => {
      const x = (idx + 0.5) * (800 / 40);
      const y = zeroY - (val / totalRange) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Capital mix segments
  const capTotal = Math.max(1, financing.totalCapital);
  const capSegments = [
    {
      label: t(lang, 'Vốn chủ sở hữu', 'Shareholder Equity'),
      val: financing.equity,
      share: financing.equity / capTotal,
      color: '#0071e3',
    },
    {
      label: t(lang, 'Vay mua đất', 'Land Acquisition Loan'),
      val: financing.landLoan,
      share: financing.landLoan / capTotal,
      color: '#6366f1',
    },
    {
      label: t(lang, 'Vay xây dựng', 'Construction Loan'),
      val: financing.constrLoan,
      share: financing.constrLoan / capTotal,
      color: '#0d9488',
    },
    {
      label: t(lang, 'Nguồn tiền thu trước KH', 'Customer Pre-sales'),
      val: financing.collectionsUsed,
      share: financing.collectionsUsed / capTotal,
      color: '#f59e0b',
    },
  ];

  // Waterfall P&L bars
  const revMax = Math.max(1, pl.revenue);
  const plRows = [
    {
      label: t(lang, 'Doanh thu hợp đồng (chưa VAT)', 'Contracted Revenue (ex. VAT)'),
      val: pl.revenue,
      pct: 1,
      isTotal: true,
      barColor: 'bg-blue-600 dark:bg-blue-500',
    },
    {
      label: t(lang, 'Giá vốn (Đất + Xây dựng + Tư vấn + Dự phòng)', 'Cost of Goods Sold (Land & Build)'),
      val: -pl.cogs,
      pct: pl.revenue > 0 ? pl.cogs / pl.revenue : 0,
      isTotal: false,
      barColor: 'bg-slate-400 dark:bg-slate-500',
    },
    {
      label: t(lang, 'Lợi nhuận gộp (Gross Profit)', 'Gross Profit'),
      val: pl.gp,
      pct: pl.gpMargin,
      isTotal: true,
      barColor: 'bg-sky-500',
    },
    {
      label: t(lang, 'Chi phí bán hàng, nhà mẫu, pháp lý & QLDN', 'Selling, Legal & G&A Expenses'),
      val: -pl.opex,
      pct: pl.revenue > 0 ? pl.opex / pl.revenue : 0,
      isTotal: false,
      barColor: 'bg-amber-500',
    },
    {
      label: t(lang, 'Lợi nhuận hoạt động (EBIT)', 'Operating Profit (EBIT)'),
      val: pl.ebit,
      pct: pl.ebitMargin,
      isTotal: true,
      barColor: 'bg-indigo-500',
    },
    {
      label: t(lang, 'Chi phí lãi vay ngân hàng', 'Loan Interest Expense'),
      val: -pl.interest,
      pct: pl.revenue > 0 ? pl.interest / pl.revenue : 0,
      isTotal: false,
      barColor: 'bg-rose-400',
    },
    {
      label: t(lang, 'Thuế Thu nhập Doanh nghiệp (CIT)', 'Corporate Income Tax (CIT)'),
      val: -pl.cit,
      pct: pl.revenue > 0 ? pl.cit / pl.revenue : 0,
      isTotal: false,
      barColor: 'bg-rose-500',
    },
    {
      label: t(lang, 'Lợi nhuận sau thuế (LNST / PAT)', 'Profit After Tax (PAT)'),
      val: pl.pat,
      pct: pl.patMargin,
      isTotal: true,
      barColor: 'bg-emerald-600 dark:bg-emerald-500',
    },
  ];

  const activeHoverIdx = hoveredQ !== null ? hoveredQ : null;

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-5">
      {/* Row 1: 40-Quarter Interactive Cash Flow & Cumulative FCFE Chart */}
      <section className="rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
              {t(
                lang,
                'Diễn biến Dòng tiền Thu / Chi & Lũy kế FCFE xuyên suốt 40 Quý',
                '40-Quarter Cash Inflow / Outflow & Cumulative FCFE Trajectory'
              )}
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {t(
                lang,
                `Đơn vị: ${unitLabel} · Rê chuột lên từng cột quý (Q1–Q40) để xem chi tiết số liệu`,
                `Unit: ${unitLabel} · Hover any quarter (Q1–Q40) to inspect exact cash flows`
              )}
            </p>
          </div>

          {/* Live Hover Readout or Legend */}
          {activeHoverIdx !== null ? (
            <div className="font-tabular text-[12px] flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-900/6 dark:bg-white/10">
              <span className="font-bold text-slate-900 dark:text-white">
                Q{activeHoverIdx + 1} ({inputs.model_start_year + Math.floor(activeHoverIdx / 4)})
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                +{formatMoney(inflowArr[activeHoverIdx], lang, unitDisplay)}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                {formatMoney(outflowArr[activeHoverIdx], lang, unitDisplay)}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {t(lang, 'Lũy kế FCFE:', 'Cum. FCFE:')}{' '}
                {formatMoney(cumFcfeArr[activeHoverIdx], lang, unitDisplay)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-[12px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                {t(lang, 'Dòng thu', 'Inflow')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-400" />
                {t(lang, 'Dòng chi', 'Outflow')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-500" />
                {t(lang, 'Lũy kế FCFE', 'Cum. FCFE')}
              </span>
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 800 ${chartHeight + 28}`}
            className="w-full min-w-[680px] h-60 select-none"
            onMouseLeave={() => setHoveredQ(null)}
          >
            {/* Zero Baseline */}
            <line
              x1={0}
              y1={zeroY}
              x2={800}
              y2={zeroY}
              stroke="currentColor"
              className="text-slate-300 dark:text-white/20"
              strokeWidth={1}
            />

            {/* 40 Quarter Bars */}
            {Array.from({ length: 40 }, (_, q) => {
              const colW = 800 / 40;
              const xCenter = (q + 0.5) * colW;
              const barW = colW * 0.62;
              const inH = (inflowArr[q] / totalRange) * chartHeight;
              const outH = (Math.abs(outflowArr[q]) / totalRange) * chartHeight;
              const isHover = hoveredQ === q;

              return (
                <g
                  key={q}
                  onMouseEnter={() => setHoveredQ(q)}
                  className="cursor-pointer"
                >
                  <rect
                    x={q * colW}
                    y={0}
                    width={colW}
                    height={chartHeight}
                    fill={isHover ? 'rgba(120,120,140,0.10)' : 'transparent'}
                  />
                  {inH > 0.3 && (
                    <rect
                      x={xCenter - barW / 2}
                      y={zeroY - inH}
                      width={barW}
                      height={inH}
                      rx={2}
                      className="fill-blue-500/85 dark:fill-blue-400/85"
                    />
                  )}
                  {outH > 0.3 && (
                    <rect
                      x={xCenter - barW / 2}
                      y={zeroY}
                      width={barW}
                      height={outH}
                      rx={2}
                      className="fill-rose-400/85 dark:fill-rose-500/80"
                    />
                  )}
                  {(q % 4 === 0 || q === 39) && (
                    <text
                      x={xCenter}
                      y={chartHeight + 18}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                    >
                      Q{q + 1}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Cumulative FCFE Line */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth={2.25}
              points={cumPoints}
            />
          </svg>
        </div>
      </section>

      {/* Row 2: P&L Waterfall Table + Capital Structure Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* P&L Statement */}
        <section className="xl:col-span-7 rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              {t(lang, '1. Báo cáo Kết quả Kinh doanh Dự án (P&L)', '1. Project Profit & Loss Statement')}
            </h3>
            <span className="font-tabular text-[12px] text-slate-500 dark:text-slate-400">
              {unitLabel}
            </span>
          </div>
          <table className="w-full border-collapse text-[12.5px]">
            <tbody>
              {plRows.map((r, idx) => (
                <tr
                  key={idx}
                  className={`border-b last:border-b-0 border-slate-900/6 dark:border-white/6 ${
                    r.isTotal
                      ? 'bg-slate-900/[0.03] dark:bg-white/[0.04] font-semibold text-slate-950 dark:text-white'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <td className="py-2.5 px-4">{r.label}</td>
                  <td className="py-2.5 px-3 w-36 hidden sm:table-cell">
                    <div className="h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.barColor}`}
                        style={{ width: `${Math.min(100, (Math.abs(r.val) / revMax) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-tabular text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatPct(r.pct, 1, lang)}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-tabular whitespace-nowrap ${
                      r.val < 0 ? 'text-rose-600 dark:text-rose-400' : ''
                    }`}
                  >
                    {formatMoney(r.val, lang, unitDisplay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Capital Structure & Unit Economics */}
        <section className="xl:col-span-5 rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                {t(lang, '2. Cơ cấu Nguồn vốn Huy động', '2. Capital Funding Structure')}
              </h3>
              <span className="font-tabular text-[12px] text-slate-500 dark:text-slate-400">
                {formatMoney(financing.totalCapital, lang, unitDisplay)} {unitLabel}
              </span>
            </div>

            {/* Stacked Horizontal Capital Bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-200 dark:bg-white/10 mb-4">
              {capSegments.map((seg, i) => (
                <div
                  key={i}
                  style={{ width: `${Math.max(0, seg.share * 100)}%`, backgroundColor: seg.color }}
                  title={`${seg.label}: ${formatPct(seg.share, 1, lang)}`}
                />
              ))}
            </div>

            <div className="space-y-2.5 text-[12.5px]">
              {capSegments.map((seg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1 border-b border-slate-900/6 dark:border-white/6"
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span>{seg.label}</span>
                  </span>
                  <span className="font-tabular font-medium text-slate-900 dark:text-white">
                    {formatMoney(seg.val, lang, unitDisplay)}{' '}
                    <span className="text-slate-400 text-[11.5px]">
                      ({formatPct(seg.share, 1, lang)})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unit Cost Summary Box */}
          <div className="mt-4 pt-3.5 border-t border-slate-900/8 dark:border-white/10 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.04]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t(lang, 'Giá thành bình quân / m² TP', 'Avg. Cost / Saleable m²')}
              </div>
              <div className="font-tabular text-[15px] font-bold text-slate-900 dark:text-white mt-0.5">
                {formatNum(summary.unitCostPerM2, 1, lang)} {t(lang, 'tr/m²', 'VNDm/m²')}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.04]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t(lang, 'Giá bán bình quân / m² TP', 'Avg. Selling Price / m²')}
              </div>
              <div className="font-tabular text-[15px] font-bold text-[var(--accent-primary)] mt-0.5">
                {formatNum(summary.avgPrice, 1, lang)} {t(lang, 'tr/m²', 'VNDm/m²')}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Row 3: Revenue by Product & Development Cost Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Sales Revenue Table */}
        <section className="rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              {t(lang, '3. Cơ cấu Doanh thu theo Sản phẩm', '3. Sales Revenue by Product Line')}
            </h3>
            <span className="font-tabular text-[12px] text-slate-500 dark:text-slate-400">
              {formatNum(summary.totalUnits, 0, lang)} {t(lang, 'sản phẩm', 'units')}
            </span>
          </div>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-900/8 dark:border-white/10 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="text-left py-2 px-4">{t(lang, 'Sản phẩm', 'Product')}</th>
                <th className="text-right py-2 px-3">{t(lang, 'DT thương phẩm', 'Area (m²)')}</th>
                <th className="text-right py-2 px-3">{t(lang, 'ĐG BQ (tr/m²)', 'Price')}</th>
                <th className="text-right py-2 px-4">{t(lang, 'Doanh thu', 'Revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((item) => (
                <tr
                  key={item.p}
                  className="border-b last:border-b-0 border-slate-900/6 dark:border-white/6 text-slate-700 dark:text-slate-200"
                >
                  <td className="py-2 px-4 font-medium">
                    {lang === 'vi' ? PRODUCT_NAMES[item.p].vi : PRODUCT_NAMES[item.p].en}
                  </td>
                  <td className="py-2 px-3 text-right font-tabular">
                    {formatNum(item.area, 0, lang)}
                  </td>
                  <td className="py-2 px-3 text-right font-tabular">
                    {formatNum(item.avgPrice, 1, lang)}
                  </td>
                  <td className="py-2 px-4 text-right font-tabular font-medium text-slate-900 dark:text-white">
                    {formatMoney(item.contracted, lang, unitDisplay)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900/[0.03] dark:bg-white/[0.04] font-semibold text-slate-950 dark:text-white">
                <td className="py-2.5 px-4">{t(lang, 'Tổng cộng', 'Total')}</td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {formatNum(summary.totalNSA, 0, lang)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {formatNum(summary.avgPrice, 1, lang)}
                </td>
                <td className="py-2.5 px-4 text-right font-tabular">
                  {formatMoney(summary.totalRevenue, lang, unitDisplay)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Development Cost Structure */}
        <section className="rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              {t(lang, '4. Cơ cấu Tổng chi phí Đầu tư', '4. Total Project Cost Breakdown')}
            </h3>
            <span className="font-tabular text-[12px] text-slate-500 dark:text-slate-400">
              {unitLabel}
            </span>
          </div>
          <table className="w-full border-collapse text-[12.5px]">
            <tbody>
              {[
                {
                  vi: 'Chi phí chuyển nhượng đất & Tiền sử dụng đất',
                  en: 'Land Acquisition & Land Use Fee',
                  val: dev.land,
                },
                {
                  vi: 'Chi phí hạ tầng kỹ thuật & cảnh quan',
                  en: 'Site Infrastructure & Landscaping',
                  val: dev.infra,
                },
                {
                  vi: 'Chi phí xây dựng công trình (Cao tầng & Thấp tầng)',
                  en: 'Building Construction (High-rise & Low-rise)',
                  val: dev.highrise + dev.lowrise,
                },
                {
                  vi: 'Tư vấn thiết kế, QLDA & Dự phòng phí',
                  en: 'Consultancy, PM & Contingency',
                  val: dev.consult + dev.contingency,
                },
                {
                  vi: 'Bán hàng, Tiếp thị, Nhà mẫu, Pháp lý & QLDN',
                  en: 'Marketing, Brokerage, Gallery, Legal & G&A',
                  val: dev.opex,
                },
                {
                  vi: 'Chi phí lãi vay trong thời gian xây dựng',
                  en: 'Financing Interest Cost',
                  val: financing.interest,
                },
              ].map((row, idx) => {
                const totalAll = summary.perf.cost;
                const pct = totalAll > 0 ? row.val / totalAll : 0;
                return (
                  <tr
                    key={idx}
                    className="border-b border-slate-900/6 dark:border-white/6 text-slate-700 dark:text-slate-200"
                  >
                    <td className="py-2 px-4">{lang === 'vi' ? row.vi : row.en}</td>
                    <td className="py-2 px-3 text-right font-tabular text-slate-500 dark:text-slate-400">
                      {formatPct(pct, 1, lang)}
                    </td>
                    <td className="py-2 px-4 text-right font-tabular font-medium text-slate-900 dark:text-white">
                      {formatMoney(row.val, lang, unitDisplay)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-900/[0.03] dark:bg-white/[0.04] font-semibold text-slate-950 dark:text-white">
                <td className="py-2.5 px-4">
                  {t(lang, 'Tổng chi phí (chưa gồm Thuế TNDN)', 'Total Project Cost (ex. CIT)')}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">100,0%</td>
                <td className="py-2.5 px-4 text-right font-tabular">
                  {formatMoney(summary.perf.cost, lang, unitDisplay)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* Row 4: 7x7 Sensitivity Analysis Matrix */}
      <section className="rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              {t(
                lang,
                '5. Ma trận Phân tích Độ nhạy 2 Chiều (Giá bán Căn hộ × Đơn giá Đất)',
                '5. Two-Way Sensitivity Matrix (Apartment Price × Land Unit Price)'
              )}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {t(
                lang,
                'Ô trung tâm đánh dấu kịch bản cơ sở hiện tại của dự án',
                'Highlighted center cell indicates the active baseline scenario'
              )}
            </p>
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-slate-900/6 dark:bg-white/10 text-[12px]">
            <button
              type="button"
              onClick={() => setSensMode('pat')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                sensMode === 'pat'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t(lang, 'LNST', 'PAT')} ({unitLabel})
            </button>
            <button
              type="button"
              onClick={() => setSensMode('irr')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                sensMode === 'irr'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              IRR {t(lang, 'Vốn CSH', 'Equity')} (%)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-900/8 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400">
                <th className="text-left py-2 px-3.5 font-semibold">
                  {t(lang, 'Giá căn hộ \\ Giá đất', 'Apt Price \\ Land')}
                </th>
                {sens.landPrices.map((lp, j) => (
                  <th
                    key={j}
                    className={`py-2 px-3 text-right font-tabular ${
                      j === 3 ? 'text-[var(--accent-primary)] font-bold' : ''
                    }`}
                  >
                    {formatNum(lp, 1, lang)} tr/m²
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sens.aptPrices.map((ap, i) => (
                <tr
                  key={i}
                  className="border-b last:border-b-0 border-slate-900/6 dark:border-white/6"
                >
                  <td
                    className={`py-2 px-3.5 font-tabular font-medium bg-slate-50/50 dark:bg-white/[0.015] ${
                      i === 3
                        ? 'text-[var(--accent-primary)] font-bold'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {formatNum(ap, 1, lang)} tr/m²
                  </td>
                  {sens.landPrices.map((_, j) => {
                    const isBase = i === 3 && j === 3;
                    const val = sensMode === 'pat' ? sens.pat[i]?.[j] ?? 0 : sens.irr[i]?.[j] ?? 0;
                    const positive = sensMode === 'pat' ? val >= 0 : val >= inputs.equity_discount_rate;
                    return (
                      <td
                        key={j}
                        className={`py-2 px-3 text-right font-tabular transition ${
                          isBase
                            ? 'bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent-primary)] font-bold text-slate-950 dark:text-white'
                            : positive
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400 bg-rose-500/[0.04]'
                        }`}
                      >
                        {sensMode === 'pat'
                          ? formatMoney(val, lang, unitDisplay)
                          : formatPct(val, 1, lang)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
