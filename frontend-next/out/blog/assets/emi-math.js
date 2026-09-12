(function (root) {
  'use strict';
  function calculateEmi(input) {
    const fields = ['price', 'down', 'emiDiscount', 'cashDiscount', 'annualRate', 'months', 'fee', 'gstRate', 'cashback'];
    for (const field of fields) {
      if (typeof input[field] !== 'number' || !Number.isFinite(input[field]) || input[field] < 0) throw new Error('Enter a valid, non-negative number in every amount and rate field.');
    }
    const { price, down, emiDiscount, cashDiscount, annualRate, months, fee, gstRate, cashback } = input;
    if (price <= 0 || price > 100000000) throw new Error('Enter a product price above zero and up to ₹10 crore.');
    if (!Number.isInteger(months) || months < 1 || months > 360) throw new Error('Choose a whole-number tenure from 1 to 360 months.');
    if (annualRate > 100 || gstRate > 100) throw new Error('Rates must be between 0 and 100%.');
    if (emiDiscount + down >= price) throw new Error('The EMI discount plus down payment must be less than the product price.');
    if (cashDiscount > price) throw new Error('The pay-now discount cannot exceed the product price.');
    if (fee > price || cashback > price - emiDiscount) throw new Error('Check the fee and cashback: they cannot exceed the applicable purchase amount.');
    const principal = price - emiDiscount - down;
    const rate = annualRate / 1200;
    // log1p/expm1 preserve accuracy for very small interest rates.
    const emi = rate === 0 ? principal / months : principal * rate / -Math.expm1(-months * Math.log1p(rate));
    let balance = principal;
    const schedule = [];
    for (let month = 1; month <= months; month++) {
      const interest = balance * rate;
      const paidPrincipal = month === months ? balance : Math.min(balance, emi - interest);
      balance = Math.max(0, balance - paidPrincipal);
      const tax = input.interestGst ? interest * gstRate / 100 : 0;
      schedule.push({ month, principal: paidPrincipal, interest, tax, payment: paidPrincipal + interest, total: paidPrincipal + interest + tax, balance });
    }
    const interest = schedule.reduce((sum, row) => sum + row.interest, 0);
    const interestTax = schedule.reduce((sum, row) => sum + row.tax, 0);
    const feeTax = input.feeGst ? fee * gstRate / 100 : 0;
    const upfront = down + fee + feeTax;
    const total = upfront + principal + interest + interestTax;
    const cashTotal = price - cashDiscount;
    return { principal, emi, interest, interestTax, feeTax, upfront, total, cashTotal, extra: total - cashTotal, net: total - cashback, netExtra: total - cashback - cashTotal, schedule };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculateEmi };
  else root.CouponPushEmi = { calculateEmi };
})(globalThis);
