import React, { useState } from 'react';
import { Calculator, Copy, Check, X } from 'lucide-react';
import { evaluateFormula, formatNum } from '../engine/formulaParser';
import { Language } from '../types/model';
import { t } from '../data/i18n';

interface QuickCalculatorProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
}

export const QuickCalculator: React.FC<QuickCalculatorProps> = ({ open, onClose, lang }) => {
  const [expr, setExpr] = useState('28004 * 4.5 + 328000');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const evaluated = evaluateFormula(expr, lang);

  const handleCopy = () => {
    if (evaluated === null) return;
    navigator.clipboard?.writeText(String(Number(evaluated.toFixed(4))));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="fixed bottom-5 right-6 z-50 w-80 rounded-2xl bg-white/92 dark:bg-slate-900/94 backdrop-blur-2xl border border-slate-900/15 dark:border-white/15 shadow-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-900 dark:text-white">
          <Calculator className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>{t(lang, 'Máy tính nháp biểu thức', 'Scratchpad Expression Calc')}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <input
        type="text"
        autoFocus
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        placeholder="= (6000 * 6.9) * 14"
        className="w-full px-3 py-2 rounded-xl font-tabular text-[13px] bg-slate-100/80 dark:bg-slate-800/90 border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-[var(--accent-primary)]"
      />

      <div className="flex items-center justify-between px-1">
        <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
          {t(lang, 'Kết quả:', 'Result:')}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-tabular text-[16px] font-bold text-[var(--accent-primary)]">
            {evaluated !== null ? formatNum(evaluated, 2, lang) : '—'}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={evaluated === null}
            title={t(lang, 'Sao chép kết quả', 'Copy result')}
            className="p-1.5 rounded-lg bg-slate-900/6 dark:bg-white/10 hover:bg-slate-900/12 dark:hover:bg-white/16 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
