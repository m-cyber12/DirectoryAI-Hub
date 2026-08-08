import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto('http://127.0.0.1:3100/news?m=all');
await p.waitForTimeout(2000);
await p.screenshot({ path: '/tmp/v29-news-all.png' });
const months = await p.locator('#news-month option').allTextContents();
console.log('MONTHS:', months.join(' | '));
await b.close();
