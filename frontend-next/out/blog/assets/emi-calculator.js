(function () {
  'use strict';
  const form = document.querySelector('[data-emi-form]');
  if (!form) return;
  if (new URLSearchParams(location.search).get('embed') === '1') document.body.classList.add('emi-embed');
  const result = document.querySelector('[data-emi-result]');
  const error = document.querySelector('[data-emi-error]');
  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  const field = name => form.elements.namedItem(name);
  let lastResult;
  const set = (name, text) => { document.querySelector(`[data-value="${name}"]`).textContent = text; };
  function calculate() {
    try {
      const input = {};
      for (const name of ['price', 'down', 'emiDiscount', 'cashDiscount', 'annualRate', 'months', 'fee', 'gstRate', 'cashback']) {
        if (!field(name).value.trim()) throw new Error('Fill in every amount and rate. Enter 0 where a charge or discount does not apply.');
        input[name] = Number(field(name).value);
      }
      input.interestGst = field('interestGst').checked;
      input.feeGst = field('feeGst').checked;
      const values = globalThis.CouponPushEmi.calculateEmi(input);
      lastResult = values;
      error.textContent = '';
      result.hidden = false;
      for (const key of ['principal', 'emi', 'interest', 'interestTax', 'feeTax', 'upfront', 'total', 'cashTotal', 'net']) set(key, money.format(values[key]));
      set('fee', money.format(input.fee));
      set('cashback', money.format(input.cashback));
      set('difference', Math.abs(values.extra) < 0.005 ? 'Same cost as paying upfront' : `${money.format(Math.abs(values.extra))} ${values.extra > 0 ? 'more' : 'less'} than paying upfront`);
      set('netDifference', Math.abs(values.netExtra) < 0.005 ? 'Same net cost after cashback' : `${money.format(Math.abs(values.netExtra))} ${values.netExtra > 0 ? 'more' : 'less'} after the entered cashback`);
      set('firstPayment', money.format(values.schedule[0].total));
      set('tenure', `${input.months} monthly payments · before any tax on interest`);
      const body = document.querySelector('[data-emi-schedule]');
      body.replaceChildren();
      for (const row of values.schedule) {
        const tr = document.createElement('tr');
        for (const key of ['month', 'principal', 'interest', 'tax', 'total', 'balance']) {
          const td = document.createElement('td');
          td.textContent = key === 'month' ? String(row[key]) : money.format(row[key]);
          tr.append(td);
        }
        body.append(tr);
      }
    } catch (exception) {
      lastResult = null;
      result.hidden = true;
      error.textContent = exception.message;
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
  // Hide the old estimate while editing so it is never mistaken for the new inputs.
  form.addEventListener('input', () => { result.hidden = true; lastResult = null; error.textContent = 'Inputs changed. Select Calculate EMI to update the estimate.'; });
  field('mode').addEventListener('change', () => { field('interestGst').checked = field('mode').value === 'card'; });
  document.querySelector('[data-emi-reset]').addEventListener('click', () => { form.reset(); calculate(); });
  document.querySelector('[data-emi-download]').addEventListener('click', () => {
    if (!lastResult) return;
    const rows = ['Month,Principal INR,Interest INR,Tax on interest INR,Payment including interest tax INR,Balance INR', ...lastResult.schedule.map(row => [row.month, ...['principal', 'interest', 'tax', 'total', 'balance'].map(key => row[key].toFixed(2))].join(','))];
    rows.push('', `Upfront down payment and fees INR,${lastResult.upfront.toFixed(2)}`, `Total before cashback INR,${lastResult.total.toFixed(2)}`);
    const url = URL.createObjectURL(new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'couponpush-emi-schedule.csv';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  calculate();
})();
