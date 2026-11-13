import React, { useState } from 'react';
import { Wand2, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  AppPreferences,
  CalculationResult,
  ModelInputs,
  ProductCode,
  TimelineInputs,
} from '../types/model';
import { PRODUCT_NAMES, t } from '../data/i18n';
import { evaluateFormula, formatNum, formatPct } from '../engine/formulaParser';

interface TimelineViewProps {
  inputs: ModelInputs;
  onUpdateTimeline: (nextTimeline: TimelineInputs) => void;
  result: CalculationResult;
  prefs: AppPreferences;
}

type HorizonFilter = 'all40' | 'q1_20' | 'q21_40';

interface ScheduleRowDescriptor {
  id: string;
  group: 'cost' | 'construction' | 'sales' | 'collection';
  groupTitleVi: string;
  groupTitleEn: string;
  labelVi: string;
  labelEn: string;
  values: number[];
  applyRow: (nextArr: number[], base: TimelineInputs) => TimelineInputs;
}

const PRODUCTS: ProductCode[] = ['ls', 'th', 'vl', 'ps', 'ap'];

export const TimelineView: React.FC<TimelineViewProps> = ({
  inputs,
  onUpdateTimeline,
  result,
  prefs,
}) => {
  const { lang } = prefs;
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('all40');
  const [selectedRowId, setSelectedRowId] = useState<string>('cost_land');
  const [fromQ, setFromQ] = useState<number>(9);
  const [toQ, setToQ] = useState<number>(16);

  const cloneTl = (): TimelineInputs => JSON.parse(JSON.stringify(inputs.timeline)) as TimelineInputs;

  const rows: ScheduleRowDescriptor[] = [
    {
      id: 'cost_land',
      group: 'cost',
      groupTitleVi: '1. Tiến độ thanh toán đất & chi phí chuẩn bị đầu tư',
      groupTitleEn: '1. Land & Pre-Development Payment Schedule',
      labelVi: 'Thanh toán tiền chuyển nhượng đất',
      labelEn: 'Land transfer payment',
      values: inputs.timeline.land,
      applyRow: (arr, tl) => ({ ...tl, land: arr }),
    },
    {
      id: 'cost_luf',
      group: 'cost',
      groupTitleVi: '',
      groupTitleEn: '',
      labelVi: 'Nộp Tiền sử dụng đất (LUF)',
      labelEn: 'Land use fee settlement',
      values: inputs.timeline.luf,
      applyRow: (arr, tl) => ({ ...tl, luf: arr }),
    },
    {
      id: 'cost_design',
      group: 'cost',
      groupTitleVi: '',
      groupTitleEn: '',
      labelVi: 'Tư vấn thiết kế & Pháp lý',
      labelEn: 'Design consultant & Legal fee',
      values: inputs.timeline.design_legal,
      applyRow: (arr, tl) => ({ ...tl, design_legal: arr }),
    },
    {
      id: 'cost_gallery',
      group: 'cost',
      groupTitleVi: '',
      groupTitleEn: '',
      labelVi: 'Xây dựng Nhà mẫu (Sales Gallery)',
      labelEn: 'Sales gallery construction',
      values: inputs.timeline.gallery,
      applyRow: (arr, tl) => ({ ...tl, gallery: arr }),
    },
    {
      id: 'cost_infra',
      group: 'cost',
      groupTitleVi: '',
      groupTitleEn: '',
      labelVi: 'Thi công Hạ tầng kỹ thuật & Cảnh quan',
      labelEn: 'Infrastructure & Landscape construction',
      values: inputs.timeline.infra,
      applyRow: (arr, tl) => ({ ...tl, infra: arr }),
    },
    ...PRODUCTS.map((p, idx): ScheduleRowDescriptor => ({
      id: `constr_${p}`,
      group: 'construction',
      groupTitleVi: idx === 0 ? '2. Tiến độ thi công xây dựng theo sản phẩm' : '',
      groupTitleEn: idx === 0 ? '2. Building Construction Progress by Product' : '',
      labelVi: `XD · ${PRODUCT_NAMES[p].vi}`,
      labelEn: `Constr. · ${PRODUCT_NAMES[p].en}`,
      values: inputs.timeline.construction[p],
      applyRow: (arr, tl) => ({
        ...tl,
        construction: { ...tl.construction, [p]: arr },
      }),
    })),
    ...PRODUCTS.map((p, idx): ScheduleRowDescriptor => ({
      id: `sales_${p}`,
      group: 'sales',
      groupTitleVi: idx === 0 ? '3. Tiến độ mở bán ký hợp đồng theo sản phẩm' : '',
      groupTitleEn: idx === 0 ? '3. Contracted Sales Launch Schedule by Product' : '',
      labelVi: `Mở bán · ${PRODUCT_NAMES[p].vi}`,
      labelEn: `Sales · ${PRODUCT_NAMES[p].en}`,
      values: inputs.timeline.sales[p],
      applyRow: (arr, tl) => ({
        ...tl,
        sales: { ...tl.sales, [p]: arr },
      }),
    })),
    ...PRODUCTS.map((p, idx): ScheduleRowDescriptor => ({
      id: `coll_${p}`,
      group: 'collection',
      groupTitleVi: idx === 0 ? '4. Tiến độ thu tiền khách hàng theo sản phẩm' : '',
      groupTitleEn: idx === 0 ? '4. Customer Cash Collection Schedule by Product' : '',
      labelVi: `Thu tiền · ${PRODUCT_NAMES[p].vi}`,
      labelEn: `Collection · ${PRODUCT_NAMES[p].en}`,
      values: inputs.timeline.collection[p],
      applyRow: (arr, tl) => ({
        ...tl,
        collection: { ...tl.collection, [p]: arr },
      }),
    })),
  ];

  const quarterIndices: number[] = [];
  if (horizonFilter === 'all40') {
    for (let i = 0; i < 40; i++) quarterIndices.push(i);
  } else if (horizonFilter === 'q1_20') {
    for (let i = 0; i < 20; i++) quarterIndices.push(i);
  } else {
    for (let i = 20; i < 40; i++) quarterIndices.push(i);
  }

  const handleSpreadEvenly = () => {
    const target = rows.find((r) => r.id === selectedRowId);
    if (!target) return;
    const startIdx = Math.max(0, Math.min(39, Math.min(fromQ, toQ) - 1));
    const endIdx = Math.max(0, Math.min(39, Math.max(fromQ, toQ) - 1));
    const count = endIdx - startIdx + 1;
    const nextArr = new Array<number>(40).fill(0);
    for (let i = startIdx; i <= endIdx; i++) {
      nextArr[i] = 1 / count;
    }
    onUpdateTimeline(target.applyRow(nextArr, cloneTl()));
  };

  const handleClearRow = () => {
    const target = rows.find((r) => r.id === selectedRowId);
    if (!target) return;
    onUpdateTimeline(target.applyRow(new Array<number>(40).fill(0), cloneTl()));
  };

  const handleCellEdit = (row: ScheduleRowDescriptor, qIdx: number, rawText: string) => {
    const trimmed = rawText.trim();
    const nextArr = [...row.values];
    if (!trimmed) {
      nextArr[qIdx] = 0;
      onUpdateTimeline(row.applyRow(nextArr, cloneTl()));
      return;
    }
    const hasPct = trimmed.includes('%');
    const parsed = evaluateFormula(trimmed, lang);
    if (parsed === null) return;
    const ratio = hasPct ? parsed : parsed / 100;
    nextArr[qIdx] = Math.max(0, Math.min(1, ratio));
    onUpdateTimeline(row.applyRow(nextArr, cloneTl()));
  };

  const handlePasteRow = (
    e: React.ClipboardEvent<HTMLInputElement>,
    row: ScheduleRowDescriptor,
    startQIdx: number
  ) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
    e.preventDefault();
    const cells = text
      .split(/[\t\r\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (cells.length <= 1) return;

    const nextArr = [...row.values];
    for (let i = 0; i < cells.length && startQIdx + i < 40; i++) {
      const token = cells[i];
      const hasPct = token.includes('%');
      const parsed = evaluateFormula(token, lang);
      if (parsed !== null) {
        const val = hasPct ? parsed : parsed > 1 ? parsed / 100 : parsed;
        nextArr[startQIdx + i] = Math.max(0, Math.min(1, val));
      }
    }
    onUpdateTimeline(row.applyRow(nextArr, cloneTl()));
  };

  const startYear = inputs.model_start_year;

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-5">
      {/* Top Toolbar & Smart 40-Quarter Quick-Distribute Bar */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 mr-1">
            <Wand2 className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>{t(lang, 'Rải nhanh 40 Quý:', 'Quick Fill 40Q:')}</span>
          </div>

          <select
            aria-label="Target schedule row"
            value={selectedRowId}
            onChange={(e) => setSelectedRowId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-[12.5px] bg-white dark:bg-slate-800 border border-slate-900/12 dark:border-white/12 text-slate-800 dark:text-slate-100 outline-none"
          >
            {rows.map((r) => (
              <option key={r.id} value={r.id}>
                {lang === 'vi' ? r.labelVi : r.labelEn}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600 dark:text-slate-300">
            <span>{t(lang, 'Từ Q', 'From Q')}</span>
            <input
              type="number"
              min={1}
              max={40}
              value={fromQ}
              onChange={(e) => setFromQ(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
              className="w-14 px-2 py-1 rounded-lg font-tabular text-center bg-white dark:bg-slate-800 border border-slate-900/12 dark:border-white/12 text-slate-900 dark:text-white"
            />
            <span>{t(lang, 'đến Q', 'to Q')}</span>
            <input
              type="number"
              min={1}
              max={40}
              value={toQ}
              onChange={(e) => setToQ(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
              className="w-14 px-2 py-1 rounded-lg font-tabular text-center bg-white dark:bg-slate-800 border border-slate-900/12 dark:border-white/12 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleSpreadEvenly}
            className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[var(--accent-primary)] text-white hover:brightness-105 transition cursor-pointer"
          >
            {t(lang, 'Chia đều 100%', 'Distribute 100%')}
          </button>

          <button
            type="button"
            onClick={handleClearRow}
            title={t(lang, 'Xoá dòng đang chọn về 0%', 'Zero selected row')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-slate-900/5 dark:bg-white/8 hover:bg-slate-900/10 dark:hover:bg-white/15 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t(lang, 'Xoá dòng', 'Clear Row')}</span>
          </button>
        </div>

        {/* Horizon Range Filter */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900/6 dark:bg-white/10 text-[12px]">
          <button
            type="button"
            onClick={() => setHorizonFilter('all40')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              horizonFilter === 'all40'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {t(lang, 'Đủ 40 Quý (Q1–Q40)', 'All 40 Quarters')}
          </button>
          <button
            type="button"
            onClick={() => setHorizonFilter('q1_20')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              horizonFilter === 'q1_20'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Q1–Q20 ({t(lang, 'Năm 1–5', 'Yr 1–5')})
          </button>
          <button
            type="button"
            onClick={() => setHorizonFilter('q21_40')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              horizonFilter === 'q21_40'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Q21–Q40 ({t(lang, 'Năm 6–10', 'Yr 6–10')})
          </button>
        </div>
      </div>

      {/* Main Unlocked 40-Quarter Editable Spreadsheet */}
      <section className="rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              {t(
                lang,
                'Ma trận Tiến độ Thực hiện 40 Quý (Mở khoá toàn diện Q1–Q40)',
                '40-Quarter Master Schedule Matrix (100% Unlocked Q1–Q40)'
              )}
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {t(
                lang,
                'Nhập tỷ lệ % cho từng quý (ví dụ gõ 25 cho 25%) hoặc dán trực tiếp một hàng từ Excel.',
                'Type percentage values per quarter (e.g. 25 for 25%) or paste tab-separated cells directly from Excel.'
              )}
            </p>
          </div>
          <span className="font-tabular text-[12px] text-slate-500 dark:text-slate-400">
            {startYear} – {startYear + 9} · 10 {t(lang, 'năm', 'years')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              {/* Year Group Header */}
              <tr className="bg-slate-100/90 dark:bg-slate-950/85 border-b border-slate-900/8 dark:border-white/10 text-slate-600 dark:text-slate-300">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-950 text-left px-3.5 py-2 min-w-[230px] border-r border-slate-900/10 dark:border-white/10 font-semibold"
                >
                  {t(lang, 'Hạng mục tiến độ', 'Schedule Item')}
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[230px] z-20 bg-slate-100 dark:bg-slate-950 text-right px-2.5 py-2 min-w-[78px] border-r border-slate-900/10 dark:border-white/10 font-semibold"
                >
                  {t(lang, 'Tổng %', 'Total')}
                </th>
                {Array.from({ length: horizonFilter === 'all40' ? 10 : 5 }, (_, idx) => {
                  const yearOffset = horizonFilter === 'q21_40' ? idx + 5 : idx;
                  return (
                    <th
                      key={yearOffset}
                      colSpan={4}
                      className="text-center py-1.5 px-2 border-r border-slate-900/8 dark:border-white/10 font-tabular font-semibold"
                    >
                      {t(lang, 'Năm', 'Year')} {yearOffset + 1} ({startYear + yearOffset})
                    </th>
                  );
                })}
              </tr>
              {/* Quarter Sub-Header */}
              <tr className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400">
                {quarterIndices.map((qIdx) => (
                  <th
                    key={qIdx}
                    className={`font-tabular text-right py-1.5 px-1.5 min-w-[64px] font-medium ${
                      (qIdx + 1) % 4 === 0 ? 'border-r border-slate-900/10 dark:border-white/10' : ''
                    }`}
                  >
                    Q{qIdx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowSum = row.values.reduce((a, b) => a + b, 0);
                const isComplete = Math.abs(rowSum - 1) <= 0.005;
                const isEmpty = rowSum < 1e-5;
                const isSelected = selectedRowId === row.id;

                return (
                  <React.Fragment key={row.id}>
                    {row.groupTitleVi && (
                      <tr className="bg-slate-900/[0.035] dark:bg-white/[0.045] border-y border-slate-900/8 dark:border-white/10">
                        <td
                          colSpan={2 + quarterIndices.length}
                          className="px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                        >
                          <span className="sticky left-3.5 inline-block">
                            {lang === 'vi' ? row.groupTitleVi : row.groupTitleEn}
                          </span>
                        </td>
                      </tr>
                    )}

                    <tr
                      onClick={() => setSelectedRowId(row.id)}
                      className={`border-b border-slate-900/6 dark:border-white/6 transition ${
                        isSelected
                          ? 'bg-[var(--accent-soft)]/40'
                          : 'hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.025]'
                      }`}
                    >
                      <td className="sticky left-0 z-10 bg-white/95 dark:bg-slate-900/95 px-3.5 py-1.5 border-r border-slate-900/8 dark:border-white/10 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {lang === 'vi' ? row.labelVi : row.labelEn}
                      </td>
                      <td
                        className={`sticky left-[230px] z-10 bg-white/95 dark:bg-slate-900/95 px-2.5 py-1.5 border-r border-slate-900/10 dark:border-white/10 font-tabular text-right font-semibold whitespace-nowrap ${
                          isComplete
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isEmpty
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {formatPct(rowSum, 1, lang)}
                      </td>
                      {quarterIndices.map((qIdx) => {
                        const cellVal = row.values[qIdx] ?? 0;
                        const activeCell = cellVal > 1e-5;
                        return (
                          <td
                            key={qIdx}
                            className={`p-1 ${
                              (qIdx + 1) % 4 === 0
                                ? 'border-r border-slate-900/8 dark:border-white/10'
                                : ''
                            }`}
                          >
                            <QuarterPctCell
                              value={cellVal}
                              lang={lang}
                              active={activeCell}
                              onCommit={(txt) => handleCellEdit(row, qIdx, txt)}
                              onPaste={(e) => handlePasteRow(e, row, qIdx)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Product Milestone Audit & Visual Gantt Summary */}
      <section className="rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10">
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
            {t(
              lang,
              'Kiểm tra Mốc Pháp lý & Bàn giao theo Sản phẩm (40 Quý)',
              'Product Milestone & Legal Compliance Audit (40 Quarters)'
            )}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-900/8 dark:border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="text-left py-2.5 px-4">{t(lang, 'Sản phẩm', 'Product')}</th>
                <th className="text-center py-2.5 px-3">{t(lang, 'Khởi công', 'Constr. Start')}</th>
                <th className="text-center py-2.5 px-3">{t(lang, 'Bàn giao', 'Handover')}</th>
                <th className="text-center py-2.5 px-3">{t(lang, 'Mở bán', 'Sales Start')}</th>
                <th className="text-center py-2.5 px-3">{t(lang, 'Mốc thu 95%', '95% Collected')}</th>
                <th className="text-center py-2.5 px-3">{t(lang, 'Thu 100%', 'Final Collect')}</th>
                <th className="text-left py-2.5 px-4 min-w-[220px]">
                  {t(lang, 'Biểu đồ Gantt 40 Quý (XD & Thu tiền)', '40Q Gantt (Build & Collect)')}
                </th>
                <th className="text-right py-2.5 px-4">{t(lang, 'Trạng thái', 'Check')}</th>
              </tr>
            </thead>
            <tbody>
              {result.timelineAudit.products.map((audit) => {
                const ok =
                  !audit.active ||
                  (audit.salesCollStatus === 'OK' &&
                    audit.basementSalesStatus === 'OK' &&
                    audit.handover95Status === 'OK');
                return (
                  <tr
                    key={audit.p}
                    className="border-b last:border-b-0 border-slate-900/6 dark:border-white/6 text-slate-700 dark:text-slate-200"
                  >
                    <td className="py-2.5 px-4 font-medium">
                      {lang === 'vi' ? PRODUCT_NAMES[audit.p].vi : PRODUCT_NAMES[audit.p].en}
                    </td>
                    <td className="py-2.5 px-3 text-center font-tabular">
                      {audit.constrStart ? `Q${audit.constrStart}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-tabular">
                      {audit.handover ? `Q${audit.handover}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-tabular">
                      {audit.salesStart ? `Q${audit.salesStart}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-tabular">
                      {audit.coll95 ? `Q${audit.coll95}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-tabular">
                      {audit.finalColl ? `Q${audit.finalColl}` : '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      {audit.active ? (
                        <div className="space-y-1">
                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 relative overflow-hidden">
                            {audit.constrStart && audit.handover && (
                              <div
                                className="absolute top-0 bottom-0 bg-blue-500 rounded-full"
                                style={{
                                  left: `${((audit.constrStart - 1) / 40) * 100}%`,
                                  width: `${Math.max(2.5, ((audit.handover - audit.constrStart + 1) / 40) * 100)}%`,
                                }}
                              />
                            )}
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 relative overflow-hidden">
                            {audit.collStart && audit.finalColl && (
                              <div
                                className="absolute top-0 bottom-0 bg-emerald-500 rounded-full"
                                style={{
                                  left: `${((audit.collStart - 1) / 40) * 100}%`,
                                  width: `${Math.max(2.5, ((audit.finalColl - audit.collStart + 1) / 40) * 100)}%`,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[12px]">
                          {t(lang, 'Không phát sinh diện tích', 'Inactive')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {!audit.active ? (
                        <span className="text-slate-400 text-[12px]">N/A</span>
                      ) : ok ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[12px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t(lang, 'Hợp lệ', 'Aligned')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[12px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{t(lang, 'Cần rà soát', 'Review')}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

interface QuarterPctCellProps {
  value: number;
  lang: 'vi' | 'en';
  active: boolean;
  onCommit: (raw: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

const QuarterPctCell: React.FC<QuarterPctCellProps> = ({
  value,
  lang,
  active,
  onCommit,
  onPaste,
}) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const formatted = active ? `${formatNum(value * 100, 1, lang)}%` : '';

  return (
    <input
      type="text"
      inputMode="decimal"
      value={focused ? draft : formatted}
      placeholder="·"
      onFocus={(e) => {
        setFocused(true);
        if (active) {
          const v = Number((value * 100).toFixed(2));
          setDraft(lang === 'vi' ? String(v).replace('.', ',') : String(v));
        } else {
          setDraft('');
        }
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onPaste={onPaste}
      onBlur={() => {
        setFocused(false);
        onCommit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
          setFocused(false);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={`w-full font-tabular text-right text-[11.5px] px-1.5 py-1 rounded-[5px] outline-none transition border ${
        focused
          ? 'border-[var(--accent-primary)] bg-white dark:bg-slate-800 text-slate-950 dark:text-white'
          : active
          ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold'
          : 'border-transparent bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/6 text-slate-400 dark:text-slate-600 placeholder:text-slate-300 dark:placeholder:text-slate-700'
      }`}
    />
  );
};
