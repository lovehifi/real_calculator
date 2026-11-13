import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  AppPreferences,
  AssumptionCategory,
  ModelInputs,
  ProductCode,
  ScenarioSnapshot,
  TimelineInputs,
  WorkspaceTab,
} from './types/model';
import {
  PRESET_TEMPLATES,
  SAMPLE_PROJECT_INPUTS,
  cloneInputs,
  normalizeImportedInputs,
} from './data/sampleProject';
import { runFinancialModel } from './engine/financialEngine';
import { t } from './data/i18n';
import { MacMenuBar } from './components/MacMenuBar';
import { MacSidebar } from './components/MacSidebar';
import { KpiRibbon } from './components/KpiRibbon';
import { AssumptionsView } from './components/AssumptionsView';
import { TimelineView } from './components/TimelineView';
import { DashboardView } from './components/DashboardView';
import { CashFlowView } from './components/CashFlowView';
import { ChecksAndScenariosView } from './components/ChecksAndScenariosView';
import { CustomizePopover } from './components/CustomizePopover';
import { CommandPalette } from './components/CommandPalette';
import { QuickCalculator } from './components/QuickCalculator';

const STORAGE_INPUTS_KEY = 'rc_desktop_inputs_v2';
const STORAGE_PREFS_KEY = 'rc_desktop_prefs_v2';
const STORAGE_SCENARIOS_KEY = 'rc_desktop_scenarios_v2';

const DEFAULT_PREFS: AppPreferences = {
  lang: 'vi',
  theme: 'light',
  glassIntensity: 'balanced',
  accentColor: 'blue',
  density: 'comfortable',
  windowMode: 'framed',
  wallpaper: 'sonoma',
  autoCalculate: true,
  showKpiRibbon: true,
  showInspector: true,
  sidebarCollapsed: false,
  unitDisplay: 'million',
};

export default function App() {
  const [prefs, setPrefs] = useState<AppPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) return { ...DEFAULT_PREFS, ...(JSON.parse(saved) as Partial<AppPreferences>) };
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PREFS;
  });

  const [inputs, setInputs] = useState<ModelInputs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INPUTS_KEY);
      if (saved) return normalizeImportedInputs(JSON.parse(saved) as Record<string, unknown>);
    } catch {
      // ignore storage errors
    }
    return cloneInputs(SAMPLE_PROJECT_INPUTS);
  });

  const [committedInputs, setCommittedInputs] = useState<ModelInputs>(inputs);
  const [undoStack, setUndoStack] = useState<ModelInputs[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SCENARIOS_KEY);
      if (saved) return JSON.parse(saved) as ScenarioSnapshot[];
    } catch {
      // ignore
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('assumptions');
  const [assumptionCat, setAssumptionCat] = useState<AssumptionCategory>('all');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickCalcOpen, setQuickCalcOpen] = useState(false);
  const [saveScenarioModalOpen, setSaveScenarioModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [scenarioDraftName, setScenarioDraftName] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2400);
  }, []);

  // Sync dark mode class & accent attribute on documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-accent', prefs.accentColor);
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  // Persist inputs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_INPUTS_KEY, JSON.stringify(inputs));
    } catch {
      // ignore
    }
    if (prefs.autoCalculate) {
      setCommittedInputs(inputs);
    }
  }, [inputs, prefs.autoCalculate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SCENARIOS_KEY, JSON.stringify(scenarios));
    } catch {
      // ignore
    }
  }, [scenarios]);

  const updatePrefs = useCallback((patch: Partial<AppPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyNewInputs = useCallback((next: ModelInputs) => {
    setInputs((prev) => {
      setUndoStack((stk) => [...stk.slice(-19), prev]);
      return next;
    });
  }, []);

  const handleUpdateField = useCallback(
    <K extends keyof ModelInputs>(key: K, value: ModelInputs[K]) => {
      setInputs((prev) => {
        if (prev[key] === value) return prev;
        setUndoStack((stk) => [...stk.slice(-19), prev]);
        return { ...prev, [key]: value };
      });
    },
    []
  );

  const handleUpdateTimeline = useCallback((nextTimeline: TimelineInputs) => {
    setInputs((prev) => {
      setUndoStack((stk) => [...stk.slice(-19), prev]);
      return { ...prev, timeline: nextTimeline };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((stk) => {
      if (stk.length === 0) return stk;
      const previous = stk[stk.length - 1];
      setInputs(previous);
      return stk.slice(0, -1);
    });
  }, []);

  const result = useMemo(() => runFinancialModel(committedInputs, true), [committedInputs]);
  const isDirtyManual = !prefs.autoCalculate && committedInputs !== inputs;

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(inputs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeSlug = inputs.projectName.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'project';
    a.href = url;
    a.download = `${safeSlug}_40Q.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t(prefs.lang, 'Đã xuất tệp dự án .JSON', 'Project .JSON saved'));
  }, [inputs, prefs.lang, showToast]);

  const handleExportCsv = useCallback(() => {
    const headers = [
      'Line Item',
      'Total (VNDm)',
      ...Array.from({ length: 40 }, (_, i) => `Q${i + 1}`),
    ];
    const rows: [string, number, ...number[]][] = [
      ['Total Cash Inflow', result.cf.inflow.total, ...result.cf.inflow.q],
      ['Sales Revenue (ex. VAT)', result.cf.revenue.total, ...result.cf.revenue.q],
      ['Output VAT', result.cf.outVat.total, ...result.cf.outVat.q],
      ['Loan Drawdowns', result.cf.loan.total, ...result.cf.loan.q],
      ['Equity Contribution', result.cf.equity.total, ...result.cf.equity.q],
      ['Total Cash Outflow', result.cf.outflow.total, ...result.cf.outflow.q],
      ['Land & LUF', result.cf.landAcq.total, ...result.cf.landAcq.q],
      ['Construction & Consultancy', result.cf.dev.total, ...result.cf.dev.q],
      ['Operating & Selling', result.cf.opex.total, ...result.cf.opex.q],
      ['Taxes Paid', result.cf.taxes.total, ...result.cf.taxes.q],
      ['Interest Paid', result.cf.interest.total, ...result.cf.interest.q],
      ['Principal Repayment', result.cf.principal.total, ...result.cf.principal.q],
      ['Dividends', result.cf.dist.total, ...result.cf.dist.q],
      ['Net Cash Flow', result.cf.net.total, ...result.cf.net.q],
      ['Ending Cash Balance', result.cf.end.total, ...result.cf.end.q],
      ['Free Cash Flow to Equity (FCFE)', result.cf.fcfe.total, ...result.cf.fcfe.q],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((r) =>
          [
            `"${r[0]}"`,
            ...r.slice(1).map((n) => Math.round(Number(n) || 0)),
          ].join(',')
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CashFlow_40Quarters_${inputs.model_start_year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t(prefs.lang, 'Đã tải bảng dòng tiền 40 quý (.CSV)', 'Exported 40-Quarter CSV'));
  }, [inputs.model_start_year, prefs.lang, result.cf, showToast]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Record<string, unknown>;
        const normalized = normalizeImportedInputs(parsed);
        applyNewInputs(normalized);
        showToast(t(prefs.lang, `Đã nạp dự án: ${normalized.projectName}`, `Loaded: ${normalized.projectName}`));
      } catch {
        showToast(t(prefs.lang, 'Tệp JSON không hợp lệ', 'Invalid JSON project file'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadPreset = useCallback(
    (presetId: string) => {
      const found = PRESET_TEMPLATES.find((p) => p.id === presetId);
      if (!found) return;
      const built = found.build();
      applyNewInputs(built);
      showToast(
        t(
          prefs.lang,
          `Đã khởi tạo: ${found.nameVi}`,
          `Loaded template: ${found.nameEn}`
        )
      );
    },
    [applyNewInputs, prefs.lang, showToast]
  );

  const handleNormalizeAllTimelines = useCallback(() => {
    const next = cloneInputs(inputs);
    const norm = (arr: number[]) => {
      const s = arr.reduce((a, b) => a + Math.max(0, b), 0);
      if (s <= 1e-6) return arr;
      return arr.map((v) => Math.max(0, v) / s);
    };
    next.timeline.land = norm(next.timeline.land);
    next.timeline.luf = norm(next.timeline.luf);
    next.timeline.design_legal = norm(next.timeline.design_legal);
    next.timeline.gallery = norm(next.timeline.gallery);
    next.timeline.infra = norm(next.timeline.infra);
    const prods: ProductCode[] = ['ls', 'th', 'vl', 'ps', 'ap'];
    for (const p of prods) {
      next.timeline.construction[p] = norm(next.timeline.construction[p]);
      next.timeline.sales[p] = norm(next.timeline.sales[p]);
      next.timeline.collection[p] = norm(next.timeline.collection[p]);
    }
    applyNewInputs(next);
    showToast(
      t(prefs.lang, 'Đã chuẩn hoá toàn bộ tiến độ 40 quý về 100%', 'Normalized all 40Q rows to 100%')
    );
  }, [applyNewInputs, inputs, prefs.lang, showToast]);

  const handleSaveScenario = useCallback(
    (name: string) => {
      const snap: ScenarioSnapshot = {
        id: `${Date.now()}`,
        name,
        createdAt: new Date().toLocaleTimeString(prefs.lang === 'vi' ? 'vi-VN' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        inputs: cloneInputs(inputs),
        kpis: {
          revenue: result.summary.perf.revenue,
          totalCost: result.summary.perf.cost,
          pat: result.summary.perf.pat,
          margin: result.summary.perf.margin,
          equity: result.financing.equity,
          irr: result.summary.perf.irr,
          npv: result.summary.perf.npv,
          paybackYears: result.summary.perf.paybackYears,
        },
      };
      setScenarios((prev) => [snap, ...prev]);
      showToast(t(prefs.lang, `Đã lưu kịch bản "${name}"`, `Saved scenario "${name}"`));
    },
    [inputs, prefs.lang, result, showToast]
  );

  // Global macOS Desktop Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (key === '1') {
        e.preventDefault();
        setActiveTab('assumptions');
      } else if (key === '2') {
        e.preventDefault();
        setActiveTab('timeline');
      } else if (key === '3') {
        e.preventDefault();
        setActiveTab('dashboard');
      } else if (key === '4') {
        e.preventDefault();
        setActiveTab('cashflow');
      } else if (key === '5') {
        e.preventDefault();
        setActiveTab('checks');
      } else if (key === 'b') {
        e.preventDefault();
        updatePrefs({ sidebarCollapsed: !prefs.sidebarCollapsed });
      } else if (key === 'd') {
        e.preventDefault();
        updatePrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' });
      } else if (key === 'm') {
        e.preventDefault();
        setQuickCalcOpen((v) => !v);
      } else if (key === ',') {
        e.preventDefault();
        setCustomizeOpen((v) => !v);
      } else if (key === 's') {
        e.preventDefault();
        handleExportJson();
      } else if (key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (key === 'e') {
        e.preventDefault();
        handleExportCsv();
      } else if (key === 'r') {
        e.preventDefault();
        setCommittedInputs(inputs);
        showToast(t(prefs.lang, 'Đã cập nhật kết quả tính toán', 'Model recalculated'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleExportCsv,
    handleExportJson,
    inputs,
    prefs.lang,
    prefs.sidebarCollapsed,
    prefs.theme,
    showToast,
    updatePrefs,
  ]);

  const issueCount = result.checks.filter((c) => c.status !== 'OK').length;

  // Wallpaper classes for Framed Tauri Desktop mode
  const wallpaperBg = {
    sonoma:
      'bg-[radial-gradient(ellipse_at_top_left,_#38bdf8_0%,_#818cf8_38%,_#34d399_78%,_#0f172a_100%)] dark:bg-[radial-gradient(ellipse_at_top_left,_#0c4a6e_0%,_#1e1b4b_45%,_#064e3b_85%,_#020617_100%)]',
    sequoia:
      'bg-[radial-gradient(ellipse_at_top_right,_#fbbf24_0%,_#fb7185_42%,_#4f46e5_88%)] dark:bg-[radial-gradient(ellipse_at_top_right,_#78350f_0%,_#881337_45%,_#1e1b4b_90%)]',
    aurora:
      'bg-[radial-gradient(ellipse_at_top,_#2dd4bf_0%,_#0284c7_48%,_#0f172a_100%)] dark:bg-[radial-gradient(ellipse_at_top,_#115e59_0%,_#0f172a_58%,_#020617_100%)]',
    graphite:
      'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 dark:from-slate-900 dark:via-slate-950 dark:to-black',
  }[prefs.wallpaper];

  const windowShellBlur = {
    subtle: 'bg-slate-50/92 dark:bg-slate-950/92 backdrop-blur-md',
    balanced: 'bg-slate-50/82 dark:bg-slate-950/82 backdrop-blur-2xl',
    ultra: 'bg-white/68 dark:bg-slate-950/68 backdrop-blur-3xl',
  }[prefs.glassIntensity];

  const isFramed = prefs.windowMode === 'framed';

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex items-center justify-center transition-colors duration-300 ${
        isFramed ? `${wallpaperBg} p-2.5 sm:p-4` : 'bg-slate-100 dark:bg-slate-950 p-0'
      }`}
    >
      {/* Hidden JSON File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Standalone Tauri macOS Window Container */}
      <div
        className={`w-full h-full flex flex-col overflow-hidden transition-all ${windowShellBlur} ${
          isFramed
            ? 'rounded-[18px] border border-white/55 dark:border-white/14 shadow-[0_28px_70px_-15px_rgba(0,0,0,0.42)]'
            : ''
        }`}
      >
        {/* Top macOS Titlebar & Native Dropdown Menus */}
        <MacMenuBar
          projectName={inputs.projectName}
          onProjectNameChange={(name) => handleUpdateField('projectName', name)}
          prefs={prefs}
          onUpdatePrefs={updatePrefs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          canUndo={undoStack.length > 0}
          onUndo={handleUndo}
          onLoadPreset={handleLoadPreset}
          onTriggerImportJson={() => fileInputRef.current?.click()}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onNormalizeAllTimelines={handleNormalizeAllTimelines}
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onToggleQuickCalc={() => setQuickCalcOpen((v) => !v)}
          onToggleCustomize={() => setCustomizeOpen((v) => !v)}
          onSaveScenarioModal={() => {
            setScenarioDraftName('');
            setSaveScenarioModalOpen(true);
          }}
          onManualRecalculate={() => {
            setCommittedInputs(inputs);
            showToast(t(prefs.lang, 'Đã tính toán lại mô hình 40 quý', 'Recalculated 40Q model'));
          }}
          isDirtyManual={isDirtyManual}
          designMethod={inputs.design_method}
          onChangeDesignMethod={(m) => handleUpdateField('design_method', m)}
          onRequestResetConfirm={() => setResetConfirmOpen(true)}
        />

        {/* Body: Left Frosted Source-List Sidebar + Right Workspace */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <MacSidebar
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            assumptionCat={assumptionCat}
            onSelectAssumptionCat={setAssumptionCat}
            startYear={inputs.model_start_year}
            issueCount={issueCount}
            scenarios={scenarios}
            onLoadScenario={(sc) => {
              applyNewInputs(cloneInputs(sc.inputs));
              showToast(t(prefs.lang, `Đã nạp kịch bản: ${sc.name}`, `Loaded scenario: ${sc.name}`));
            }}
            onOpenSaveScenario={() => {
              setScenarioDraftName('');
              setSaveScenarioModalOpen(true);
            }}
          />

          <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {prefs.showKpiRibbon && <KpiRibbon result={result} prefs={prefs} />}

            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === 'assumptions' && (
                <AssumptionsView
                  inputs={inputs}
                  onUpdateField={handleUpdateField}
                  result={result}
                  prefs={prefs}
                  onUpdatePrefs={updatePrefs}
                  category={assumptionCat}
                  onSelectCategory={setAssumptionCat}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineView
                  inputs={inputs}
                  onUpdateTimeline={handleUpdateTimeline}
                  result={result}
                  prefs={prefs}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView inputs={inputs} result={result} prefs={prefs} />
              )}

              {activeTab === 'cashflow' && (
                <CashFlowView
                  inputs={inputs}
                  result={result}
                  prefs={prefs}
                  onExportCsv={handleExportCsv}
                />
              )}

              {activeTab === 'checks' && (
                <ChecksAndScenariosView
                  result={result}
                  prefs={prefs}
                  scenarios={scenarios}
                  onSaveScenario={handleSaveScenario}
                  onLoadScenario={(sc) => {
                    applyNewInputs(cloneInputs(sc.inputs));
                    showToast(
                      t(prefs.lang, `Đã nạp kịch bản: ${sc.name}`, `Loaded scenario: ${sc.name}`)
                    );
                  }}
                  onDeleteScenario={(id) =>
                    setScenarios((prev) => prev.filter((item) => item.id !== id))
                  }
                  onNavigateTab={setActiveTab}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Overlays & Native macOS Sheets */}
      <CustomizePopover
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        prefs={prefs}
        onUpdatePrefs={updatePrefs}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        prefs={prefs}
        onUpdatePrefs={updatePrefs}
        onSelectTab={setActiveTab}
        onLoadPreset={handleLoadPreset}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onOpenSaveScenario={() => {
          setScenarioDraftName('');
          setSaveScenarioModalOpen(true);
        }}
      />

      <QuickCalculator
        open={quickCalcOpen}
        onClose={() => setQuickCalcOpen(false)}
        lang={prefs.lang}
      />

      {/* Native macOS Save Scenario Sheet */}
      {saveScenarioModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSaveScenarioModalOpen(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const label =
                scenarioDraftName.trim() ||
                `${t(prefs.lang, 'Phương án', 'Scenario')} #${scenarios.length + 1}`;
              handleSaveScenario(label);
              setSaveScenarioModalOpen(false);
            }}
            className="w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-900/15 dark:border-white/15 shadow-2xl p-5 space-y-4"
          >
            <div>
              <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">
                {t(prefs.lang, 'Lưu bản chụp Kịch bản mới', 'Save Scenario Snapshot')}
              </h3>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
                {t(
                  prefs.lang,
                  'Lưu toàn bộ giả định và tiến độ 40 quý hiện tại để đối chiếu hiệu quả.',
                  'Store current assumptions and 40-quarter schedule for side-by-side comparison.'
                )}
              </p>
            </div>
            <input
              type="text"
              autoFocus
              value={scenarioDraftName}
              onChange={(e) => setScenarioDraftName(e.target.value)}
              placeholder={t(prefs.lang, 'Ví dụ: Phương án cơ sở / Giá bán +10%', 'e.g. Base Case / Price +10%')}
              className="w-full px-3 py-2 rounded-xl text-[13px] bg-slate-100 dark:bg-slate-800 border border-slate-900/12 dark:border-white/12 text-slate-900 dark:text-white outline-none focus:border-[var(--accent-primary)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveScenarioModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-900/6 dark:hover:bg-white/10 cursor-pointer"
              >
                {t(prefs.lang, 'Huỷ', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[var(--accent-primary)] text-white hover:brightness-105 cursor-pointer"
              >
                {t(prefs.lang, 'Lưu Kịch bản', 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Native macOS Reset Confirmation Sheet (Replaces window.confirm) */}
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setResetConfirmOpen(false);
          }}
        >
          <div className="w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-900/15 dark:border-white/15 shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">
                {t(prefs.lang, 'Khôi phục về Dự án Mẫu Mặc định?', 'Reset to Default Sample Project?')}
              </h3>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
                {t(
                  prefs.lang,
                  'Các thông số đang chỉnh sửa sẽ trở về mẫu Khu Đô Thị Hỗn Hợp Riverside Park (bạn vẫn có thể Hoàn tác bằng ⌘Z).',
                  'Active inputs will revert to the Riverside Park default sample (you can still Undo with ⌘Z).'
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-900/6 dark:hover:bg-white/10 cursor-pointer"
              >
                {t(prefs.lang, 'Giữ nguyên', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  applyNewInputs(cloneInputs(SAMPLE_PROJECT_INPUTS));
                  setResetConfirmOpen(false);
                  showToast(t(prefs.lang, 'Đã khôi phục dự án mẫu mặc định', 'Reset to default sample'));
                }}
                className="px-4 py-1.5 rounded-lg text-[12.5px] font-semibold bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
              >
                {t(prefs.lang, 'Khôi phục', 'Reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle macOS HUD Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/88 dark:bg-white/90 text-white dark:text-slate-950 backdrop-blur-xl text-[12.5px] font-medium shadow-lg pointer-events-none">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
