import React from 'react';
import { X, Sun, Moon, Monitor, Maximize2 } from 'lucide-react';
import {
  AccentTheme,
  AppPreferences,
  GlassIntensity,
  WallpaperPreset,
} from '../types/model';
import { t } from '../data/i18n';

interface CustomizePopoverProps {
  open: boolean;
  onClose: () => void;
  prefs: AppPreferences;
  onUpdatePrefs: (patch: Partial<AppPreferences>) => void;
}

export const CustomizePopover: React.FC<CustomizePopoverProps> = ({
  open,
  onClose,
  prefs,
  onUpdatePrefs,
}) => {
  if (!open) return null;
  const { lang } = prefs;

  const accents: { id: AccentTheme; label: string; hex: string }[] = [
    { id: 'blue', label: 'macOS Blue', hex: '#0071e3' },
    { id: 'emerald', label: 'Emerald', hex: '#0d9488' },
    { id: 'indigo', label: 'Indigo', hex: '#4f46e5' },
    { id: 'amber', label: 'Amber', hex: '#d97706' },
  ];

  const wallpapers: { id: WallpaperPreset; vi: string; en: string; preview: string }[] = [
    {
      id: 'sonoma',
      vi: 'Sonoma Sky',
      en: 'Sonoma Sky',
      preview: 'bg-gradient-to-br from-sky-400 via-indigo-400 to-emerald-300',
    },
    {
      id: 'sequoia',
      vi: 'Sequoia Sunset',
      en: 'Sequoia Sunset',
      preview: 'bg-gradient-to-br from-amber-300 via-rose-400 to-indigo-600',
    },
    {
      id: 'aurora',
      vi: 'Nordic Aurora',
      en: 'Nordic Aurora',
      preview: 'bg-gradient-to-br from-teal-400 via-cyan-600 to-slate-900',
    },
    {
      id: 'graphite',
      vi: 'Studio Graphite',
      en: 'Studio Graphite',
      preview: 'bg-gradient-to-br from-slate-600 via-slate-800 to-zinc-950',
    },
  ];

  const glassModes: { id: GlassIntensity; vi: string; en: string }[] = [
    { id: 'subtle', vi: 'Trong trẻo', en: 'Crisp' },
    { id: 'balanced', vi: 'Cân bằng', en: 'Balanced' },
    { id: 'ultra', vi: 'Kính mờ sâu', en: 'Ultra Blur' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end pt-14 pr-5 bg-black/15 dark:bg-black/35"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-84 rounded-2xl bg-white/92 dark:bg-slate-900/94 backdrop-blur-2xl border border-slate-900/12 dark:border-white/15 shadow-2xl p-4 space-y-4 text-[12.5px] text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-900/8 dark:border-white/10 pb-2.5">
          <h3 className="font-semibold text-[13.5px] text-slate-950 dark:text-white">
            {t(lang, 'Tuỳ chỉnh Giao diện macOS', 'macOS Control Center')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Mode */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t(lang, 'Chế độ Sáng / Tối', 'Appearance')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdatePrefs({ theme: 'light' })}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl border font-medium transition cursor-pointer ${
                prefs.theme === 'light'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                  : 'border-slate-900/10 dark:border-white/10 hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{t(lang, 'Sáng (Frosted)', 'Frosted Light')}</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdatePrefs({ theme: 'dark' })}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl border font-medium transition cursor-pointer ${
                prefs.theme === 'dark'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                  : 'border-slate-900/10 dark:border-white/10 hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{t(lang, 'Tối (Obsidian)', 'Obsidian Dark')}</span>
            </button>
          </div>
        </div>

        {/* Glassmorphism Vibrancy */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t(lang, 'Độ mờ kính (Glassmorphism)', 'Glass Vibrancy')}
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/6 dark:bg-white/8">
            {glassModes.map((gm) => (
              <button
                key={gm.id}
                type="button"
                onClick={() => onUpdatePrefs({ glassIntensity: gm.id })}
                className={`py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer ${
                  prefs.glassIntensity === gm.id
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'vi' ? gm.vi : gm.en}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t(lang, 'Màu nhấn chủ đạo', 'System Accent Color')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {accents.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => onUpdatePrefs({ accentColor: acc.id })}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition cursor-pointer ${
                  prefs.accentColor === acc.id
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] font-semibold'
                    : 'border-slate-900/8 dark:border-white/10'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shadow-xs"
                  style={{ backgroundColor: acc.hex }}
                />
                <span className="text-[11px]">{acc.label.split(' ').pop()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Window Frame Mode */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t(lang, 'Khung cửa sổ Tauri Desktop', 'Desktop Window Frame')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdatePrefs({ windowMode: 'framed' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[12px] font-medium transition cursor-pointer ${
                prefs.windowMode === 'framed'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                  : 'border-slate-900/10 dark:border-white/10'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{t(lang, 'Cửa sổ Nổi', 'Framed')}</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdatePrefs({ windowMode: 'fullscreen' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[12px] font-medium transition cursor-pointer ${
                prefs.windowMode === 'fullscreen'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                  : 'border-slate-900/10 dark:border-white/10'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{t(lang, 'Tràn viền', 'Edge-to-Edge')}</span>
            </button>
          </div>
        </div>

        {/* Wallpaper Picker when Framed */}
        {prefs.windowMode === 'framed' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t(lang, 'Hình nền macOS phía sau kính mờ', 'Backdrop Wallpaper')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {wallpapers.map((wp) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => onUpdatePrefs({ wallpaper: wp.id })}
                  className={`p-1 rounded-xl border transition cursor-pointer ${
                    prefs.wallpaper === wp.id
                      ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]'
                      : 'border-slate-900/10 dark:border-white/10'
                  }`}
                >
                  <div className={`h-7 rounded-lg ${wp.preview}`} />
                  <div className="text-[10.5px] text-center mt-1 truncate">
                    {wp.vi.split(' ')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Toggles */}
        <div className="pt-2 border-t border-slate-900/8 dark:border-white/10 space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span>{t(lang, 'Tự động tính toán tức thì', 'Real-time Auto-Calculate')}</span>
            <input
              type="checkbox"
              checked={prefs.autoCalculate}
              onChange={(e) => onUpdatePrefs({ autoCalculate: e.target.checked })}
              className="accent-[var(--accent-primary)] w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>{t(lang, 'Hiện thanh tóm tắt KPI phía trên', 'Show Top KPI Ribbon')}</span>
            <input
              type="checkbox"
              checked={prefs.showKpiRibbon}
              onChange={(e) => onUpdatePrefs({ showKpiRibbon: e.target.checked })}
              className="accent-[var(--accent-primary)] w-4 h-4"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
