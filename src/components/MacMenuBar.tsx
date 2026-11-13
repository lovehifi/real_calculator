import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator,
  Check,
  Command,
  Menu,
  Play,
  Share2,
  SlidersHorizontal,
  FolderKanban,
} from 'lucide-react';
import { AppPreferences, WorkspaceTab } from '../types/model';
import { PRESET_TEMPLATES } from '../data/sampleProject';
import { t } from '../data/i18n';

interface MacMenuBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  prefs: AppPreferences;
  onUpdatePrefs: (patch: Partial<AppPreferences>) => void;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onLoadPreset: (presetId: string) => void;
  onDuplicateProject: () => void;
  onTriggerImportJson: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onOpenPrint: () => void;
  onCopyShareLink: () => void;
  onNormalizeAllTimelines: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCalc: () => void;
  onToggleCustomize: () => void;
  onToggleMobileSidebar: () => void;
  onSaveScenarioModal: () => void;
  onManualRecalculate: () => void;
  isDirtyManual: boolean;
  designMethod: 'population' | 'far';
  onChangeDesignMethod: (m: 'population' | 'far') => void;
  onRequestResetConfirm: () => void;
}

type MenuKey = 'file' | 'edit' | 'view' | 'model' | 'scenarios' | 'window' | null;

export const MacMenuBar: React.FC<MacMenuBarProps> = ({
  projectName,
  onProjectNameChange,
  prefs,
  onUpdatePrefs,
  activeTab,
  onSelectTab,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onLoadPreset,
  onDuplicateProject,
  onTriggerImportJson,
  onExportJson,
  onExportCsv,
  onExportExcel,
  onOpenPrint,
  onCopyShareLink,
  onNormalizeAllTimelines,
  onOpenCommandPalette,
  onToggleQuickCalc,
  onToggleCustomize,
  onToggleMobileSidebar,
  onSaveScenarioModal,
  onManualRecalculate,
  isDirtyManual,
  designMethod,
  onChangeDesignMethod,
  onRequestResetConfirm,
}) => {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(projectName);
  const barRef = useRef<HTMLDivElement>(null);
  const lang = prefs.lang;

  useEffect(() => {
    setTitleDraft(projectName);
  }, [projectName]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', onDocClick);
    return () => window.removeEventListener('mousedown', onDocClick);
  }, []);

  const closeAndRun = (fn: () => void) => {
    setOpenMenu(null);
    fn();
  };

  const menus: { key: Exclude<MenuKey, null>; label: string }[] = [
    { key: 'file', label: t(lang, 'Tệp', 'File') },
    { key: 'edit', label: t(lang, 'Chỉnh sửa', 'Edit') },
    { key: 'view', label: t(lang, 'Hiển thị', 'View') },
    { key: 'model', label: t(lang, 'Mô hình', 'Model') },
    { key: 'scenarios', label: t(lang, 'Kịch bản', 'Scenarios') },
    { key: 'window', label: t(lang, 'Cửa sổ', 'Window') },
  ];

  return (
    <header
      ref={barRef}
      className="h-11 shrink-0 select-none px-3.5 flex items-center justify-between gap-3 border-b border-slate-900/10 dark:border-white/10 bg-white/72 dark:bg-slate-900/75 backdrop-blur-2xl z-40 relative"
    >
      {/* Left: Traffic lights + Native macOS Dropdown Menus */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label={t(lang, 'Mở danh sách điều hướng', 'Toggle Navigation Drawer')}
          className="md:hidden p-1.5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-900/8 dark:hover:bg-white/12 transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center gap-2 pr-1" title={t(lang, 'Điều khiển cửa sổ Tauri', 'Tauri Window Controls')}>
          <button
            type="button"
            onClick={onRequestResetConfirm}
            aria-label={t(lang, 'Khôi phục dự án gốc', 'Reset workspace')}
            title={t(lang, 'Khôi phục về dự án mẫu mặc định', 'Reset to default sample')}
            className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/15 hover:brightness-95 transition cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onUpdatePrefs({ showKpiRibbon: !prefs.showKpiRibbon })}
            aria-label={t(lang, 'Thu gọn thanh KPI', 'Toggle KPI Ribbon')}
            title={t(lang, 'Ẩn / Hiện thanh chỉ số KPI', 'Show / Hide KPI Ribbon')}
            className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/15 hover:brightness-95 transition cursor-pointer"
          />
          <button
            type="button"
            onClick={() =>
              onUpdatePrefs({
                windowMode: prefs.windowMode === 'framed' ? 'fullscreen' : 'framed',
              })
            }
            aria-label={t(lang, 'Chế độ toàn màn hình', 'Toggle Fullscreen Window')}
            title={t(lang, 'Chuyển đổi Khung cửa sổ Desktop / Toàn màn hình', 'Toggle Framed Desktop / Fullscreen')}
            className="w-3 h-3 rounded-full bg-[#28c840] border border-black/15 hover:brightness-95 transition cursor-pointer"
          />
        </div>

        <span className="font-semibold text-[13px] tracking-tight text-slate-900 dark:text-white hidden sm:inline whitespace-nowrap">
          Real Calculator
        </span>

        <nav className="flex items-center gap-0.5 relative" aria-label="Application Menu">
          {menus.map((m) => {
            const isOpen = openMenu === m.key;
            return (
              <div key={m.key} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu(isOpen ? null : m.key)}
                  onMouseEnter={() => {
                    if (openMenu !== null) setOpenMenu(m.key);
                  }}
                  className={`px-2.5 py-1 rounded-[6px] text-[12.5px] font-medium transition cursor-pointer ${
                    isOpen
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-900/6 dark:hover:bg-white/10'
                  }`}
                >
                  {m.label}
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-84 rounded-xl p-1.5 bg-white/97 dark:bg-slate-900/97 backdrop-blur-3xl border border-slate-900/12 dark:border-white/15 shadow-[0_20px_48px_rgba(0,0,0,0.24)] z-50 text-[12.5px] text-slate-800 dark:text-slate-100">
                    {m.key === 'file' && (
                      <>
                        <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {t(lang, 'Khởi tạo từ mẫu dự án', 'Project Templates')}
                        </div>
                        {PRESET_TEMPLATES.map((tpl) => (
                          <MenuItem
                            key={tpl.id}
                            label={lang === 'vi' ? tpl.nameVi : tpl.nameEn}
                            shortcut={tpl.id === 'clean_blank' ? '⌘N' : undefined}
                            onClick={() => closeAndRun(() => onLoadPreset(tpl.id))}
                          />
                        ))}
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Nhân bản thành Dự án mới', 'Duplicate as New Project')}
                          onClick={() => closeAndRun(onDuplicateProject)}
                        />
                        <MenuItem
                          label={t(lang, 'Sao chép Liên kết Chia sẻ...', 'Copy Shareable Deal Link...')}
                          onClick={() => closeAndRun(onCopyShareLink)}
                        />
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Mở tệp dự án (.json)...', 'Open Project (.json)...')}
                          shortcut="⌘O"
                          onClick={() => closeAndRun(onTriggerImportJson)}
                        />
                        <MenuItem
                          label={t(lang, 'Lưu tệp dự án (.json)', 'Save Project (.json)')}
                          shortcut="⌘S"
                          onClick={() => closeAndRun(onExportJson)}
                        />
                        <MenuItem
                          label={t(lang, 'Xuất Workbook Excel 6 sheet (.xlsx)', 'Export 6-Sheet Excel (.xlsx)')}
                          onClick={() => closeAndRun(onExportExcel)}
                        />
                        <MenuItem
                          label={t(lang, 'Xuất dòng tiền 40 quý (.csv)', 'Export 40Q Cash Flow (.csv)')}
                          shortcut="⌘E"
                          onClick={() => closeAndRun(onExportCsv)}
                        />
                        <MenuItem
                          label={t(lang, 'In / Lưu PDF Hồ sơ Đầu tư...', 'Print / Save PDF Memo...')}
                          shortcut="⌘P"
                          onClick={() => closeAndRun(onOpenPrint)}
                        />
                      </>
                    )}

                    {m.key === 'edit' && (
                      <>
                        <MenuItem
                          label={t(lang, 'Hoàn tác thao tác trước', 'Undo Last Edit')}
                          shortcut="⌘Z"
                          disabled={!canUndo}
                          onClick={() => closeAndRun(onUndo)}
                        />
                        <MenuItem
                          label={t(lang, 'Làm lại thao tác vừa hoàn tác', 'Redo Edit')}
                          shortcut="⌘⇧Z"
                          disabled={!canRedo}
                          onClick={() => closeAndRun(onRedo)}
                        />
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Chuẩn hoá tất cả tiến độ 40 quý = 100%', 'Normalize All 40Q Schedules to 100%')}
                          onClick={() => closeAndRun(onNormalizeAllTimelines)}
                        />
                        <MenuItem
                          label={t(lang, 'Đổi tên dự án hiện tại...', 'Rename Active Project...')}
                          onClick={() =>
                            closeAndRun(() => {
                              setEditingTitle(true);
                            })
                          }
                        />
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Máy tính biểu thức nổi', 'Floating Expression Calculator')}
                          shortcut="⌘M"
                          onClick={() => closeAndRun(onToggleQuickCalc)}
                        />
                        <MenuItem
                          label={t(lang, 'Khôi phục mặc định ban đầu...', 'Reset Workspace to Default...')}
                          onClick={() => closeAndRun(onRequestResetConfirm)}
                        />
                      </>
                    )}

                    {m.key === 'view' && (
                      <>
                        <MenuItem
                          label={t(lang, 'Giả định & Thiết kế', 'Assumptions & Planning')}
                          shortcut="⌘1"
                          checked={activeTab === 'assumptions'}
                          onClick={() => closeAndRun(() => onSelectTab('assumptions'))}
                        />
                        <MenuItem
                          label={t(lang, 'Tiến độ 40 Quý (Mở khoá toàn bộ)', '40-Quarter Schedule')}
                          shortcut="⌘2"
                          checked={activeTab === 'timeline'}
                          onClick={() => closeAndRun(() => onSelectTab('timeline'))}
                        />
                        <MenuItem
                          label={t(lang, 'Dashboard Phân tích', 'Executive Analytics')}
                          shortcut="⌘3"
                          checked={activeTab === 'dashboard'}
                          onClick={() => closeAndRun(() => onSelectTab('dashboard'))}
                        />
                        <MenuItem
                          label={t(lang, 'Báo cáo Dòng tiền (40 Quý & 10 Năm)', 'Cash Flow Report (40Q & 10Y)')}
                          shortcut="⌘4"
                          checked={activeTab === 'cashflow'}
                          onClick={() => closeAndRun(() => onSelectTab('cashflow'))}
                        />
                        <MenuItem
                          label={t(lang, 'Kiểm tra & Kịch bản', 'Checks & Scenarios')}
                          shortcut="⌘5"
                          checked={activeTab === 'checks'}
                          onClick={() => closeAndRun(() => onSelectTab('checks'))}
                        />
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Hiện Thanh bên (Sidebar)', 'Show Sidebar')}
                          shortcut="⌘B"
                          checked={!prefs.sidebarCollapsed}
                          onClick={() =>
                            closeAndRun(() => onUpdatePrefs({ sidebarCollapsed: !prefs.sidebarCollapsed }))
                          }
                        />
                        <MenuItem
                          label={t(lang, 'Hiện Thanh chỉ số KPI', 'Show Top KPI Ribbon')}
                          checked={prefs.showKpiRibbon}
                          onClick={() =>
                            closeAndRun(() => onUpdatePrefs({ showKpiRibbon: !prefs.showKpiRibbon }))
                          }
                        />
                        <MenuItem
                          label={t(lang, 'Hiện Bảng giải trình trực quan', 'Show Live Breakdown Inspector')}
                          checked={prefs.showInspector}
                          onClick={() =>
                            closeAndRun(() => onUpdatePrefs({ showInspector: !prefs.showInspector }))
                          }
                        />
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Đơn vị: Triệu đồng', 'Unit: VND Million')}
                          checked={prefs.unitDisplay === 'million'}
                          onClick={() => closeAndRun(() => onUpdatePrefs({ unitDisplay: 'million' }))}
                        />
                        <MenuItem
                          label={t(lang, 'Đơn vị: Tỷ đồng', 'Unit: VND Billion')}
                          checked={prefs.unitDisplay === 'billion'}
                          onClick={() => closeAndRun(() => onUpdatePrefs({ unitDisplay: 'billion' }))}
                        />
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Chế độ Tối (Obsidian Glass)', 'Dark Mode (Obsidian Glass)')}
                          shortcut="⌘D"
                          checked={prefs.theme === 'dark'}
                          onClick={() =>
                            closeAndRun(() =>
                              onUpdatePrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' })
                            )
                          }
                        />
                      </>
                    )}

                    {m.key === 'model' && (
                      <>
                        <MenuItem
                          label={t(lang, 'Tự động tính toán tức thì', 'Auto-Calculate in Real Time')}
                          checked={prefs.autoCalculate}
                          onClick={() =>
                            closeAndRun(() => onUpdatePrefs({ autoCalculate: !prefs.autoCalculate }))
                          }
                        />
                        <MenuItem
                          label={t(lang, 'Chạy tính toán lại ngay', 'Recalculate Model Now')}
                          shortcut="⌘R"
                          onClick={() => closeAndRun(onManualRecalculate)}
                        />
                        <MenuDivider />
                        <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {t(lang, 'Phương án quy hoạch cao tầng', 'High-Rise Sizing Method')}
                        </div>
                        <MenuItem
                          label={t(lang, 'Tính theo Dân số khu cao tầng', 'By Population')}
                          checked={designMethod === 'population'}
                          onClick={() => closeAndRun(() => onChangeDesignMethod('population'))}
                        />
                        <MenuItem
                          label={t(lang, 'Tính theo Hệ số sử dụng đất (FAR)', 'By Floor Area Ratio (FAR)')}
                          checked={designMethod === 'far'}
                          onClick={() => closeAndRun(() => onChangeDesignMethod('far'))}
                        />
                      </>
                    )}

                    {m.key === 'scenarios' && (
                      <>
                        <MenuItem
                          label={t(lang, 'Lưu mô hình hiện tại thành Kịch bản...', 'Save Current Model as Scenario...')}
                          onClick={() => closeAndRun(onSaveScenarioModal)}
                        />
                        <MenuItem
                          label={t(lang, 'Mở bảng so sánh đa kịch bản', 'Open Scenario Comparison Studio')}
                          onClick={() => closeAndRun(() => onSelectTab('checks'))}
                        />
                      </>
                    )}

                    {m.key === 'window' && (
                      <>
                        <MenuItem
                          label={t(lang, 'Cửa sổ nổi trên nền macOS Wallpaper', 'Framed Window on macOS Wallpaper')}
                          checked={prefs.windowMode === 'framed'}
                          onClick={() => closeAndRun(() => onUpdatePrefs({ windowMode: 'framed' }))}
                        />
                        <MenuItem
                          label={t(lang, 'Toàn màn hình độc lập (Edge-to-Edge)', 'Fullscreen Standalone App')}
                          checked={prefs.windowMode === 'fullscreen'}
                          onClick={() => closeAndRun(() => onUpdatePrefs({ windowMode: 'fullscreen' }))}
                        />
                        <MenuDivider />
                        <MenuItem
                          label={t(lang, 'Tuỳ chỉnh Giao diện & Hiệu ứng mờ...', 'Customize Glass & Appearance...')}
                          shortcut="⌘,"
                          onClick={() => closeAndRun(onToggleCustomize)}
                        />
                        <MenuItem
                          label={t(lang, 'Bảng lệnh nhanh (Command Palette)', 'Command Palette')}
                          shortcut="⌘K"
                          onClick={() => closeAndRun(onOpenCommandPalette)}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Center: Clean Standalone Tauri Document Title (Zero breadcrumbs, zero lock badges) */}
      <div className="hidden lg:flex items-center justify-center min-w-0 max-w-md flex-1">
        {editingTitle ? (
          <input
            type="text"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              setEditingTitle(false);
              if (titleDraft.trim()) onProjectNameChange(titleDraft.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditingTitle(false);
                if (titleDraft.trim()) onProjectNameChange(titleDraft.trim());
              } else if (e.key === 'Escape') {
                setEditingTitle(false);
                setTitleDraft(projectName);
              }
            }}
            className="px-2.5 py-0.5 text-[13px] font-medium rounded-md bg-white dark:bg-slate-800 border border-[var(--accent-primary)] text-slate-900 dark:text-white outline-none w-72 text-center"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            title={t(lang, 'Nhấn để đổi tên dự án', 'Click to rename project')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-900/5 dark:hover:bg-white/8 transition text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="truncate">{projectName}</span>
          </button>
        )}
      </div>

      {/* Right: Quick Toolbar Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!prefs.autoCalculate && (
          <button
            type="button"
            onClick={onManualRecalculate}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold transition cursor-pointer ${
              isDirtyManual
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'bg-slate-900/6 dark:bg-white/10 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{t(lang, 'Tính toán', 'Calculate')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCopyShareLink}
          title={t(lang, 'Sao chép liên kết chia sẻ dự án này', 'Copy shareable project URL')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-900/8 dark:hover:bg-white/12 border border-slate-900/8 dark:border-white/10 transition cursor-pointer whitespace-nowrap"
        >
          <Share2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="hidden md:inline">{t(lang, 'Chia sẻ', 'Share')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          title={t(lang, 'Tìm kiếm lệnh & chỉ tiêu (⌘K)', 'Command Palette (⌘K)')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-slate-600 dark:text-slate-300 bg-slate-900/5 dark:bg-white/8 hover:bg-slate-900/10 dark:hover:bg-white/15 border border-slate-900/8 dark:border-white/10 transition cursor-pointer whitespace-nowrap"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{t(lang, 'Lệnh nhanh', 'Search')}</span>
          <kbd className="font-tabular text-[11px] text-slate-400 dark:text-slate-400">⌘K</kbd>
        </button>

        <button
          type="button"
          onClick={onToggleQuickCalc}
          title={t(lang, 'Máy tính nháp biểu thức (⌘M)', 'Quick Expression Calculator (⌘M)')}
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-900/8 dark:hover:bg-white/12 transition cursor-pointer"
          aria-label="Quick Calculator"
        >
          <Calculator className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleCustomize}
          title={t(lang, 'Tuỳ chỉnh giao diện macOS (⌘,)', 'Customize Appearance (⌘,)')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-900/8 dark:hover:bg-white/12 border border-slate-900/8 dark:border-white/10 transition cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="hidden md:inline">{t(lang, 'Tuỳ chỉnh', 'Customize')}</span>
        </button>

        {/* Segmented Unit Toggle */}
        <div
          className="hidden sm:flex items-center p-0.5 rounded-md bg-slate-900/6 dark:bg-white/10 border border-slate-900/6 dark:border-white/8 text-[11.5px]"
          role="group"
          aria-label="Currency Unit"
        >
          <button
            type="button"
            onClick={() => onUpdatePrefs({ unitDisplay: 'million' })}
            className={`px-2 py-0.5 rounded-[5px] font-medium transition cursor-pointer ${
              prefs.unitDisplay === 'million'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t(lang, 'Triệu', 'VNDm')}
          </button>
          <button
            type="button"
            onClick={() => onUpdatePrefs({ unitDisplay: 'billion' })}
            className={`px-2 py-0.5 rounded-[5px] font-medium transition cursor-pointer ${
              prefs.unitDisplay === 'billion'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t(lang, 'Tỷ', 'VNDbn')}
          </button>
        </div>

        {/* Segmented Language Toggle */}
        <div
          className="flex items-center p-0.5 rounded-md bg-slate-900/6 dark:bg-white/10 border border-slate-900/6 dark:border-white/8 text-[11.5px]"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            onClick={() => onUpdatePrefs({ lang: 'vi' })}
            className={`px-1.5 py-0.5 rounded-[5px] font-semibold transition cursor-pointer ${
              lang === 'vi'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            VI
          </button>
          <button
            type="button"
            onClick={() => onUpdatePrefs({ lang: 'en' })}
            className={`px-1.5 py-0.5 rounded-[5px] font-semibold transition cursor-pointer ${
              lang === 'en'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};

interface MenuItemProps {
  label: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, shortcut, checked, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-left transition ${
      disabled
        ? 'opacity-40 cursor-not-allowed'
        : 'hover:bg-[var(--accent-primary)] hover:text-white cursor-pointer group'
    }`}
  >
    <span className="flex items-center gap-2 min-w-0">
      <span className="w-3.5 flex items-center justify-center shrink-0">
        {checked && <Check className="w-3.5 h-3.5" />}
      </span>
      <span className="truncate">{label}</span>
    </span>
    {shortcut && (
      <span className="font-tabular text-[11px] text-slate-400 dark:text-slate-400 group-hover:text-white/85 shrink-0">
        {shortcut}
      </span>
    )}
  </button>
);

const MenuDivider: React.FC = () => (
  <div className="my-1 border-t border-slate-900/8 dark:border-white/10" />
);
