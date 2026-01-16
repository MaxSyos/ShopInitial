const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const url = process.env.TUNNEL_URL || 'https://obscure-space-palm-tree-49xq5wv59w52ggr-3000.app.github.dev/products';
  console.log('Running Puppeteer test for', url);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    // espera pelo seletor data-testid
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const count = await page.$$eval('[data-testid="product-card"]', nodes => nodes.length);
    console.log('Product cards found:', count);

    // screenshot
    const screenshotPath = '/tmp/products-page.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to', screenshotPath);

    await browser.close();
    process.exit(count >= 1 ? 0 : 2);
  } catch (err) {
    console.error('Puppeteer test error:', err);
    try { await browser.close(); } catch (e) {}
    process.exit(1);
  }
})();
