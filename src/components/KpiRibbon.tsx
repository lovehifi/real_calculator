import React from 'react';
import { AppPreferences, CalculationResult } from '../types/model';
import { formatMoney, formatNum, formatPct } from '../engine/formulaParser';
import { t } from '../data/i18n';

interface KpiRibbonProps {
  result: CalculationResult;
  prefs: AppPreferences;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ result, prefs }) => {
  const { lang, unitDisplay } = prefs;
  const unitLabel =
    unitDisplay === 'billion'
      ? t(lang, 'tỷ đồng', 'VND bn')
      : t(lang, 'triệu đồng', 'VNDm');

  const { perf } = result.summary;
  const isPositivePat = perf.pat >= 0;

  const items = [
    {
      label: t(lang, 'Tổng doanh thu (chưa VAT)', 'Total Revenue (ex. VAT)'),
      value: formatMoney(perf.revenue, lang, unitDisplay),
      sub: unitLabel,
      tone: 'text-slate-900 dark:text-white',
    },
    {
      label: t(lang, 'Lợi nhuận sau thuế (LNST)', 'Profit After Tax (PAT)'),
      value: formatMoney(perf.pat, lang, unitDisplay),
      sub: `${unitLabel} · ROS ${formatPct(perf.margin, 1, lang)}`,
      tone: isPositivePat
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: t(lang, 'IRR vốn chủ sở hữu', 'Project Equity IRR'),
      value: formatPct(perf.irr, 1, lang),
      sub: `ROE ${formatPct(perf.roe, 1, lang)}`,
      tone: 'text-[var(--accent-primary)]',
    },
    {
      label: t(lang, 'NPV vốn chủ sở hữu', 'Project Equity NPV'),
      value: formatMoney(perf.npv, lang, unitDisplay),
      sub: `@ ${formatPct(perf.discountRate, 1, lang)}/${t(lang, 'năm', 'yr')}`,
      tone:
        perf.npv >= 0
          ? 'text-slate-900 dark:text-white'
          : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: t(lang, 'Vốn chủ sở hữu yêu cầu', 'Required Equity'),
      value: formatMoney(result.financing.equity, lang, unitDisplay),
      sub: `${t(lang, 'Vay', 'Debt')} ${formatMoney(result.financing.totalLoan, lang, unitDisplay)}`,
      tone: 'text-slate-900 dark:text-white',
    },
    {
      label: t(lang, 'Thời gian hoàn vốn', 'Equity Payback'),
      value:
        perf.paybackYears !== null
          ? `${formatNum(perf.paybackYears, 2, lang)} ${t(lang, 'năm', 'yrs')}`
          : '—',
      sub:
        perf.paybackQuarter !== null
          ? `${t(lang, 'Tại Quý', 'Quarter')} Q${perf.paybackQuarter} / 40`
          : t(lang, 'Ngoài 40 quý', '> 40Q'),
      tone: 'text-slate-900 dark:text-white',
    },
  ];

  return (
    <section
      aria-label="Key Financial Metrics"
      className="shrink-0 px-5 py-2.5 border-b border-slate-900/8 dark:border-white/10 bg-white/52 dark:bg-slate-900/48 backdrop-blur-xl grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {items.map((it, idx) => (
        <div
          key={idx}
          className="min-w-0 flex flex-col justify-center border-r last:border-r-0 border-slate-900/6 dark:border-white/8 pr-3"
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {it.label}
          </span>
          <div className={`font-tabular text-[16px] font-bold tracking-tight mt-0.5 truncate ${it.tone}`}>
            {it.value}
          </div>
          <span className="font-tabular text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {it.sub}
          </span>
        </div>
      ))}
    </section>
  );
};
