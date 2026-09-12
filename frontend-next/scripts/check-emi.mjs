import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { calculateEmi } = require('../blog/assets/emi-math.js');
const input = { price: 30000, down: 0, emiDiscount: 0, cashDiscount: 0, annualRate: 15, months: 6, fee: 199, gstRate: 18, cashback: 0, interestGst: true, feeGst: true };
const close = (a, b, tolerance = 0.000001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const standard = calculateEmi(input);
// Independently calculate the equal payment using the present-value annuity formula.
const factor = (1 + 0.15 / 12) ** 6;
close(standard.emi, 30000 * (0.15 / 12) * factor / (factor - 1));
close(standard.schedule.reduce((sum, row) => sum + row.principal, 0), 30000);
close(standard.schedule.at(-1).balance, 0);
close(standard.total, standard.schedule.reduce((sum, row) => sum + row.total, 0) + 199 * 1.18);
close(standard.interestTax, standard.interest * 0.18);
close(standard.feeTax, 35.82);
const zero = calculateEmi({ ...input, annualRate: 0, fee: 0 });
close(zero.emi, 5000); close(zero.interest, 0); close(zero.total, 30000); close(zero.extra, 0);
const loan = calculateEmi({ ...input, interestGst: false, feeGst: false });
close(loan.interestTax, 0); close(loan.feeTax, 0);
const discounted = calculateEmi({ ...input, down: 5000, emiDiscount: 1000, cashDiscount: 500, cashback: 750 });
close(discounted.principal, 24000); close(discounted.cashTotal, 29500);
close(discounted.net, discounted.total - 750); close(discounted.upfront, 5234.82);
const single = calculateEmi({ ...input, months: 1 });
close(single.interest, 375); close(single.schedule[0].principal, 30000);
const tiny = calculateEmi({ ...input, annualRate: 0.000000001, months: 360 });
assert.ok(Number.isFinite(tiny.emi)); close(tiny.emi, 30000 / 360, 0.001);
for (const patch of [{ price: 0 }, { price: Infinity }, { down: -1 }, { months: 0 }, { months: 1.5 }, { months: 361 }, { annualRate: 101 }, { down: 30000 }, { emiDiscount: 30001 }, { cashDiscount: 30001 }, { gstRate: -1 }, { fee: 30001 }, { cashback: 30001 }]) {
  assert.throws(() => calculateEmi({ ...input, ...patch }), Error);
}
// A merchant subsidy which offsets finance interest does not erase fees or interest tax.
const noCostPrincipal = 30000 / (standard.emi * 6 / 30000);
const noCost = calculateEmi({ ...input, emiDiscount: 30000 - noCostPrincipal });
close(noCost.principal + noCost.interest, 30000);
assert.ok(noCost.extra > 234.82);
console.log('EMI checks passed: annuity formula, schedule conservation, zero interest, GST, fees, discounts, cashback, no-cost subsidy and invalid inputs.');
