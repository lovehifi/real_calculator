import React, { useState, useRef } from 'react';
import { evaluateFormula, formatNum } from '../engine/formulaParser';
import { Language } from '../types/model';

interface FormulaCellInputProps {
  value: number | null;
  onChange: (nextVal: number | null) => void;
  lang: Language;
  isPct?: boolean;
  decimals?: number;
  noGrouping?: boolean;
  allowNull?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
  ariaLabel?: string;
}

export const FormulaCellInput: React.FC<FormulaCellInputProps> = ({
  value,
  onChange,
  lang,
  isPct = false,
  decimals = 0,
  noGrouping = false,
  allowNull = false,
  placeholder = '—',
  min,
  max,
  className = '',
  ariaLabel,
}) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const [invalidFlash, setInvalidFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayFormatted = (): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return '';
    }
    const shown = isPct ? value * 100 : value;
    if (noGrouping) {
      return String(Math.round(shown));
    }
    return formatNum(shown, decimals, lang, false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    if (value === null || value === undefined || !Number.isFinite(value)) {
      setDraft('');
    } else {
      const rawNum = isPct ? Number((value * 100).toFixed(6)) : Number(value.toFixed(6));
      setDraft(lang === 'vi' ? String(rawNum).replace('.', ',') : String(rawNum));
    }
    requestAnimationFrame(() => {
      e.target.select();
    });
  };

  const commitValue = () => {
    setFocused(false);
    const trimmed = draft.trim();
    if (!trimmed) {
      if (allowNull) {
        onChange(null);
      } else {
        onChange(0);
      }
      return;
    }

    const hasExplicitPercent = trimmed.includes('%');
    const parsed = evaluateFormula(trimmed, lang);
    if (parsed === null) {
      setInvalidFlash(true);
      setTimeout(() => setInvalidFlash(false), 650);
      return;
    }

    let next = parsed;
    if (isPct && !hasExplicitPercent) {
      // User typed "75" into a % cell -> 0.75 (whereas "=75%" already evaluated to 0.75)
      next = parsed / 100;
    }

    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;

    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFocused(false);
      setDraft('');
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={focused ? draft : displayFormatted()}
      placeholder={placeholder}
      onFocus={handleFocus}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitValue}
      onKeyDown={handleKeyDown}
      className={`font-tabular text-right transition-colors outline-none rounded-[6px] px-2 py-1 w-full border ${
        invalidFlash
          ? 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300'
          : focused
          ? 'border-[var(--accent-primary)] bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-[0_0_0_2px_var(--accent-soft)]'
          : 'border-slate-300/65 dark:border-white/12 bg-[var(--accent-soft)] hover:border-[var(--accent-border)] text-[var(--accent-primary)] font-medium'
      } ${className}`}
    />
  );
};
