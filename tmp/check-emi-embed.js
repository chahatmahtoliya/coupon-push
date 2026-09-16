async (page) => {
  await page.goto('http://127.0.0.1:8767/blog/tools/emi-calculator.html?embed=1');
  if (await page.getByRole('banner').isVisible()) throw new Error('Embed header visible');
  if (await page.getByRole('contentinfo').isVisible()) throw new Error('Embed footer visible');
  if (!(await page.getByRole('region', { name: 'EMI estimate', exact: true }).isVisible())) throw new Error('Embed calculator missing');
  if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))) throw new Error('Embed horizontal overflow');
  await page.screenshot({ path: 'tmp/emi-embed-mobile.png', fullPage: true });
  console.log('PASS: mobile embed layout, calculator visible, navigation hidden, no horizontal overflow.');
}
