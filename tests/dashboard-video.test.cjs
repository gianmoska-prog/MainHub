// Run with Node; uses the bundled Playwright, or PLAYWRIGHT_MODULE when supplied.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Gianl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
// Mock mode is confined to this test server. No live posts or uploads are created.
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/' || pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html');
    return res.end(html.replace("mode: 'supabase',", "mode: 'mock',").replace('supabaseEnabled: true,', 'supabaseEnabled: false,'));
  }
  const target = path.resolve(root, '.' + pathname);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) { res.writeHead(404); return res.end(); }
  res.end(fs.readFileSync(target));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 960 } });
    // The legacy mock-auth UI references this diagnostic helper outside its closure.
    await page.addInitScript(() => { window.dataEvent = () => {}; });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof mockSignInInternalUser === 'function');
    await page.evaluate(async () => { await mockSignInInternalUser(); await navigateTo('dashboard'); setDashboardComposerExpanded(true); });
    const sample = await fetch('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm');
    assert.equal(sample.ok, true);
    const videoBytes = new Uint8Array(await sample.arrayBuffer());
    await page.locator('#dashboardAttachmentInput').setInputFiles({ name: 'studio-preview.webm', mimeType: 'video/webm', buffer: Buffer.from(videoBytes) });
    await page.waitForFunction(() => dashboardLocalAttachments.length === 1);
    assert.equal(await page.locator('#dashboardAttachments video[controls]').count(), 1);
    await page.locator('#dashboardEntryTitle').fill('Video integration test');
    const result = await page.evaluate(async () => {
      let failure;
      window.addEventListener('moscatelli:record-create-error', e => failure = e.detail, { once: true });
      const record = await createDashboardPost(dashboardRecordFromComposer());
      return { id: record?.id, mime: record?.attachments[0]?.mime_type, failure, feedback: dashboardComposerFeedback?.textContent, signedIn: isInternalUserSignedIn() };
    });
    assert.equal(result.mime, 'video/webm', JSON.stringify(result));
    const player = page.locator(`[data-post-id="${result.id}"] video`);
    await player.evaluate(async video => { await video.play(); });
    await page.waitForFunction(id => document.querySelector(`[data-post-id="${id}"] video`)?.currentTime > 0, result.id);
    await player.evaluate(video => video.pause());
    assert.equal(await page.locator(`[data-post-id="${result.id}"] .dashboard-attachment-open`).count(), 0);
    await page.evaluate(() => removeDashboardAttachment(0));
    assert.equal(await page.locator('#dashboardAttachments video').count(), 0);
    const limits = await page.evaluate(async () => {
      try { await prepareDashboardAttachment(new File([new Uint8Array(50 * 1024 * 1024 + 1)], 'large.mp4', { type: 'video/mp4' })); return false; }
      catch (e) { return e.code === 'video_size_limit'; }
    });
    assert.equal(limits, true);
    const translationsOK = await page.evaluate(() => translations.en['dashboard.attach'] === 'Attach file' && translations.pt['dashboard.attach'] === 'Anexar arquivo');
    assert.equal(translationsOK, true);
    await page.setViewportSize({ width: 390, height: 844 });
    const widthOK = await player.evaluate(video => video.getBoundingClientRect().width <= 390);
    assert.equal(widthOK, true);
    assert.deepEqual(errors, []);
    console.log('PASS: syntax, video selection/preview, saved MIME, inline playback, removal, size limit, bilingual labels, mobile width; no page errors.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
