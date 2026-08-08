import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto('http://127.0.0.1:3100/');
await p.waitForTimeout(1800);
const probe = async (label) => console.log(label, JSON.stringify(await p.evaluate(() => ({
  y: Math.round(window.scrollY),
  btnOp: (document.querySelector('button[aria-label*="Gauntlet"]') || {}).style ? getComputedStyle(document.querySelector('button[aria-label*="Gauntlet"]')).opacity : 'none',
  fist: getComputedStyle(document.querySelector('img[src*="gauntlet-fist"]')).opacity,
  open: getComputedStyle(document.querySelector('img[src*="gauntlet-open"]')).opacity,
  stone: document.querySelector('.g-stone') ? getComputedStyle(document.querySelector('.g-stone')).opacity : 'none',
}))));
await probe('FRESH(top):');
for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(400); }
await probe('FRESH(scrolled):');
// returning visitor with 1 click recorded
await p.evaluate(() => window.scrollBy(0, -260));
await p.waitForTimeout(600);
await p.locator('.g-stone').nth(0).dispatchEvent('click');
await p.waitForTimeout(900);
await p.goBack();
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(900);
await probe('RETURN(top):');
for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(400); }
await probe('RETURN(scrolled):');
await b.close();
