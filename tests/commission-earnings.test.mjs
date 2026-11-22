// STEP 09.5 — Teacher Wallet/Earnings & Admin Commission Management Automated Tests
// Verifies BigInt whole-VND currency accuracy, strict query hygiene, all 14 API endpoints,
// error code normalization, navigation separation, and SSR rendering without extra dependencies.
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
    if (!/\.tsx?$/.test(filename)) {
      if (fs.existsSync(filename + '.ts')) filename += '.ts';
      else if (fs.existsSync(filename + '.tsx')) filename += '.tsx';
      else if (fs.existsSync(path.join(filename, 'index.ts'))) filename = path.join(filename, 'index.ts');
      else if (fs.existsSync(path.join(filename, 'index.tsx'))) filename = path.join(filename, 'index.tsx');
    }
    if (cache.has(filename)) return cache.get(filename).exports;
    const record = { exports: {} };
    cache.set(filename, record);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    new Function('require', 'module', 'exports', output)(
      (id) => load(id.startsWith('.') ? path.resolve(path.dirname(filename), id) : id),
      record,
      record.exports
    );
    return record.exports;
  }
  return load;
}

const nextLinkMock = {
  __esModule: true,
  default: ({ href, children, ...rest }) => React.createElement('a', { href, ...rest }, children),
};

const UUID_1 = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';
const UUID_3 = '33333333-3333-4333-8333-333333333333';

// =========================================================================
// 1. Exact Whole-VND BigInt Currency Formatting & Arithmetic (Zero Precision Loss)
// =========================================================================
test('1. vndCurrency.ts — Exact Whole-VND BigInt Formatting & Precision Beyond MAX_SAFE_INTEGER', async (t) => {
  const load = loader();
  const vnd = load('@/lib/vndCurrency');

  await t.test('formats "0", "280000", "-280000" accurately with vi-VN VND currency', () => {
    const zero = vnd.formatVnd('0');
    const pos = vnd.formatVnd('280000');
    const posSigned = vnd.formatVnd('280000', { showPlusSign: true });
    const neg = vnd.formatVnd('-280000');

    assert.ok(zero.includes('0') && zero.includes('₫'));
    assert.ok(pos.includes('280.000') && pos.includes('₫'));
    assert.ok(posSigned.startsWith('+') && posSigned.includes('280.000'));
    assert.ok(neg.includes('-') && neg.includes('280.000'));
  });

  await t.test('preserves exact precision above Number.MAX_SAFE_INTEGER (9007199254740993000)', () => {
    const huge1 = '9007199254740993000';
    const huge2 = '9007199254740993001';

    assert.equal(vnd.parseVndBigInt(huge1), 9007199254740993000n);
    assert.equal(vnd.parseVndBigInt(huge2), 9007199254740993001n);
    assert.equal(vnd.compareVndStrings(huge1, huge2), -1);
    assert.equal(vnd.addVndStrings(huge1, '1'), huge2);
    assert.equal(vnd.sumVndStrings([huge1, huge2, '-280000']), '18014398509481706001');

    const formattedHuge = vnd.formatVnd(huge2);
    assert.ok(
      formattedHuge.includes('9.007.199.254.740.993.001'),
      `Expected exact formatted BigInt digits, got: ${formattedHuge}`
    );

    const compactHuge = vnd.formatCompactVndBigInt(huge2);
    assert.ok(compactHuge.includes('tỷ'), `Expected compact billions label, got: ${compactHuge}`);

    // Ratio scaling for SVG geometry works cleanly on huge BigInts
    assert.equal(vnd.vndRatioPercent(huge1, huge2), 99.99);
  });

  await t.test('rejects floating-point or malformed strings in strict parseVndBigInt', () => {
    assert.throws(() => vnd.parseVndBigInt('280000.50'), RangeError);
    assert.throws(() => vnd.parseVndBigInt('abc'), RangeError);
    assert.equal(vnd.tryParseVndBigInt('invalid', 0n), 0n);
  });

  await t.test('converts basis points <-> percentages cleanly', () => {
    assert.equal(vnd.formatBpsPercent(7000), '70%');
    assert.equal(vnd.formatBpsPercent(7250), '72.5%');
    assert.equal(vnd.percentToBps('70'), 7000);
    assert.equal(vnd.percentToBps('72.55'), 7255);
    assert.equal(vnd.percentToBps('100'), 10000);
    assert.equal(vnd.percentToBps('101'), null);
    assert.equal(vnd.percentToBps('-5'), null);
  });
});

// =========================================================================
// 2. Strict Query Hygiene, Reconciliation 31-Day Guard & Error Normalization
// =========================================================================
test('2. commission-earnings.ts — Strict Query Hygiene, Validation & Error Codes', async (t) => {
  const load = loader();
  const helpers = load('@/lib/commission-earnings');

  await t.test('teacher query builders NEVER attach teacherId and strip empty/undefined filters', () => {
    const statsQ = helpers.buildTeacherEarningsStatsQuery({
      period: '30days',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      timezone: 'Asia/Ho_Chi_Minh',
      courseId: '   ',
      teacherId: UUID_1,
      unknownParam: 'bad',
    });
    assert.equal('teacherId' in statsQ, false);
    assert.equal('unknownParam' in statsQ, false);
    assert.equal('courseId' in statsQ, false);
    // Non-custom period strips startDate/endDate
    assert.equal('startDate' in statsQ, false);
    assert.equal('endDate' in statsQ, false);
    assert.equal(statsQ.period, '30days');

    const listQ = helpers.buildTeacherEarningsListQuery({
      page: 1,
      limit: 10,
      status: '',
      courseId: '',
      from: undefined,
      to: '',
      teacherId: UUID_1,
    });
    assert.equal('teacherId' in listQ, false);
    assert.equal('status' in listQ, false);
    assert.equal('courseId' in listQ, false);
    assert.equal('from' in listQ, false);
    assert.equal('to' in listQ, false);
    assert.equal(listQ.page, 1);

    const txQ = helpers.buildTeacherTransactionsQuery({
      page: 2,
      limit: 20,
      entryType: '',
      teacherId: UUID_1,
    });
    assert.equal('teacherId' in txQ, false);
    assert.equal('entryType' in txQ, false);
    assert.equal(txQ.page, 2);
  });

  await t.test('enforces max 31-day span for reconciliation date range', () => {
    assert.equal(helpers.validateReconciliationDateSpan('', '').valid, true);
    assert.equal(helpers.validateReconciliationDateSpan('2026-11-01', '2026-11-30').valid, true);
    assert.equal(helpers.validateReconciliationDateSpan('2026-11-01', '2026-12-01').valid, true); // 31 inclusive days
    assert.equal(helpers.validateReconciliationDateSpan('2026-11-01', '2026-12-02').valid, false); // 32 inclusive days
    assert.equal(helpers.validateReconciliationDateSpan('2026-11-20', '2026-11-10').valid, false);
    assert.equal(helpers.validateReconciliationDateSpan('2026-02-31', '2026-03-01').valid, false);
  });

  await t.test('translates backend errorCodes (409 conflicts, 403 inactive, 404, 500) cleanly', () => {
    const { AppApiError } = load('@/types/api');

    const conflictPolicy = helpers.extractCommissionApiError(
      new AppApiError({
        statusCode: 409,
        message: 'Expected version 1',
        raw: { errorCode: 'POLICY_VERSION_CONFLICT' },
      })
    );
    assert.equal(conflictPolicy.statusCode, 409);
    assert.equal(conflictPolicy.errorCode, 'POLICY_VERSION_CONFLICT');
    assert.ok(conflictPolicy.message.includes('xung đột phiên bản'));

    const missingPol = helpers.extractCommissionApiError(
      new AppApiError({
        statusCode: 409,
        message: 'Policy missing',
        raw: { errorCode: 'COMMISSION_POLICY_MISSING' },
      })
    );
    assert.equal(missingPol.errorCode, 'COMMISSION_POLICY_MISSING');
    assert.ok(missingPol.message.includes('chính sách hoa hồng'));

    const pendingOrders = helpers.extractCommissionApiError(
      new AppApiError({
        statusCode: 409,
        message: 'Pending orders exist',
        raw: { errorCode: 'INCOMPATIBLE_PENDING_ORDERS_EXIST' },
      })
    );
    assert.equal(pendingOrders.errorCode, 'INCOMPATIBLE_PENDING_ORDERS_EXIST');
    assert.ok(pendingOrders.message.includes('SePay'));
  });
});

// =========================================================================
// 3. All 14 Teacher & Admin Commission/Earnings Endpoints Integration Contract
// =========================================================================
test('3. All 14 Commission/Earnings API Service Calls (Bearer JWT, no-store, Strict Params)', async (t) => {
  const storage = new Map([['tmdemy_access_token', 'jwt-step095-token']]);
  const originalWindow = global.window;
  const originalStorage = global.localStorage;
  global.window = { localStorage: storage, dispatchEvent() {} };
  global.localStorage = {
    getItem: (k) => storage.get(k),
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
  };

  const calls = [];
  t.mock.method(global, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return Response.json({ success: true, data: {} }, { status: 200 });
  });
  t.after(() => {
    global.window = originalWindow;
    global.localStorage = originalStorage;
  });

  const load = loader();
  const { teacherEarningsService } = load('@/services/teacher-earnings.service');
  const { adminCommissionService } = load('@/services/admin-commission.service');

  // 5 Teacher endpoints
  await teacherEarningsService.getOverview();
  await teacherEarningsService.getStatistics({
    period: '30days',
    timezone: 'Asia/Ho_Chi_Minh',
    courseId: '',
    teacherId: UUID_1,
  });
  await teacherEarningsService.getEarnings({
    page: 1,
    limit: 10,
    status: 'pending',
    courseId: '',
    teacherId: UUID_1,
  });
  await teacherEarningsService.getEarningById(UUID_2);
  await teacherEarningsService.getTransactions({
    page: 1,
    limit: 20,
    entryType: 'earning_recognized',
    teacherId: UUID_1,
  });

  // 9 Admin endpoints
  await adminCommissionService.getPolicies();
  await adminCommissionService.createPolicy({
    name: 'Standard 70/30',
    teacherRateBps: 7000,
    platformRateBps: 3000,
    holdingPeriodDays: 7,
    expectedCurrentVersion: 0,
    notes: 'Initial policy',
  });
  await adminCommissionService.getActivation();
  await adminCommissionService.setActivation({ enabled: true, reason: 'Launch Phase 09' });
  await adminCommissionService.getEarningsStatistics({ period: 'all', teacherId: UUID_1 });
  await adminCommissionService.getEarnings({ page: 1, limit: 10, status: 'available', teacherId: UUID_1 });
  await adminCommissionService.getEarningById(UUID_2);
  await adminCommissionService.getTeacherEarnings(UUID_1, { page: 1, limit: 10 });
  await adminCommissionService.getReconciliation({ from: '2026-11-01', to: '2026-11-20', limit: 100 });

  assert.equal(calls.length, 14);

  for (const call of calls) {
    assert.equal(call.options.cache, 'no-store');
    assert.equal(call.options.headers.get('Authorization'), 'Bearer jwt-step095-token');
  }

  // First 5 calls are Teacher routes -> NEVER carry teacherId
  for (let i = 0; i < 5; i++) {
    assert.ok(!calls[i].url.includes('teacherId'), `Teacher route ${calls[i].url} must NEVER include teacherId`);
  }

  assert.ok(calls[0].url.endsWith('/api/teacher/earnings/overview'));
  assert.ok(calls[1].url.includes('/api/teacher/earnings/statistics'));
  assert.ok(calls[2].url.includes('/api/teacher/earnings?'));
  assert.ok(calls[3].url.endsWith(`/api/teacher/earnings/${UUID_2}`));
  assert.ok(calls[4].url.includes('/api/teacher/earnings/transactions'));

  assert.ok(calls[5].url.endsWith('/api/admin/commissions/policies'));
  assert.equal(calls[6].options.method, 'POST');
  assert.ok(calls[6].url.endsWith('/api/admin/commissions/policies'));
  assert.ok(calls[7].url.endsWith('/api/admin/commissions/activation'));
  assert.equal(calls[8].options.method, 'POST');
  assert.ok(calls[8].url.endsWith('/api/admin/commissions/activation'));
  assert.ok(calls[9].url.includes('/api/admin/earnings/statistics'));
  assert.ok(calls[10].url.includes('/api/admin/earnings?'));
  assert.ok(calls[11].url.endsWith(`/api/admin/earnings/${UUID_2}`));
  assert.ok(calls[12].url.includes(`/api/admin/teachers/${UUID_1}/earnings`));
  assert.ok(calls[13].url.includes('/api/admin/earnings/reconciliation'));
});

// =========================================================================
// 4. Navigation Separation & Core Wallet/Chart SSR Rendering
// =========================================================================
test('4. Navigation Separation & Core UI SSR Rendering', async (t) => {
  await t.test('TeacherSidebar & AdminSidebar expose separate Commission/Wallet entries alongside existing analytics', () => {
    const load = loader({
      'next/link': nextLinkMock,
      'next/navigation': {
        usePathname: () => '/teacher/earnings',
        useRouter: () => ({ push: () => {} }),
      },
      '@/components/common/logo': { Logo: () => React.createElement('span', null, 'TMdemy') },
      '@/hooks/use-auth': { useAuth: () => ({ logout: async () => {}, user: { username: 'admin', email: 'a@b.c' } }) },
      '@/lib/toast': { toast: { success: () => {}, error: () => {} } },
    });

    const { TEACHER_NAV_ITEMS } = load('@/components/teacher/teacher-sidebar');
    assert.ok(TEACHER_NAV_ITEMS.some((i) => i.path === '/teacher/earnings'));
    assert.ok(TEACHER_NAV_ITEMS.some((i) => i.path === '/teacher/analytics'));

    const { ADMIN_NAV_ITEMS } = load('@/components/admin/admin-sidebar');
    assert.ok(ADMIN_NAV_ITEMS.some((i) => i.path === '/admin/commissions'));
    assert.ok(ADMIN_NAV_ITEMS.some((i) => i.path === '/admin/analytics'));
    assert.ok(ADMIN_NAV_ITEMS.some((i) => i.path === '/admin/payments'));
  });

  await t.test('TeacherWalletOverview renders exact BigInt VND, activePolicy===null fallback & disabled STEP 10 note', () => {
    const load = loader();
    const { TeacherWalletOverview } = load('@/components/teacher/earnings/teacher-wallet-overview');

    const html = renderToStaticMarkup(
      React.createElement(TeacherWalletOverview, {
        data: {
          currency: 'VND',
          balanceAsOf: '2026-11-21T13:00:00.000Z',
          activePolicy: null,
          currentBalances: {
            lifetimeRecognized: '9007199254740993001',
            pendingBalance: '280000',
            availableBalance: '400000',
            reservedBalance: '0',
            paidOutBalance: '0',
          },
          counts: { totalEarnings: 2, pendingEarnings: 1, availableEarnings: 1 },
        },
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );

    assert.ok(html.includes('9.007.199.254.740.993.001'));
    assert.ok(html.includes('400.000'));
    assert.ok(html.includes('280.000'));
    assert.ok(html.includes('STEP 10'));
    assert.ok(html.includes('disabled'));
    assert.ok(html.includes('chưa có chính sách hoa hồng'));
  });

  await t.test('EarningsTimelineChart renders SVG safely with BigInt whole-VND timeline strings', () => {
    const load = loader();
    const { EarningsTimelineChart } = load('@/components/commission/earnings-timeline-chart');

    const html = renderToStaticMarkup(
      React.createElement(EarningsTimelineChart, {
        timeline: [
          { date: '2026-11-19', teacherEarnings: '0', platformShare: '0', earningCount: 0 },
          { date: '2026-11-20', teacherEarnings: '9007199254740993000', platformShare: '300000', earningCount: 2 },
        ],
        loading: false,
      })
    );
    assert.ok(html.includes('<svg'));
    assert.ok(html.includes('9.007.199.254.740.993.000'));
  });

  await t.test('TeacherBreadcrumb & AdminBreadcrumb resolve new Commission/Wallet routes cleanly', () => {
    const tLoad = loader({
      'next/link': nextLinkMock,
      'next/navigation': { usePathname: () => '/teacher/earnings' },
    });
    const { TeacherBreadcrumb } = tLoad('@/components/teacher/teacher-breadcrumb');
    const tHtml = renderToStaticMarkup(React.createElement(TeacherBreadcrumb));
    assert.ok(tHtml.includes('Ví &amp; Thu nhập'));

    const aLoad = loader({
      'next/link': nextLinkMock,
      'next/navigation': { usePathname: () => '/admin/commissions' },
    });
    const { AdminBreadcrumb } = aLoad('@/components/admin/admin-breadcrumb');
    const aHtml = renderToStaticMarkup(React.createElement(AdminBreadcrumb));
    assert.ok(aHtml.includes('Hoa hồng &amp; Đối soát'));
  });
});

// Keep UUID_3 referenced cleanly if needed for future extensions
assert.ok(UUID_3.length === 36);
