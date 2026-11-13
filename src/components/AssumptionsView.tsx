import React, { useState } from 'react';
import { Search, Sliders, Eye, EyeOff } from 'lucide-react';
import {
  AppPreferences,
  AssumptionCategory,
  CalculationResult,
  ModelInputs,
} from '../types/model';
import { FIELD_META, PRODUCT_NAMES, t } from '../data/i18n';
import { formatMoney, formatNum, formatPct } from '../engine/formulaParser';
import { FormulaCellInput } from './FormulaCellInput';

interface AssumptionsViewProps {
  inputs: ModelInputs;
  onUpdateField: <K extends keyof ModelInputs>(key: K, value: ModelInputs[K]) => void;
  result: CalculationResult;
  prefs: AppPreferences;
  onUpdatePrefs: (patch: Partial<AppPreferences>) => void;
  category: AssumptionCategory;
  onSelectCategory: (cat: AssumptionCategory) => void;
}

export const AssumptionsView: React.FC<AssumptionsViewProps> = ({
  inputs,
  onUpdateField,
  result,
  prefs,
  onUpdatePrefs,
  category,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { lang, unitDisplay, density } = prefs;
  const isCompact = density === 'compact';
  const rowPad = isCompact ? 'py-1.5 px-3' : 'py-2.5 px-3.5';
  const unitMoney =
    unitDisplay === 'billion'
      ? t(lang, 'tỷ đồng', 'VND bn')
      : t(lang, 'triệu đồng', 'VNDm');

  const categories: { id: AssumptionCategory; vi: string; en: string }[] = [
    { id: 'all', vi: 'Tất cả', en: 'All' },
    { id: 'land', vi: 'A. Quy hoạch đất', en: 'A. Land Use' },
    { id: 'highrise', vi: 'B. Cao tầng', en: 'B. High-Rise' },
    { id: 'lowrise', vi: 'C. Thấp tầng', en: 'C. Low-Rise' },
    { id: 'cost', vi: 'D. Chi phí đầu tư', en: 'D. Dev Cost' },
    { id: 'sales_fin', vi: 'E–G. Giá bán & Vốn', en: 'E–G. Sales & Finance' },
  ];

  const matchesSearch = (key: string, customLabel?: string): boolean => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const meta = FIELD_META[key];
    const text = `${key} ${customLabel ?? ''} ${meta?.vi ?? ''} ${meta?.en ?? ''}`.toLowerCase();
    return text.includes(q);
  };

  const renderInputRow = (
    key: keyof ModelInputs,
    computedRight?: string,
    computedSub?: string,
    options?: { allowNull?: boolean; min?: number; max?: number; disabled?: boolean }
  ) => {
    const meta = FIELD_META[key as string];
    if (!meta || !matchesSearch(key as string)) return null;
    const val = inputs[key] as number | null;
    const label = lang === 'vi' ? meta.vi : meta.en;
    const hint = lang === 'vi' ? meta.hintVi : meta.hintEn;
    const unit = lang === 'vi' ? meta.unitVi : meta.unitEn;

    return (
      <tr
        key={key as string}
        className="border-b last:border-b-0 border-slate-900/6 dark:border-white/8 hover:bg-slate-900/[0.025] dark:hover:bg-white/[0.03] transition"
      >
        <td className={`${rowPad} text-[13px] text-slate-800 dark:text-slate-100`}>
          <div className="font-medium">{label}</div>
          {hint && (
            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">{hint}</div>
          )}
        </td>
        <td className={`${rowPad} text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap`}>
          {unit}
        </td>
        <td className={`${rowPad} w-40`}>
          {options?.disabled ? (
            <div className="font-tabular text-right px-2 py-1 text-[13px] text-slate-400 dark:text-slate-500">
              {val !== null && val !== undefined
                ? meta.isPct
                  ? formatPct(val, meta.decimals ?? 1, lang)
                  : formatNum(val, meta.decimals ?? 0, lang)
                : '—'}
            </div>
          ) : (
            <FormulaCellInput
              value={val}
              onChange={(next) =>
                onUpdateField(key, (next as unknown) as ModelInputs[typeof key])
              }
              lang={lang}
              isPct={meta.isPct}
              decimals={meta.decimals ?? 0}
              noGrouping={meta.noGrouping}
              allowNull={options?.allowNull}
              min={options?.min ?? 0}
              max={options?.max}
              ariaLabel={label}
              className="text-[13px]"
            />
          )}
        </td>
        <td className={`${rowPad} text-right font-tabular text-[13px] text-slate-700 dark:text-slate-200 whitespace-nowrap w-44`}>
          {computedRight ? (
            <div>
              <div className="font-medium">{computedRight}</div>
              {computedSub && (
                <div className="text-[11px] text-slate-400 dark:text-slate-500">{computedSub}</div>
              )}
            </div>
          ) : (
            <span className="text-slate-300 dark:text-slate-600">—</span>
          )}
        </td>
      </tr>
    );
  };

  const renderComputedRow = (
    labelVi: string,
    labelEn: string,
    unit: string,
    valStr: string,
    rightStr?: string,
    highlight = false
  ) => {
    const label = t(lang, labelVi, labelEn);
    if (!matchesSearch(label, label)) return null;
    return (
      <tr
        key={labelEn}
        className={`border-b last:border-b-0 border-slate-900/6 dark:border-white/8 ${
          highlight
            ? 'bg-slate-900/[0.04] dark:bg-white/[0.06] font-semibold text-slate-950 dark:text-white'
            : 'bg-slate-900/[0.015] dark:bg-white/[0.02] text-slate-700 dark:text-slate-200'
        }`}
      >
        <td className={`${rowPad} text-[13px]`}>{label}</td>
        <td className={`${rowPad} text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap`}>
          {unit}
        </td>
        <td className={`${rowPad} text-right font-tabular text-[13px] px-4`}>{valStr}</td>
        <td className={`${rowPad} text-right font-tabular text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap`}>
          {rightStr ?? '—'}
        </td>
      </tr>
    );
  };

  const showLand = category === 'all' || category === 'land';
  const showHigh = category === 'all' || category === 'highrise';
  const showLow = category === 'all' || category === 'lowrise';
  const showCost = category === 'all' || category === 'cost';
  const showSalesFin = category === 'all' || category === 'sales_fin';

  const { planning, dev, sales } = result;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main Spreadsheet Cards Column */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Top Segmented Filter & Formula Hint Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-900/6 dark:bg-white/8 border border-slate-900/6 dark:border-white/8">
            {categories.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'vi' ? cat.vi : cat.en}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(lang, 'Lọc giả định (vd: mật độ, VAT)...', 'Filter parameters...')}
                className="pl-8 pr-3 py-1.5 rounded-lg text-[12.5px] w-56 bg-white/80 dark:bg-slate-900/70 border border-slate-900/10 dark:border-white/12 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                onUpdatePrefs({ density: prefs.density === 'compact' ? 'comfortable' : 'compact' })
              }
              title={t(lang, 'Đổi mật độ dòng bảng', 'Toggle Row Density')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-white/75 dark:bg-slate-900/70 border border-slate-900/10 dark:border-white/12 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>{isCompact ? t(lang, 'Thu gọn', 'Compact') : t(lang, 'Thoáng', 'Spacious')}</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdatePrefs({ showInspector: !prefs.showInspector })}
              title={t(lang, 'Ẩn/Hiện cột giải trình trực quan', 'Toggle Live Inspector')}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-white/75 dark:bg-slate-900/70 border border-slate-900/10 dark:border-white/12 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {prefs.showInspector ? (
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              )}
              <span>{t(lang, 'Giải trình', 'Inspector')}</span>
            </button>
          </div>
        </div>

        <div className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-4 px-1">
          <span>
            {t(
              lang,
              'Mẹo: Mọi ô số màu xanh đều hỗ trợ gõ công thức trực tiếp (ví dụ =6000*1,2 hoặc =40*105%) và mở khoá toàn bộ thông số nâng cao.',
              'Tip: Every blue cell accepts inline formulas (e.g. =6000*1.2 or =40*105%) with all advanced fields unlocked.'
            )}
          </span>
          <span className="font-tabular whitespace-nowrap shrink-0">
            {t(lang, 'Đơn vị kết quả:', 'Output unit:')} {unitMoney}
          </span>
        </div>

        {/* SECTION A: LAND USE PLANNING */}
        {showLand && (
          <SectionCard
            title={t(lang, 'A. Quy hoạch sử dụng đất & Kỳ bắt đầu', 'A. Land Use Planning & Start Year')}
            subtitle={t(
              lang,
              `Tổng diện tích khu đất: ${formatNum(planning.land.total, 0, lang)} m² (${formatNum(planning.land.total / 10000, 2, lang)} ha)`,
              `Total site area: ${formatNum(planning.land.total, 0, lang)} m² (${formatNum(planning.land.total / 10000, 2, lang)} ha)`
            )}
            lang={lang}
            rightColHeader={t(lang, 'Tỷ trọng / Ghi chú', 'Share / Note')}
          >
            {renderInputRow(
              'model_start_year',
              `Q1/${inputs.model_start_year} → Q4/${inputs.model_start_year + 9}`,
              t(lang, '40 quý liên tục', '40 quarters'),
              { min: 2000, max: 2100 }
            )}
            {renderInputRow(
              'highrise_land_area',
              planning.land.total > 0
                ? formatPct(planning.land.highrise / planning.land.total, 1, lang)
                : '0%',
              t(lang, 'Đất cao tầng', 'High-rise share')
            )}
            {renderInputRow(
              'lowrise_shop_land',
              planning.land.total > 0
                ? formatPct(inputs.lowrise_shop_land / planning.land.total, 1, lang)
                : '0%'
            )}
            {renderInputRow(
              'townhouse_land',
              planning.land.total > 0
                ? formatPct(inputs.townhouse_land / planning.land.total, 1, lang)
                : '0%'
            )}
            {renderInputRow(
              'villa_land',
              planning.land.total > 0
                ? formatPct(inputs.villa_land / planning.land.total, 1, lang)
                : '0%'
            )}
            {renderInputRow(
              'lowrise_road_green',
              planning.land.total > 0
                ? formatPct(inputs.lowrise_road_green / planning.land.total, 1, lang)
                : '0%'
            )}
            {renderInputRow(
              'nonconforming_area',
              planning.land.total > 0
                ? formatPct(inputs.nonconforming_area / planning.land.total, 1, lang)
                : '0%'
            )}
            {renderComputedRow(
              'Diện tích đất ở thấp tầng thương phẩm',
              'Saleable low-rise product land',
              'm²',
              formatNum(planning.land.lowProduct, 0, lang),
              planning.land.total > 0
                ? formatPct(planning.land.lowProduct / planning.land.total, 1, lang)
                : '0%'
            )}
            {renderComputedRow(
              'Tổng diện tích toàn khu thấp tầng',
              'Total low-rise zone area',
              'm²',
              formatNum(planning.land.lowZone, 0, lang),
              planning.land.total > 0
                ? formatPct(planning.land.lowZone / planning.land.total, 1, lang)
                : '0%'
            )}
            {renderComputedRow(
              'Tổng diện tích dự án',
              'Total project site area',
              'm²',
              formatNum(planning.land.total, 0, lang),
              '100,0%',
              true
            )}
          </SectionCard>
        )}

        {/* SECTION B: HIGH-RISE DESIGN (ALL ADVANCED PARAMS UNLOCKED) */}
        {showHigh && (
          <SectionCard
            title={t(lang, 'B. Thiết kế quy hoạch Khối Cao tầng', 'B. High-Rise Architectural & FAR Design')}
            subtitle={t(
              lang,
              `CFA: ${formatNum(planning.high.cfa, 0, lang)} m² · Thương phẩm: ${formatNum(planning.high.nsa, 0, lang)} m² · ${formatNum(planning.high.units, 0, lang)} căn`,
              `CFA: ${formatNum(planning.high.cfa, 0, lang)} m² · Saleable NSA: ${formatNum(planning.high.nsa, 0, lang)} m² · ${formatNum(planning.high.units, 0, lang)} units`
            )}
            lang={lang}
            rightColHeader={t(lang, 'Chỉ tiêu quy đổi', 'Derived Output')}
            headerAction={
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/6 dark:bg-white/10 text-[11.5px]">
                <button
                  type="button"
                  onClick={() => onUpdateField('design_method', 'population')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    inputs.design_method === 'population'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t(lang, 'Theo Dân số', 'By Population')}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateField('design_method', 'far')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    inputs.design_method === 'far'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t(lang, 'Theo Hệ số SDĐ', 'By FAR')}
                </button>
              </div>
            }
          >
            {renderInputRow(
              'shop_far',
              `${formatNum(planning.high.commercialGfa, 0, lang)} m² GFA`,
              t(lang, 'Sàn TMDV khối đế', 'Commercial GFA')
            )}
            {inputs.design_method === 'far'
              ? renderInputRow(
                  'res_far_input',
                  `${formatNum(planning.high.apartmentGfa, 0, lang)} m² GFA`,
                  `${formatNum(planning.high.population, 0, lang)} ${t(lang, 'người', 'people')}`
                )
              : renderInputRow(
                  'population_input',
                  `${formatNum(planning.high.apartmentNsa, 0, lang)} m² NSA`,
                  `FAR ở: ${formatNum(planning.high.residentialRatio, 2, lang)}x`
                )}
            {renderInputRow('sqm_per_person', `${formatNum(planning.high.population, 0, lang)} ${t(lang, 'người', 'people')}`)}
            {renderInputRow(
              'technical_floor_ratio',
              `${formatNum(planning.high.technicalArea, 0, lang)} m²`,
              t(lang, 'Sàn kỹ thuật miễn FAR', 'Exempt tech area'),
              { max: 0.5 }
            )}
            {renderInputRow('basement_bcr', `${formatNum(planning.high.basementArea, 0, lang)} m²`, undefined, {
              max: 1,
            })}
            {renderInputRow('podium_bcr', `${formatNum(planning.land.highrise * inputs.podium_bcr, 0, lang)} m²/tầng`, undefined, {
              max: 1,
            })}
            {renderInputRow('tower_bcr', `${formatNum(planning.land.highrise * inputs.tower_bcr, 0, lang)} m²/tầng`, undefined, {
              max: 1,
            })}
            {renderInputRow(
              'basement_floors',
              `${formatNum(planning.high.basementArea, 0, lang)} m² hầm`,
              undefined,
              { max: 6 }
            )}
            {renderInputRow(
              'refuge_floors',
              `${planning.high.storeys} ${t(lang, 'tầng nổi', 'storeys')}`,
              undefined,
              { max: 5 }
            )}
            {renderInputRow(
              'shop_efficiency',
              `${formatNum(planning.high.commercialNla, 0, lang)} m² NLA`,
              undefined,
              { max: 1 }
            )}
            {renderInputRow(
              'res_efficiency',
              `${formatNum(planning.high.apartmentNsa, 0, lang)} m² NSA`,
              undefined,
              { max: 1 }
            )}
            {renderInputRow(
              'basement_parking_eff',
              `${formatNum(planning.high.parkingArea, 0, lang)} m² đỗ xe`,
              undefined,
              { max: 1 }
            )}
            {renderInputRow(
              'floating_parking_eff',
              `${planning.high.parkingStoreys} ${t(lang, 'tầng đỗ xe nổi', 'parking storeys')}`,
              undefined,
              { max: 1 }
            )}
            {renderInputRow(
              'avg_shop_size_highrise',
              `${formatNum(planning.high.shopUnits, 1, lang)} ${t(lang, 'căn', 'units')}`
            )}
            {renderInputRow(
              'avg_apartment_size',
              `${formatNum(planning.high.aptUnits, 1, lang)} ${t(lang, 'căn hộ', 'apts')}`
            )}
            {renderComputedRow(
              'Tổng hệ số sử dụng đất (FAR) & Tầng cao nổi',
              'Total High-Rise FAR & Above-Ground Storeys',
              'lần',
              `${formatNum(planning.high.far, 2, lang)}x`,
              `${planning.high.storeys} ${t(lang, 'tầng', 'fl')} (${planning.high.commercialStoreys} TM + ${planning.high.parkingStoreys} xe + ${planning.high.residentialStoreys} ở)`
            )}
            {renderComputedRow(
              'Tổng diện tích sàn xây dựng (CFA, gồm hầm & đỗ xe)',
              'Total Construction Floor Area (CFA incl. parking)',
              'm²',
              formatNum(planning.high.cfa, 0, lang),
              `Hiệu suất thương phẩm: ${formatPct(planning.high.efficiency, 1, lang)}`,
              true
            )}
          </SectionCard>
        )}

        {/* SECTION C: LOW-RISE DESIGN */}
        {showLow && (
          <SectionCard
            title={t(lang, 'C. Thiết kế Khu Thấp tầng', 'C. Low-Rise Urban Design')}
            subtitle={t(
              lang,
              `Tổng GFA thấp tầng: ${formatNum(planning.low.gfa.total, 0, lang)} m² · Tổng số nền: ${formatNum(planning.low.units.total, 1, lang)} căn`,
              `Low-rise GFA: ${formatNum(planning.low.gfa.total, 0, lang)} m² · Total lots: ${formatNum(planning.low.units.total, 1, lang)} units`
            )}
            lang={lang}
            rightColHeader={t(lang, 'GFA / Số lượng căn', 'GFA / Units')}
          >
            {renderInputRow('lowrise_shop_bcr', `${formatNum(planning.low.gfa.ls, 0, lang)} m² GFA`, undefined, {
              max: 1,
            })}
            {renderInputRow('townhouse_bcr', `${formatNum(planning.low.gfa.th, 0, lang)} m² GFA`, undefined, {
              max: 1,
            })}
            {renderInputRow('villa_bcr', `${formatNum(planning.low.gfa.vl, 0, lang)} m² GFA`, undefined, {
              max: 1,
            })}
            {renderInputRow('lowrise_shop_floors', `${formatNum(planning.low.gfa.ls, 0, lang)} m² XD`)}
            {renderInputRow('townhouse_floors', `${formatNum(planning.low.gfa.th, 0, lang)} m² XD`)}
            {renderInputRow('villa_floors', `${formatNum(planning.low.gfa.vl, 0, lang)} m² XD`)}
            {renderInputRow(
              'avg_shop_lot',
              `${formatNum(planning.low.units.ls, 1, lang)} ${t(lang, 'căn', 'units')}`
            )}
            {renderInputRow(
              'avg_townhouse_lot',
              `${formatNum(planning.low.units.th, 1, lang)} ${t(lang, 'căn', 'units')}`
            )}
            {renderInputRow(
              'avg_villa_lot',
              `${formatNum(planning.low.units.vl, 1, lang)} ${t(lang, 'căn', 'units')}`
            )}
            {renderComputedRow(
              'Tổng sàn xây dựng & Tổng sản phẩm thấp tầng',
              'Total Low-Rise GFA & Product Units',
              'm²',
              formatNum(planning.low.gfa.total, 0, lang),
              `${formatNum(planning.low.units.total, 1, lang)} ${t(lang, 'căn', 'units')} · ${formatNum(planning.low.population, 0, lang)} ${t(lang, 'người', 'people')}`,
              true
            )}
          </SectionCard>
        )}

        {/* SECTION D: DEVELOPMENT COST */}
        {showCost && (
          <SectionCard
            title={t(lang, 'D. Tổng mức Chi phí Đầu tư (Chưa VAT)', 'D. Total Development Cost (Excl. VAT)')}
            subtitle={t(
              lang,
              `Tổng chi phí chưa lãi vay: ${formatMoney(dev.totalExVat, lang, unitDisplay)} ${unitMoney} · VAT đầu vào: ${formatMoney(dev.inputVat, lang, unitDisplay)} ${unitMoney}`,
              `Total cost ex-interest: ${formatMoney(dev.totalExVat, lang, unitDisplay)} ${unitMoney} · Input VAT: ${formatMoney(dev.inputVat, lang, unitDisplay)} ${unitMoney}`
            )}
            lang={lang}
            rightColHeader={`${t(lang, 'Thành tiền', 'Amount')} (${unitMoney})`}
          >
            {renderInputRow(
              'land_transfer_unit_price',
              formatMoney(dev.landTransfer, lang, unitDisplay),
              t(lang, 'Chi phí mua đất', 'Land transfer')
            )}
            {renderInputRow(
              'asset_book_value',
              dev.goodwill !== 0
                ? `Chênh lệch: ${formatMoney(dev.goodwill, lang, unitDisplay)}`
                : formatMoney(dev.bookValue, lang, unitDisplay),
              undefined,
              { allowNull: true }
            )}
            {renderInputRow(
              'land_use_fee',
              formatMoney(dev.luf, lang, unitDisplay),
              planning.land.total > 0
                ? `${formatNum(dev.luf / planning.land.total, 1, lang)} triệu/m² đất`
                : undefined
            )}
            {renderInputRow('infrastructure_unit_rate', formatMoney(dev.infra, lang, unitDisplay))}
            {renderInputRow('highrise_build_cost_rate', formatMoney(dev.highrise, lang, unitDisplay))}
            {renderInputRow('lowrise_shop_build_cost_rate', formatMoney(dev.ls, lang, unitDisplay))}
            {renderInputRow('townhouse_build_cost_rate', formatMoney(dev.th, lang, unitDisplay))}
            {renderInputRow('villa_build_cost_rate', formatMoney(dev.vl, lang, unitDisplay))}
            {renderInputRow('design_consultant_rate', formatMoney(dev.design, lang, unitDisplay), undefined, {
              max: 0.5,
            })}
            {renderInputRow('project_management_rate', formatMoney(dev.pm, lang, unitDisplay), undefined, {
              max: 0.5,
            })}
            {renderInputRow(
              'construction_contingency_rate',
              formatMoney(dev.contingency, lang, unitDisplay),
              undefined,
              { max: 0.5 }
            )}
            {renderInputRow('legal_cost', formatMoney(dev.legal, lang, unitDisplay))}
            {renderInputRow('sales_commission_rate', formatMoney(dev.commission, lang, unitDisplay), undefined, {
              max: 0.5,
            })}
            {renderInputRow('marketing_rate', formatMoney(dev.marketing, lang, unitDisplay), undefined, {
              max: 0.5,
            })}
            {renderInputRow('sales_gallery_cost', formatMoney(dev.gallery, lang, unitDisplay))}
            {renderInputRow('ga_rate', formatMoney(dev.ga, lang, unitDisplay), undefined, { max: 0.3 })}
            {renderComputedRow(
              'Tổng chi phí đầu tư & vận hành (chưa VAT & lãi vay)',
              'Total Development & Operating Cost (ex. VAT & interest)',
              unitMoney,
              formatMoney(dev.totalExVat, lang, unitDisplay),
              `+ VAT: ${formatMoney(dev.inputVat, lang, unitDisplay)}`,
              true
            )}
          </SectionCard>
        )}

        {/* SECTION E, F, G: SALES PRICING, FINANCING & TAX */}
        {showSalesFin && (
          <SectionCard
            title={t(
              lang,
              'E–G. Giá bán thương phẩm, Nguồn vốn vay & Thuế',
              'E–G. Product Pricing, Financing & Tax Parameters'
            )}
            subtitle={t(
              lang,
              `Doanh thu hợp đồng: ${formatMoney(result.pl.revenue, lang, unitDisplay)} ${unitMoney} · Lãi vay dự kiến: ${formatMoney(result.pl.interest, lang, unitDisplay)} ${unitMoney}`,
              `Contracted revenue: ${formatMoney(result.pl.revenue, lang, unitDisplay)} ${unitMoney} · Total interest: ${formatMoney(result.pl.interest, lang, unitDisplay)} ${unitMoney}`
            )}
            lang={lang}
            rightColHeader={`${t(lang, 'Doanh thu / Quy mô', 'Revenue / Impact')} (${unitMoney})`}
          >
            {renderInputRow(
              'lowrise_shop_land_price_component',
              formatMoney(sales[0].contracted, lang, unitDisplay),
              `ĐG trọn gói: ${formatNum(sales[0].avgPrice, 1, lang)} tr/m²`
            )}
            {renderInputRow(
              'townhouse_land_price_component',
              formatMoney(sales[1].contracted, lang, unitDisplay),
              `ĐG trọn gói: ${formatNum(sales[1].avgPrice, 1, lang)} tr/m²`
            )}
            {renderInputRow(
              'villa_land_price_component',
              formatMoney(sales[2].contracted, lang, unitDisplay),
              `ĐG trọn gói: ${formatNum(sales[2].avgPrice, 1, lang)} tr/m²`
            )}
            {renderInputRow(
              'podium_shop_base_selling_price',
              formatMoney(sales[3].contracted, lang, unitDisplay),
              `${formatNum(sales[3].area, 0, lang)} m² NLA`
            )}
            {renderInputRow(
              'apartment_base_selling_price',
              formatMoney(sales[4].contracted, lang, unitDisplay),
              `${formatNum(sales[4].area, 0, lang)} m² NSA`
            )}
            {renderInputRow('selling_price_escalation', formatPct(inputs.selling_price_escalation, 1, lang), undefined, {
              max: 0.5,
            })}
            {renderInputRow(
              'land_loan_ratio',
              formatMoney(result.financing.landLoan, lang, unitDisplay),
              t(lang, 'Vay mua đất', 'Land loan'),
              { max: 0.95 }
            )}
            {renderInputRow(
              'constr_loan_ratio',
              formatMoney(result.financing.constrLoan, lang, unitDisplay),
              t(lang, 'Vay xây dựng', 'Constr. loan'),
              { max: 0.95 }
            )}
            {renderInputRow(
              'annual_loan_interest_rate',
              formatMoney(result.financing.interest, lang, unitDisplay),
              t(lang, 'Tổng lãi vay 40 quý', 'Total 40Q interest'),
              { max: 0.5 }
            )}
            {renderInputRow(
              'equity_discount_rate',
              `NPV: ${formatMoney(result.summary.perf.npv, lang, unitDisplay)}`,
              undefined,
              { max: 0.6 }
            )}
            {renderInputRow('cit_rate', formatMoney(result.pl.cit, lang, unitDisplay), t(lang, 'Thuế TNDN', 'CIT'), {
              max: 0.5,
            })}
            {renderInputRow(
              'vat_rate',
              formatMoney(result.cf.outVat.total, lang, unitDisplay),
              t(lang, 'VAT đầu ra', 'Output VAT'),
              { max: 0.25 }
            )}
            {renderInputRow('sens_apartment_price_step')}
            {renderInputRow('sens_land_price_step')}
          </SectionCard>
        )}
      </div>

      {/* Right Live Breakdown Inspector */}
      {prefs.showInspector && (
        <aside className="hidden xl:flex w-80 shrink-0 border-l border-slate-900/10 dark:border-white/10 bg-white/48 dark:bg-slate-950/45 backdrop-blur-xl p-4 flex-col gap-5 overflow-y-auto">
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t(lang, 'Cơ cấu sử dụng đất', 'Land Allocation')}
            </h3>
            <div className="mt-2.5 h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
              {planning.land.total > 0 && (
                <>
                  <div
                    style={{ width: `${(planning.land.highrise / planning.land.total) * 100}%` }}
                    className="bg-blue-500"
                    title="Cao tầng"
                  />
                  <div
                    style={{ width: `${(planning.land.lowProduct / planning.land.total) * 100}%` }}
                    className="bg-emerald-500"
                    title="Thấp tầng thương phẩm"
                  />
                  <div
                    style={{ width: `${(planning.land.roadGreen / planning.land.total) * 100}%` }}
                    className="bg-amber-400"
                    title="Giao thông cây xanh"
                  />
                </>
              )}
            </div>
            <div className="mt-2.5 space-y-1.5 text-[12px]">
              <InspectorRow
                dotColor="bg-blue-500"
                label={t(lang, 'Đất cao tầng', 'High-rise land')}
                value={`${formatNum(planning.land.highrise, 0, lang)} m²`}
              />
              <InspectorRow
                dotColor="bg-emerald-500"
                label={t(lang, 'Đất ở thấp tầng', 'Low-rise lots')}
                value={`${formatNum(planning.land.lowProduct, 0, lang)} m²`}
              />
              <InspectorRow
                dotColor="bg-amber-400"
                label={t(lang, 'Giao thông & cây xanh', 'Roads & green')}
                value={`${formatNum(planning.land.roadGreen, 0, lang)} m²`}
              />
            </div>
          </div>

          <div className="border-t border-slate-900/8 dark:border-white/10 pt-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t(lang, 'Tỷ trọng Doanh thu theo Sản phẩm', 'Revenue Mix')}
            </h3>
            <div className="mt-2.5 space-y-2">
              {sales.map((s) => (
                <div key={s.p} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-slate-700 dark:text-slate-200 truncate">
                      {lang === 'vi' ? PRODUCT_NAMES[s.p].vi : PRODUCT_NAMES[s.p].en}
                    </span>
                    <span className="font-tabular font-medium text-slate-900 dark:text-white">
                      {formatMoney(s.contracted, lang, unitDisplay)} ({formatPct(s.share, 0, lang)})
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-primary)] transition-all"
                      style={{ width: `${Math.min(100, s.share * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900/8 dark:border-white/10 pt-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t(lang, 'Tóm tắt Kết quả Kinh doanh', 'P&L Quick View')}
            </h3>
            <div className="mt-2.5 space-y-1.5 text-[12.5px]">
              <SimpleMetricRow
                label={t(lang, 'Doanh thu thuần', 'Net Revenue')}
                value={formatMoney(result.pl.revenue, lang, unitDisplay)}
              />
              <SimpleMetricRow
                label={t(lang, 'Giá vốn (Đất + XD + TV)', 'COGS')}
                value={`-${formatMoney(result.pl.cogs, lang, unitDisplay)}`}
              />
              <SimpleMetricRow
                label={t(lang, 'Chi phí bán hàng & QL', 'SG&A / Opex')}
                value={`-${formatMoney(result.pl.opex, lang, unitDisplay)}`}
              />
              <SimpleMetricRow
                label={t(lang, 'Chi phí lãi vay', 'Interest Expense')}
                value={`-${formatMoney(result.pl.interest, lang, unitDisplay)}`}
              />
              <SimpleMetricRow
                label={t(lang, 'Thuế TNDN (CIT)', 'Corporate Tax')}
                value={`-${formatMoney(result.pl.cit, lang, unitDisplay)}`}
              />
              <div className="pt-1.5 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between font-semibold text-emerald-700 dark:text-emerald-400">
                <span>{t(lang, 'Lợi nhuận sau thuế', 'Profit After Tax')}</span>
                <span className="font-tabular">
                  {formatMoney(result.pl.pat, lang, unitDisplay)} {unitMoney}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

interface SectionCardProps {
  title: string;
  subtitle: string;
  lang: 'vi' | 'en';
  rightColHeader: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  lang,
  rightColHeader,
  headerAction,
  children,
}) => (
  <section className="rounded-2xl bg-white/78 dark:bg-slate-900/68 backdrop-blur-xl border border-slate-900/8 dark:border-white/10 shadow-xs overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-900/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 dark:bg-white/[0.02]">
      <div>
        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="font-tabular text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {headerAction}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-900/8 dark:border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-900/[0.015] dark:bg-white/[0.015]">
            <th className="text-left py-2 px-3.5">{t(lang, 'Chỉ tiêu giả định', 'Parameter')}</th>
            <th className="text-left py-2 px-3">{t(lang, 'Đơn vị', 'Unit')}</th>
            <th className="text-right py-2 px-3.5">{t(lang, 'Giá trị nhập', 'Input')}</th>
            <th className="text-right py-2 px-3.5">{rightColHeader}</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </section>
);

const InspectorRow: React.FC<{ dotColor: string; label: string; value: string }> = ({
  dotColor,
  label,
  value,
}) => (
  <div className="flex items-center justify-between">
    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
    <span className="font-tabular font-medium text-slate-900 dark:text-white">{value}</span>
  </div>
);

const SimpleMetricRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
    <span>{label}</span>
    <span className="font-tabular text-slate-900 dark:text-white">{value}</span>
  </div>
);
