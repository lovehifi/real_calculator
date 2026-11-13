import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFormula, formatMoney, formatPct } from './formulaParser.ts';
import { runFinancialModel } from './financialEngine.ts';
import { SAMPLE_PROJECT_INPUTS, cloneInputs, normalizeImportedInputs } from '../data/sampleProject.ts';

test('evaluateFormula supports Vietnamese and English numeric expressions and percentages', () => {
  assert.equal(evaluateFormula('=6000*4,5', 'vi'), 27000);
  assert.equal(evaluateFormula('= (40 + 5,5) * 2', 'vi'), 91);
  assert.equal(evaluateFormula('=100 * 50%', 'vi'), 50);
  assert.equal(evaluateFormula('328.000', 'vi'), 328000);
  assert.equal(evaluateFormula('1,250.5', 'en'), 1250.5);
  assert.equal(evaluateFormula('=10/0', 'vi'), null);
  assert.equal(evaluateFormula('invalid_text', 'vi'), null);
});

test('runFinancialModel produces complete, balanced 40-quarter cash flows on sample project', () => {
  const res = runFinancialModel(SAMPLE_PROJECT_INPUTS);

  // Land area checks
  assert.equal(res.planning.land.highrise, 6000);
  assert.equal(res.planning.land.lowProduct, 12000);
  assert.equal(res.planning.land.lowZone, 22004);
  assert.equal(res.planning.land.total, 28004);

  // High-rise NSA & GFA checks
  assert.equal(res.planning.high.apartmentNsa, 32000);
  assert.ok(Math.abs(res.planning.high.apartmentGfa - 39143.73) < 1);
  assert.ok(Math.abs(res.planning.high.cfa - 56072) < 5);

  // Revenue & Profit sanity
  assert.ok(res.pl.revenue > 2_200_000 && res.pl.revenue < 2_300_000);
  assert.ok(res.pl.pat > 250_000);
  assert.ok(res.summary.perf.irr > 0.2 && res.summary.perf.irr < 0.85);

  // 40-Quarter cash flow integrity (unlocked Q1..Q40)
  assert.equal(res.cf.revenue.q.length, 40);
  assert.equal(res.cf.revenue.years.length, 10);
  assert.ok(Math.abs(res.cf.revenue.total - res.pl.revenue) < 1e-4);

  // Every quarter satisfies open + net === end and non-negative ending cash
  for (let q = 0; q < 40; q++) {
    const open = res.cf.open.q[q];
    const net = res.cf.net.q[q];
    const end = res.cf.end.q[q];
    assert.ok(Math.abs(open + net - end) < 1e-4, `Quarter ${q + 1} cash balance mismatch`);
    assert.ok(end >= -1e-4, `Quarter ${q + 1} ending cash went negative: ${end}`);
    if (q < 39) {
      assert.ok(Math.abs(res.cf.open.q[q + 1] - end) < 1e-4, `Quarter ${q + 2} opening cash mismatch`);
    }
  }

  // 7x7 Sensitivity matrix uses true model runs and matches base PAT at [3][3]
  assert.equal(res.sens.pat.length, 7);
  assert.equal(res.sens.pat[3].length, 7);
  assert.ok(Math.abs(res.sens.pat[3][3] - res.pl.pat) < 1e-4);
  assert.ok(res.sens.pat[6][0] > res.sens.pat[0][6]);
});

test('runFinancialModel dynamically responds to Quarter 35 schedule edits (no 40-quarter lock)', () => {
  const custom = cloneInputs(SAMPLE_PROJECT_INPUTS);
  // Shift apartment collection tail into Quarter 36 (index 35, Year 9)
  custom.timeline.collection.ap = new Array<number>(40).fill(0);
  custom.timeline.collection.ap[10] = 0.5;
  custom.timeline.collection.ap[35] = 0.5;

  const res = runFinancialModel(custom, false);
  assert.ok(res.cf.revenue.q[35] > 600_000, 'Expected revenue in Q36 from unlocked 40-quarter schedule');
  assert.ok(res.cf.revenue.years[8] > 600_000, 'Expected Year 9 annual rollup to reflect Q36 collection');
});

test('normalizeImportedInputs converts legacy VND-thousand web files seamlessly', () => {
  const legacy = {
    highrise_land_area: 6000,
    land_transfer_unit_price: 4500,
    land_use_fee: 328000000,
    apartment_base_selling_price: 40000,
  };
  const norm = normalizeImportedInputs(legacy);
  assert.equal(norm.land_transfer_unit_price, 4.5);
  assert.equal(norm.land_use_fee, 328000);
  assert.equal(norm.apartment_base_selling_price, 40);
  assert.equal(formatMoney(328000, 'vi', 'billion'), '328,0');
  assert.equal(formatPct(0.452, 1, 'en'), '45.2%');
});
