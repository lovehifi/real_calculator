import React, { useState, useEffect } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { AppPreferences, WorkspaceTab } from '../types/model';
import { PRESET_TEMPLATES } from '../data/sampleProject';
import { t } from '../data/i18n';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  prefs: AppPreferences;
  onUpdatePrefs: (patch: Partial<AppPreferences>) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  onLoadPreset: (id: string) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onOpenPrint: () => void;
  onCopyShareLink: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenSaveScenario: () => void;
}

interface PaletteAction {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  run: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  prefs,
  onUpdatePrefs,
  onSelectTab,
  onLoadPreset,
  onExportJson,
  onExportCsv,
  onExportExcel,
  onOpenPrint,
  onCopyShareLink,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenSaveScenario,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const { lang } = prefs;

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const actions: PaletteAction[] = [
    {
      id: 'ws_assumptions',
      group: t(lang, 'Chuyển trang', 'Navigation'),
      label: t(lang, 'Mở bảng Giả định & Thiết kế quy hoạch', 'Go to Assumptions & Planning'),
      shortcut: '⌘1',
      run: () => onSelectTab('assumptions'),
    },
    {
      id: 'ws_timeline',
      group: t(lang, 'Chuyển trang', 'Navigation'),
      label: t(lang, 'Mở bảng Tiến độ 40 Quý (Mở khoá toàn diện)', 'Go to 40-Quarter Schedule'),
      shortcut: '⌘2',
      run: () => onSelectTab('timeline'),
    },
    {
      id: 'ws_dashboard',
      group: t(lang, 'Chuyển trang', 'Navigation'),
      label: t(lang, 'Mở Dashboard Phân tích & Ma trận Độ nhạy', 'Go to Executive Analytics Dashboard'),
      shortcut: '⌘3',
      run: () => onSelectTab('dashboard'),
    },
    {
      id: 'ws_cashflow',
      group: t(lang, 'Chuyển trang', 'Navigation'),
      label: t(lang, 'Mở Báo cáo Dòng tiền 40 Quý & 10 Năm', 'Go to 40Q & 10Y Cash Flow Statement'),
      shortcut: '⌘4',
      run: () => onSelectTab('cashflow'),
    },
    {
      id: 'ws_checks',
      group: t(lang, 'Chuyển trang', 'Navigation'),
      label: t(lang, 'Mở Kiểm tra Pháp lý & So sánh Kịch bản', 'Go to Checks & Scenario Studio'),
      shortcut: '⌘5',
      run: () => onSelectTab('checks'),
    },
    {
      id: 'act_excel',
      group: t(lang, 'Xuất báo cáo', 'Export & Share'),
      label: t(lang, 'Xuất Workbook Excel đầy đủ 6 sheet (.xlsx)', 'Export 6-Sheet Excel Workbook (.xlsx)'),
      run: onExportExcel,
    },
    {
      id: 'act_print',
      group: t(lang, 'Xuất báo cáo', 'Export & Share'),
      label: t(lang, 'In / Lưu PDF Hồ sơ Thẩm định Đầu tư...', 'Print / Save PDF Investment Memo...'),
      shortcut: '⌘P',
      run: onOpenPrint,
    },
    {
      id: 'act_share',
      group: t(lang, 'Xuất báo cáo', 'Export & Share'),
      label: t(lang, 'Sao chép Liên kết Chia sẻ Dự án', 'Copy Shareable Deal Link'),
      run: onCopyShareLink,
    },
    ...(canUndo
      ? [
          {
            id: 'act_undo',
            group: t(lang, 'Chỉnh sửa', 'Edit'),
            label: t(lang, 'Hoàn tác thao tác trước', 'Undo Last Edit'),
            shortcut: '⌘Z',
            run: onUndo,
          },
        ]
      : []),
    ...(canRedo
      ? [
          {
            id: 'act_redo',
            group: t(lang, 'Chỉnh sửa', 'Edit'),
            label: t(lang, 'Làm lại thao tác vừa hoàn tác', 'Redo Edit'),
            shortcut: '⌘⇧Z',
            run: onRedo,
          },
        ]
      : []),
    {
      id: 'act_save_sc',
      group: t(lang, 'Thao tác nhanh', 'Actions'),
      label: t(lang, 'Chụp & Lưu Kịch bản hiện tại...', 'Save Current Model as Scenario...'),
      run: onOpenSaveScenario,
    },
    {
      id: 'act_csv',
      group: t(lang, 'Xuất báo cáo', 'Export & Share'),
      label: t(lang, 'Xuất báo cáo Dòng tiền 40 Quý (.csv)', 'Export 40-Quarter Cash Flow (.csv)'),
      shortcut: '⌘E',
      run: onExportCsv,
    },
    {
      id: 'act_json',
      group: t(lang, 'Xuất báo cáo', 'Export & Share'),
      label: t(lang, 'Lưu tệp dự án độc lập (.json)', 'Save Project File (.json)'),
      shortcut: '⌘S',
      run: onExportJson,
    },
    {
      id: 'act_theme',
      group: t(lang, 'Giao diện', 'Appearance'),
      label:
        prefs.theme === 'dark'
          ? t(lang, 'Chuyển sang Giao diện Sáng Mờ ảo (Sonoma Light)', 'Switch to Frosted Light Theme')
          : t(lang, 'Chuyển sang Giao diện Tối Huyền ảo (Obsidian Dark)', 'Switch to Obsidian Dark Theme'),
      shortcut: '⌘D',
      run: () => onUpdatePrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' }),
    },
    {
      id: 'act_unit',
      group: t(lang, 'Giao diện', 'Appearance'),
      label:
        prefs.unitDisplay === 'million'
          ? t(lang, 'Đổi đơn vị hiển thị sang Tỷ đồng', 'Switch Display Unit to VND Billion')
          : t(lang, 'Đổi đơn vị hiển thị sang Triệu đồng', 'Switch Display Unit to VND Million'),
      run: () =>
        onUpdatePrefs({
          unitDisplay: prefs.unitDisplay === 'million' ? 'billion' : 'million',
        }),
    },
    ...PRESET_TEMPLATES.map((tpl) => ({
      id: `tpl_${tpl.id}`,
      group: t(lang, 'Dự án mẫu', 'Templates'),
      label: `${t(lang, 'Nạp mẫu:', 'Load Template:')} ${lang === 'vi' ? tpl.nameVi : tpl.nameEn}`,
      run: () => onLoadPreset(tpl.id),
    })),
  ];

  const filtered = actions.filter((a) =>
    `${a.group} ${a.label}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  const safeIdx = Math.min(activeIndex, Math.max(0, filtered.length - 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/25 dark:bg-black/50 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl mx-4 rounded-2xl bg-white/92 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-900/15 dark:border-white/15 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-900/10 dark:border-white/10">
          <Search className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onClose();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(filtered.length - 1, prev + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(0, prev - 1));
              } else if (e.key === 'Enter' && filtered[safeIdx]) {
                e.preventDefault();
                filtered[safeIdx].run();
                onClose();
              }
            }}
            placeholder={t(
              lang,
              'Gõ lệnh nhanh, chuyển bảng 40 quý, đổi giao diện hoặc nạp dự án mẫu...',
              'Search commands, 40Q views, templates, or settings...'
            )}
            className="flex-1 bg-transparent text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          <kbd className="font-tabular text-[11px] px-1.5 py-0.5 rounded bg-slate-900/6 dark:bg-white/10 text-slate-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-slate-400">
              {t(lang, 'Không tìm thấy lệnh phù hợp', 'No matching command')}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const selected = idx === safeIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-[13px] transition cursor-pointer ${
                    selected
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="min-w-0 truncate">
                    <span
                      className={`text-[11px] mr-2 ${
                        selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.group} ·
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <span
                        className={`font-tabular text-[11px] ${
                          selected ? 'text-white/85' : 'text-slate-400'
                        }`}
                      >
                        {item.shortcut}
                      </span>
                    )}
                    {selected && <CornerDownLeft className="w-3.5 h-3.5 text-white/80" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
