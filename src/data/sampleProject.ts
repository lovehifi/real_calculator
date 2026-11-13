import { ModelInputs, ProductCode } from '../types/model';

function make40(entries: Record<number, number>): number[] {
  const arr = new Array<number>(40).fill(0);
  for (const [idxStr, val] of Object.entries(entries)) {
    const idx = Number(idxStr);
    if (idx >= 0 && idx < 40) {
      arr[idx] = val;
    }
  }
  return arr;
}

export function cloneInputs(inp: ModelInputs): ModelInputs {
  return JSON.parse(JSON.stringify(inp)) as ModelInputs;
}

export const SAMPLE_PROJECT_INPUTS: ModelInputs = {
  projectName: 'Khu Đô Thị Hỗn Hợp Riverside Park',
  model_start_year: 2026,

  // A. Land Use Planning (m²)
  highrise_land_area: 6000,
  lowrise_shop_land: 2000,
  townhouse_land: 1000,
  villa_land: 9000,
  lowrise_road_green: 10004,
  nonconforming_area: 0,

  // B. High-rise Design (All unlocked)
  design_method: 'population',
  shop_far: 0.4,
  res_far_input: 6.524,
  population_input: 1000,
  sqm_per_person: 32,
  technical_floor_ratio: 0.09,
  basement_bcr: 0.7,
  podium_bcr: 0.5,
  tower_bcr: 0.35,
  basement_floors: 0,
  refuge_floors: 0,
  shop_efficiency: 0.7,
  res_efficiency: 0.75,
  basement_parking_eff: 0.75,
  floating_parking_eff: 0.65,
  avg_shop_size_highrise: 110,
  avg_apartment_size: 61.11,

  // C. Low-rise Design
  lowrise_shop_bcr: 0.9,
  townhouse_bcr: 0.9,
  villa_bcr: 0.4,
  lowrise_shop_floors: 2,
  townhouse_floors: 2,
  villa_floors: 3,
  avg_shop_lot: 100,
  avg_townhouse_lot: 90,
  avg_villa_lot: 226.71,

  // D. Development Cost (triệu đồng or triệu đồng/m²)
  land_transfer_unit_price: 4.5,
  asset_book_value: null,
  land_use_fee: 328000,
  infrastructure_unit_rate: 2.0,
  highrise_build_cost_rate: 14.0,
  lowrise_shop_build_cost_rate: 8.0,
  townhouse_build_cost_rate: 8.0,
  villa_build_cost_rate: 8.0,
  design_consultant_rate: 0.07,
  project_management_rate: 0.03,
  construction_contingency_rate: 0.05,
  legal_cost: 20000,
  sales_commission_rate: 0.06,
  marketing_rate: 0.015,
  sales_gallery_cost: 35000,
  ga_rate: 0.003316,

  // E. Sales Revenue (triệu đồng/m²)
  lowrise_shop_land_price_component: 75.0,
  townhouse_land_price_component: 65.0,
  villa_land_price_component: 60.0,
  podium_shop_base_selling_price: 45.6,
  apartment_base_selling_price: 40.0,
  selling_price_escalation: 0.05,

  // F & G. Financing, Tax & Sensitivity
  land_loan_ratio: 0.7,
  constr_loan_ratio: 0.55,
  annual_loan_interest_rate: 0.12,
  equity_discount_rate: 0.10,
  cit_rate: 0.20,
  vat_rate: 0.10,
  sens_apartment_price_step: 3.0,
  sens_land_price_step: 0.5,

  // 40-Quarter Schedule (Q1..Q40, 0-indexed 0..39)
  timeline: {
    land: make40({ 2: 0.1, 3: 0.9 }),
    luf: make40({ 8: 1.0 }),
    design_legal: make40({ 2: 0.2, 3: 0.2, 4: 0.2, 5: 0.2, 6: 0.2 }),
    gallery: make40({ 6: 0.5, 7: 0.5 }),
    infra: make40({
      8: 1 / 6,
      9: 1 / 6,
      10: 1 / 6,
      11: 1 / 6,
      12: 1 / 6,
      13: 1 / 6,
    }),
    construction: {
      ls: make40({ 9: 0.25, 10: 0.25, 11: 0.25, 12: 0.25 }),
      th: make40({ 9: 0.25, 10: 0.25, 11: 0.25, 12: 0.25 }),
      vl: make40({ 9: 0.25, 10: 0.25, 11: 0.25, 12: 0.25 }),
      ps: make40({ 8: 0.125, 9: 0.125, 10: 0.125, 11: 0.125, 12: 0.125, 13: 0.125, 14: 0.125, 15: 0.125 }),
      ap: make40({ 8: 0.125, 9: 0.125, 10: 0.125, 11: 0.125, 12: 0.125, 13: 0.125, 14: 0.125, 15: 0.125 }),
    },
    sales: {
      ls: make40({ 9: 0.5, 10: 0.5 }),
      th: make40({ 9: 0.5, 10: 0.5 }),
      vl: make40({ 9: 0.5, 10: 0.5 }),
      ps: make40({ 10: 0.5, 11: 0.5 }),
      ap: make40({ 10: 0.5, 11: 0.5 }),
    },
    collection: {
      ls: make40({ 9: 0.2, 10: 0.1, 11: 0.2, 12: 0.45, 15: 0.05 }),
      th: make40({ 9: 0.2, 10: 0.1, 11: 0.2, 12: 0.45, 15: 0.05 }),
      vl: make40({ 9: 0.2, 10: 0.1, 11: 0.2, 12: 0.45, 15: 0.05 }),
      ps: make40({ 10: 0.3, 11: 0.1, 12: 0.1, 13: 0.1, 14: 0.1, 15: 0.25, 18: 0.05 }),
      ap: make40({ 10: 0.3, 11: 0.1, 12: 0.1, 13: 0.1, 14: 0.1, 15: 0.25, 18: 0.05 }),
    },
  },
};

export interface PresetTemplate {
  id: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  build: () => ModelInputs;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'mixed_flagship',
    nameVi: 'Khu đô thị hỗn hợp Riverside Park (Mặc định)',
    nameEn: 'Riverside Park Mixed-Use Township (Default)',
    descVi: '2,8 ha · Cao tầng 6.000 m² + Thấp tầng 22.004 m² · Chuẩn 40 quý',
    descEn: '2.8 ha · High-rise 6,000 m² + Low-rise 22,004 m² · 40-quarter horizon',
    build: () => cloneInputs(SAMPLE_PROJECT_INPUTS),
  },
  {
    id: 'highrise_metro',
    nameVi: 'Tổ hợp Chung cư Cao tầng Metro Skyline',
    nameEn: 'Metro Skyline High-Rise Condominium',
    descVi: '1,2 ha · Chuyên biệt căn hộ & shophouse khối đế có 2 tầng hầm',
    descEn: '1.2 ha · Dedicated apartment & podium shophouse tower with 2 basements',
    build: () => {
      const base = cloneInputs(SAMPLE_PROJECT_INPUTS);
      base.projectName = 'Tổ hợp Cao tầng Metro Skyline';
      base.highrise_land_area = 12000;
      base.lowrise_shop_land = 0;
      base.townhouse_land = 0;
      base.villa_land = 0;
      base.lowrise_road_green = 0;
      base.design_method = 'far';
      base.shop_far = 0.6;
      base.res_far_input = 6.2;
      base.basement_floors = 2;
      base.basement_bcr = 0.75;
      base.refuge_floors = 1;
      base.land_transfer_unit_price = 18.0;
      base.land_use_fee = 420000;
      base.highrise_build_cost_rate = 15.8;
      base.apartment_base_selling_price = 58.0;
      base.podium_shop_base_selling_price = 82.0;
      base.timeline.construction.ps = make40({
        4: 0.1, 5: 0.1, 6: 0.12, 7: 0.12, 8: 0.14, 9: 0.14, 10: 0.14, 11: 0.14,
      });
      base.timeline.construction.ap = make40({
        4: 0.1, 5: 0.1, 6: 0.12, 7: 0.12, 8: 0.14, 9: 0.14, 10: 0.14, 11: 0.14,
      });
      base.timeline.sales.ps = make40({ 6: 0.4, 7: 0.3, 8: 0.3 });
      base.timeline.sales.ap = make40({ 6: 0.35, 7: 0.35, 8: 0.3 });
      base.timeline.collection.ps = make40({ 6: 0.2, 7: 0.15, 8: 0.15, 9: 0.1, 10: 0.1, 11: 0.25, 13: 0.05 });
      base.timeline.collection.ap = make40({ 6: 0.2, 7: 0.15, 8: 0.15, 9: 0.1, 10: 0.1, 11: 0.25, 13: 0.05 });
      return base;
    },
  },
  {
    id: 'lowrise_compound',
    nameVi: 'Khu Biệt thự & Shophouse Sinh thái Palm Cove',
    nameEn: 'Palm Cove Villa & Shophouse Compound',
    descVi: '5,0 ha · Thấp tầng biệt lập kéo dài phân kỳ bán hàng đến Quý 24',
    descEn: '5.0 ha · Phased low-rise gated compound extending through Quarter 24',
    build: () => {
      const base = cloneInputs(SAMPLE_PROJECT_INPUTS);
      base.projectName = 'Khu Biệt thự Sinh thái Palm Cove';
      base.highrise_land_area = 0;
      base.lowrise_shop_land = 5500;
      base.townhouse_land = 8500;
      base.villa_land = 16000;
      base.lowrise_road_green = 20000;
      base.land_transfer_unit_price = 3.8;
      base.land_use_fee = 390000;
      base.infrastructure_unit_rate = 2.4;
      base.lowrise_shop_land_price_component = 68;
      base.townhouse_land_price_component = 56;
      base.villa_land_price_component = 52;
      // Multi-phase across Q8..Q24 (demonstrating unlocked 40-quarter horizon)
      base.timeline.construction.ls = make40({ 8: 0.25, 9: 0.25, 10: 0.25, 11: 0.25 });
      base.timeline.construction.th = make40({ 10: 0.2, 11: 0.2, 12: 0.2, 13: 0.2, 14: 0.2 });
      base.timeline.construction.vl = make40({ 12: 0.125, 13: 0.125, 14: 0.125, 15: 0.125, 16: 0.125, 17: 0.125, 18: 0.125, 19: 0.125 });
      base.timeline.sales.ls = make40({ 8: 0.5, 9: 0.5 });
      base.timeline.sales.th = make40({ 11: 0.5, 12: 0.5 });
      base.timeline.sales.vl = make40({ 14: 0.25, 15: 0.25, 16: 0.25, 17: 0.25 });
      base.timeline.collection.ls = make40({ 8: 0.3, 9: 0.2, 10: 0.2, 11: 0.25, 14: 0.05 });
      base.timeline.collection.th = make40({ 11: 0.3, 12: 0.2, 13: 0.2, 14: 0.25, 17: 0.05 });
      base.timeline.collection.vl = make40({ 14: 0.2, 15: 0.15, 16: 0.15, 17: 0.15, 18: 0.1, 19: 0.2, 22: 0.05 });
      return base;
    },
  },
  {
    id: 'clean_blank',
    nameVi: 'Dự án Trắng (Nhập mới từ đầu)',
    nameEn: 'Blank Project (Start from Scratch)',
    descVi: 'Xoá các diện tích đất về 0 m² nhưng giữ nguyên tỷ lệ định mức chuẩn',
    descEn: 'Zeroes out land areas while preserving benchmark cost & efficiency ratios',
    build: () => {
      const base = cloneInputs(SAMPLE_PROJECT_INPUTS);
      base.projectName = 'Dự án BĐS Mới';
      base.highrise_land_area = 0;
      base.lowrise_shop_land = 0;
      base.townhouse_land = 0;
      base.villa_land = 0;
      base.lowrise_road_green = 0;
      base.nonconforming_area = 0;
      base.land_use_fee = 0;
      base.legal_cost = 0;
      base.sales_gallery_cost = 0;
      return base;
    },
  },
];

function ensureArray40(arr: unknown, fallback: number[]): number[] {
  if (!Array.isArray(arr)) return [...fallback];
  const out = new Array<number>(40).fill(0);
  for (let i = 0; i < 40; i++) {
    const v = Number(arr[i]);
    out[i] = Number.isFinite(v) ? v : 0;
  }
  return out;
}

/**
 * Normalizes imported JSON (supporting both Desktop JSON and legacy web RC_SAMPLE JSON in VND thousand)
 */
export function normalizeImportedInputs(raw: Record<string, unknown>): ModelInputs {
  const base = cloneInputs(SAMPLE_PROJECT_INPUTS);
  const src = (raw.inputs && typeof raw.inputs === 'object' ? raw.inputs : raw) as Record<string, unknown>;

  // Detect legacy VND-thousand scaling if apartment_base_selling_price > 1000 or land_use_fee > 10_000_000
  const isLegacyThousand =
    Number(src.apartment_base_selling_price || 0) > 1000 ||
    Number(src.land_use_fee || 0) > 10_000_000 ||
    Number(src.highrise_build_cost_rate || 0) > 500;

  const scale = isLegacyThousand ? 1 / 1000 : 1;

  if (typeof src.projectName === 'string' && src.projectName.trim()) {
    base.projectName = src.projectName.trim();
  }

  const numField = (key: keyof ModelInputs, mult = 1) => {
    const v = src[key as string];
    if (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) {
      (base as unknown as Record<string, unknown>)[key as string] = Number(v) * mult;
    }
  };

  numField('model_start_year');
  numField('highrise_land_area');
  numField('lowrise_shop_land');
  numField('townhouse_land');
  numField('villa_land');
  numField('lowrise_road_green');
  numField('nonconforming_area');

  if (src.design_method === 'far' || src.design_method === 'population') {
    base.design_method = src.design_method;
  }

  numField('shop_far');
  numField('res_far_input');
  numField('population_input');
  numField('sqm_per_person');
  numField('technical_floor_ratio');
  numField('basement_bcr');
  numField('podium_bcr');
  numField('tower_bcr');
  numField('basement_floors');
  numField('refuge_floors');
  numField('shop_efficiency');
  numField('res_efficiency');
  numField('basement_parking_eff');
  numField('floating_parking_eff');
  numField('avg_shop_size_highrise');
  numField('avg_apartment_size');

  numField('lowrise_shop_bcr');
  numField('townhouse_bcr');
  numField('villa_bcr');
  numField('lowrise_shop_floors');
  numField('townhouse_floors');
  numField('villa_floors');
  numField('avg_shop_lot');
  numField('avg_townhouse_lot');
  numField('avg_villa_lot');

  // Scaled monetary fields
  numField('land_transfer_unit_price', scale);
  if (src.asset_book_value === null || src.asset_book_value === undefined || src.asset_book_value === '') {
    base.asset_book_value = null;
  } else if (Number.isFinite(Number(src.asset_book_value))) {
    base.asset_book_value = Number(src.asset_book_value) * scale;
  }
  numField('land_use_fee', scale);
  numField('infrastructure_unit_rate', scale);
  numField('highrise_build_cost_rate', scale);
  numField('lowrise_shop_build_cost_rate', scale);
  numField('townhouse_build_cost_rate', scale);
  numField('villa_build_cost_rate', scale);

  numField('design_consultant_rate');
  numField('project_management_rate');
  numField('construction_contingency_rate');
  numField('legal_cost', scale);
  numField('sales_commission_rate');
  numField('marketing_rate');
  numField('sales_gallery_cost', scale);
  numField('ga_rate');

  numField('lowrise_shop_land_price_component', scale);
  numField('townhouse_land_price_component', scale);
  numField('villa_land_price_component', scale);
  numField('podium_shop_base_selling_price', scale);
  numField('apartment_base_selling_price', scale);
  numField('selling_price_escalation');

  numField('land_loan_ratio');
  numField('constr_loan_ratio');
  numField('annual_loan_interest_rate');
  numField('equity_discount_rate');
  numField('cit_rate');
  numField('vat_rate');
  numField('sens_apartment_price_step', scale);
  numField('sens_land_price_step', scale);

  if (src.timeline && typeof src.timeline === 'object') {
    const tl = src.timeline as Record<string, unknown>;
    base.timeline.land = ensureArray40(tl.land, base.timeline.land);
    base.timeline.luf = ensureArray40(tl.luf, base.timeline.luf);
    base.timeline.design_legal = ensureArray40(tl.design_legal, base.timeline.design_legal);
    base.timeline.gallery = ensureArray40(tl.gallery, base.timeline.gallery);
    base.timeline.infra = ensureArray40(tl.infra, base.timeline.infra);

    const prods: ProductCode[] = ['ls', 'th', 'vl', 'ps', 'ap'];
    for (const grp of ['construction', 'sales', 'collection'] as const) {
      const grpObj = tl[grp] as Record<string, unknown> | undefined;
      if (grpObj && typeof grpObj === 'object') {
        for (const p of prods) {
          base.timeline[grp][p] = ensureArray40(grpObj[p], base.timeline[grp][p]);
        }
      }
    }
  }

  return base;
}
