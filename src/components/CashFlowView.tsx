import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';
import {
  AppPreferences,
  CalculationResult,
  CashFlowRow,
  ModelInputs,
} from '../types/model';
import { t } from '../data/i18n';
import { formatMoney, formatNum, formatPct } from '../engine/formulaParser';

interface CashFlowViewProps {
  inputs: ModelInputs;
  result: CalculationResult;
  prefs: AppPreferences;
  onExportCsv: () => void;
}

interface CfStatementLine {
  id: string;
  labelVi: string;
  labelEn: string;
  row: CashFlowRow;
  level: 'section' | 'group' | 'detail' | 'highlight';
  compactVisible: boolean;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  inputs,
  result,
  prefs,
  onExportCsv,
}) => {
  const { lang, unitDisplay } = prefs;
  const [periodMode, setPeriodMode] = useState<'quarterly' | 'annual'>('quarterly');
  const [detailMode, setDetailMode] = useState<'full' | 'compact'>('full');
  const [activeOnlyQuarters, setActiveOnlyQuarters] = useState(false);
  const [filterText, setFilterText] = useState('');

  const { cf, summary } = result;
  const startYear = inputs.model_start_year;
  const unitLabel =
    unitDisplay === 'billion'
      ? t(lang, 'tỷ đồng', 'VND bn')
      : t(lang, 'triệu đồng', 'VNDm');

  const lines: CfStatementLine[] = [
    {
      id: 'inflow',
      labelVi: 'I. TỔNG DÒNG TIỀN THU VÀO',
      labelEn: 'I. TOTAL CASH INFLOW',
      row: cf.inflow,
      level: 'section',
      compactVisible: true,
    },
    {
      id: 'revenue',
      labelVi: '1. Tiền thu bán hàng (chưa VAT)',
      labelEn: '1. Customer Sales Collections (ex. VAT)',
      row: cf.revenue,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'outVat',
      labelVi: '2. Thuế GTGT đầu ra thu từ khách hàng',
      labelEn: '2. Output VAT Collected',
      row: cf.outVat,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'finIn',
      labelVi: '3. Dòng tiền huy động vốn (Vay & Vốn CSH)',
      labelEn: '3. Financing Inflows (Debt & Equity)',
      row: cf.finIn,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'ldraw',
      labelVi: 'Giải ngân vay mua đất',
      labelEn: 'Land loan drawdown',
      row: cf.ldraw,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'cdraw',
      labelVi: 'Giải ngân vay xây dựng',
      labelEn: 'Construction loan drawdown',
      row: cf.cdraw,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'equity',
      labelVi: 'Góp vốn chủ sở hữu',
      labelEn: 'Shareholder equity contribution',
      row: cf.equity,
      level: 'detail',
      compactVisible: true,
    },

    {
      id: 'outflow',
      labelVi: 'II. TỔNG DÒNG TIỀN CHI RA',
      labelEn: 'II. TOTAL CASH OUTFLOW',
      row: cf.outflow,
      level: 'section',
      compactVisible: true,
    },
    {
      id: 'landAcq',
      labelVi: '1. Chi phí đất & Tiền sử dụng đất',
      labelEn: '1. Land Acquisition & Land Use Fee',
      row: cf.landAcq,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'landTransfer',
      labelVi: 'Thanh toán tiền nhận chuyển nhượng đất',
      labelEn: 'Land transfer price payment',
      row: cf.landTransfer,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'luf',
      labelVi: 'Nộp Tiền sử dụng đất (LUF)',
      labelEn: 'Land use fee payment',
      row: cf.luf,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'dev',
      labelVi: '2. Chi phí xây dựng, hạ tầng, tư vấn & dự phòng',
      labelEn: '2. Construction, Infrastructure & Soft Costs',
      row: cf.dev,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'infra',
      labelVi: 'Chi phí hạ tầng kỹ thuật',
      labelEn: 'Infrastructure construction',
      row: cf.infra,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'constrLs',
      labelVi: 'XD Shophouse thấp tầng',
      labelEn: 'Low-rise shophouse construction',
      row: cf.constrLs,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'constrTh',
      labelVi: 'XD Nhà liên kế',
      labelEn: 'Townhouse construction',
      row: cf.constrTh,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'constrVl',
      labelVi: 'XD Biệt thự',
      labelEn: 'Villa construction',
      row: cf.constrVl,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'constrPs',
      labelVi: 'XD Shophouse khối đế',
      labelEn: 'Podium shophouse construction',
      row: cf.constrPs,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'constrAp',
      labelVi: 'XD Căn hộ chung cư',
      labelEn: 'Apartment construction',
      row: cf.constrAp,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'design',
      labelVi: 'Tư vấn thiết kế',
      labelEn: 'Design consultant fee',
      row: cf.design,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'pm',
      labelVi: 'Quản lý dự án & giám sát',
      labelEn: 'Project management',
      row: cf.pm,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'cont',
      labelVi: 'Chi phí dự phòng XD',
      labelEn: 'Construction contingency',
      row: cf.cont,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'opex',
      labelVi: '3. Chi phí hoạt động, bán hàng & pháp lý',
      labelEn: '3. Operating, Selling & Legal Expenses',
      row: cf.opex,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'legal',
      labelVi: 'Chi phí pháp lý',
      labelEn: 'Legal & pre-development fee',
      row: cf.legal,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'gallery',
      labelVi: 'Nhà mẫu dự án (Sales Gallery)',
      labelEn: 'Sales gallery / show unit',
      row: cf.gallery,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'comm',
      labelVi: 'Hoa hồng bán hàng',
      labelEn: 'Sales commission',
      row: cf.comm,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'mkt',
      labelVi: 'Chi phí tiếp thị & truyền thông',
      labelEn: 'Marketing fee',
      row: cf.mkt,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'ga',
      labelVi: 'Chi phí quản lý doanh nghiệp (G&A)',
      labelEn: 'General & administrative (G&A)',
      row: cf.ga,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'taxes',
      labelVi: '4. Thuế GTGT & Thuế TNDN nộp ngân sách',
      labelEn: '4. Taxes Paid (Input VAT, Net VAT & CIT)',
      row: cf.taxes,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'inVat',
      labelVi: 'Thuế GTGT đầu vào phát sinh',
      labelEn: 'Input VAT paid on costs',
      row: cf.inVat,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'vatPaid',
      labelVi: 'Thuế GTGT thực nộp kho bạc',
      labelEn: 'Net VAT remitted to authority',
      row: cf.vatPaid,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'cit',
      labelVi: 'Thuế TNDN (CIT) phải nộp',
      labelEn: 'Corporate income tax paid',
      row: cf.cit,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'finOut',
      labelVi: '5. Trả nợ gốc, lãi vay & chia cổ tức',
      labelEn: '5. Debt Service & Shareholder Dividends',
      row: cf.finOut,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'interest',
      labelVi: 'Trả lãi vay ngân hàng',
      labelEn: 'Interest paid',
      row: cf.interest,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'principal',
      labelVi: 'Trả nợ gốc vay',
      labelEn: 'Loan principal repayment',
      row: cf.principal,
      level: 'detail',
      compactVisible: false,
    },
    {
      id: 'dist',
      labelVi: 'Chia cổ tức & hoàn vốn chủ sở hữu',
      labelEn: 'Shareholder dividend distribution',
      row: cf.dist,
      level: 'detail',
      compactVisible: false,
    },

    {
      id: 'net',
      labelVi: 'III. DÒNG TIỀN RÒNG TRONG KỲ',
      labelEn: 'III. NET CASH FLOW',
      row: cf.net,
      level: 'highlight',
      compactVisible: true,
    },
    {
      id: 'open',
      labelVi: 'Số dư tiền mặt đầu kỳ',
      labelEn: 'Opening Cash Balance',
      row: cf.open,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'end',
      labelVi: 'Số dư tiền mặt cuối kỳ',
      labelEn: 'Ending Cash Balance',
      row: cf.end,
      level: 'group',
      compactVisible: true,
    },
    {
      id: 'fcfe',
      labelVi: 'IV. DÒNG TIỀN VỐN CHỦ SỞ HỮU (FCFE)',
      labelEn: 'IV. FREE CASH FLOW TO EQUITY (FCFE)',
      row: cf.fcfe,
      level: 'highlight',
      compactVisible: true,
    },
    {
      id: 'cumFcfe',
      labelVi: 'Lũy kế dòng tiền vốn chủ sở hữu (Cumulative FCFE)',
      labelEn: 'Cumulative Equity Cash Flow',
      row: cf.cumFcfe,
      level: 'group',
      compactVisible: true,
    },
  ];

  const visibleLines = lines.filter((line) => {
    if (detailMode === 'compact' && !line.compactVisible) return false;
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return `${line.labelVi} ${line.labelEn}`.toLowerCase().includes(q);
  });

  // Determine columns
  const quarterCols: number[] = [];
  for (let q = 0; q < 40; q++) {
    if (!activeOnlyQuarters) {
      quarterCols.push(q);
    } else {
      const hasFlow =
        Math.abs(cf.inflow.q[q]) > 0.5 ||
        Math.abs(cf.outflow.q[q]) > 0.5 ||
        Math.abs(cf.end.q[q]) > 0.5;
      if (hasFlow) quarterCols.push(q);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden px-5 py-4 gap-4">
      {/* Top Controls Bar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Switcher: 40 Quarters vs 10 Years (100% Unlocked!) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/6 dark:bg-white/10 border border-slate-900/6 dark:border-white/8 text-[12.5px]">
            <button
              type="button"
              onClick={() => setPeriodMode('quarterly')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                periodMode === 'quarterly'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t(lang, 'Theo Quý · 40 Quý', 'Quarterly · 40Q')}
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('annual')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                periodMode === 'annual'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t(lang, 'Theo Năm · 10 Năm', 'Annual · 10Y')}
            </button>
          </div>

          {/* Full vs Compact */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/6 dark:bg-white/10 border border-slate-900/6 dark:border-white/8 text-[12.5px]">
            <button
              type="button"
              onClick={() => setDetailMode('full')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                detailMode === 'full'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t(lang, 'Chi tiết', 'Detailed')}
            </button>
            <button
              type="button"
              onClick={() => setDetailMode('compact')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                detailMode === 'compact'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t(lang, 'Rút gọn', 'Summary')}
            </button>
          </div>

          {periodMode === 'quarterly' && (
            <button
              type="button"
              onClick={() => setActiveOnlyQuarters(!activeOnlyQuarters)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-medium border transition cursor-pointer ${
                activeOnlyQuarters
                  ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-primary)]'
                  : 'bg-white/75 dark:bg-slate-900/70 border-slate-900/10 dark:border-white/12 text-slate-600 dark:text-slate-300'
              }`}
            >
              {activeOnlyQuarters
                ? t(lang, `Đang lọc ${quarterCols.length} quý phát sinh`, `Showing ${quarterCols.length} active Qs`)
                : t(lang, 'Ẩn các quý 0đ', 'Hide zero quarters')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t(lang, 'Tìm khoản mục dòng tiền...', 'Search line item...')}
              className="pl-8 pr-3 py-1.5 rounded-lg text-[12.5px] w-48 bg-white/80 dark:bg-slate-900/70 border border-slate-900/10 dark:border-white/12 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[var(--accent-primary)] text-white hover:brightness-105 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t(lang, 'Xuất CSV 40 Quý', 'Export 40Q CSV')}</span>
          </button>
        </div>
      </div>

      {/* Cash Flow Table Container */}
      <div className="flex-1 rounded-2xl bg-white/85 dark:bg-slate-900/76 backdrop-blur-xl border border-slate-900/10 dark:border-white/12 shadow-xs overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-100/95 dark:bg-slate-950/95 border-b border-slate-900/10 dark:border-white/12 text-slate-700 dark:text-slate-200">
              <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-950 text-left px-4 py-2.5 min-w-[260px] border-r border-slate-900/10 dark:border-white/10 font-semibold">
                <div>{t(lang, 'Khoản mục Dòng tiền', 'Cash Flow Line Item')}</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {t(lang, 'Đơn vị:', 'Unit:')} {unitLabel}
                </div>
              </th>
              <th className="sticky left-[260px] z-30 bg-slate-100 dark:bg-slate-950 text-right px-3 py-2.5 min-w-[115px] border-r border-slate-900/12 dark:border-white/12 font-semibold">
                {t(lang, 'Tổng cộng', 'Total')}
              </th>
              {periodMode === 'annual'
                ? Array.from({ length: 10 }, (_, y) => (
                    <th
                      key={y}
                      className="font-tabular text-right px-3 py-2.5 min-w-[105px] border-r border-slate-900/6 dark:border-white/6 font-semibold"
                    >
                      <div>{t(lang, `Năm ${y + 1}`, `Year ${y + 1}`)}</div>
                      <div className="text-[10.5px] font-normal text-slate-400">
                        {startYear + y}
                      </div>
                    </th>
                  ))
                : quarterCols.map((q) => (
                    <th
                      key={q}
                      className={`font-tabular text-right px-2.5 py-2 min-w-[92px] font-semibold ${
                        (q + 1) % 4 === 0
                          ? 'border-r border-slate-900/12 dark:border-white/12'
                          : 'border-r border-slate-900/4 dark:border-white/5'
                      }`}
                    >
                      <div>Q{q + 1}</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        {startYear + Math.floor(q / 4)}
                      </div>
                    </th>
                  ))}
            </tr>
          </thead>

          <tbody>
            {visibleLines.map((line) => {
              const isSection = line.level === 'section';
              const isHighlight = line.level === 'highlight';
              const isDetail = line.level === 'detail';

              const rowBg = isSection
                ? 'bg-slate-100/90 dark:bg-slate-800/90 font-bold text-slate-950 dark:text-white'
                : isHighlight
                ? 'bg-[var(--accent-soft)] font-bold text-slate-950 dark:text-white'
                : isDetail
                ? 'bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-300'
                : 'bg-slate-50/95 dark:bg-slate-900/98 font-semibold text-slate-800 dark:text-slate-100';

              const stickyCellBg = isSection
                ? 'bg-slate-100 dark:bg-slate-800'
                : isHighlight
                ? 'bg-blue-50 dark:bg-slate-800'
                : isDetail
                ? 'bg-white dark:bg-slate-900'
                : 'bg-slate-50 dark:bg-slate-900';

              const values =
                periodMode === 'annual'
                  ? line.row.years
                  : quarterCols.map((qIdx) => line.row.q[qIdx]);

              return (
                <tr
                  key={line.id}
                  className={`border-b border-slate-900/6 dark:border-white/6 hover:brightness-[0.985] dark:hover:brightness-110 transition ${rowBg}`}
                >
                  <td
                    className={`sticky left-0 z-10 ${stickyCellBg} px-4 py-2 border-r border-slate-900/8 dark:border-white/10 whitespace-nowrap ${
                      isDetail ? 'pl-8' : ''
                    }`}
                  >
                    {lang === 'vi' ? line.labelVi : line.labelEn}
                  </td>
                  <td
                    className={`sticky left-[260px] z-10 ${stickyCellBg} px-3 py-2 text-right font-tabular border-r border-slate-900/12 dark:border-white/12 whitespace-nowrap ${
                      line.row.total < -0.5 ? 'text-rose-600 dark:text-rose-400' : ''
                    }`}
                  >
                    {formatMoney(line.row.total, lang, unitDisplay, false)}
                  </td>
                  {values.map((v, idx) => {
                    const qNum = periodMode === 'quarterly' ? quarterCols[idx] : idx;
                    const strongBorder =
                      periodMode === 'quarterly' && (qNum + 1) % 4 === 0;
                    return (
                      <td
                        key={idx}
                        className={`px-2.5 py-2 text-right font-tabular whitespace-nowrap ${
                          strongBorder
                            ? 'border-r border-slate-900/12 dark:border-white/12'
                            : 'border-r border-slate-900/4 dark:border-white/5'
                        } ${v < -0.5 ? 'text-rose-600 dark:text-rose-400' : ''}`}
                      >
                        {formatMoney(v, lang, unitDisplay, true)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Equity Return Strip */}
      <div className="shrink-0 rounded-xl bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 text-[12.5px]">
        <div className="flex flex-wrap items-center gap-6">
          <span>
            <span className="text-slate-500 dark:text-slate-400 mr-1.5">
              {t(lang, 'IRR Vốn chủ sở hữu:', 'Project Equity IRR:')}
            </span>
            <strong className="font-tabular text-[var(--accent-primary)]">
              {formatPct(summary.perf.irr, 2, lang)}
            </strong>
          </span>
          <span>
            <span className="text-slate-500 dark:text-slate-400 mr-1.5">
              NPV (@ {formatPct(summary.perf.discountRate, 1, lang)}):
            </span>
            <strong className="font-tabular text-slate-900 dark:text-white">
              {formatMoney(summary.perf.npv, lang, unitDisplay)} {unitLabel}
            </strong>
          </span>
          <span>
            <span className="text-slate-500 dark:text-slate-400 mr-1.5">
              {t(lang, 'Quý hoàn vốn:', 'Payback Quarter:')}
            </span>
            <strong className="font-tabular text-emerald-700 dark:text-emerald-400">
              {summary.perf.paybackQuarter
                ? `Q${summary.perf.paybackQuarter} (${formatNum(summary.perf.paybackYears, 2, lang)} ${t(lang, 'năm', 'yrs')})`
                : '—'}
            </strong>
          </span>
        </div>
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
          {t(lang, 'Đã mở khoá đầy đủ báo cáo 40 Quý & 10 Năm', 'Full 40-Quarter & 10-Year Horizon Unlocked')}
        </span>
      </div>
    </div>
  );
};
