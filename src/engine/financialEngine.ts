import {
  CalculationResult,
  CashFlowRow,
  CashFlowStatement,
  ModelCheckItem,
  ModelInputs,
  ProductCode,
  ProductSalesItem,
  ProductTimelineAudit,
} from '../types/model';

const PRODUCTS: ProductCode[] = ['ls', 'th', 'vl', 'ps', 'ap'];

function sum(arr: number[]): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s;
}

function makeFlowRow(q: number[], mode: 'flow' | 'open' | 'end' | 'cum' = 'flow'): CashFlowRow {
  const cleanQ = q.map((v) => (Math.abs(v) < 1e-7 ? 0 : v));
  const years = new Array<number>(10).fill(0);
  for (let y = 0; y < 10; y++) {
    const slice = cleanQ.slice(y * 4, y * 4 + 4);
    if (mode === 'flow') {
      years[y] = sum(slice);
    } else if (mode === 'open') {
      years[y] = slice[0];
    } else {
      years[y] = slice[3];
    }
  }
  let total = 0;
  if (mode === 'flow') total = sum(cleanQ);
  else if (mode === 'open') total = cleanQ[0];
  else total = cleanQ[39];

  return { q: cleanQ, years, total };
}

/**
 * Computes periodic IRR via Newton-Raphson with bisection fallback.
 */
export function calculatePeriodicIrr(cashflows: number[], maxIter = 200, tol = 1e-7): number | null {
  let hasPos = false;
  let hasNeg = false;
  for (const c of cashflows) {
    if (c > 1e-4) hasPos = true;
    if (c < -1e-4) hasNeg = true;
  }
  if (!hasPos || !hasNeg) return null;

  const npvAt = (r: number): number => {
    let val = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const c = cashflows[t];
      if (c === 0) continue;
      val += c / Math.pow(1 + r, t);
    }
    return val;
  };

  let rate = 0.04; // ~17% annualized starting guess for quarterly cashflows
  for (let iter = 0; iter < maxIter; iter++) {
    let npv = 0;
    let dNpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const c = cashflows[t];
      if (c === 0) continue;
      const denom = Math.pow(1 + rate, t);
      npv += c / denom;
      if (t > 0) {
        dNpv -= (t * c) / Math.pow(1 + rate, t + 1);
      }
    }
    if (Math.abs(npv) < tol) return rate;
    if (Math.abs(dNpv) < 1e-12) break;
    const next = rate - npv / dNpv;
    if (!Number.isFinite(next) || next <= -0.95 || next > 5) break;
    if (Math.abs(next - rate) < tol) return next;
    rate = next;
  }

  // Bisection fallback across [-0.50, 2.0] per quarter
  let low = -0.5;
  let high = 2.0;
  let npvLow = npvAt(low);
  const npvHigh = npvAt(high);
  if (npvLow * npvHigh > 0) {
    return null;
  }
  for (let i = 0; i < 120; i++) {
    const mid = (low + high) / 2;
    const npvMid = npvAt(mid);
    if (Math.abs(npvMid) < tol) return mid;
    if (npvMid * npvLow > 0) {
      low = mid;
      npvLow = npvMid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

export function calculateNpvFromQuarterly(annualDiscountRate: number, quarterlyFlows: number[]): number {
  const qRate = Math.pow(1 + Math.max(-0.9, annualDiscountRate), 0.25) - 1;
  let npv = 0;
  for (let t = 0; t < quarterlyFlows.length; t++) {
    const c = quarterlyFlows[t];
    if (c === 0) continue;
    npv += c / Math.pow(1 + qRate, t + 1);
  }
  return npv;
}

function normalizeWeights(arr: number[]): number[] {
  const out = new Array<number>(40).fill(0);
  for (let i = 0; i < 40; i++) {
    const v = Number(arr?.[i] ?? 0);
    out[i] = Number.isFinite(v) && v > 0 ? v : 0;
  }
  return out;
}

function firstActiveQuarter(arr: number[]): number | null {
  for (let i = 0; i < 40; i++) {
    if (arr[i] > 1e-5) return i + 1;
  }
  return null;
}

function lastActiveQuarter(arr: number[]): number | null {
  for (let i = 39; i >= 0; i--) {
    if (arr[i] > 1e-5) return i + 1;
  }
  return null;
}

function milestoneQuarter(arr: number[], targetCum: number): number | null {
  let cum = 0;
  for (let i = 0; i < 40; i++) {
    cum += arr[i];
    if (cum + 1e-5 >= targetCum) return i + 1;
  }
  return null;
}

export function runFinancialModel(inp: ModelInputs, includeSensitivity = true): CalculationResult {
  // =========================================================================
  // 1. LAND & URBAN PLANNING
  // =========================================================================
  const highLand = Math.max(0, Number(inp.highrise_land_area) || 0);
  const lsLand = Math.max(0, Number(inp.lowrise_shop_land) || 0);
  const thLand = Math.max(0, Number(inp.townhouse_land) || 0);
  const vlLand = Math.max(0, Number(inp.villa_land) || 0);
  const rgLand = Math.max(0, Number(inp.lowrise_road_green) || 0);
  const nonconfLand = Math.max(0, Number(inp.nonconforming_area) || 0);

  const lowProductLand = lsLand + thLand + vlLand;
  const lowZone = lowProductLand + rgLand;
  const totalLand = highLand + lowZone + nonconfLand;

  // High-rise design (100% unlocked parameters)
  const highActive = highLand > 0;
  const shopFar = highActive ? Math.max(0, Number(inp.shop_far) || 0) : 0;
  const techRatio = Math.max(0, Number(inp.technical_floor_ratio) || 0);
  const shopEff = Math.min(1, Math.max(0.05, Number(inp.shop_efficiency) || 0.7));
  const resEff = Math.min(1, Math.max(0.05, Number(inp.res_efficiency) || 0.75));
  const baseBcr = Math.min(1, Math.max(0, Number(inp.basement_bcr) || 0));
  const podiumBcr = Math.min(1, Math.max(0.05, Number(inp.podium_bcr) || 0.5));
  const towerBcr = Math.min(1, Math.max(0.05, Number(inp.tower_bcr) || 0.35));
  const basementLevels = highActive ? Math.max(0, Math.round(Number(inp.basement_floors) || 0)) : 0;
  const refugeStoreys = highActive ? Math.max(0, Math.round(Number(inp.refuge_floors) || 0)) : 0;
  const baseParkEff = Math.min(1, Math.max(0.1, Number(inp.basement_parking_eff) || 0.75));
  const floatParkEff = Math.min(1, Math.max(0.1, Number(inp.floating_parking_eff) || 0.65));

  const commGfa = highActive ? highLand * shopFar : 0;
  const sqmPerPerson = Math.max(1, Number(inp.sqm_per_person) || 32);

  let aptNsa = 0;
  let aptGfa = 0;
  let techArea = 0;
  let highPop = 0;

  if (highActive) {
    if (inp.design_method === 'population') {
      highPop = Math.max(0, Number(inp.population_input) || 0);
      aptNsa = highPop * sqmPerPerson;
      const grossResSlab = aptNsa / resEff;
      aptGfa = grossResSlab / (1 + techRatio);
      techArea = grossResSlab - aptGfa;
    } else {
      const resFarIn = Math.max(0, Number(inp.res_far_input) || 0);
      aptGfa = highLand * resFarIn;
      techArea = aptGfa * techRatio;
      aptNsa = (aptGfa + techArea) * resEff;
      highPop = aptNsa / sqmPerPerson;
    }
  }

  const highGfa = commGfa + aptGfa;
  const highFar = highActive && highLand > 0 ? highGfa / highLand : 0;
  const resRatio = highActive && highLand > 0 ? aptGfa / highLand : 0;

  const podiumFootprint = highLand * podiumBcr;
  const towerFootprint = highLand * towerBcr;
  const basementArea = highActive ? basementLevels * highLand * baseBcr : 0;

  // Parking requirement: 20 m² per 100 m² NSA/GFA (QCVN 04 standard)
  const requiredNetParking = highActive ? (aptNsa + commGfa) * 0.2 : 0;
  const basementNetParking = basementArea * baseParkEff;
  const remainingNetParking = Math.max(0, requiredNetParking - basementNetParking);
  const floatingParkingGross = highActive ? remainingNetParking / floatParkEff : 0;
  const refugeArea = highActive ? refugeStoreys * towerFootprint : 0;
  // Shared ground lobby / MEP core exempt from FAR when podium exists
  const groundCoreExempt = highActive && highGfa > 0 ? towerFootprint * 0.2 : 0;

  const exemptGfa = basementArea + floatingParkingGross + techArea + refugeArea + groundCoreExempt;
  const cfaHigh = highGfa + exemptGfa;
  const parkingTotalArea = basementArea + floatingParkingGross;

  const commStoreys = highActive && commGfa > 0 && podiumFootprint > 0 ? Math.max(1, Math.ceil(commGfa / podiumFootprint)) : 0;
  const parkingStoreys =
    highActive && floatingParkingGross > 0 && podiumFootprint > 0
      ? Math.max(1, Math.round(floatingParkingGross / podiumFootprint))
      : 0;
  const resStoreys =
    highActive && aptGfa > 0 && towerFootprint > 0
      ? Math.max(1, Math.round((aptGfa + techArea) / towerFootprint))
      : 0;
  const totalStoreys = commStoreys + parkingStoreys + resStoreys + refugeStoreys;

  // Commercial NLA (net of tower core penetration through podium slab)
  const commCoreDeduction = commGfa > 0 ? Math.min(commGfa * 0.5, towerFootprint * 0.589) : 0;
  const commNla = highActive ? Math.max(0, (commGfa - commCoreDeduction) * shopEff) : 0;
  const totalHighNsa = commNla + aptNsa;
  const highEff = cfaHigh > 0 ? totalHighNsa / cfaHigh : 0;

  const avgShopHigh = Math.max(1, Number(inp.avg_shop_size_highrise) || 110);
  const avgAptSize = Math.max(1, Number(inp.avg_apartment_size) || 61.11);
  const shopUnits = commNla > 0 ? commNla / avgShopHigh : 0;
  const aptUnits = aptNsa > 0 ? aptNsa / avgAptSize : 0;
  const totalHighUnits = shopUnits + aptUnits;
  const commercialShare = highGfa > 0 ? commGfa / highGfa : 0;

  // Low-rise design
  const lowActive = lowProductLand > 0;
  const lsBcr = Math.min(1, Math.max(0, Number(inp.lowrise_shop_bcr) || 0));
  const thBcr = Math.min(1, Math.max(0, Number(inp.townhouse_bcr) || 0));
  const vlBcr = Math.min(1, Math.max(0, Number(inp.villa_bcr) || 0));
  const lsFloors = Math.max(0, Number(inp.lowrise_shop_floors) || 0);
  const thFloors = Math.max(0, Number(inp.townhouse_floors) || 0);
  const vlFloors = Math.max(0, Number(inp.villa_floors) || 0);

  const lsGfa = lsLand * lsBcr * lsFloors;
  const thGfa = thLand * thBcr * thFloors;
  const vlGfa = vlLand * vlBcr * vlFloors;
  const lowTotalGfa = lsGfa + thGfa + vlGfa;

  const avgLsLot = Math.max(1, Number(inp.avg_shop_lot) || 100);
  const avgThLot = Math.max(1, Number(inp.avg_townhouse_lot) || 90);
  const avgVlLot = Math.max(1, Number(inp.avg_villa_lot) || 226.71);

  const lsUnits = lsLand > 0 ? lsLand / avgLsLot : 0;
  const thUnits = thLand > 0 ? thLand / avgThLot : 0;
  const vlUnits = vlLand > 0 ? vlLand / avgVlLot : 0;
  const lowTotalUnits = lsUnits + thUnits + vlUnits;
  const lowPop = lowTotalUnits * 4;
  const lowBcrOverall =
    lowProductLand > 0 ? (lsLand * lsBcr + thLand * thBcr + vlLand * vlBcr) / lowProductLand : 0;

  // =========================================================================
  // 2. DEVELOPMENT COST (triệu đồng)
  // =========================================================================
  const landTransferRate = Math.max(0, Number(inp.land_transfer_unit_price) || 0);
  const landTransfer = totalLand * landTransferRate;
  const bookValue =
    inp.asset_book_value !== null && inp.asset_book_value !== undefined && Number.isFinite(Number(inp.asset_book_value))
      ? Math.max(0, Number(inp.asset_book_value))
      : landTransfer;
  const goodwill = landTransfer - bookValue;
  const luf = Math.max(0, Number(inp.land_use_fee) || 0);
  const totalLandCost = landTransfer + luf;

  const infraRate = Math.max(0, Number(inp.infrastructure_unit_rate) || 0);
  const highBuildRate = Math.max(0, Number(inp.highrise_build_cost_rate) || 0);
  const lsBuildRate = Math.max(0, Number(inp.lowrise_shop_build_cost_rate) || 0);
  const thBuildRate = Math.max(0, Number(inp.townhouse_build_cost_rate) || 0);
  const vlBuildRate = Math.max(0, Number(inp.villa_build_cost_rate) || 0);

  const infraCost = totalLand * infraRate;
  const highConstr = cfaHigh * highBuildRate;
  const psShareOfHigh = highGfa > 0 ? commGfa / highGfa : 0;
  const psConstr = highConstr * psShareOfHigh;
  const apConstr = highConstr - psConstr;

  const lsConstr = lsGfa * lsBuildRate;
  const thConstr = thGfa * thBuildRate;
  const vlConstr = vlGfa * vlBuildRate;
  const lowConstr = lsConstr + thConstr + vlConstr;
  const totalConstruction = infraCost + highConstr + lowConstr;

  const designRate = Math.max(0, Number(inp.design_consultant_rate) || 0);
  const pmRate = Math.max(0, Number(inp.project_management_rate) || 0);
  const contRate = Math.max(0, Number(inp.construction_contingency_rate) || 0);

  const designCost = totalConstruction * designRate;
  const pmCost = totalConstruction * pmRate;
  const consultCost = designCost + pmCost;
  const contingency = totalConstruction * contRate;
  const legalCost = Math.max(0, Number(inp.legal_cost) || 0);
  const galleryCost = Math.max(0, Number(inp.sales_gallery_cost) || 0);

  // =========================================================================
  // 3. SALES REVENUE WITH QUARTERLY ESCALATION ACROSS 40 QUARTERS
  // =========================================================================
  const lsLandComp = Math.max(0, Number(inp.lowrise_shop_land_price_component) || 0);
  const thLandComp = Math.max(0, Number(inp.townhouse_land_price_component) || 0);
  const vlLandComp = Math.max(0, Number(inp.villa_land_price_component) || 0);
  const psBase = Math.max(0, Number(inp.podium_shop_base_selling_price) || 0);
  const apBase = Math.max(0, Number(inp.apartment_base_selling_price) || 0);
  const escalation = Math.max(0, Number(inp.selling_price_escalation) || 0);

  const lsBuildPerLotM2 = lsLand > 0 ? (lsGfa / lsLand) * lsBuildRate : 0;
  const thBuildPerLotM2 = thLand > 0 ? (thGfa / thLand) * thBuildRate : 0;
  const vlBuildPerLotM2 = vlLand > 0 ? (vlGfa / vlLand) * vlBuildRate : 0;

  const basePrices: Record<ProductCode, number> = {
    ls: lsLandComp + lsBuildPerLotM2 * 1.3,
    th: thLandComp + thBuildPerLotM2 * 1.3,
    vl: vlLandComp + vlBuildPerLotM2 * 1.3,
    ps: psBase,
    ap: apBase,
  };

  const productAreas: Record<ProductCode, number> = {
    ls: lsLand,
    th: thLand,
    vl: vlLand,
    ps: commNla,
    ap: aptNsa,
  };

  const productUnits: Record<ProductCode, number> = {
    ls: lsUnits,
    th: thUnits,
    vl: vlUnits,
    ps: shopUnits,
    ap: aptUnits,
  };

  const contractedByProd: Record<ProductCode, number> = { ls: 0, th: 0, vl: 0, ps: 0, ap: 0 };
  const avgPriceByProd: Record<ProductCode, number> = { ls: 0, th: 0, vl: 0, ps: 0, ap: 0 };
  const contractedSalesQ = new Array<number>(40).fill(0);

  for (const p of PRODUCTS) {
    const area = productAreas[p];
    const bPrice = basePrices[p];
    if (area <= 0 || bPrice <= 0) {
      contractedByProd[p] = 0;
      avgPriceByProd[p] = bPrice;
      continue;
    }
    const salesSched = normalizeWeights(inp.timeline.sales[p]);
    const schedSum = sum(salesSched);
    if (schedSum <= 1e-6) {
      // If schedule not filled yet, still compute baseline contracted revenue
      contractedByProd[p] = area * bPrice;
      avgPriceByProd[p] = bPrice;
    } else {
      let activeCount = 0;
      let prodRev = 0;
      for (let q = 0; q < 40; q++) {
        const w = salesSched[q] / schedSum;
        if (w > 1e-6) {
          const escStep = Math.floor(activeCount / 4);
          const qPrice = bPrice * Math.pow(1 + escalation, escStep);
          const qRev = area * w * qPrice;
          prodRev += qRev;
          contractedSalesQ[q] += qRev;
          activeCount++;
        }
      }
      contractedByProd[p] = prodRev;
      avgPriceByProd[p] = prodRev / area;
    }
  }

  const totalRevenue = sum(PRODUCTS.map((p) => contractedByProd[p]));
  const salesItems: ProductSalesItem[] = PRODUCTS.map((p) => ({
    p,
    active: productAreas[p] > 0,
    units: productUnits[p],
    area: productAreas[p],
    basePrice: basePrices[p],
    avgPrice: avgPriceByProd[p],
    contracted: contractedByProd[p],
    share: totalRevenue > 0 ? contractedByProd[p] / totalRevenue : 0,
  }));

  const commRate = Math.max(0, Number(inp.sales_commission_rate) || 0);
  const mktRate = Math.max(0, Number(inp.marketing_rate) || 0);
  const gaRate = Math.max(0, Number(inp.ga_rate) || 0);

  const commission = totalRevenue * commRate;
  const marketing = totalRevenue * mktRate;
  const gaCost = totalRevenue * gaRate;
  const totalOpex = legalCost + galleryCost + commission + marketing + gaCost;

  const vatRate = Math.max(0, Number(inp.vat_rate) || 0.1);
  const citRate = Math.max(0, Number(inp.cit_rate) || 0.2);

  const totalExVat = totalLandCost + totalConstruction + contingency + consultCost + totalOpex;
  const inputVatTotal =
    (totalConstruction + contingency + consultCost + commission + marketing + galleryCost) * vatRate;
  const cashRequirement = totalExVat + inputVatTotal;

  // =========================================================================
  // 4. TRUE 40-QUARTER TIMELINE DISTRIBUTIONS (Q1..Q40)
  // =========================================================================
  const tlLand = normalizeWeights(inp.timeline.land);
  const tlLuf = normalizeWeights(inp.timeline.luf);
  const tlDesignLegal = normalizeWeights(inp.timeline.design_legal);
  const tlGallery = normalizeWeights(inp.timeline.gallery);
  const tlInfra = normalizeWeights(inp.timeline.infra);

  const distributeCost = (amount: number, weights: number[], fallbackQuarter = 0): number[] => {
    const out = new Array<number>(40).fill(0);
    if (amount <= 0) return out;
    const wSum = sum(weights);
    if (wSum > 1e-6) {
      for (let q = 0; q < 40; q++) out[q] = -amount * (weights[q] / wSum);
    } else {
      out[fallbackQuarter] = -amount;
    }
    return out;
  };

  const landTransferQ = distributeCost(landTransfer, tlLand, 2);
  const lufQ = distributeCost(luf, tlLuf, 8);
  const landAcqQ = landTransferQ.map((v, q) => v + lufQ[q]);

  const infraQ = distributeCost(infraCost, tlInfra, 8);
  const constrByProdCosts: Record<ProductCode, number> = {
    ls: lsConstr,
    th: thConstr,
    vl: vlConstr,
    ps: psConstr,
    ap: apConstr,
  };

  const constrProdQ: Record<ProductCode, number[]> = {
    ls: distributeCost(lsConstr, normalizeWeights(inp.timeline.construction.ls), 9),
    th: distributeCost(thConstr, normalizeWeights(inp.timeline.construction.th), 9),
    vl: distributeCost(vlConstr, normalizeWeights(inp.timeline.construction.vl), 9),
    ps: distributeCost(psConstr, normalizeWeights(inp.timeline.construction.ps), 8),
    ap: distributeCost(apConstr, normalizeWeights(inp.timeline.construction.ap), 8),
  };

  const constructionBuildingsQ = new Array<number>(40).fill(0);
  const totalBuildActivityQ = new Array<number>(40).fill(0);
  for (let q = 0; q < 40; q++) {
    constructionBuildingsQ[q] =
      constrProdQ.ls[q] + constrProdQ.th[q] + constrProdQ.vl[q] + constrProdQ.ps[q] + constrProdQ.ap[q];
    totalBuildActivityQ[q] = Math.abs(infraQ[q] + constructionBuildingsQ[q]);
  }

  const designQ = distributeCost(designCost, tlDesignLegal, 2);
  const legalQ = distributeCost(legalCost, tlDesignLegal, 2);
  const pmQ = distributeCost(pmCost, totalBuildActivityQ, 8);
  const contQ = distributeCost(contingency, totalBuildActivityQ, 8);
  const consultQ = designQ.map((v, q) => v + pmQ[q]);
  const devQ = infraQ.map((v, q) => v + constructionBuildingsQ[q] + consultQ[q] + contQ[q]);

  const galleryQ = distributeCost(galleryCost, tlGallery, 6);

  // Quarterly cash collection from customers across 40 quarters
  const revQ = new Array<number>(40).fill(0);
  for (const p of PRODUCTS) {
    const cRev = contractedByProd[p];
    if (cRev <= 0) continue;
    const collW = normalizeWeights(inp.timeline.collection[p]);
    const collSum = sum(collW);
    if (collSum > 1e-6) {
      for (let q = 0; q < 40; q++) {
        revQ[q] += cRev * (collW[q] / collSum);
      }
    } else {
      revQ[12] += cRev;
    }
  }

  // Commission & Marketing follow contracted sales progress (or collections if sales schedule empty)
  const salesWeightQ = sum(contractedSalesQ) > 1e-6 ? contractedSalesQ : revQ;
  const commQ = distributeCost(commission, salesWeightQ, 10);
  const mktQ = distributeCost(marketing, salesWeightQ, 10);
  const sellingQ = galleryQ.map((v, q) => v + commQ[q] + mktQ[q]);

  // G&A spread equally across quarters with active development or land/design spend
  const activeDevMask = new Array<number>(40).fill(0);
  for (let q = 0; q < 40; q++) {
    if (Math.abs(landAcqQ[q]) + Math.abs(devQ[q]) + Math.abs(legalQ[q]) > 1e-3) {
      activeDevMask[q] = 1;
    }
  }
  const gaQ = distributeCost(gaCost, activeDevMask, 4);
  const opexQ = legalQ.map((v, q) => v + sellingQ[q] + gaQ[q]);

  // Output VAT & Input VAT credit offset across 40 quarters
  const vatTaxableRatio = totalRevenue > 0 ? Math.max(0, (totalRevenue - totalLandCost) / totalRevenue) : 0;
  const outVatQ = revQ.map((r) => r * vatTaxableRatio * vatRate);
  const inVatQ = new Array<number>(40).fill(0);
  const vatPaidQ = new Array<number>(40).fill(0);

  let vatCreditPool = 0;
  for (let q = 0; q < 40; q++) {
    const vatableSpend =
      Math.abs(devQ[q]) + Math.abs(commQ[q]) + Math.abs(mktQ[q]) + Math.abs(galleryQ[q]);
    const inVatThisQ = vatableSpend * vatRate;
    inVatQ[q] = -inVatThisQ;
    vatCreditPool += inVatThisQ;

    const outVatThisQ = outVatQ[q];
    if (outVatThisQ >= vatCreditPool) {
      vatPaidQ[q] = -(outVatThisQ - vatCreditPool);
      vatCreditPool = 0;
    } else {
      vatCreditPool -= outVatThisQ;
      vatPaidQ[q] = 0;
    }
  }
  const unrecoveredVat = vatCreditPool > 5; // > 5 triệu đồng unrecovered at Q40

  // =========================================================================
  // 5. TWO-PASS DEBT, INTEREST, CIT, EQUITY & DIVIDEND SIMULATION (Q1..Q40)
  // =========================================================================
  const cogs = totalLandCost + totalConstruction + contingency + consultCost;
  const gp = totalRevenue - cogs;
  const ebit = gp - totalOpex;

  const landLoanRatio = Math.min(0.95, Math.max(0, Number(inp.land_loan_ratio) || 0));
  const constrLoanRatio = Math.min(0.95, Math.max(0, Number(inp.constr_loan_ratio) || 0.55));
  const annualInterest = Math.max(0, Number(inp.annual_loan_interest_rate) || 0);
  const qInterestRate = annualInterest / 4;

  let ldrawQ = new Array<number>(40).fill(0);
  let cdrawQ = new Array<number>(40).fill(0);
  let loanQ = new Array<number>(40).fill(0);
  let interestQ = new Array<number>(40).fill(0);
  let principalQ = new Array<number>(40).fill(0);
  let citQ = new Array<number>(40).fill(0);
  let taxesQ = new Array<number>(40).fill(0);
  let equityQ = new Array<number>(40).fill(0);
  let distQ = new Array<number>(40).fill(0);
  let openQ = new Array<number>(40).fill(0);
  let endQ = new Array<number>(40).fill(0);

  let estTotalInterest =
    landTransfer * landLoanRatio * annualInterest * 1.4 +
    (totalConstruction + contingency) * constrLoanRatio * annualInterest * 0.75;

  // Determine last active project quarter so dividends settle cleanly
  let lastProjectQ = 0;
  for (let q = 0; q < 40; q++) {
    if (revQ[q] > 1e-3 || Math.abs(landAcqQ[q] + devQ[q] + opexQ[q]) > 1e-3) {
      lastProjectQ = q;
    }
  }

  for (let pass = 0; pass < 3; pass++) {
    const pbtPass = ebit - estTotalInterest;
    const totalCitPass = pbtPass > 0 ? pbtPass * citRate : 0;

    // Distribute CIT across collection quarters (provisional 1% on pre-sales + settlement on main handover/collection quarters)
    citQ = distributeCost(totalCitPass, revQ, Math.min(39, lastProjectQ));
    taxesQ = inVatQ.map((v, q) => v + vatPaidQ[q] + citQ[q]);

    ldrawQ = new Array<number>(40).fill(0);
    cdrawQ = new Array<number>(40).fill(0);
    loanQ = new Array<number>(40).fill(0);
    interestQ = new Array<number>(40).fill(0);
    principalQ = new Array<number>(40).fill(0);
    equityQ = new Array<number>(40).fill(0);
    distQ = new Array<number>(40).fill(0);
    openQ = new Array<number>(40).fill(0);
    endQ = new Array<number>(40).fill(0);

    // Precompute future remaining outflows at each quarter so dividends never starve upcoming costs
    const baseNonDebtFlow = new Array<number>(40).fill(0);
    for (let q = 0; q < 40; q++) {
      baseNonDebtFlow[q] =
        revQ[q] + outVatQ[q] + landAcqQ[q] + devQ[q] + opexQ[q] + taxesQ[q];
    }

    let debtBalance = 0;
    let cashBalance = 0;

    for (let q = 0; q < 40; q++) {
      openQ[q] = cashBalance;

      // Potential drawdowns based on eligible land & construction spend
      const landDraw = Math.abs(landTransferQ[q]) * landLoanRatio;
      const eligibleBuild = Math.abs(infraQ[q] + constructionBuildingsQ[q] + contQ[q]);
      // Only draw construction loan if operating cash before draw is insufficient
      const preDrawCash = cashBalance + baseNonDebtFlow[q] + landDraw - debtBalance * qInterestRate;
      const maxConstrDraw = eligibleBuild * constrLoanRatio;
      const constrDraw = preDrawCash < 0 ? Math.min(maxConstrDraw, -preDrawCash) : maxConstrDraw * 0.35;

      ldrawQ[q] = landDraw;
      cdrawQ[q] = revQ[q] > eligibleBuild * 1.5 && preDrawCash > 0 ? 0 : constrDraw;
      loanQ[q] = ldrawQ[q] + cdrawQ[q];

      // Interest on average debt balance during the quarter
      const qInt = (debtBalance + loanQ[q] * 0.5) * qInterestRate;
      interestQ[q] = -qInt;
      debtBalance += loanQ[q];

      let cashAfterOpsAndInt = cashBalance + baseNonDebtFlow[q] + loanQ[q] + interestQ[q];

      // Repay debt principal whenever surplus cash is available
      if (cashAfterOpsAndInt > 0 && debtBalance > 0) {
        const repay = Math.min(debtBalance, cashAfterOpsAndInt);
        principalQ[q] = -repay;
        debtBalance -= repay;
        cashAfterOpsAndInt -= repay;
      }

      // If deficit remains, inject shareholder equity
      if (cashAfterOpsAndInt < 0) {
        equityQ[q] = -cashAfterOpsAndInt;
        cashAfterOpsAndInt = 0;
      }

      // Compute worst-case future cumulative cash deficit so we retain a safe reserve before paying dividends
      let futureReserveNeeded = 0;
      let runningFuture = 0;
      for (let fq = 39; fq > q; fq--) {
        runningFuture = Math.min(0, baseNonDebtFlow[fq] + runningFuture);
      }
      futureReserveNeeded = Math.abs(runningFuture) + debtBalance * 0.1;

      if (debtBalance <= 1e-4 && cashAfterOpsAndInt > futureReserveNeeded && q >= Math.max(1, lastProjectQ - 6)) {
        const distributable = q >= lastProjectQ ? cashAfterOpsAndInt : cashAfterOpsAndInt - futureReserveNeeded;
        if (distributable > 0) {
          distQ[q] = -distributable;
          cashAfterOpsAndInt -= distributable;
        }
      }

      cashBalance = cashAfterOpsAndInt;
      endQ[q] = cashBalance;
    }

    // Sweep any residual cash at the final active quarter if debt is 0
    if (cashBalance > 1e-3 && debtBalance <= 1e-3) {
      const settleQ = Math.min(39, Math.max(lastProjectQ, 0));
      distQ[settleQ] -= cashBalance;
      for (let q = settleQ; q < 40; q++) {
        if (q > settleQ) openQ[q] -= cashBalance;
        endQ[q] -= cashBalance;
      }
    }

    estTotalInterest = Math.abs(sum(interestQ));
  }

  const totalInterest = Math.abs(sum(interestQ));
  const pbt = ebit - totalInterest;
  const cit = pbt > 0 ? pbt * citRate : 0;
  const pat = pbt - cit;

  const finInQ = loanQ.map((v, q) => v + equityQ[q]);
  const inflowQ = revQ.map((v, q) => v + outVatQ[q] + finInQ[q]);
  const finOutQ = interestQ.map((v, q) => v + principalQ[q] + distQ[q]);
  const outflowQ = landAcqQ.map((v, q) => v + devQ[q] + opexQ[q] + taxesQ[q] + finOutQ[q]);
  const netQ = inflowQ.map((v, q) => v + outflowQ[q]);

  const shEquityQ = equityQ.map((v) => -v);
  const shDivQ = distQ.map((v) => -v);
  const fcfeQ = shEquityQ.map((v, q) => v + shDivQ[q]);

  const cumFcfeQ = new Array<number>(40).fill(0);
  let runningCumFcfe = 0;
  for (let q = 0; q < 40; q++) {
    runningCumFcfe += fcfeQ[q];
    cumFcfeQ[q] = runningCumFcfe;
  }

  // =========================================================================
  // 6. FINANCIAL METRICS (IRR, NPV, PAYBACK, ROE, MARGIN)
  // =========================================================================
  const discountRate = Math.max(0, Number(inp.equity_discount_rate) || 0.1);
  const qIrr = calculatePeriodicIrr(fcfeQ);
  const annualIrr = qIrr !== null ? Math.pow(1 + qIrr, 4) - 1 : 0;
  const npv = calculateNpvFromQuarterly(discountRate, fcfeQ);

  // Payback period on FCFE
  let paybackQuarter: number | null = null;
  let paybackYears: number | null = null;
  let sawOutflow = false;
  for (let q = 0; q < 40; q++) {
    if (cumFcfeQ[q] < -1) sawOutflow = true;
    if (sawOutflow && cumFcfeQ[q] >= 0) {
      paybackQuarter = q + 1;
      const prevCum = q > 0 ? cumFcfeQ[q - 1] : 0;
      const frac = fcfeQ[q] > 0 ? Math.abs(prevCum) / fcfeQ[q] : 1;
      paybackYears = (q + frac) / 4;
      break;
    }
  }

  const requiredEquity = sum(equityQ);
  const landLoanTotal = sum(ldrawQ);
  const constrLoanTotal = sum(cdrawQ);
  const totalLoan = landLoanTotal + constrLoanTotal;
  const distribution = Math.abs(sum(distQ));
  const collectionsUsed = Math.max(0, cashRequirement + totalInterest - requiredEquity - totalLoan);

  const roe = requiredEquity > 0 ? pat / requiredEquity : 0;
  const patMargin = totalRevenue > 0 ? pat / totalRevenue : 0;
  const gpMargin = totalRevenue > 0 ? gp / totalRevenue : 0;
  const ebitMargin = totalRevenue > 0 ? ebit / totalRevenue : 0;

  let firstAnyQ = 40;
  let lastAnyQ = 0;
  for (let q = 0; q < 40; q++) {
    if (Math.abs(inflowQ[q]) + Math.abs(outflowQ[q]) > 1) {
      if (q < firstAnyQ) firstAnyQ = q;
      if (q > lastAnyQ) lastAnyQ = q;
    }
  }
  const durationYears = lastAnyQ >= firstAnyQ ? (lastAnyQ - firstAnyQ + 1) / 4 : 0;

  const totalNSA = lowProductLand + totalHighNsa;
  const totalUnits = lowTotalUnits + totalHighUnits;
  const avgPrice = totalNSA > 0 ? totalRevenue / totalNSA : 0;

  let unitCostMode: 'mixed' | 'highrise' | 'lowrise' | 'none' = 'none';
  if (highActive && lowActive) unitCostMode = 'mixed';
  else if (highActive) unitCostMode = 'highrise';
  else if (lowActive) unitCostMode = 'lowrise';

  const totalCostExCit = totalExVat + totalInterest;
  const unitCostPerM2 = totalNSA > 0 ? totalCostExCit / totalNSA : 0;
  const unitCostPerUnit = totalUnits > 0 ? totalCostExCit / totalUnits : 0;

  const cf: CashFlowStatement = {
    inflow: makeFlowRow(inflowQ),
    revenue: makeFlowRow(revQ),
    outVat: makeFlowRow(outVatQ),
    finIn: makeFlowRow(finInQ),
    ldraw: makeFlowRow(ldrawQ),
    cdraw: makeFlowRow(cdrawQ),
    loan: makeFlowRow(loanQ),
    equity: makeFlowRow(equityQ),

    outflow: makeFlowRow(outflowQ),
    landAcq: makeFlowRow(landAcqQ),
    landTransfer: makeFlowRow(landTransferQ),
    luf: makeFlowRow(lufQ),
    dev: makeFlowRow(devQ),
    infra: makeFlowRow(infraQ),
    constrLs: makeFlowRow(constrProdQ.ls),
    constrTh: makeFlowRow(constrProdQ.th),
    constrVl: makeFlowRow(constrProdQ.vl),
    constrPs: makeFlowRow(constrProdQ.ps),
    constrAp: makeFlowRow(constrProdQ.ap),
    construction: makeFlowRow(constructionBuildingsQ),
    design: makeFlowRow(designQ),
    pm: makeFlowRow(pmQ),
    consult: makeFlowRow(consultQ),
    cont: makeFlowRow(contQ),
    opex: makeFlowRow(opexQ),
    legal: makeFlowRow(legalQ),
    comm: makeFlowRow(commQ),
    mkt: makeFlowRow(mktQ),
    gallery: makeFlowRow(galleryQ),
    selling: makeFlowRow(sellingQ),
    ga: makeFlowRow(gaQ),
    taxes: makeFlowRow(taxesQ),
    inVat: makeFlowRow(inVatQ),
    vatPaid: makeFlowRow(vatPaidQ),
    cit: makeFlowRow(citQ),
    finOut: makeFlowRow(finOutQ),
    interest: makeFlowRow(interestQ),
    principal: makeFlowRow(principalQ),
    dist: makeFlowRow(distQ),

    net: makeFlowRow(netQ),
    open: makeFlowRow(openQ, 'open'),
    end: makeFlowRow(endQ, 'end'),

    shareholder: makeFlowRow(fcfeQ),
    shEquity: makeFlowRow(shEquityQ),
    shDiv: makeFlowRow(shDivQ),
    fcfe: makeFlowRow(fcfeQ),
    cumFcfe: makeFlowRow(cumFcfeQ, 'cum'),
  };

  // =========================================================================
  // 7. TIMELINE AUDIT & DOMAIN CHECKS
  // =========================================================================
  const profileCheck = (arr: number[], activeCost: number) => {
    const s = sum(arr);
    const ok = activeCost <= 0 || Math.abs(s - 1) <= 0.005;
    return {
      sum: s,
      ok,
      firstQ: firstActiveQuarter(arr),
      lastQ: lastActiveQuarter(arr),
    };
  };

  const profilesAudit = {
    land: profileCheck(tlLand, landTransfer),
    luf: profileCheck(tlLuf, luf),
    design_legal: profileCheck(tlDesignLegal, designCost + legalCost),
    gallery: profileCheck(tlGallery, galleryCost),
    infra: profileCheck(tlInfra, infraCost),
  };

  const productAudits: ProductTimelineAudit[] = PRODUCTS.map((p) => {
    const active = productAreas[p] > 0;
    const cArr = normalizeWeights(inp.timeline.construction[p]);
    const sArr = normalizeWeights(inp.timeline.sales[p]);
    const colArr = normalizeWeights(inp.timeline.collection[p]);

    const constrSum = sum(cArr);
    const salesSum = sum(sArr);
    const collSum = sum(colArr);

    if (!active) {
      return {
        p,
        active: false,
        constrStart: null,
        handover: null,
        salesStart: null,
        collStart: null,
        coll95: null,
        finalColl: null,
        constrSum,
        salesSum,
        collSum,
        salesCollStatus: 'NA',
        basementSalesStatus: 'NA',
        handover95Status: 'NA',
      };
    }

    const constrStart = firstActiveQuarter(cArr);
    const handover = milestoneQuarter(cArr, 0.995);
    const salesStart = firstActiveQuarter(sArr);
    const collStart = firstActiveQuarter(colArr);
    const coll95 = milestoneQuarter(colArr, 0.949);
    const finalColl = lastActiveQuarter(colArr);

    let salesCollStatus: ProductTimelineAudit['salesCollStatus'] = 'OK';
    if (!salesStart || !collStart) salesCollStatus = 'INCOMPLETE';
    else if (salesStart !== collStart) salesCollStatus = 'WARNING';

    let basementSalesStatus: ProductTimelineAudit['basementSalesStatus'] = 'NA';
    if (p === 'ps' || p === 'ap') {
      if (basementLevels > 0 && constrStart && salesStart) {
        basementSalesStatus = salesStart > constrStart ? 'OK' : 'WARNING';
      } else {
        basementSalesStatus = 'OK';
      }
    }

    let handover95Status: ProductTimelineAudit['handover95Status'] = 'OK';
    if (!handover || Math.abs(collSum - 1) > 0.01) {
      handover95Status = coll95 === null ? 'ERROR' : 'INCOMPLETE';
    } else if (!coll95) {
      handover95Status = 'ERROR';
    } else if (coll95 !== handover) {
      handover95Status = 'WARNING';
    }

    return {
      p,
      active,
      constrStart,
      handover,
      salesStart,
      collStart,
      coll95,
      finalColl,
      constrSum,
      salesSum,
      collSum,
      salesCollStatus,
      basementSalesStatus,
      handover95Status,
    };
  });

  const checks: ModelCheckItem[] = [];

  // Design check 1: Tower BCR <= Podium BCR
  if (highActive) {
    const okBcr = towerBcr <= podiumBcr + 1e-6;
    checks.push({
      id: 'D-01',
      category: 'design',
      status: okBcr ? 'OK' : 'ERROR',
      titleVi: 'Mật độ xây dựng khối tháp & khối đế',
      titleEn: 'Tower vs. Podium construction ratio',
      detailVi: okBcr
        ? `Khối tháp ${(towerBcr * 100).toFixed(0)}% ≤ Khối đế ${(podiumBcr * 100).toFixed(0)}%`
        : 'Mật độ xây dựng khối tháp không được vượt quá mật độ khối đế.',
      detailEn: okBcr
        ? `Tower ${(towerBcr * 100).toFixed(0)}% ≤ Podium ${(podiumBcr * 100).toFixed(0)}%`
        : 'Tower construction ratio cannot exceed podium construction ratio.',
      targetTab: 'assumptions',
    });

    // Design check 2: Commercial share 0%..30%
    const okCommShare = commercialShare >= 0 && commercialShare <= 0.3001;
    checks.push({
      id: 'D-02',
      category: 'design',
      status: okCommShare ? 'OK' : 'WARNING',
      titleVi: 'Tỷ trọng sàn TMDV khu cao tầng',
      titleEn: 'High-rise commercial GFA ratio',
      detailVi: okCommShare
        ? `Tỷ trọng TMDV đạt ${(commercialShare * 100).toFixed(1)}% GFA (trong ngưỡng 0–30%)`
        : `Tỷ trọng TMDV ${(commercialShare * 100).toFixed(1)}% vượt ngưỡng khuyến nghị 30% GFA.`,
      detailEn: okCommShare
        ? `Commercial share ${(commercialShare * 100).toFixed(1)}% of GFA (within 0–30%)`
        : `Commercial share ${(commercialShare * 100).toFixed(1)}% exceeds 30% benchmark.`,
      targetTab: 'assumptions',
    });

    // Design check 3: Refuge floors for tall towers
    let refugeStatus: 'OK' | 'WARNING' = 'OK';
    let refugeMsgVi = `Chiều cao ${totalStoreys} tầng nổi, bố trí ${refugeStoreys} tầng lánh nạn phù hợp.`;
    let refugeMsgEn = `${totalStoreys} above-ground storeys with ${refugeStoreys} refuge floor(s).`;
    if (totalStoreys >= 41 && refugeStoreys < 2) {
      refugeStatus = 'WARNING';
      refugeMsgVi = `Công trình ${totalStoreys} tầng nên bố trí ít nhất 2 tầng lánh nạn theo QCVN 06.`;
      refugeMsgEn = `Tower of ${totalStoreys} storeys should include at least 2 refuge floors.`;
    } else if (totalStoreys >= 30 && refugeStoreys < 1) {
      refugeStatus = 'WARNING';
      refugeMsgVi = `Công trình ${totalStoreys} tầng (≥ 30 tầng) nên kiểm tra yêu cầu ít nhất 1 tầng lánh nạn.`;
      refugeMsgEn = `Tower of ${totalStoreys} storeys (≥ 30) may require at least 1 refuge floor.`;
    }
    checks.push({
      id: 'D-03',
      category: 'design',
      status: refugeStatus,
      titleVi: 'Quy chuẩn tầng lánh nạn PCCC (QCVN 06)',
      titleEn: 'Fire safety refuge floor check',
      detailVi: refugeMsgVi,
      detailEn: refugeMsgEn,
      targetTab: 'assumptions',
    });

    // Design check 4: Podium <= 5 storeys
    const podiumTotal = commStoreys + parkingStoreys;
    checks.push({
      id: 'D-04',
      category: 'design',
      status: podiumTotal <= 5 ? 'OK' : 'WARNING',
      titleVi: 'Chiều cao khối đế (TMDV + đỗ xe nổi)',
      titleEn: 'Podium height check (Commercial + Parking)',
      detailVi:
        podiumTotal <= 5
          ? `Khối đế ${podiumTotal} tầng (${commStoreys} TMDV + ${parkingStoreys} đỗ xe nổi) ≤ 5 tầng.`
          : `Khối đế ${podiumTotal} tầng vượt 5 tầng; cân nhắc bổ sung tầng hầm để giảm đỗ xe nổi.`,
      detailEn:
        podiumTotal <= 5
          ? `Podium height ${podiumTotal} storeys (${commStoreys} comm + ${parkingStoreys} parking) ≤ 5 storeys.`
          : `Podium height ${podiumTotal} storeys exceeds 5 storeys; consider adding basement levels.`,
      targetTab: 'assumptions',
    });
  }

  // Timeline check 5: Cost payment rows sum to 100%
  const badCostProfiles = Object.entries(profilesAudit).filter(([, v]) => !v.ok);
  checks.push({
    id: 'T-01',
    category: 'timeline',
    status: badCostProfiles.length === 0 ? 'OK' : 'WARNING',
    titleVi: 'Tổng tỷ trọng phân bổ chi phí 40 quý',
    titleEn: '40-quarter cost schedule completeness',
    detailVi:
      badCostProfiles.length === 0
        ? 'Tất cả dòng tiến độ thanh toán đất, TSDĐ, pháp lý và hạ tầng đạt 100%.'
        : `${badCostProfiles.length} dòng tiến độ chi phí chưa đạt đúng tổng 100% (hệ thống tự chuẩn hoá tỷ trọng).`,
    detailEn:
      badCostProfiles.length === 0
        ? 'All land, LUF, design/legal, gallery, and infrastructure schedules sum to 100%.'
        : `${badCostProfiles.length} cost schedule row(s) do not total 100% (auto-normalized in engine).`,
    targetTab: 'timeline',
  });

  // Timeline check 6: Product schedules & 95% handover rule
  const activeProdAudits = productAudits.filter((a) => a.active);
  const bad95 = activeProdAudits.filter((a) => a.handover95Status !== 'OK');
  checks.push({
    id: 'T-02',
    category: 'legal',
    status: bad95.some((a) => a.handover95Status === 'ERROR')
      ? 'ERROR'
      : bad95.length > 0
      ? 'WARNING'
      : 'OK',
    titleVi: 'Kiểm tra trần thu tiền 95% & thời điểm bàn giao',
    titleEn: 'Handover vs. 95% collection milestone (Law on RE Business)',
    detailVi:
      bad95.length === 0
        ? 'Tất cả sản phẩm đạt mốc thu lũy kế 95% khớp với quý hoàn thành bàn giao.'
        : 'Một số sản phẩm có mốc thu 95% lệch với quý bàn giao hoặc chưa đạt 95% trong 40 quý.',
    detailEn:
      bad95.length === 0
        ? 'All active products reach 95% cumulative collection aligned with construction completion.'
        : 'One or more products reach 95% collection before/after handover or do not reach 95%.',
    targetTab: 'timeline',
  });

  // Legal check 7: LUF paid on or before first sales launch
  const lufLastQ = profilesAudit.luf.lastQ;
  const earliestSalesQ = activeProdAudits.reduce<number | null>((acc, item) => {
    if (!item.salesStart) return acc;
    return acc === null ? item.salesStart : Math.min(acc, item.salesStart);
  }, null);
  const lufBeforeSalesOk =
    luf <= 0 || !lufLastQ || !earliestSalesQ || lufLastQ <= earliestSalesQ;
  checks.push({
    id: 'L-01',
    category: 'legal',
    status: lufBeforeSalesOk ? 'OK' : 'WARNING',
    titleVi: 'Thời điểm hoàn thành Tiền sử dụng đất so với Mở bán',
    titleEn: 'Land use fee completion prior to sales launch',
    detailVi: lufBeforeSalesOk
      ? `Nộp xong TSDĐ (Q${lufLastQ ?? '—'}) trước hoặc cùng thời điểm mở bán đầu tiên (Q${earliestSalesQ ?? '—'}).`
      : `Hoàn thành nộp TSDĐ (Q${lufLastQ}) muộn hơn quý mở bán đầu tiên (Q${earliestSalesQ}).`,
    detailEn: lufBeforeSalesOk
      ? `LUF settled (Q${lufLastQ ?? '—'}) on or before initial sales launch (Q${earliestSalesQ ?? '—'}).`
      : `LUF completion (Q${lufLastQ}) occurs after initial sales launch (Q${earliestSalesQ}).`,
    targetTab: 'timeline',
  });

  // Finance check 8: VAT recovery & Cash Balance
  checks.push({
    id: 'F-01',
    category: 'finance',
    status: unrecoveredVat ? 'WARNING' : 'OK',
    titleVi: 'Khấu trừ Thuế GTGT đầu vào trong 40 quý',
    titleEn: 'Input VAT credit recovery across 40 quarters',
    detailVi: unrecoveredVat
      ? `Còn ${Math.round(vatCreditPool).toLocaleString('vi-VN')} triệu đồng VAT đầu vào chưa khấu trừ hết ở Quý 40.`
      : 'Toàn bộ thuế GTGT đầu vào được khấu trừ hết qua thuế GTGT đầu ra.',
    detailEn: unrecoveredVat
      ? `VND ${Math.round(vatCreditPool).toLocaleString('en-US')}m of input VAT remains unrecovered at Q40.`
      : 'Input VAT is 100% recovered against output VAT within the 40-quarter horizon.',
    targetTab: 'cashflow',
  });

  const minCash = Math.min(...endQ);
  checks.push({
    id: 'F-02',
    category: 'finance',
    status: pat > 0 && minCash >= -0.5 ? 'OK' : pat <= 0 ? 'ERROR' : 'WARNING',
    titleVi: 'Cân đối dòng tiền 40 quý & Hiệu quả sinh lời',
    titleEn: '40-quarter cash solvency & profitability',
    detailVi:
      pat > 0
        ? `Số dư tiền cuối kỳ không âm trong suốt 40 quý · LNST đạt ${Math.round(pat).toLocaleString('vi-VN')} triệu đồng.`
        : `Dự án đang lỗ sau thuế (${Math.round(pat).toLocaleString('vi-VN')} triệu đồng); cần rà soát giá bán hoặc suất đầu tư.`,
    detailEn:
      pat > 0
        ? `Non-negative cash balance across all 40 quarters · PAT reaches VND ${Math.round(pat).toLocaleString('en-US')}m.`
        : `Negative profit after tax (VND ${Math.round(pat).toLocaleString('en-US')}m); review pricing or unit costs.`,
    targetTab: 'dashboard',
  });

  // =========================================================================
  // 8. 7x7 SENSITIVITY MATRIX (Apartment Price vs. Land Unit Price)
  // =========================================================================
  const aptStep = Math.max(0.5, Number(inp.sens_apartment_price_step) || 3);
  const landStep = Math.max(0.1, Number(inp.sens_land_price_step) || 0.5);

  const aptPrices = Array.from({ length: 7 }, (_, i) => Math.max(0, apBase + (i - 3) * aptStep));
  const landPrices = Array.from({ length: 7 }, (_, j) => Math.max(0, landTransferRate + (j - 3) * landStep));

  const sensPat: number[][] = [];
  const sensIrr: number[][] = [];

  if (includeSensitivity) {
    for (let i = 0; i < 7; i++) {
      const patRow: number[] = [];
      const irrRow: number[] = [];
      for (let j = 0; j < 7; j++) {
        if (i === 3 && j === 3) {
          patRow.push(pat);
          irrRow.push(annualIrr);
        } else {
          const clone: ModelInputs = {
            ...inp,
            apartment_base_selling_price: aptPrices[i],
            land_transfer_unit_price: landPrices[j],
          };
          const sub = runFinancialModel(clone, false);
          patRow.push(sub.pl.pat);
          irrRow.push(sub.summary.perf.irr);
        }
      }
      sensPat.push(patRow);
      sensIrr.push(irrRow);
    }
  }

  return {
    planning: {
      land: {
        highrise: highLand,
        lowProduct: lowProductLand,
        roadGreen: rgLand,
        lowZone,
        nonconforming: nonconfLand,
        total: totalLand,
      },
      high: {
        active: highActive,
        far: highFar,
        commercialRatio: shopFar,
        residentialRatio: resRatio,
        storeys: totalStoreys,
        parkingStoreys,
        commercialStoreys: commStoreys,
        residentialStoreys: resStoreys,
        refugeStoreys,
        basementLevels,
        cfa: cfaHigh,
        gfa: highGfa,
        commercialGfa: commGfa,
        apartmentGfa: aptGfa,
        basementArea,
        parkingArea: parkingTotalArea,
        technicalArea: techArea,
        exemptGfa,
        nsa: totalHighNsa,
        commercialNla: commNla,
        apartmentNsa: aptNsa,
        efficiency: highEff,
        units: totalHighUnits,
        shopUnits,
        aptUnits,
        population: highPop,
        commercialShare,
      },
      low: {
        active: lowActive,
        productLand: lowProductLand,
        bcr: lowBcrOverall,
        gfa: {
          ls: lsGfa,
          th: thGfa,
          vl: vlGfa,
          total: lowTotalGfa,
        },
        units: {
          ls: lsUnits,
          th: thUnits,
          vl: vlUnits,
          total: lowTotalUnits,
        },
        population: lowPop,
      },
    },
    dev: {
      landTransfer,
      bookValue,
      goodwill,
      luf,
      land: totalLandCost,
      infra: infraCost,
      highrise: highConstr,
      lowrise: lowConstr,
      ls: lsConstr,
      th: thConstr,
      vl: vlConstr,
      ps: psConstr,
      ap: apConstr,
      construction: totalConstruction,
      contingency,
      design: designCost,
      pm: pmCost,
      consult: consultCost,
      legal: legalCost,
      commission,
      marketing,
      gallery: galleryCost,
      ga: gaCost,
      opex: totalOpex,
      totalExVat,
      inputVat: inputVatTotal,
      cashRequirement,
    },
    sales: salesItems,
    pl: {
      revenue: totalRevenue,
      cogs,
      gp,
      gpMargin,
      opex: totalOpex,
      ebit,
      ebitMargin,
      interest: totalInterest,
      pbt,
      cit,
      pat,
      patMargin,
    },
    financing: {
      landLoan: landLoanTotal,
      constrLoan: constrLoanTotal,
      totalLoan,
      interest: totalInterest,
      equity: requiredEquity,
      collectionsUsed,
      totalCapital: requiredEquity + totalLoan + collectionsUsed,
      distribution,
      minEndCash: minCash,
    },
    summary: {
      totalNSA,
      totalUnits,
      totalRevenue,
      avgPrice,
      unitCostMode,
      unitCostPerM2,
      unitCostPerUnit,
      perf: {
        revenue: totalRevenue,
        cost: totalCostExCit,
        cit,
        pat,
        npv,
        discountRate,
        roe,
        irr: annualIrr,
        shIrr: annualIrr * 0.9,
        paybackYears,
        paybackQuarter,
        durationYears,
        margin: patMargin,
      },
    },
    cf,
    sens: {
      aptPrices,
      landPrices,
      pat: sensPat,
      irr: sensIrr,
      baseIndex: [3, 3],
    },
    timelineAudit: {
      profiles: profilesAudit,
      products: productAudits,
    },
    checks,
  };
}
