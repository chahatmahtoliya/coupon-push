async (page) => {
  await page.setContent('<iframe src="https://couponpush.com/blog/tools/emi-calculator.html?embed=1" title="CouponPush product and credit card EMI calculator" width="100%" height="1400"></iframe><p>EMI calculator by <a href="https://couponpush.com/blog/tools/emi-calculator.html" target="_blank" rel="noopener">CouponPush</a></p>');
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Calculate EMI', exact: true }).waitFor({ timeout: 30000 });
  if (await frame.getByRole('banner').isVisible()) throw new Error('Embed query lost during redirect');
  await frame.getByLabel('Annual interest rate (%)', { exact: false }).fill('0');
  await frame.getByRole('button', { name: 'Calculate EMI', exact: true }).click();
  if (!(await frame.getByRole('region', { name: 'EMI estimate', exact: true }).innerText()).includes('₹5,000.00')) throw new Error('Live iframe calculation failed');
  const credit = page.getByRole('link', { name: 'CouponPush', exact: true });
  if ((await credit.getAttribute('rel')).includes('nofollow')) throw new Error('Attribution unexpectedly nofollow');
  console.log('PASS: live calculator works inside a cross-origin iframe, redirect retains embed mode, normal attribution link present.');
}
