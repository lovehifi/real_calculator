import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BookmarkPlus,
  CheckCircle2,
  FolderOpen,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  AppPreferences,
  CalculationResult,
  ScenarioSnapshot,
  WorkspaceTab,
} from '../types/model';
import { t } from '../data/i18n';
import { formatMoney, formatNum, formatPct } from '../engine/formulaParser';

interface ChecksAndScenariosViewProps {
  result: CalculationResult;
  prefs: AppPreferences;
  scenarios: ScenarioSnapshot[];
  onSaveScenario: (name: string) => void;
  onLoadScenario: (sc: ScenarioSnapshot) => void;
  onDeleteScenario: (id: string) => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
}

export const ChecksAndScenariosView: React.FC<ChecksAndScenariosViewProps> = ({
  result,
  prefs,
  scenarios,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario,
  onNavigateTab,
}) => {
  const { lang, unitDisplay } = prefs;
  const [scenarioName, setScenarioName] = useState('');

  const unitLabel =
    unitDisplay === 'billion'
      ? t(lang, 'tỷ đồng', 'VND bn')
      : t(lang, 'triệu đồng', 'VNDm');

  const okCount = result.checks.filter((c) => c.status === 'OK').length;
  const warnCount = result.checks.filter((c) => c.status === 'WARNING').length;
  const errCount = result.checks.filter((c) => c.status === 'ERROR').length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = scenarioName.trim();
    const fallbackName = `${t(lang, 'Phương án', 'Scenario')} #${scenarios.length + 1}`;
    onSaveScenario(trimmed || fallbackName);
    setScenarioName('');
  };

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-5">
      {/* Section 1: Automated Model & Regulatory Checks */}
      <section className="rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
              {t(
                lang,
                '1. Kiểm toán Quy hoạch, Pháp lý & Cân đối Dòng tiền 40 Quý',
                '1. Automated Planning, Legal & 40-Quarter Solvency Audit'
              )}
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {t(
                lang,
                'Rà soát tự động các quy chuẩn QCVN, trần thu tiền 95% trước bàn giao và khấu trừ thuế GTGT',
                'Automated verification of FAR/BCR rules, 95% pre-handover collection cap, and VAT recovery'
              )}
            </p>
          </div>

          <div className="font-tabular text-[12.5px] flex items-center gap-3">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {okCount} {t(lang, 'Đạt', 'Passed')}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {warnCount} {t(lang, 'Cảnh báo', 'Warnings')}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {errCount} {t(lang, 'Lỗi', 'Errors')}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-900/6 dark:divide-white/6">
          {result.checks.map((chk) => {
            const Icon =
              chk.status === 'OK'
                ? CheckCircle2
                : chk.status === 'WARNING'
                ? AlertTriangle
                : XCircle;
            const iconTone =
              chk.status === 'OK'
                ? 'text-emerald-600 dark:text-emerald-400'
                : chk.status === 'WARNING'
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400';

            return (
              <div
                key={chk.id}
                className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.025] transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconTone}`} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="font-tabular text-[11.5px] text-slate-400">{chk.id}</span>
                      <span>{lang === 'vi' ? chk.titleVi : chk.titleEn}</span>
                    </div>
                    <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5">
                      {lang === 'vi' ? chk.detailVi : chk.detailEn}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab(chk.targetTab)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:text-[var(--accent-primary)] hover:bg-slate-900/5 dark:hover:bg-white/8 transition cursor-pointer"
                >
                  <span>{t(lang, 'Đi tới bảng', 'Inspect')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Multi-Scenario Comparison Studio */}
      <section className="rounded-2xl bg-white/82 dark:bg-slate-900/72 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="px-4 py-3.5 border-b border-slate-900/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
              {t(
                lang,
                '2. So sánh Đa Kịch bản Đầu tư (Scenario Studio)',
                '2. Multi-Scenario Comparison Studio'
              )}
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {t(
                lang,
                'Chụp lại thông số hiện tại thành các phương án để đặt lên bàn cân so sánh IRR, NPV và vốn chủ sở hữu',
                'Snapshot your active assumptions to compare IRR, NPV, PAT, and required equity side by side'
              )}
            </p>
          </div>

          <form onSubmit={handleSave} className="flex items-center gap-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder={t(lang, 'Tên kịch bản (vd: Tăng giá 10%)...', 'Scenario name...')}
              className="px-3 py-1.5 rounded-lg text-[12.5px] w-56 bg-white dark:bg-slate-800 border border-slate-900/12 dark:border-white/12 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[var(--accent-primary)]"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[var(--accent-primary)] text-white hover:brightness-105 transition cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{t(lang, 'Lưu Kịch bản', 'Save Snapshot')}</span>
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-900/8 dark:border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-white/[0.02]">
                <th className="text-left py-2.5 px-4">{t(lang, 'Phương án / Kịch bản', 'Scenario')}</th>
                <th className="text-right py-2.5 px-3">{t(lang, 'Doanh thu', 'Revenue')} ({unitLabel})</th>
                <th className="text-right py-2.5 px-3">{t(lang, 'Tổng chi phí', 'Total Cost')}</th>
                <th className="text-right py-2.5 px-3">{t(lang, 'LNST (PAT)', 'PAT')}</th>
                <th className="text-right py-2.5 px-3">{t(lang, 'Biên LNST', 'Margin')}</th>
                <th className="text-right py-2.5 px-3">{t(lang, 'Vốn CSH', 'Equity')}</th>
                <th className="text-right py-2.5 px-3">IRR</th>
                <th className="text-right py-2.5 px-3">NPV</th>
                <th className="text-right py-2.5 px-3">{t(lang, 'Hoàn vốn', 'Payback')}</th>
                <th className="text-right py-2.5 px-4">{t(lang, 'Thao tác', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {/* Active Live Model Row */}
              <tr className="border-b border-slate-900/8 dark:border-white/10 bg-[var(--accent-soft)]/50 font-semibold text-slate-950 dark:text-white">
                <td className="py-2.5 px-4">
                  <div>{t(lang, 'Mô hình đang mở (Hiện tại)', 'Active Live Model')}</div>
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {formatMoney(result.summary.perf.revenue, lang, unitDisplay)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {formatMoney(result.summary.perf.cost, lang, unitDisplay)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular text-emerald-700 dark:text-emerald-400">
                  {formatMoney(result.summary.perf.pat, lang, unitDisplay)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {formatPct(result.summary.perf.margin, 1, lang)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {formatMoney(result.financing.equity, lang, unitDisplay)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular text-[var(--accent-primary)]">
                  {formatPct(result.summary.perf.irr, 1, lang)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {formatMoney(result.summary.perf.npv, lang, unitDisplay)}
                </td>
                <td className="py-2.5 px-3 text-right font-tabular">
                  {result.summary.perf.paybackYears !== null
                    ? `${formatNum(result.summary.perf.paybackYears, 2, lang)} ${t(lang, 'năm', 'y')}`
                    : '—'}
                </td>
                <td className="py-2.5 px-4 text-right text-[11.5px] text-slate-500 dark:text-slate-400">
                  {t(lang, 'Đang chỉnh sửa', 'Live')}
                </td>
              </tr>

              {scenarios.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-8 text-center text-slate-400 dark:text-slate-500 text-[13px]"
                  >
                    {t(
                      lang,
                      'Chưa có kịch bản nào được lưu. Nhập tên kịch bản ở góc trên bên phải và bấm "Lưu Kịch bản" để so sánh.',
                      'No saved scenarios yet. Enter a name above and click "Save Snapshot" to compare.'
                    )}
                  </td>
                </tr>
              ) : (
                scenarios.map((sc) => (
                  <tr
                    key={sc.id}
                    className="border-b last:border-b-0 border-slate-900/6 dark:border-white/6 text-slate-700 dark:text-slate-200 hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.025]"
                  >
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{sc.name}</div>
                      <div className="text-[11px] text-slate-400">{sc.createdAt}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {formatMoney(sc.kpis.revenue, lang, unitDisplay)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {formatMoney(sc.kpis.totalCost, lang, unitDisplay)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular font-medium text-emerald-700 dark:text-emerald-400">
                      {formatMoney(sc.kpis.pat, lang, unitDisplay)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {formatPct(sc.kpis.margin, 1, lang)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {formatMoney(sc.kpis.equity, lang, unitDisplay)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular font-semibold text-[var(--accent-primary)]">
                      {formatPct(sc.kpis.irr, 1, lang)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {formatMoney(sc.kpis.npv, lang, unitDisplay)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {sc.kpis.paybackYears !== null
                        ? `${formatNum(sc.kpis.paybackYears, 2, lang)} ${t(lang, 'năm', 'y')}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onLoadScenario(sc)}
                          title={t(lang, 'Nạp kịch bản này', 'Load Scenario')}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-medium bg-slate-900/6 dark:bg-white/10 hover:bg-[var(--accent-primary)] hover:text-white transition cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{t(lang, 'Nạp', 'Load')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteScenario(sc.id)}
                          title={t(lang, 'Xoá kịch bản', 'Delete')}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
