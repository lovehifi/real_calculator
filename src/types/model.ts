export type Language = 'vi' | 'en';
export type ProductCode = 'ls' | 'th' | 'vl' | 'ps' | 'ap';
export type DesignMethod = 'population' | 'far';
export type WorkspaceTab = 'assumptions' | 'timeline' | 'dashboard' | 'cashflow' | 'checks';
export type AssumptionCategory = 'all' | 'land' | 'highrise' | 'lowrise' | 'cost' | 'sales_fin';

export interface ProductTimelineMap {
  ls: number[];
  th: number[];
  vl: number[];
  ps: number[];
  ap: number[];
}

export interface TimelineInputs {
  land: number[];
  luf: number[];
  design_legal: number[];
  gallery: number[];
  infra: number[];
  construction: ProductTimelineMap;
  sales: ProductTimelineMap;
  collection: ProductTimelineMap;
}

/**
 * All monetary inputs are stored in VND Million (triệu đồng) or VND Million / m²
 * All percentage inputs are stored as decimal ratios (e.g. 0.07 = 7.0%)
 */
export interface ModelInputs {
  projectName: string;
  model_start_year: number;

  // A. Land Use Planning (m²)
  highrise_land_area: number;
  lowrise_shop_land: number;
  townhouse_land: number;
  villa_land: number;
  lowrise_road_green: number;
  nonconforming_area: number;

  // B. High-rise Design (100% unlocked including advanced fields)
  design_method: DesignMethod;
  shop_far: number;
  res_far_input: number;
  population_input: number;
  sqm_per_person: number;
  technical_floor_ratio: number;
  basement_bcr: number;
  podium_bcr: number;
  tower_bcr: number;
  basement_floors: number;
  refuge_floors: number;
  shop_efficiency: number;
  res_efficiency: number;
  basement_parking_eff: number;
  floating_parking_eff: number;
  avg_shop_size_highrise: number;
  avg_apartment_size: number;

  // C. Low-rise Design
  lowrise_shop_bcr: number;
  townhouse_bcr: number;
  villa_bcr: number;
  lowrise_shop_floors: number;
  townhouse_floors: number;
  villa_floors: number;
  avg_shop_lot: number;
  avg_townhouse_lot: number;
  avg_villa_lot: number;

  // D. Development Cost (triệu đồng or triệu đồng/m²)
  land_transfer_unit_price: number;
  asset_book_value: number | null;
  land_use_fee: number;
  infrastructure_unit_rate: number;
  highrise_build_cost_rate: number;
  lowrise_shop_build_cost_rate: number;
  townhouse_build_cost_rate: number;
  villa_build_cost_rate: number;
  design_consultant_rate: number;
  project_management_rate: number;
  construction_contingency_rate: number;
  legal_cost: number;
  sales_commission_rate: number;
  marketing_rate: number;
  sales_gallery_cost: number;
  ga_rate: number;

  // E. Sales Revenue (triệu đồng/m²)
  lowrise_shop_land_price_component: number;
  townhouse_land_price_component: number;
  villa_land_price_component: number;
  podium_shop_base_selling_price: number;
  apartment_base_selling_price: number;
  selling_price_escalation: number;

  // F & G. Financing, Tax & Sensitivity
  land_loan_ratio: number;
  constr_loan_ratio: number;
  annual_loan_interest_rate: number;
  equity_discount_rate: number;
  cit_rate: number;
  vat_rate: number;
  sens_apartment_price_step: number;
  sens_land_price_step: number;

  // 40-Quarter Schedule (Q1..Q40, 100% unlocked)
  timeline: TimelineInputs;
}

export interface CashFlowRow {
  q: number[];     // 40 quarters (Q1..Q40)
  years: number[]; // 10 years (Year 1..Year 10)
  total: number;
}

export interface ProductSalesItem {
  p: ProductCode;
  active: boolean;
  units: number;
  area: number;
  basePrice: number;
  avgPrice: number;
  contracted: number;
  share: number;
}

export interface ProductTimelineAudit {
  p: ProductCode;
  active: boolean;
  constrStart: number | null; // 1-indexed quarter (1..40)
  handover: number | null;
  salesStart: number | null;
  collStart: number | null;
  coll95: number | null;
  finalColl: number | null;
  constrSum: number;
  salesSum: number;
  collSum: number;
  salesCollStatus: 'OK' | 'WARNING' | 'INCOMPLETE' | 'NA';
  basementSalesStatus: 'OK' | 'WARNING' | 'NA';
  handover95Status: 'OK' | 'WARNING' | 'ERROR' | 'INCOMPLETE' | 'NA';
}

export interface ModelCheckItem {
  id: string;
  category: 'design' | 'timeline' | 'legal' | 'finance';
  status: 'OK' | 'WARNING' | 'ERROR';
  titleVi: string;
  titleEn: string;
  detailVi: string;
  detailEn: string;
  targetTab: WorkspaceTab;
}

export interface CashFlowStatement {
  inflow: CashFlowRow;
  revenue: CashFlowRow;
  outVat: CashFlowRow;
  finIn: CashFlowRow;
  ldraw: CashFlowRow;
  cdraw: CashFlowRow;
  loan: CashFlowRow;
  equity: CashFlowRow;

  outflow: CashFlowRow;
  landAcq: CashFlowRow;
  landTransfer: CashFlowRow;
  luf: CashFlowRow;
  dev: CashFlowRow;
  infra: CashFlowRow;
  constrLs: CashFlowRow;
  constrTh: CashFlowRow;
  constrVl: CashFlowRow;
  constrPs: CashFlowRow;
  constrAp: CashFlowRow;
  construction: CashFlowRow;
  design: CashFlowRow;
  pm: CashFlowRow;
  consult: CashFlowRow;
  cont: CashFlowRow;
  opex: CashFlowRow;
  legal: CashFlowRow;
  comm: CashFlowRow;
  mkt: CashFlowRow;
  gallery: CashFlowRow;
  selling: CashFlowRow;
  ga: CashFlowRow;
  taxes: CashFlowRow;
  inVat: CashFlowRow;
  vatPaid: CashFlowRow;
  cit: CashFlowRow;
  finOut: CashFlowRow;
  interest: CashFlowRow;
  principal: CashFlowRow;
  dist: CashFlowRow;

  net: CashFlowRow;
  open: CashFlowRow;
  end: CashFlowRow;

  shareholder: CashFlowRow;
  shEquity: CashFlowRow;
  shDiv: CashFlowRow;
  fcfe: CashFlowRow;
  cumFcfe: CashFlowRow;
  debtBalance: CashFlowRow;
}

export interface DebtSafetyMetrics {
  debtBalanceQ: number[];
  dscrQ: (number | null)[];
  peakDebt: number;
  peakDebtQuarter: number | null;
  peakEquityExposure: number;
  peakEquityQuarter: number | null;
  minDscr: number | null;
  avgDscr: number | null;
}

export interface TornadoDriverResult {
  id: 'price' | 'build' | 'land' | 'interest' | 'opex';
  labelVi: string;
  labelEn: string;
  basePat: number;
  lowPat: number;
  highPat: number;
  baseIrr: number;
  lowIrr: number;
  highIrr: number;
  patSpread: number;
  irrSpread: number;
}

export interface CalculationResult {
  planning: {
    land: {
      highrise: number;
      lowProduct: number;
      roadGreen: number;
      lowZone: number;
      nonconforming: number;
      total: number;
    };
    high: {
      active: boolean;
      far: number;
      commercialRatio: number;
      residentialRatio: number;
      storeys: number;
      parkingStoreys: number;
      commercialStoreys: number;
      residentialStoreys: number;
      refugeStoreys: number;
      basementLevels: number;
      cfa: number;
      gfa: number;
      commercialGfa: number;
      apartmentGfa: number;
      basementArea: number;
      parkingArea: number;
      technicalArea: number;
      exemptGfa: number;
      nsa: number;
      commercialNla: number;
      apartmentNsa: number;
      efficiency: number;
      units: number;
      shopUnits: number;
      aptUnits: number;
      population: number;
      commercialShare: number;
    };
    low: {
      active: boolean;
      productLand: number;
      bcr: number;
      gfa: {
        ls: number;
        th: number;
        vl: number;
        total: number;
      };
      units: {
        ls: number;
        th: number;
        vl: number;
        total: number;
      };
      population: number;
    };
  };
  dev: {
    landTransfer: number;
    bookValue: number;
    goodwill: number;
    luf: number;
    land: number;
    infra: number;
    highrise: number;
    lowrise: number;
    ls: number;
    th: number;
    vl: number;
    ps: number;
    ap: number;
    construction: number;
    contingency: number;
    design: number;
    pm: number;
    consult: number;
    legal: number;
    commission: number;
    marketing: number;
    gallery: number;
    ga: number;
    opex: number;
    totalExVat: number;
    inputVat: number;
    cashRequirement: number;
  };
  sales: ProductSalesItem[];
  pl: {
    revenue: number;
    cogs: number;
    gp: number;
    gpMargin: number;
    opex: number;
    ebit: number;
    ebitMargin: number;
    interest: number;
    pbt: number;
    cit: number;
    pat: number;
    patMargin: number;
  };
  financing: {
    landLoan: number;
    constrLoan: number;
    totalLoan: number;
    interest: number;
    equity: number;
    collectionsUsed: number;
    totalCapital: number;
    distribution: number;
    minEndCash: number;
  };
  debtMetrics: DebtSafetyMetrics;
  summary: {
    totalNSA: number;
    totalUnits: number;
    totalRevenue: number;
    avgPrice: number;
    unitCostMode: 'mixed' | 'highrise' | 'lowrise' | 'none';
    unitCostPerM2: number;
    unitCostPerUnit: number;
    perf: {
      revenue: number;
      cost: number;
      cit: number;
      pat: number;
      npv: number;
      discountRate: number;
      roe: number;
      irr: number;
      shIrr: number;
      paybackYears: number | null;
      paybackQuarter: number | null;
      durationYears: number;
      margin: number;
    };
  };
  cf: CashFlowStatement;
  sens: {
    aptPrices: number[];  // 7 steps in triệu đồng/m²
    landPrices: number[]; // 7 steps in triệu đồng/m²
    pat: number[][];      // 7x7 PAT in triệu đồng
    irr: number[][];      // 7x7 IRR decimal
    baseIndex: [number, number];
  };
  tornado: TornadoDriverResult[];
  timelineAudit: {
    profiles: Record<'land' | 'luf' | 'design_legal' | 'gallery' | 'infra', { sum: number; ok: boolean; firstQ: number | null; lastQ: number | null }>;
    products: ProductTimelineAudit[];
  };
  checks: ModelCheckItem[];
}

export interface ScenarioSnapshot {
  id: string;
  name: string;
  createdAt: string;
  inputs: ModelInputs;
  kpis: {
    revenue: number;
    totalCost: number;
    pat: number;
    margin: number;
    equity: number;
    irr: number;
    npv: number;
    paybackYears: number | null;
  };
}

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: string;
  inputs: ModelInputs;
}

export type ThemeMode = 'light' | 'dark';
export type GlassIntensity = 'subtle' | 'balanced' | 'ultra';
export type AccentTheme = 'blue' | 'emerald' | 'indigo' | 'amber';
export type TableDensity = 'compact' | 'comfortable';
export type WindowMode = 'framed' | 'fullscreen';
export type WallpaperPreset = 'sonoma' | 'sequoia' | 'graphite' | 'aurora';

export interface AppPreferences {
  lang: Language;
  theme: ThemeMode;
  glassIntensity: GlassIntensity;
  accentColor: AccentTheme;
  density: TableDensity;
  windowMode: WindowMode;
  wallpaper: WallpaperPreset;
  autoCalculate: boolean;
  showKpiRibbon: boolean;
  showInspector: boolean;
  sidebarCollapsed: boolean;
  unitDisplay: 'million' | 'billion'; // triệu đồng vs tỷ đồng display option
}
