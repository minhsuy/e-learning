// Dependency-free tests exercise actual production TS/TSX.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const nativeRequire = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loader(mocks = {}) {
  const cache = new Map();
  function load(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!name.startsWith('@/') && !path.isAbsolute(name)) return nativeRequire(name);
    let filename = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name;
    if (!/\.tsx?$/.test(filename)) filename += fs.existsSync(filename + '.ts') ? '.ts' : '.tsx';
    if (cache.has(filename)) return cache.get(filename).exports;
    const record = { exports: {} };
    cache.set(filename, record);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', output)(id => load(id.startsWith('.') ? path.resolve(path.dirname(filename), id) : id), record, record.exports);
    return record.exports;
  }
  return load;
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const pending = { orderId: 'order-1', status: 'pending', paymentState: 'pending', courseAccessGranted: false, expiresAt: null, paidAt: null };
const payment = { paymentCode: 'EXACT123', amount: '199000', qrUrl: 'https://img.vietqr.io/image/backend.svg?amount=199000', transferContent: 'EXACT 123 NO CHANGE', expiresAt: '2026-11-16T12:30:00Z', bankAccount: { bankName: 'BANK', accountNumber: '001234', accountName: 'MERCHANT' } };

// Small hook runner for isolated component behavior. No simulated browser/layout claims.
function hookRunner() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const cleanups = [];
  return {
    react: { ...React,
      useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
      useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
      useEffect(effect, deps) { const index = cursor++; const previous = slots[index]; if (!previous || deps?.some((value, i) => value !== previous[i])) { slots[index] = deps; effects.push(() => { cleanups[index]?.(); cleanups[index] = effect(); }); } },
      useCallback(callback) { return callback; },
    },
    render(component, props) { cursor = 0; return component(props); },
    effects() { const next = effects; effects = []; next.forEach(effect => effect()); },
    dispose() { cleanups.forEach(cleanup => cleanup?.()); },
    reset() { slots.length = 0; cursor = 0; effects = []; cleanups.length = 0; },
  };
}
function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap(node => nodes(node, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
function textContent(tree) {
  if (Array.isArray(tree)) return tree.map(textContent).join('');
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  return tree?.props ? textContent(tree.props.children) : '';
}

test('payment API uses existing client: 200 reuse, 201 paid, free, coupon and errors', async t => {
  const storage = new Map([['tmdemy_access_token', 'student-token'], ['tmdemy_refresh_token', 'refresh-token']]);
  t.mock.method(global, 'fetch', async () => { throw Error('Missing mock'); });
  const originalWindow = global.window;
  global.window = { localStorage: storage, dispatchEvent() {} };
  const originalStorage = global.localStorage;
  global.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  t.after(() => { global.window = originalWindow; global.localStorage = originalStorage; });
  const load = loader();
  const service = load('@/services/payment.service');
  for (const [http, free] of [[201, false], [200, false], [201, true]]) {
    await t.test(`checkout HTTP ${http}, payment null=${free}`, async () => {
      let sent;
      global.fetch = async (url, options) => { sent = { url, options }; return Response.json({ success: true, data: { order: { id: 'order-1', total: free ? 0 : 199000 }, payment: free ? null : payment, reused: http === 200 } }, { status: http }); };
      const response = await service.createPaymentCheckout('11111111-1111-4111-8111-111111111111', 'COUPON');
      assert.deepEqual(JSON.parse(sent.options.body), { courseId: '11111111-1111-4111-8111-111111111111', couponCode: 'COUPON' });
      assert.equal(sent.options.headers.get('Authorization'), 'Bearer student-token');
      assert.ok(sent.url.endsWith('/api/payments/checkout'));
      assert.equal(response.data.payment === null, free);
      assert.equal(response.data.reused, http === 200);
    });
  }
  for (const code of [400, 401, 403, 404, 409, 503]) {
    await t.test(`HTTP ${code} surfaces without POST retries`, async () => {
      let calls = 0;
      global.fetch = async () => { calls++; return Response.json({ success: false, error: `error-${code}` }, { status: code }); };
      await assert.rejects(service.createPaymentCheckout('11111111-1111-4111-8111-111111111111'), error => error.statusCode === code && error.message === `error-${code}`);
      assert.equal(calls, 1);
    });
  }
  await t.test('network failure surfaces; no POST retry', async () => {
    let calls = 0;
    global.fetch = async () => { calls++; throw new Error('offline'); };
    await assert.rejects(service.createPaymentCheckout('11111111-1111-4111-8111-111111111111'), error => error.statusCode === 0);
    assert.equal(calls, 1);
  });
  await t.test('real reported 503 envelope preserves backend status/message without retry', async () => {
    let calls = 0;
    const envelope = { success: false, error: 'Payment service temporarily unavailable' };
    global.fetch = async () => { calls++; return Response.json(envelope, { status: 503 }); };
    await assert.rejects(service.createPaymentCheckout('11111111-1111-4111-8111-111111111111'), error => {
      assert.equal(error.statusCode, 503);
      assert.equal(error.message, envelope.error);
      assert.deepEqual(error.raw, envelope);
      return true;
    });
    assert.equal(calls, 1);
  });
  await t.test('rejects a slug or malformed course UUID without sending any request', async () => {
    let calls = 0;
    global.fetch = async () => { calls++; throw Error('Unexpected request'); };
    for (const courseId of ['real-course-slug', '', '11111111-1111-1111-1111-111111111111']) {
      await assert.rejects(service.createPaymentCheckout(courseId), error => error.statusCode === 400 && Boolean(error.validationErrors.courseId));
    }
    assert.equal(calls, 0);
  });
  await t.test('omits absent/blank coupon and preserves only the trimmed selected code', async () => {
    const bodies = [];
    global.fetch = async (url, options) => { bodies.push(JSON.parse(options.body)); return Response.json({ success: true }); };
    const courseId = '11111111-1111-4111-8111-111111111111';
    for (const coupon of [undefined, '', '   ', ' SELECTED ']) await service.createPaymentCheckout(courseId, coupon);
    assert.deepEqual(bodies, [{ courseId }, { courseId }, { courseId }, { courseId, couponCode: 'SELECTED' }]);
  });
  await t.test('JWT expiry refreshes before one safe authenticated replay', async () => {
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push([String(url), options]);
      if (calls.length === 1) return Response.json({ error: 'jwt expired' }, { status: 401 });
      if (calls.length === 2) return Response.json({ success: true, access_token: 'fresh-token' });
      return Response.json({ success: true, data: pending });
    };
    await service.getOrderPaymentStatus('order-1');
    assert.ok(calls[1][0].endsWith('/api/users/access_token'));
    assert.equal(calls[2][1].headers.get('Authorization'), 'Bearer fresh-token');
    assert.equal(calls[2][1].cache, 'no-store');
  });
});

test('checkout error feedback distinguishes backend failure from network/auth/request failures', async t => {
  const load = loader();
  const { AppApiError } = load('@/types/api');
  const { describeCheckoutFailure } = load('@/lib/payment');
  for (const [statusCode, category] of [[0, 'network'], [400, 'validation'], [401, 'authentication'], [403, 'authentication'], [404, 'validation'], [409, 'conflict'], [503, 'unavailable'], [500, 'unexpected']]) {
    await t.test(`HTTP ${statusCode}: ${category}`, () => {
      const error = new AppApiError({ statusCode, message: 'Sensitive internal detail must not be displayed' });
      const feedback = describeCheckoutFailure(error);
      assert.equal(feedback.category, category);
      assert.equal(feedback.httpStatus, statusCode || null);
      assert.ok(!feedback.message.includes('Sensitive internal'));
      assert.equal(feedback.safeServerMessage, undefined);
      assert.equal(error.statusCode, statusCode);
      assert.equal(error.message, 'Sensitive internal detail must not be displayed');
    });
  }
  for (const name of ['TimeoutError', 'AbortError']) {
    const error = new Error('aborted'); error.name = name;
    assert.equal(describeCheckoutFailure(error).category, 'timeout');
  }
  const failure = describeCheckoutFailure(new AppApiError({ statusCode: 503, message: 'Payment service temporarily unavailable' }));
  assert.equal(failure.safeServerMessage, 'Payment service temporarily unavailable');
  assert.ok(!failure.message.includes('cấu hình'), 'Generic 503 cannot prove missing configuration');
  assert.equal(describeCheckoutFailure(new Error('Internal stack')).category, 'unexpected');
});

test('countdown, access authority and navigation handoff', () => {
  const lib = loader()('@/lib/payment');
  const now = Date.parse('2026-11-16T12:00:00Z');
  assert.equal(lib.remainingPaymentSeconds('2026-11-16T12:01:30Z', now), 90);
  assert.equal(lib.formatPaymentTime(90), '01:30');
  assert.equal(lib.remainingPaymentSeconds('2026-11-16T11:59:00Z', now), 0);
  assert.equal(lib.remainingPaymentSeconds('invalid', now), null);
  assert.equal(lib.remainingPaymentSeconds(null, now), null);
  assert.equal(lib.paymentAccessReady(pending), false);
  assert.equal(lib.paymentAccessReady({ ...pending, status: 'completed', paymentState: 'completed' }), false);
  assert.equal(lib.paymentAccessReady({ ...pending, status: 'completed', paymentState: 'completed', courseAccessGranted: true }), true);
  lib.rememberCheckout('student-a', { order: { id: 'order-1' }, payment });
  assert.equal(lib.recallCheckout('student-b', 'order-1'), null);
  assert.equal(lib.recallCheckout('student-a', 'other-order'), null);
  assert.equal(lib.recallCheckout('student-a', 'order-1').payment, payment);
  assert.equal(loader()('@/lib/payment').recallCheckout('student-a', 'order-1'), null, 'reload loses instructions and never restores success');
});

test('learning eligibility requires persisted non-canceled enrollment for the selected course', () => {
  const { hasLearningEnrollment } = loader()('@/lib/payment');
  const courseId = '11111111-1111-4111-8111-111111111111';
  assert.equal(hasLearningEnrollment([], courseId), false, 'a completed order without enrollment cannot grant access');
  for (const status of ['CANCELED', 'canceled', undefined, 'UNKNOWN']) {
    assert.equal(hasLearningEnrollment([{ courseId, status }], courseId), false);
  }
  for (const status of ['ACTIVE', 'active', 'COMPLETED', 'completed']) {
    assert.equal(hasLearningEnrollment([{ courseId, status }], courseId), true);
  }
  assert.equal(hasLearningEnrollment([{ courseId: 'another-course', status: 'ACTIVE' }], courseId), false);
});

test('missing or malformed bank instructions show a safe fallback without QR or copy actions', () => {
  const runner = hookRunner();
  const load = loader({ react: runner.react });
  const { PaymentInstructions } = load('@/components/payment/payment-instructions');
  const { isPaymentInstructions } = load('@/lib/payment');
  for (const candidate of [null, {}, { ...payment, bankAccount: null }, { ...payment, amount: 199000 }, { ...payment, transferContent: '' }, { ...payment, qrUrl: '' }]) {
    assert.equal(isPaymentInstructions(candidate), false);
    const tree = runner.render(PaymentInstructions, { payment: candidate });
    assert.ok(textContent(tree).includes('Thông tin chuyển khoản từ máy chủ chưa hợp lệ'));
    assert.equal(nodes(tree, node => node.type === 'img').length, 0);
    assert.equal(nodes(tree, node => node.props?.['aria-label']?.startsWith('Sao chép')).length, 0);
  }
  assert.equal(isPaymentInstructions(payment), true);
  runner.dispose();
});

test('countdown asks backend at zero once, tolerates invalid expiry, cleans up', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: Date.parse('2026-11-16T12:00:00Z') });
  const runner = hookRunner();
  const { PaymentCountdown } = loader({ react: runner.react })('@/components/payment/payment-instructions');
  let checks = 0;
  const props = { expiresAt: '2026-11-16T12:00:02Z', onDeadline: () => checks++ };
  runner.render(PaymentCountdown, props); runner.effects();
  assert.equal(checks, 0);
  t.mock.timers.tick(2000); assert.equal(checks, 1);
  t.mock.timers.tick(3000); assert.equal(checks, 1);
  assert.ok(textContent(runner.render(PaymentCountdown, props)).includes('00:00'));
  runner.dispose();
  runner.reset(); runner.render(PaymentCountdown, { ...props, expiresAt: 'invalid' }); runner.effects();
  t.mock.timers.tick(5000); assert.equal(checks, 1); runner.dispose();
});

test('all persisted payment states render with access-gated real learning links', async t => {
  const { PaymentStatusView } = loader()('@/components/payment/payment-status-view');
  for (const state of ['pending', 'completed', 'rejected', 'expired', 'manual_review']) {
    await t.test(state, () => {
      const html = renderToStaticMarkup(React.createElement(PaymentStatusView, { status: { ...pending, paymentState: state }, courseSlug: 'actual-course' }));
      assert.ok(!html.includes('href="/learn/'));
      assert.ok(!html.includes('Thanh toán thành công'));
    });
  }
  const html = renderToStaticMarkup(React.createElement(PaymentStatusView, { status: { ...pending, status: 'completed', paymentState: 'completed', courseAccessGranted: true }, courseSlug: 'actual-course' }));
  assert.ok(html.includes('Thanh toán thành công'));
  assert.ok(html.includes('href="/learn/actual-course"'));
  assert.ok(html.includes('href="/my-courses"'));
});

test('polling interval, terminal states, no overlap, disposal, backoff and request deadline', async t => {
  const { createPaymentPoller } = loader()('@/lib/payment-poller');
  for (const state of ['pending', 'completed', 'rejected', 'expired', 'manual_review']) {
    await t.test(`polling ${state}`, async t => {
      t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
      let calls = 0;
      const poller = createPaymentPoller({ request: async () => { calls++; return { ...pending, paymentState: state }; }, onStatus() {}, onError() {}, onBusy() {}, onPause() {} });
      await poller.start();
      t.mock.timers.tick(2499); await flush(); assert.equal(calls, 1);
      t.mock.timers.tick(1); await flush(); assert.equal(calls, state === 'pending' ? 2 : 1);
      poller.dispose();
      t.mock.timers.tick(10000); await flush(); assert.equal(calls, state === 'pending' ? 2 : 1);
    });
  }
  await t.test('manual/focus calls cannot overlap; unmount aborts', async () => {
    let signal;
    let calls = 0;
    let resolve;
    const poller = createPaymentPoller({ request: incoming => { calls++; signal = incoming; return new Promise(done => { resolve = done; }); }, onStatus() { throw Error('Disposed callback'); }, onError() {}, onBusy() {}, onPause() {} });
    const running = poller.start();
    await poller.refresh(); await poller.refresh(); assert.equal(calls, 1);
    poller.dispose(); assert.equal(signal.aborted, true);
    resolve(pending); await running;
  });
  await t.test('four network failures pause without false success; manual retry recovers', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    let calls = 0; let paused = false; let statuses = 0;
    const poller = createPaymentPoller({ request: async () => { calls++; if (calls <= 4) throw Error('offline'); return pending; }, onStatus() { statuses++; }, onError() {}, onBusy() {}, onPause() { paused = true; } });
    await poller.start();
    for (const delay of [5000, 10000, 20000]) { t.mock.timers.tick(delay); await flush(); }
    assert.equal(calls, 4); assert.equal(paused, true); assert.equal(statuses, 0);
    t.mock.timers.tick(60000); await flush(); assert.equal(calls, 4);
    await poller.refresh(); assert.equal(statuses, 1); poller.dispose();
  });
  await t.test('hung request is aborted at deadline', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    let aborted = false;
    const poller = createPaymentPoller({ request: signal => new Promise((resolve, reject) => signal.addEventListener('abort', () => { aborted = true; reject(new Error('timeout')); })), onStatus() {}, onError() {}, onBusy() {}, onPause() {} });
    const running = poller.start();
    t.mock.timers.tick(12000); await running; assert.equal(aborted, true); poller.dispose();
  });
  await t.test('automatic waiting is bounded even when pending indefinitely', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    let calls = 0; let pauses = 0;
    const poller = createPaymentPoller({ maxDuration: 2500, request: async () => { calls++; return pending; }, onStatus() {}, onError() {}, onBusy() {}, onPause() { pauses++; } });
    await poller.start();
    t.mock.timers.tick(2500); await flush();
    assert.equal(calls, 2); assert.equal(pauses, 1);
    t.mock.timers.tick(10000); await flush(); assert.equal(calls, 2); poller.dispose();
  });
});

test('VietQR exact backend fields, clipboard success/failure and image failure', async t => {
  const runner = hookRunner();
  const feedback = [];
  const { PaymentInstructions } = loader({ react: runner.react, '@/lib/toast': { toast: { success: msg => feedback.push(msg), error: msg => feedback.push(msg) } } })('@/components/payment/payment-instructions');
  let tree = runner.render(PaymentInstructions, { payment });
  assert.ok(textContent(tree).includes(payment.transferContent));
  assert.ok(textContent(tree).includes(payment.bankAccount.accountNumber));
  assert.ok(textContent(tree).includes(payment.bankAccount.accountName));
  assert.equal(nodes(tree, node => node.type === 'img')[0].props.src, payment.qrUrl);
  const copied = [];
  Object.defineProperty(global.navigator, 'clipboard', { configurable: true, value: { writeText: async value => copied.push(value) } });
  t.after(() => delete global.navigator.clipboard);
  const buttons = nodes(tree, node => node.props?.['aria-label']?.startsWith('Sao chép'));
  await buttons[0].props.onClick(); await flush(); await buttons[1].props.onClick(); await flush();
  await buttons[2].props.onClick(); await flush();
  assert.deepEqual(copied, [payment.bankAccount.accountNumber, payment.transferContent, payment.amount]);
  assert.deepEqual(feedback.slice(0, 3), ['Đã sao chép số tài khoản', 'Đã sao chép nội dung chuyển khoản', 'Đã sao chép số tiền']);
  nodes(tree, node => node.type === 'img')[0].props.onLoad();
  tree = runner.render(PaymentInstructions, { payment });
  assert.equal(nodes(tree, node => node.props?.['aria-label'] === 'Đang tải mã QR').length, 0);
  global.navigator.clipboard.writeText = async () => { throw Error('denied'); };
  await buttons[0].props.onClick(); await flush(); assert.ok(feedback.some(msg => msg.includes('Không thể sao chép')));
  nodes(tree, node => node.type === 'img')[0].props.onError();
  tree = runner.render(PaymentInstructions, { payment });
  assert.ok(textContent(tree).includes('Không thể tải mã QR'));
  assert.ok(textContent(tree).includes(payment.transferContent));
  runner.dispose();
});

test('read-only instructions service uses the authenticated GET contract and no-store', async t => {
  const previous = global.fetch;
  const previousWindow = global.window, previousStorage = global.localStorage;
  global.window = {};
  global.localStorage = { getItem: key => key === 'tmdemy_access_token' ? 'local-access' : null };
  t.after(() => { global.fetch = previous; global.window = previousWindow; global.localStorage = previousStorage; });
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url: String(url), options }); return Response.json({ success: true, data: { status: pending, payment } }); };
  const service = loader()('@/services/payment.service');
  await service.getOrderPaymentInstructions('order/encoded');
  assert.equal(calls.length, 1);
  assert(calls[0].url.endsWith('/api/payments/orders/order%2Fencoded/instructions'));
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer local-access');
  assert.equal(calls[0].options.body, undefined);
});

test('chapter lesson requests carry the current token and avoid caching protected study content', async t => {
  const previousFetch = global.fetch, previousWindow = global.window, previousStorage = global.localStorage;
  global.window = {};
  global.localStorage = { getItem: key => key === 'tmdemy_access_token' ? 'enrolled-student-access' : null };
  t.after(() => { global.fetch = previousFetch; global.window = previousWindow; global.localStorage = previousStorage; });
  let sent;
  global.fetch = async (url, options) => { sent = { url: String(url), options }; return Response.json({ success: true, data: [] }); };
  await loader()('@/services/lesson.service').lessonService.getLessonsByChapter('chapter-id');
  assert(sent.url.endsWith('/api/lessons/chapter/chapter-id'));
  assert.equal(sent.options.headers.get('Authorization'), 'Bearer enrolled-student-access');
  assert.equal(sent.options.cache, 'no-store');
});

test('background suspension stops future polling and foreground resumes one check', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const { createPaymentPoller } = loader()('@/lib/payment-poller');
  let calls = 0;
  const poller = createPaymentPoller({ request: async () => { calls++; return pending; }, onStatus() {}, onError() {}, onBusy() {}, onPause() {} });
  await poller.start(); poller.suspend();
  t.mock.timers.tick(15000); await flush(); assert.equal(calls, 1);
  await poller.resume(); assert.equal(calls, 2);
  poller.dispose(); await poller.resume(); assert.equal(calls, 2);
});

test('recovery authorization, wrong identity, deadline races and terminal safety', async t => {
  for (const scenario of ['forbidden', 'unauthorized', 'not-found', 'wrong-order', 'manual-review', 'expired', 'deadline']) {
    await t.test(scenario, async () => {
      const runner = hookRunner();
      let refreshes = 0;
      const state = { ...pending, paymentCode: payment.paymentCode, expiresAt: payment.expiresAt, paymentMethod: 'sepay_bank_transfer' };
      if (scenario === 'manual-review') state.paymentState = 'manual_review';
      if (scenario === 'expired') state.paymentState = 'expired';
      let live = { status: state, error: null, busy: false, paused: false, refresh() { refreshes++; } };
      const order = { id: 'order-1', code: 'DH-ORIGINAL', courseId: 'course-1', amount: 199000, discount: 0, total: 199000, course: { title: 'Private course', slug: 'private-course' } };
      const router = { refresh() {} };
      let load;
      load = loader({
        react: runner.react, 'next/navigation': { useRouter: () => router },
        '@/contexts/auth-context': { useAuth: () => ({ user: { id: 'student-a' } }) },
        '@/components/layout/app-shell': { AppShell: ({ children }) => children },
        '@/components/auth/route-guard': { RouteGuard: ({ children }) => children },
        '@/hooks/use-payment-status': { usePaymentStatus: () => live },
        '@/services/enrollment.service': { enrollmentService: { getMyEnrollments: async () => ({ success: true, data: [] }) } },
        '@/services/payment.service': {
          getOrderPaymentInstructions: async () => {
            if (['forbidden', 'unauthorized', 'not-found'].includes(scenario)) {
              const { AppApiError } = load('@/types/api');
              throw new AppApiError({ statusCode: scenario === 'forbidden' ? 403 : scenario === 'unauthorized' ? 401 : 404, message: 'Never render raw server content' });
            }
            return { success: true, data: { status: state, order: { ...order, id: scenario === 'wrong-order' ? 'other' : order.id }, payment: ['manual-review', 'expired'].includes(scenario) ? null : payment } };
          },
          createPaymentCheckout() { throw Error('GET recovery must not create an Order'); },
        },
      });
      const { PaymentCheckout } = load('@/components/payment/payment-checkout');
      const root = runner.render(PaymentCheckout, { orderId: 'order-1' });
      const inner = nodes(root, node => node.type?.name === 'PaymentContent')[0];
      let tree = runner.render(inner.type, inner.props); runner.effects(); await flush();
      tree = runner.render(inner.type, inner.props);
      assert(!textContent(tree).includes('Never render raw server content'));
      if (['forbidden', 'unauthorized', 'not-found'].includes(scenario)) {
        assert.equal(nodes(tree, node => node.type?.name === 'PaymentOrderSummaryView').length, 0);
      }
      if (scenario !== 'deadline') assert.equal(nodes(tree, node => node.type?.name === 'PaymentInstructions').length, 0);
      else {
        const countdown = nodes(tree, node => node.type?.name === 'PaymentCountdown')[0];
        countdown.props.onDeadline();
        tree = runner.render(inner.type, inner.props);
        assert.equal(refreshes, 1);
        assert.equal(nodes(tree, node => node.type?.name === 'PaymentInstructions').length, 0, 'stop offering expired instructions immediately');
        assert(textContent(tree).includes('Đang kiểm tra kết quả tại thời điểm hết hạn'));
        live = { ...live, status: { ...state, status: 'completed', paymentState: 'completed', courseAccessGranted: true } };
        tree = runner.render(inner.type, inner.props);
        const result = nodes(tree, node => node.type?.name === 'PaymentStatusView')[0];
        assert.equal(result.props.status.paymentState, 'completed', 'server completion wins a deadline race');
      }
      runner.dispose();
    });
  }
});

test('status hook refreshes on focus and removes listeners on unmount', async t => {
  const runner = hookRunner();
  const windowEvents = new EventTarget();
  const documentEvents = new EventTarget();
  documentEvents.visibilityState = 'visible';
  const originalWindow = global.window; const originalDocument = global.document;
  global.window = windowEvents; global.document = documentEvents;
  t.after(() => { runner.dispose(); global.window = originalWindow; global.document = originalDocument; });
  let calls = 0;
  const { usePaymentStatus } = loader({ react: runner.react, '@/services/payment.service': { getOrderPaymentStatus: async () => { calls++; return { success: true, data: { ...pending, paymentState: 'completed' } }; } } })('@/hooks/use-payment-status');
  runner.render(usePaymentStatus, 'order-1'); runner.effects(); await flush(); assert.equal(calls, 1);
  windowEvents.dispatchEvent(new Event('focus')); await flush(); assert.equal(calls, 2);
  documentEvents.dispatchEvent(new Event('visibilitychange')); await flush(); assert.equal(calls, 3);
  runner.dispose(); windowEvents.dispatchEvent(new Event('focus')); await flush(); assert.equal(calls, 3);
});

test('payment view restores instructions without checkout POST and refetches enrollment on confirmed access', async t => {
  for (const recover of [false, true]) {
    await t.test(recover ? 'server instruction recovery after reload' : 'confirmed success and stale error', async () => {
      const runner = hookRunner();
      let instructionReads = 0; let enrollmentReads = 0; let routeRefreshes = 0;
      const recoveredStatus = { ...pending, paymentMethod: 'sepay_bank_transfer', paymentCode: payment.paymentCode, expiresAt: payment.expiresAt };
      let response = { status: recoveredStatus, error: null, busy: false, paused: false, refresh() {} };
      const router = { refresh() { routeRefreshes++; } };
      const order = { id: 'order-1', code: 'DH-REAL', amount: 199000, discount: 0, total: 199000, course: { title: 'Actual course', slug: 'actual-course' } };
      const load = loader({
        react: runner.react,
        'next/navigation': { useRouter: () => router },
        '@/contexts/auth-context': { useAuth: () => ({ user: { id: 'student-a' } }) },
        '@/components/layout/app-shell': { AppShell: ({ children }) => children },
        '@/components/auth/route-guard': { RouteGuard: ({ children }) => children },
        '@/components/ui/button': { Button: 'button' },
        '@/hooks/use-payment-status': { usePaymentStatus: () => response },
        '@/services/enrollment.service': { enrollmentService: { getMyEnrollments: async () => { enrollmentReads++; return { success: true, data: [] }; } } },
        '@/services/payment.service': {
          getOrderPaymentInstructions: async id => { instructionReads++; assert.equal(id, 'order-1'); return { success: true, data: { order, status: recoveredStatus, payment } }; },
          createPaymentCheckout() { throw Error('Recovery must never create checkout'); },
        },
      });
      if (!recover) load('@/lib/payment').rememberCheckout('student-a', { order, payment });
      const { PaymentCheckout } = load('@/components/payment/payment-checkout');
      const root = runner.render(PaymentCheckout, { orderId: 'order-1' });
      const inner = nodes(root, node => node.type?.name === 'PaymentContent')[0];
      let tree = runner.render(inner.type, inner.props); runner.effects(); await flush();
      tree = runner.render(inner.type, inner.props);
      assert.equal(instructionReads, 1);
      assert.equal(nodes(tree, node => node.type?.name === 'PaymentInstructions').length, 1);
      if (recover) {
        const restored = nodes(tree, node => node.type?.name === 'PaymentInstructions')[0];
        assert.equal(restored.props.payment, payment);
      } else {
        assert.equal(enrollmentReads, 0);
        response = { ...response, status: { ...pending, status: 'completed', paymentState: 'completed', courseAccessGranted: true } };
        runner.render(inner.type, inner.props); runner.effects(); await flush();
        assert.equal(enrollmentReads, 1); assert.equal(routeRefreshes, 1);
        response = { ...response, error: new Error('Network unavailable') };
        tree = runner.render(inner.type, inner.props);
        assert.equal(nodes(tree, node => node.type?.name === 'PaymentStatusView').length, 0, 'a failed fresh check hides stale success actions');
        assert.ok(!textContent(tree).includes('Network unavailable'), 'raw status errors stay out of user feedback');
      }
      runner.dispose();
    });
  }
});

test('order history learning actions require enrollment, preserve manual orders and isolate users', async t => {
  const oldWindow = global.window; const oldDocument = global.document;
  global.window = new EventTarget(); global.document = new EventTarget();
  global.document.visibilityState = 'visible';
  t.after(() => { global.window = oldWindow; global.document = oldDocument; });
  for (const enrollmentStatus of ['ACTIVE', 'CANCELED', null, 'FETCH_FAILED']) {
    await t.test(`completed manual order with ${enrollmentStatus}`, async () => {
      const runner = hookRunner();
      let userId = 'student-a';
      const courseId = '11111111-1111-4111-8111-111111111111';
      const router = { push() {} };
      const load = loader({
        react: runner.react,
        'next/navigation': { useRouter: () => router, useSearchParams: () => new URLSearchParams() },
        '@/contexts/auth-context': { useAuth: () => ({ user: { id: userId }, isAuthenticated: true, status: 'authenticated' }) },
        '@/components/layout/app-shell': { AppShell: ({ children }) => children },
        '@/services/order.service': { orderService: { getMyOrders: async () => ({ success: true, data: { orders: [{ id: 'manual-order', status: 'completed', paymentMethod: 'manual', total: 1000, courseId, course: { title: 'Manual course', slug: 'manual-course' } }], pagination: { page: 1, totalPages: 1 } } }) } },
        '@/services/enrollment.service': { enrollmentService: { getMyEnrollments: async () => {
          if (enrollmentStatus === 'FETCH_FAILED') throw Error('offline');
          return { success: true, data: enrollmentStatus ? [{ courseId, status: enrollmentStatus }] : [] };
        } } },
      });
      const page = load('@/app/orders/page').default;
      const inner = nodes(page(), node => node.type?.name === 'OrdersContent')[0];
      runner.render(inner.type); runner.effects(); await flush();
      const tree = runner.render(inner.type);
      const learning = nodes(tree, node => node.props?.href === '/learn/manual-course');
      assert.equal(learning.length, enrollmentStatus === 'ACTIVE' ? 1 : 0);
      assert.ok(textContent(tree).includes('ĐÃ HOÀN THÀNH'), 'manual order state is preserved');
      if (enrollmentStatus === 'FETCH_FAILED') assert.ok(textContent(tree).includes('Chưa xác minh được quyền học'));
      userId = 'student-b';
      const switched = runner.render(inner.type);
      assert.equal(nodes(switched, node => node.props?.href === '/learn/manual-course').length, 0);
      assert.ok(!textContent(switched).includes('Manual course'));
      runner.dispose();
    });
  }
});

test('checkout form prevents duplicate submissions, forwards selected coupon, and guards ownership', async t => {
  async function setup({ owned = false, checkoutError = false } = {}) {
    const runner = hookRunner();
    const navigations = []; const payloads = [];
    let resolveCheckout;
    const course = { id: '11111111-1111-4111-8111-111111111111', slug: 'real-course', title: 'Real course', price: 199000, image: '/course.png' };
    const load = loader({
      react: runner.react,
      'next/navigation': { useRouter: () => ({ push: url => navigations.push(url), replace() {} }), useSearchParams: () => new URLSearchParams('course=real-course') },
      '@/contexts/auth-context': { useAuth: () => ({ user: { id: 'student-a' }, status: 'authenticated', isAuthenticated: true }) },
      '@/components/layout/app-shell': { AppShell: ({ children }) => children },
      '@/components/ui/button': { Button: 'button' }, '@/components/ui/input': { Input: 'input' },
      '@/services/course.service': { courseService: { getCourseBySlug: async () => ({ data: course }) } },
      '@/services/enrollment.service': { enrollmentService: { getMyEnrollments: async () => ({ success: true, data: owned ? [{ courseId: '11111111-1111-4111-8111-111111111111', status: 'ACTIVE' }] : [] }) } },
      '@/services/coupon.service': { couponService: { checkCoupon: async () => ({ success: true, data: { discount: 99000, finalPrice: 100000, coupon: { code: 'SELECTED' } } }) } },
      '@/services/payment.service': { createPaymentCheckout: (...payload) => {
        payloads.push(payload);
        if (checkoutError) {
          const { AppApiError } = load('@/types/api');
          const statusCode = typeof checkoutError === 'number' ? checkoutError : 400;
          return Promise.reject(new AppApiError({ statusCode, message: statusCode === 503 ? 'Payment service temporarily unavailable' : 'Coupon exhausted' }));
        }
        return new Promise(resolve => { resolveCheckout = resolve; });
      } },
      '@/lib/toast': { toast: { success() {} } },
    });
    const { CheckoutForm } = load('@/components/payment/checkout-form');
    const shell = runner.render(CheckoutForm);
    const inner = nodes(shell, node => node.type?.name === 'CheckoutContent')[0];
    // The module uses runner.react, so use a fresh hook slot layout for the inner tree.
    runner.dispose(); runner.reset();
    const component = inner.type;
    let tree = runner.render(component, inner.props); runner.effects(); await flush();
    tree = runner.render(component, inner.props);
    return { runner, component, props: inner.props, tree, payloads, navigations, course, finish: () => resolveCheckout({ success: true, data: { order: { id: 'order-1', amount: 199000, discount: 99000, total: 100000 }, payment } }) };
  }
  await t.test('already enrolled student has learning action and no checkout', async () => {
    const state = await setup({ owned: true });
    assert.ok(textContent(state.tree).includes('Vào học ngay'));
    assert.equal(nodes(state.tree, node => node.type === 'form').length, 0);
    assert.deepEqual(state.payloads, []); state.runner.dispose();
  });
  await t.test('selected coupon forwarded, repeated click locked before render', async () => {
    const state = await setup();
    nodes(state.tree, node => node.props?.id === 'payment-coupon')[0].props.onChange({ target: { value: 'SELECTED' } });
    let tree = state.runner.render(state.component, state.props);
    await nodes(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
    tree = state.runner.render(state.component, state.props);
    const button = nodes(tree, node => node.type === 'button' && node.props.onClick && textContent(node).includes('Tiếp tục'))[0];
    const running = button.props.onClick(); const repeated = button.props.onClick();
    assert.deepEqual(state.payloads, [['11111111-1111-4111-8111-111111111111', 'SELECTED']]);
    state.finish(); await running; await repeated; await flush();
    assert.deepEqual(state.navigations, ['/payment/order-1']); state.runner.dispose();
  });
  await t.test('coupon invalidated at checkout displays server error and remains correctable', async () => {
    const state = await setup({ checkoutError: true });
    const button = nodes(state.tree, node => node.type === 'button' && textContent(node).includes('Tiếp tục'))[0];
    await button.props.onClick(); await flush();
    const tree = state.runner.render(state.component, state.props);
    assert.ok(textContent(tree).includes('mã giảm giá không hợp lệ'));
    assert.equal(state.navigations.length, 0); state.runner.dispose();
  });
  await t.test('503 stays an unavailable backend error with no success, navigation or auto retry', async () => {
    const state = await setup({ checkoutError: 503 });
    const button = nodes(state.tree, node => node.type === 'button' && textContent(node).includes('Tiếp tục'))[0];
    await button.props.onClick(); await flush();
    const tree = state.runner.render(state.component, state.props);
    assert.ok(textContent(tree).includes('máy chủ tạm thời không khả dụng (HTTP 503)'));
    assert.equal(state.payloads.length, 1);
    assert.equal(state.navigations.length, 0);
    assert.ok(!textContent(tree).includes('Thanh toán thành công'));
    assert.equal(nodes(tree, node => node.type === 'button' && textContent(node).includes('Tiếp tục'))[0].props.disabled, false);
    state.runner.dispose();
  });
  for (const mode of ['development', 'production']) {
    await t.test(`${mode}: diagnostic details respect the environment boundary`, async t => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = mode;
      t.after(() => { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; });
      const state = await setup({ checkoutError: 503 });
      const button = nodes(state.tree, node => node.type === 'button' && textContent(node).includes('Tiếp tục'))[0];
      await button.props.onClick(); await flush();
      const tree = state.runner.render(state.component, state.props);
      const details = nodes(tree, node => node.type === 'details');
      assert.equal(details.length, mode === 'development' ? 1 : 0);
      if (mode === 'development') {
        assert.ok(textContent(details[0]).includes('POST /api/payments/checkout'));
        assert.ok(textContent(details[0]).includes('503'));
        assert.ok(textContent(details[0]).includes('Payment service temporarily unavailable'));
      }
      state.runner.dispose();
    });
  }
});
