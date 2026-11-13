import { Language } from '../types/model';

/**
 * Safely parses numeric input or inline arithmetic expressions starting with '=' or containing + - * / ( ) %
 * Supports both Vietnamese (1.234,56) and English (1,234.56) numeric conventions.
 */
export function evaluateFormula(raw: string, lang: Language = 'vi'): number | null {
  if (raw === null || raw === undefined) return null;
  let str = String(raw).trim();
  if (!str) return null;

  const isExplicitFormula = str.startsWith('=');
  if (isExplicitFormula) {
    str = str.slice(1).trim();
  }
  if (!str) return null;

  // Normalize Unicode minus/multiplication/division signs
  str = str
    .replace(/[−–—]/g, '-')
    .replace(/[×]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/\s+/g, '');

  // Convert numbers inside the expression into standard JS floating-point literals
  const normalized = str.replace(/[0-9][0-9.,]*/g, (token) => normalizeNumberToken(token, lang));

  // Only allow digits, decimal points, operators, parentheses, and %
  if (!/^[0-9.+\-*/()%eE]+$/.test(normalized)) {
    return null;
  }

  // Transform postfix percentage e.g. 50% -> (50/100)
  const withPct = normalized.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

  try {
    const tokens = tokenizeMath(withPct);
    if (!tokens.length) return null;
    const val = parseExpression(tokens);
    if (typeof val !== 'number' || !Number.isFinite(val)) return null;
    return val;
  } catch {
    return null;
  }
}

function normalizeNumberToken(token: string, lang: Language): string {
  const hasDot = token.includes('.');
  const hasComma = token.includes(',');

  if (hasDot && hasComma) {
    // Last separator is the decimal separator
    const lastDot = token.lastIndexOf('.');
    const lastComma = token.lastIndexOf(',');
    if (lastComma > lastDot) {
      // 1.234,56 -> 1234.56
      return token.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 -> 1234.56
      return token.replace(/,/g, '');
    }
  }

  if (hasComma && !hasDot) {
    const parts = token.split(',');
    if (lang === 'vi') {
      // In Vietnamese, comma is decimal separator unless multiple commas exist
      if (parts.length === 2) {
        return `${parts[0]}.${parts[1]}`;
      }
      return parts.join('');
    } else {
      // In English, comma is thousand separator if 3 digits follow, else decimal if single comma
      if (parts.length === 2 && parts[1].length !== 3) {
        return `${parts[0]}.${parts[1]}`;
      }
      return parts.join('');
    }
  }

  if (hasDot && !hasComma) {
    const parts = token.split('.');
    if (parts.length > 2) {
      return parts.join('');
    }
    if (lang === 'vi' && parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1 && Number(parts[0]) !== 0) {
      // e.g. "328.000" in Vietnamese -> 328000, whereas "0.75" or "4.5" -> decimal
      return parts.join('');
    }
    return token;
  }

  return token;
}

type MathToken =
  | { type: 'num'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' };

function tokenizeMath(expr: string): MathToken[] {
  const tokens: MathToken[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      while (
        i < expr.length &&
        ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.' || expr[i] === 'e' || expr[i] === 'E')
      ) {
        numStr += expr[i];
        i++;
      }
      const parsed = Number(numStr);
      if (Number.isNaN(parsed)) throw new Error('Invalid number');
      tokens.push({ type: 'num', value: parsed });
    } else {
      throw new Error(`Unexpected char: ${ch}`);
    }
  }
  return tokens;
}

function parseExpression(tokens: MathToken[]): number {
  let pos = 0;

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (pos < tokens.length) {
      const tok = tokens[pos];
      if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
        pos++;
        const right = parseMulDiv();
        left = tok.value === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parseUnary();
    while (pos < tokens.length) {
      const tok = tokens[pos];
      if (tok.type === 'op' && (tok.value === '*' || tok.value === '/')) {
        pos++;
        const right = parseUnary();
        if (tok.value === '/') {
          if (right === 0) throw new Error('Division by zero');
          left = left / right;
        } else {
          left = left * right;
        }
      } else {
        break;
      }
    }
    return left;
  }

  function parseUnary(): number {
    const tok = tokens[pos];
    if (!tok) throw new Error('Unexpected end');
    if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      pos++;
      const val = parseUnary();
      return tok.value === '-' ? -val : val;
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const tok = tokens[pos];
    if (!tok) throw new Error('Unexpected end');
    if (tok.type === 'num') {
      pos++;
      return tok.value;
    }
    if (tok.type === 'paren' && tok.value === '(') {
      pos++;
      const val = parseAddSub();
      const close = tokens[pos];
      if (!close || close.type !== 'paren' || close.value !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      pos++;
      return val;
    }
    throw new Error('Unexpected token');
  }

  const result = parseAddSub();
  if (pos !== tokens.length) {
    throw new Error('Trailing tokens');
  }
  return result;
}

export function formatNum(
  val: number | null | undefined,
  decimals = 0,
  lang: Language = 'vi',
  dashZero = false
): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  if (dashZero && Math.abs(val) < 1e-6) return '—';
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Object.is(val, -0) ? 0 : val);
}

export function formatMoney(
  valMillion: number | null | undefined,
  lang: Language = 'vi',
  unitDisplay: 'million' | 'billion' = 'million',
  dashZero = false
): string {
  if (valMillion === null || valMillion === undefined || !Number.isFinite(valMillion)) return '—';
  if (dashZero && Math.abs(valMillion) < 0.5) return '—';
  if (unitDisplay === 'billion') {
    return formatNum(valMillion / 1000, 1, lang, dashZero);
  }
  return formatNum(Math.round(valMillion), 0, lang, dashZero);
}

export function formatPct(
  ratio: number | null | undefined,
  decimals = 1,
  lang: Language = 'vi',
  dashZero = false
): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  if (dashZero && Math.abs(ratio) < 1e-6) return '—';
  return `${formatNum(ratio * 100, decimals, lang, false)}%`;
}
