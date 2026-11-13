import React from 'react';
import {
  BarChart3,
  CalendarRange,
  Copy,
  FileSpreadsheet,
  FolderKanban,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldCheck,
  Trash2,
  Bookmark,
  X,
} from 'lucide-react';
import {
  AppPreferences,
  AssumptionCategory,
  ProjectRecord,
  ScenarioSnapshot,
  WorkspaceTab,
} from '../types/model';
import { t } from '../data/i18n';

interface MacSidebarProps {
  prefs: AppPreferences;
  onUpdatePrefs: (patch: Partial<AppPreferences>) => void;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  assumptionCat: AssumptionCategory;
  onSelectAssumptionCat: (cat: AssumptionCategory) => void;
  startYear: number;
  issueCount: number;
  projects: ProjectRecord[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  onDuplicateProject: () => void;
  onDeleteProject: (id: string) => void;
  scenarios: ScenarioSnapshot[];
  onLoadScenario: (sc: ScenarioSnapshot) => void;
  onOpenSaveScenario: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const MacSidebar: React.FC<MacSidebarProps> = ({
  prefs,
  onUpdatePrefs,
  activeTab,
  onSelectTab,
  assumptionCat,
  onSelectAssumptionCat,
  startYear,
  issueCount,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDuplicateProject,
  onDeleteProject,
  scenarios,
  onLoadScenario,
  onOpenSaveScenario,
  mobileOpen,
  onCloseMobile,
}) => {
  const lang = prefs.lang;
  const collapsed = prefs.sidebarCollapsed;

  const navItems: {
    id: WorkspaceTab;
    labelVi: string;
    labelEn: string;
    shortcut: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'assumptions',
      labelVi: 'Giả định & Thiết kế',
      labelEn: 'Assumptions',
      shortcut: '⌘1',
      icon: Layers,
    },
    {
      id: 'timeline',
      labelVi: 'Tiến độ 40 Quý',
      labelEn: '40Q Schedule',
      shortcut: '⌘2',
      icon: CalendarRange,
    },
    {
      id: 'dashboard',
      labelVi: 'Dashboard Phân tích',
      labelEn: 'Analytics',
      shortcut: '⌘3',
      icon: BarChart3,
    },
    {
      id: 'cashflow',
      labelVi: 'Báo cáo Dòng tiền',
      labelEn: 'Cash Flow',
      shortcut: '⌘4',
      icon: FileSpreadsheet,
    },
    {
      id: 'checks',
      labelVi: 'Kiểm tra & Kịch bản',
      labelEn: 'Checks & Scenarios',
      shortcut: '⌘5',
      icon: ShieldCheck,
    },
  ];

  const subCategories: { id: AssumptionCategory; vi: string; en: string }[] = [
    { id: 'all', vi: 'Tất cả hạng mục', en: 'All Sections' },
    { id: 'land', vi: 'A. Quy hoạch sử dụng đất', en: 'A. Land Use' },
    { id: 'highrise', vi: 'B. Thiết kế cao tầng', en: 'B. High-Rise' },
    { id: 'lowrise', vi: 'C. Thiết kế thấp tầng', en: 'C. Low-Rise' },
    { id: 'cost', vi: 'D. Chi phí đầu tư', en: 'D. Dev Cost' },
    { id: 'sales_fin', vi: 'E–G. Giá bán & Nguồn vốn', en: 'E–G. Sales & Finance' },
  ];

  const fullSidebarContent = (isDrawer: boolean) => (
    <div className="h-full flex flex-col justify-between select-none overflow-y-auto">
      <div className="p-3 space-y-5">
        {/* Workspace Navigation */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t(lang, 'Không gian mô hình', 'Workspace')}
            </span>
            {isDrawer ? (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label={t(lang, 'Đóng thanh điều hướng', 'Close drawer')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/6 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onUpdatePrefs({ sidebarCollapsed: true })}
                title={t(lang, 'Thu gọn thanh bên (⌘B)', 'Collapse Sidebar (⌘B)')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/6 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      if (isDrawer) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-900/6 dark:hover:bg-white/8'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-white' : 'text-[var(--accent-primary)]'
                        }`}
                      />
                      <span className="truncate">{lang === 'vi' ? item.labelVi : item.labelEn}</span>
                    </span>
                    {item.id === 'checks' && issueCount > 0 ? (
                      <span
                        className={`font-tabular text-[11.5px] font-semibold ${
                          active ? 'text-white' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {issueCount}
                      </span>
                    ) : (
                      <span
                        className={`font-tabular text-[11px] ${
                          active ? 'text-white/75' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </button>

                  {item.id === 'assumptions' && active && (
                    <div className="mt-1 ml-5 pl-2.5 border-l border-slate-900/10 dark:border-white/12 space-y-0.5">
                      {subCategories.map((sub) => {
                        const subActive = assumptionCat === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              onSelectAssumptionCat(sub.id);
                              if (isDrawer) onCloseMobile();
                            }}
                            className={`w-full text-left px-2 py-1 rounded-md text-[12px] transition cursor-pointer truncate ${
                              subActive
                                ? 'bg-slate-900/8 dark:bg-white/12 text-slate-950 dark:text-white font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900/4 dark:hover:bg-white/6'
                            }`}
                          >
                            {lang === 'vi' ? sub.vi : sub.en}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Project Library Switcher */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t(lang, 'Thư viện Dự án', 'Projects')}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onDuplicateProject}
                title={t(lang, 'Nhân bản dự án đang mở', 'Duplicate active project')}
                className="p-1 rounded-md text-slate-400 hover:text-[var(--accent-primary)] hover:bg-slate-900/6 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onCreateNewProject}
                title={t(lang, 'Tạo dự án mới (⌘N)', 'New project (⌘N)')}
                className="p-1 rounded-md text-slate-400 hover:text-[var(--accent-primary)] hover:bg-slate-900/6 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {projects.map((proj) => {
              const isCurrent = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  className={`group flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-[12px] transition ${
                    isCurrent
                      ? 'bg-slate-900/8 dark:bg-white/12 text-slate-950 dark:text-white font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/8'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(proj.id);
                      if (isDrawer) onCloseMobile();
                    }}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <FolderKanban
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrent ? 'text-[var(--accent-primary)]' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{proj.name}</span>
                  </button>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(proj.id);
                      }}
                      title={t(lang, 'Xoá dự án này', 'Delete project')}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Saved Scenarios Quick Switcher */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t(lang, 'Kịch bản lưu trữ', 'Scenarios')}
            </span>
            <button
              type="button"
              onClick={onOpenSaveScenario}
              title={t(lang, 'Lưu kịch bản mới', 'Save Scenario')}
              className="p-1 rounded-md text-slate-400 hover:text-[var(--accent-primary)] hover:bg-slate-900/6 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {scenarios.length === 0 ? (
            <button
              type="button"
              onClick={onOpenSaveScenario}
              className="w-full text-left px-2.5 py-2 rounded-lg border border-dashed border-slate-300 dark:border-white/15 text-[12px] text-slate-500 dark:text-slate-400 hover:border-[var(--accent-primary)] hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            >
              + {t(lang, 'Lưu bản chụp kịch bản đầu tiên', 'Save first scenario snapshot')}
            </button>
          ) : (
            <div className="space-y-0.5">
              {scenarios.slice(0, 5).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    onLoadScenario(sc);
                    if (isDrawer) onCloseMobile();
                  }}
                  title={t(lang, 'Nhấn để nạp kịch bản này', 'Click to load scenario')}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-900/6 dark:hover:bg-white/8 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Bookmark className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                    <span className="truncate">{sc.name}</span>
                  </span>
                  <span className="font-tabular text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0">
                    {(sc.kpis.irr * 100).toFixed(1)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Desktop Metadata Footer */}
      <div className="px-3.5 py-3 border-t border-slate-900/8 dark:border-white/10 text-[11.5px] text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center justify-between gap-2 whitespace-nowrap">
          <span>{t(lang, 'Chu kỳ', 'Horizon')}</span>
          <span className="font-tabular font-medium text-slate-700 dark:text-slate-200">
            40 {t(lang, 'Quý', 'Q')} · {startYear}–{startYear + 9}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 whitespace-nowrap">
          <span>{t(lang, 'Đơn vị', 'Unit')}</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {prefs.unitDisplay === 'billion'
              ? t(lang, 'Tỷ đồng', 'VND bn')
              : t(lang, 'Triệu đồng', 'VNDm')}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {collapsed ? (
        <aside className="hidden md:flex w-14 shrink-0 border-r border-slate-900/10 dark:border-white/10 bg-slate-100/65 dark:bg-slate-950/60 backdrop-blur-2xl flex-col items-center py-3 justify-between select-none">
          <div className="flex flex-col items-center gap-1.5 w-full px-2">
            <button
              type="button"
              onClick={() => onUpdatePrefs({ sidebarCollapsed: false })}
              title={t(lang, 'Mở rộng thanh bên (⌘B)', 'Expand Sidebar (⌘B)')}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-900/8 dark:hover:bg-white/10 transition cursor-pointer mb-1"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={`${lang === 'vi' ? item.labelVi : item.labelEn} (${item.shortcut})`}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-900/8 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </aside>
      ) : (
        <aside className="hidden md:flex w-60 shrink-0 border-r border-slate-900/10 dark:border-white/10 bg-slate-100/62 dark:bg-slate-950/58 backdrop-blur-2xl flex-col">
          {fullSidebarContent(false)}
        </aside>
      )}

      {/* Mobile / Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex bg-black/35 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCloseMobile();
          }}
        >
          <aside className="w-72 max-w-[85vw] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-900/10 dark:border-white/12 shadow-2xl">
            {fullSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
