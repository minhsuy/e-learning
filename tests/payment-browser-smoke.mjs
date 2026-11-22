// Optional Windows browser checks: installed Edge + Node WebSocket, no npm additions.
// Run against an already built/running frontend. All API responses are browser-local fixtures.
// STEP 07.2: visuals and recovery UI only; real HTTP recovery has a separate backend harness.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const baseUrl = process.env.PAYMENT_TEST_URL || 'http://localhost:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) throw Error('Local frontend only');
const profile = await mkdtemp(path.join(os.tmpdir(), 'tmdemy-payment-edge-'));
const edgePath = process.env.PAYMENT_TEST_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = spawn(edgePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  if (!port) throw Error('Edge debugging port unavailable');
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const diagnostics = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(String(data));
    if (['Runtime.exceptionThrown', 'Network.loadingFailed'].includes(message.method)) diagnostics.push(message.params);
    if (!message.id) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.error) entry.reject(Error(message.error.message)); else entry.resolve(message.result);
  });
  function send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function waitFor(expression) {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(100); }
    throw Error(`Condition timeout: ${expression}; ${JSON.stringify(await evaluate('({ url: location.href, text: document.body?.innerText?.slice(-1800), fixture: window.paymentFixture })'))}; ${JSON.stringify(diagnostics).slice(-3000)}`);
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://accounts.google.com/*', 'http://localhost:3002/socket.io/*'] });
  const fixtureSource = `
    localStorage.setItem('tmdemy_access_token', 'browser-fixture-only');
    localStorage.setItem('tmdemy_refresh_token', 'browser-fixture-only');
    const params = new URLSearchParams(location.search);
    window.paymentFixture = { state: 'pending', access: params.has('access'), free: params.has('free'), failure: params.has('failure'), malformed: params.has('malformed'), statusFailure: false, posts: [], statuses: 0, enrollmentReads: 0 };
    const expiresAt = new Date(Date.now() + 600000).toISOString();
    const course = { id: '11111111-1111-4111-8111-111111111111', slug: 'payment-test', title: 'Khóa học kiểm thử thanh toán', price: 199000, image: '/logo.png', status: 'approved', chapters: [] };
    const order = { id: '22222222-2222-4222-8222-222222222222', _id: '22222222-2222-4222-8222-222222222222', code: 'DH-TEST-06', amount: 199000, discount: 0, total: 199000, courseId: course.id, userId: 'fixture-user', status: params.has('manual') ? 'completed' : 'pending', paymentMethod: params.has('manual') ? 'manual' : 'sepay_bank_transfer', course };
    const instructions = () => ({ paymentCode: 'EXACT06', amount: '199000', transferContent: 'EXACT06', bankAccount: window.paymentFixture.malformed ? null : { bankName: 'FIXTURE BANK', accountNumber: '001234567', accountName: 'TEST MERCHANT' }, expiresAt, qrUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="20" y="100" font-size="18">QR TEST ONLY</text></svg>') });
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
      if (!url.pathname.startsWith('/api/') || url.origin === location.origin) return originalFetch(input, options);
      let data;
      if (url.pathname === '/api/users/me') data = { id: 'fixture-user', username: 'Payment Test', email: 'fixture@example.test', role: 'user', status: 'ACTIVE', isVerified: true };
      else if (url.pathname === '/api/courses/payment-test') data = { ...course, price: window.paymentFixture.free ? 0 : course.price };
      else if (url.pathname === '/api/enrollments/my') {
        window.paymentFixture.enrollmentReads++;
        data = window.paymentFixture.access ? [{ status: params.has('canceled') ? 'CANCELED' : 'ACTIVE', courseId: course.id, course }] : [];
      }
      else if (url.pathname === '/api/orders/my') data = { orders: [order], pagination: { page: 1, totalPages: 1, limit: 100, total: 1 } };
      else if (url.pathname === '/api/payments/checkout') {
        window.paymentFixture.posts.push(JSON.parse(options.body));
        if (window.paymentFixture.failure) return Response.json({ success: false, error: 'Payment service temporarily unavailable' }, { status: 503 });
        const free = window.paymentFixture.free;
        if (free) { window.paymentFixture.state = 'completed'; window.paymentFixture.access = true; }
        data = { order: { ...order, total: free ? 0 : order.total }, reused: false, payment: free ? null : instructions() };
      }
      else if (url.pathname.includes('/api/payments/orders/')) {
        window.paymentFixture.statuses++;
        if (window.paymentFixture.statusFailure) return Response.json({ success: false, error: 'Payment service temporarily unavailable' }, { status: 503 });
        data = { orderId: order.id, status: window.paymentFixture.state === 'completed' ? 'completed' : window.paymentFixture.state === 'rejected' ? 'rejected' : 'pending', paymentState: window.paymentFixture.state, courseAccessGranted: window.paymentFixture.access, paymentMethod: 'sepay_bank_transfer', expiresAt, paidAt: null, paymentCode: 'EXACT06' };
        if (url.pathname.endsWith('/instructions')) data = { status: data, order: { ...order, total: window.paymentFixture.free ? 0 : order.total }, payment: window.paymentFixture.state === 'pending' ? instructions() : null };
      }
      if (data === undefined) return new Response(JSON.stringify({ success: false, error: 'Unrelated API disabled in isolated payment fixture' }), { status: 503, headers: { 'content-type': 'application/json' } });
      return new Response(JSON.stringify({ success: true, data }), { status: url.pathname === '/api/payments/checkout' ? 201 : 200, headers: { 'content-type': 'application/json' } });
    };
  `;
  await send('Page.addScriptToEvaluateOnNewDocument', { source: fixtureSource });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${baseUrl}/checkout?course=payment-test` });
  await waitFor(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Tiếp tục thanh toán'))`);
  await evaluate(`{ const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tiếp tục thanh toán')); b.click(); b.click(); }`);
  await waitFor(`location.pathname.startsWith('/payment/') && document.body.textContent.includes('EXACT06')`);
  assert.equal(await evaluate('window.paymentFixture.posts.length'), 1);
  assert.deepEqual(await evaluate('window.paymentFixture.posts[0]'), { courseId: '11111111-1111-4111-8111-111111111111' });
  assert.equal(await evaluate(`!!document.querySelector('img[alt="VietQR thanh toán đơn hàng"]')`), true);
  assert.equal(await evaluate(`!!document.querySelector('button[aria-label="Sao chép số tiền"]')`), true);
  assert.equal(await evaluate(`!!document.querySelector('a[href="/learn/payment-test"]')`), false);
  await evaluate('Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 5000))]).then(() => true)');
  const screenshots = path.resolve('docs/progress/payment-step07-2');
  await mkdir(screenshots, { recursive: true });
  async function capture(name) {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(path.join(screenshots, `${name}.png`), Buffer.from(result.data, 'base64'));
  }
  for (const [name, width, height] of [['desktop', 1440, 1100], ['tablet', 768, 1024], ['mobile', 375, 900], ['narrow-mobile', 320, 900]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await delay(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `${name} horizontal overflow`);
    const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(path.join(screenshots, `${name}.png`), Buffer.from(screenshot.data, 'base64'));
  }
  await evaluate(`window.copiedPaymentValues = []; Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async value => { window.copiedPaymentValues.push(value); } });`);
  for (const label of ['số tài khoản', 'số tiền', 'nội dung chuyển khoản']) {
    await evaluate(`document.querySelector('button[aria-label="Sao chép ${label}"]').click()`);
    await waitFor(`document.body.textContent.includes('Đã sao chép ${label}')`);
  }
  assert.deepEqual(await evaluate('window.copiedPaymentValues'), ['001234567', '199000', 'EXACT06']);
  await evaluate(`Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async () => { throw Error('Fixture clipboard denied'); } }); document.querySelector('button[aria-label="Sao chép số tiền"]').click();`);
  await waitFor(`document.body.textContent.includes('Không thể sao chép')`);
  await evaluate(`document.querySelector('img[alt="VietQR thanh toán đơn hàng"]').dispatchEvent(new Event('error'))`);
  await waitFor(`document.body.textContent.includes('Không thể tải mã QR')`);
  assert.equal(await evaluate(`document.body.textContent.includes('EXACT06')`), true);
  await capture('qr-failure');
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tải lại QR')).click()`);
  await waitFor(`!!document.querySelector('img[alt="VietQR thanh toán đơn hàng"]')`);
  await evaluate(`document.documentElement.classList.add('dark'); window.paymentFixture.state = 'manual_review'; Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kiểm tra trạng thái')).click()`);
  await waitFor(`document.body.textContent.includes('Thanh toán đang được kiểm tra')`);
  await capture('manual-review-dark-mobile');
  assert.equal(await evaluate(`!!document.querySelector('img[alt="VietQR thanh toán đơn hàng"]')`), false);
  for (const [state, label] of [['expired', 'Đơn hàng đã hết hạn'], ['rejected', 'Đơn thanh toán bị từ chối']]) {
    await evaluate(`window.paymentFixture.state = '${state}'; Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kiểm tra trạng thái')).click()`);
    await waitFor(`document.body.textContent.includes('${label}')`);
    await capture(state);
    assert.equal(await evaluate(`!!document.querySelector('a[href="/learn/payment-test"]')`), false);
  }
  await evaluate(`window.paymentFixture.state = 'completed'; window.paymentFixture.access = false; Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kiểm tra trạng thái')).click()`);
  await waitFor(`document.body.textContent.includes('quyền học chưa sẵn sàng')`);
  assert.equal(await evaluate(`!!document.querySelector('a[href="/learn/payment-test"]')`), false);
  await evaluate(`window.paymentFixture.access = true; Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kiểm tra trạng thái')).click()`);
  await waitFor(`!!document.querySelector('a[href="/learn/payment-test"]')`);
  await capture('success');
  await waitFor('window.paymentFixture.enrollmentReads >= 2');
  await evaluate(`window.paymentFixture.statusFailure = true; Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kiểm tra trạng thái')).click()`);
  await waitFor(`document.body.textContent.includes('Trạng thái hiện tại chưa được xác nhận lại')`);
  await capture('network-error');
  assert.equal(await evaluate(`!!document.querySelector('a[href="/learn/payment-test"]')`), false);
  await send('Page.reload');
  await waitFor(`!!document.querySelector('img[alt="VietQR thanh toán đơn hàng"]')`);
  assert.equal(await evaluate('window.paymentFixture.posts.length'), 0);
  assert.equal(await evaluate(`!!document.querySelector('img[alt="VietQR thanh toán đơn hàng"]')`), true);
  await send('Page.navigate', { url: `${baseUrl}/checkout?course=payment-test&free=1` });
  await waitFor(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Đăng ký miễn phí'))`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Đăng ký miễn phí')).click()`);
  await waitFor(`!!document.querySelector('a[href="/learn/payment-test"]')`);
  assert.equal(await evaluate(`!!document.querySelector('img[alt="VietQR thanh toán đơn hàng"]')`), false);
  assert.equal(await evaluate('window.paymentFixture.posts.length'), 1);
  assert.equal(await evaluate('window.paymentFixture.statuses > 0'), true);
  await send('Page.navigate', { url: `${baseUrl}/checkout?course=payment-test&failure=1` });
  await waitFor(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Tiếp tục thanh toán'))`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tiếp tục thanh toán')).click()`);
  await waitFor(`document.body.textContent.includes('máy chủ tạm thời không khả dụng (HTTP 503)')`);
  assert.equal(await evaluate('window.paymentFixture.posts.length'), 1);
  assert.equal(await evaluate(`location.pathname === '/checkout'`), true);
  await send('Page.navigate', { url: `${baseUrl}/checkout?course=payment-test&malformed=1` });
  await waitFor(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Tiếp tục thanh toán'))`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tiếp tục thanh toán')).click()`);
  await waitFor(`document.body.textContent.includes('Đơn này hiện không có hướng dẫn chuyển khoản khả dụng')`);
  assert.equal(await evaluate(`!!document.querySelector('img[alt="VietQR thanh toán đơn hàng"]')`), false);
  for (const [query, hasAccess] of [['manual=1', false], ['manual=1&access=1', true], ['manual=1&access=1&canceled=1', false]]) {
    await send('Page.navigate', { url: `${baseUrl}/orders?${query}` });
    await waitFor(`document.body.textContent.includes('ĐÃ HOÀN THÀNH')`);
    assert.equal(await evaluate(`!!document.querySelector('a[href="/learn/payment-test"]')`), hasAccess);
  }
  console.log('PASS: paid/free checkout, duplicate click, exact body/amount copy action, QR/fallback, desktop/tablet/mobile/320px, dark mode, review/expiry/rejection, verified access, stale status error, enrollment refetch, instruction reload without POST, HTTP 503, and manual-order enrollment gating; browser-local mocks only.');
  await send('Browser.close');
} finally {
  socket?.close();
  browser.kill();
}
