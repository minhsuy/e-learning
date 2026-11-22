// STEP 08.3 — Comprehensive Admin Analytics & Payment Management Frontend Tests
// Exercises actual production TS/TSX modules without adding external test dependencies.
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

const nextImageMock = {
  __esModule: true,
  default: ({ src, alt, className }) => React.createElement('img', { src, alt, className }),
};

// Realistic DTO fixtures matching Backend STEP 08.2 & STEP 05 contracts
const FINANCIAL_STATS_FIXTURE = {
  grossRevenue: 1740000,
  netRevenue: 1390000,
  totalOrders: 13,
  completedOrders: 10,
  pendingOrders: 2,
  rejectedOrders: 1,
  averageOrderValue: 139000,
  revenueByMonth: [
    { month: '2026-10', revenue: 450000, orderCount: 3 },
    { month: '2026-11', revenue: 940000, orderCount: 7 },
  ],
  paidOrders: 8,
  freeOrders: 2,
  totalDiscount: 350000,
  reporting: {
    timeBasis: 'recognizedAt',
    timezone: 'Asia/Ho_Chi_Minh',
    startDate: '2026-10-19T17:00:00.000Z',
    endDate: '2026-11-18T17:00:00.000Z',
    granularity: 'day',
    legacyEstimatedOrders: 2,
    undatedLegacyOrders: 0,
  },
  methodBreakdown: [
    { paymentMethod: 'sepay_bank_transfer', completedOrders: 5, revenue: 980000 },
    { paymentMethod: 'manual_bank_transfer', completedOrders: 1, revenue: 200000 },
    { paymentMethod: 'free', completedOrders: 2, revenue: 0 },
    { paymentMethod: 'legacy_unknown', completedOrders: 2, revenue: 210000 },
  ],
  revenueTimeline: [
    { date: '2026-11-18', revenue: 750000, orderCount: 5, ordersCount: 5 },
    { date: '2026-11-16', revenue: 0, orderCount: 0, ordersCount: 0 },
    { date: '2026-11-17', revenue: 210000, orderCount: 2, ordersCount: 2 },
  ],
};

const COURSE_SALES_FIXTURE = {
  reporting: {
    groupBy: 'course',
    timeBasis: 'recognizedAt',
    timezone: 'Asia/Ho_Chi_Minh',
    startDate: '2026-10-19T17:00:00.000Z',
    endDate: '2026-11-18T17:00:00.000Z',
  },
  rows: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      label: 'Course A1 TypeScript',
      revenue: 1050000,
      grossSales: 1400000,
      discount: 350000,
      completedOrders: 7,
      paidOrders: 5,
      freeOrders: 2,
      teacher: { id: '22222222-2222-4222-8222-222222222222', name: 'TeacherA' },
    },
    {
      id: null,
      label: '(Đơn hàng không gắn khóa học)',
      revenue: 90000,
      grossSales: 90000,
      discount: 0,
      completedOrders: 1,
      paidOrders: 1,
      freeOrders: 0,
      teacher: null,
    },
  ],
  pagination: { page: 1, limit: 10, total: 12, totalPages: 2 },
};

const TEACHER_SALES_FIXTURE = {
  reporting: {
    groupBy: 'teacher',
    timeBasis: 'recognizedAt',
    timezone: 'Asia/Ho_Chi_Minh',
    startDate: '2026-10-19T17:00:00.000Z',
    endDate: '2026-11-18T17:00:00.000Z',
  },
  rows: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      label: 'TeacherA',
      revenue: 1050000,
      grossSales: 1400000,
      discount: 350000,
      completedOrders: 7,
      paidOrders: 5,
      freeOrders: 2,
      courseCount: 3,
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

const DIAGNOSTICS_FIXTURE = {
  generatedAt: '2026-11-19T12:00:00.000Z',
  inbox: {
    received: 1,
    processing: 0,
    processed: 14,
    failed: 1,
    totalReceived: 16,
    pending: 1,
    retryExhausted: 1,
  },
  manualReviewTransactions: 2,
  unmatchedIncomingTransactions: 1,
  oldestPendingAgeMs: 45000,
  processingLatency: {
    averageMs: 320.5,
    samples: 14,
    scope: 'persisted-final-attempt',
  },
  ingestionLatency: {
    samples: 0,
    accepted: 0,
    failed: 0,
    averageMs: null,
    scope: 'current-process-authenticated-ingestion',
  },
};

const RECONCILIATION_FIXTURE = {
  generatedAt: '2026-11-19T12:00:00.000Z',
  window: {
    from: '2026-10-20T12:00:00.000Z',
    to: '2026-11-19T12:00:00.000Z',
  },
  internal: {
    complete: true,
    limit: 100,
    scanned: { orders: 12, transactions: 10, unresolvedEvents: 1 },
    excluded: { legacyPaid: 3, free: 4 },
  },
  external: {
    status: 'NOT_CONFIGURED',
    complete: false,
    nextCursor: null,
    transactions: 0,
  },
  durableProviderUuidMappingSupported: false,
  automaticRepair: false,
  findings: [
    {
      kind: 'MANUAL_REVIEW',
      outcome: 'REQUIRES_MANUAL_REVIEW',
      orderId: '33333333-3333-4333-8333-333333333333',
      transactionId: '44444444-4444-4444-8444-444444444444',
    },
    {
      kind: 'RETRY_EXHAUSTED',
      outcome: 'REQUIRES_MANUAL_REVIEW',
      eventId: '55555555-5555-4555-8555-555555555555',
    },
  ],
};

// =========================================================================
// 1. Admin RBAC, Sidebar Navigation & Breadcrumb Tests
// =========================================================================
test('1-3. Admin RBAC, Analytics & Payment Sidebar Navigation', async (t) => {
  await t.test('AdminShell enforces requireAuth and allowedRoles=["admin"] only', () => {
    let capturedGuardProps = null;
    const load = loader({
      '@/components/auth/route-guard': {
        RouteGuard: (props) => {
          capturedGuardProps = props;
          return React.createElement('div', { 'data-guard': 'admin' }, props.children);
        },
      },
      [path.join(root, 'src', 'components', 'admin', 'admin-sidebar')]: {
        AdminSidebar: () => React.createElement('aside', null),
      },
      [path.join(root, 'src', 'components', 'admin', 'admin-header')]: {
        AdminHeader: () => React.createElement('header', null),
      },
    });
    const { AdminShell } = load('@/components/admin/admin-shell');
    renderToStaticMarkup(React.createElement(AdminShell, null, React.createElement('div', null, 'Admin Content')));
    assert.equal(capturedGuardProps.requireAuth, true);
    assert.deepEqual(capturedGuardProps.allowedRoles, ['admin']);
  });

  await t.test('AdminSidebar exposes Analytics & Payment Management without duplicates and highlights active route', () => {
    const load = loader({
      'next/link': nextLinkMock,
      'next/navigation': {
        usePathname: () => '/admin/analytics',
        useRouter: () => ({ push: () => {} }),
      },
      '@/components/common/logo': { Logo: () => React.createElement('span', null, 'TMdemy') },
      '@/hooks/use-auth': {
        useAuth: () => ({ logout: async () => {}, user: { username: 'admin_root', email: 'admin@tmdemy.vn', role: 'admin' } }),
      },
      '@/lib/toast': { toast: { success: () => {}, error: () => {} } },
    });

    const { ADMIN_NAV_ITEMS, AdminSidebar, isAdminNavItemActive } = load('@/components/admin/admin-sidebar');

    // No duplicate paths or labels
    const paths = ADMIN_NAV_ITEMS.map((i) => i.path);
    const labels = ADMIN_NAV_ITEMS.map((i) => i.label);
    assert.equal(new Set(paths).size, paths.length, 'Sidebar must not contain duplicate paths');
    assert.equal(new Set(labels).size, labels.length, 'Sidebar must not contain duplicate labels');

    // Required items present alongside preserved Orders item
    assert.ok(ADMIN_NAV_ITEMS.some((i) => i.label === 'Phân tích & Báo cáo' && i.path === '/admin/analytics'));
    assert.ok(ADMIN_NAV_ITEMS.some((i) => i.label === 'Quản lý thanh toán' && i.path === '/admin/payments'));
    assert.ok(ADMIN_NAV_ITEMS.some((i) => i.label === 'Đơn hàng' && i.path === '/admin/orders'));

    // Active state logic
    assert.equal(isAdminNavItemActive('/admin/analytics', '/admin/analytics'), true);
    assert.equal(isAdminNavItemActive('/admin/analytics', '/admin/payments'), false);
    assert.equal(isAdminNavItemActive('/admin/payments', '/admin/payments'), true);
    assert.equal(isAdminNavItemActive('/admin/orders', '/admin/payments'), false);

    // Rendered HTML marks current page with aria-current="page" and mobile drawer classes
    const html = renderToStaticMarkup(React.createElement(AdminSidebar, { isOpen: false }));
    assert.ok(html.includes('Phân tích &amp; Báo cáo'));
    assert.ok(html.includes('Quản lý thanh toán'));
    assert.ok(html.includes('aria-current="page"'));
    assert.ok(html.includes('-translate-x-full lg:translate-x-0'));
  });

  await t.test('AdminBreadcrumb renders exact Vietnamese titles for /admin/analytics and /admin/payments', () => {
    for (const [route, expected] of [
      ['/admin/analytics', 'Phân tích &amp; Báo cáo'],
      ['/admin/payments', 'Quản lý thanh toán'],
    ]) {
      const load = loader({
        'next/link': nextLinkMock,
        'next/navigation': { usePathname: () => route },
      });
      const { AdminBreadcrumb } = load('@/components/admin/admin-breadcrumb');
      const html = renderToStaticMarkup(React.createElement(AdminBreadcrumb));
      assert.ok(html.includes(expected), `Breadcrumb for ${route} should include ${expected}`);
    }
  });
});

// =========================================================================
// 4-12. Financial Filter Validation, Query Mapping, Timeline & Method Breakdown
// =========================================================================
test('4-12. Analytics Filters, Query Construction, Date Validation, Timeline & Method Breakdown', async (t) => {
  const load = loader();
  const analytics = load('@/lib/admin-analytics');

  await t.test('builds timeBasis=recognizedAt and timezone=Asia/Ho_Chi_Minh query parameters by default', () => {
    const query = analytics.buildFinancialQueryParams(analytics.DEFAULT_ANALYTICS_FILTERS);
    assert.equal(query.timeRange, '30days');
    assert.equal(query.timeBasis, 'recognizedAt');
    assert.equal(query.timezone, 'Asia/Ho_Chi_Minh');
    assert.equal(query.paymentMethod, 'all');
    assert.equal(query.startDate, undefined);
    assert.equal(query.endDate, undefined);
  });

  await t.test('maps 7days, 30days, 12months, custom periods and UUID filters accurately', () => {
    const teacherUuid = '22222222-2222-4222-8222-222222222222';
    const courseUuid = '11111111-1111-4111-8111-111111111111';
    for (const period of ['7days', '30days', '12months', 'all']) {
      const q = analytics.buildFinancialQueryParams({
        ...analytics.DEFAULT_ANALYTICS_FILTERS,
        timeRange: period,
        teacherId: teacherUuid,
        courseId: courseUuid,
        timezone: 'UTC',
      });
      assert.equal(q.timeRange, period);
      assert.equal(q.timezone, 'UTC');
      assert.equal(q.teacherId, teacherUuid);
      assert.equal(q.courseId, courseUuid);
    }

    const customQ = analytics.buildFinancialQueryParams({
      ...analytics.DEFAULT_ANALYTICS_FILTERS,
      timeRange: 'custom',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      paymentMethod: 'sepay_bank_transfer',
    });
    assert.equal(customQ.startDate, '2026-10-01');
    assert.equal(customQ.endDate, '2026-10-31');
    assert.equal(customQ.paymentMethod, 'sepay_bank_transfer');
  });

  await t.test('validates custom date ranges: rejects impossible calendar dates, reversed spans, and > 5 years', () => {
    assert.equal(analytics.validateAnalyticsDateRange('30days').valid, true);
    assert.equal(analytics.validateAnalyticsDateRange('custom', '', '2026-11-18').valid, false);
    assert.equal(analytics.validateAnalyticsDateRange('custom', '2026-02-31', '2026-03-05').valid, false);
    assert.equal(analytics.validateAnalyticsDateRange('custom', '2026-11-20', '2026-11-10').valid, false);
    assert.equal(analytics.validateAnalyticsDateRange('custom', '2020-01-01', '2026-11-18').valid, false);
    assert.equal(analytics.validateAnalyticsDateRange('custom', '2026-10-01', '2026-11-18').valid, true);
  });

  await t.test('normalizes revenueTimeline in strict chronological order preserving zero-value buckets', () => {
    const points = analytics.normalizeRevenueTimeline(FINANCIAL_STATS_FIXTURE);
    assert.deepEqual(
      points.map((p) => p.date),
      ['2026-11-16', '2026-11-17', '2026-11-18']
    );
    assert.equal(points[0].revenue, 0);
    assert.equal(points[0].orderCount, 0);
    assert.equal(points[2].revenue, 750000);
    assert.equal(points[2].orderCount, 5);
  });

  await t.test('separates Free orders (0 VND) from monetary revenue breakdown without fabricating revenue', () => {
    const result = analytics.normalizeMethodBreakdown(FINANCIAL_STATS_FIXTURE.methodBreakdown);
    assert.equal(result.totalRevenue, 1390000);
    assert.equal(result.totalOrders, 10);
    assert.equal(result.monetaryItems.length, 3);
    assert.ok(!result.monetaryItems.some((item) => item.paymentMethod === 'free'));
    assert.equal(result.freeItem.completedOrders, 2);
    assert.equal(result.freeItem.revenue, 0);
    assert.equal(result.freeItem.revenueSharePercent, null);
    assert.equal(result.freeItem.orderSharePercent, 20);
  });
});

// =========================================================================
// 4, 9, 10, 11, 13, 14, 15, 20. Analytics UI Component Rendering Tests
// =========================================================================
test('4, 9-15, 20. Analytics KPI, Charts, Legacy Notice & Sales Breakdown Rendering', async (t) => {
  const load = loader({
    'next/link': nextLinkMock,
  });

  await t.test('AnalyticsKpiGrid maps exact Financial KPI fields and accounting scope notice', () => {
    const { AnalyticsKpiGrid } = load('@/components/admin/analytics/analytics-kpi-grid');
    const html = renderToStaticMarkup(
      React.createElement(AnalyticsKpiGrid, {
        data: FINANCIAL_STATS_FIXTURE,
        loading: false,
        periodLabel: '30 ngày gần nhất',
      })
    );
    assert.ok(html.includes('Tổng doanh thu đã ghi nhận'));
    assert.ok(html.includes('1.390.000'));
    assert.ok(html.includes('Doanh thu trước giảm giá'));
    assert.ok(html.includes('1.740.000'));
    assert.ok(html.includes('Tổng tiền giảm giá'));
    assert.ok(html.includes('350.000'));
    assert.ok(html.includes('Đơn trả phí'));
    assert.ok(html.includes('Đơn miễn phí'));
    assert.ok(html.includes('Giá trị đơn trung bình'));
    assert.ok(html.includes('139.000'));
    assert.ok(html.includes('không đồng nhất với tiền thực nhận tại tài khoản ngân hàng'));
  });

  await t.test('RevenueTrendChart renders SVG series, recognizedAt badge, legacyEstimatedOrders notice, and empty/error states', () => {
    const { RevenueTrendChart } = load('@/components/admin/analytics/revenue-trend-chart');
    const dataHtml = renderToStaticMarkup(
      React.createElement(RevenueTrendChart, {
        data: FINANCIAL_STATS_FIXTURE,
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(dataHtml.includes('<svg'));
    assert.ok(dataHtml.includes('Asia/Ho_Chi_Minh'));
    assert.ok(dataHtml.includes('COALESCE(paidAt, createdAt)'));
    // Legacy estimated notice when legacyEstimatedOrders = 2
    assert.ok(dataHtml.includes('đơn hàng lịch sử chưa ghi nhận mốc'));

    const emptyHtml = renderToStaticMarkup(
      React.createElement(RevenueTrendChart, {
        data: { ...FINANCIAL_STATS_FIXTURE, revenueTimeline: [], revenueByMonth: [] },
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(emptyHtml.includes('Chưa có dữ liệu doanh thu'));

    const errorHtml = renderToStaticMarkup(
      React.createElement(RevenueTrendChart, {
        data: null,
        loading: false,
        error: 'Mất kết nối máy chủ',
        onRetry: () => {},
      })
    );
    assert.ok(errorHtml.includes('Mất kết nối máy chủ'));
    assert.ok(errorHtml.includes('Thử lại'));
  });

  await t.test('PaymentMethodChart renders Donut chart and separates Free 0 VND orders', () => {
    const { PaymentMethodChart } = load('@/components/admin/analytics/payment-method-chart');
    const html = renderToStaticMarkup(
      React.createElement(PaymentMethodChart, {
        breakdown: FINANCIAL_STATS_FIXTURE.methodBreakdown,
        loading: false,
      })
    );
    assert.ok(html.includes('Chuyển khoản SePay / VietQR'));
    assert.ok(html.includes('Chuyển khoản thủ công'));
    assert.ok(html.includes('Phương thức cũ / Chưa phân loại'));
    assert.ok(html.includes('Đơn hàng miễn phí (0 ₫)'));
    assert.ok(html.includes('không tính vào biểu đồ doanh thu tiền tệ'));
  });

  await t.test('SalesBreakdownCard renders Course & Teacher rankings with server pagination and non-commission label', () => {
    const { SalesBreakdownCard } = load('@/components/admin/analytics/sales-breakdown-section');

    const courseHtml = renderToStaticMarkup(
      React.createElement(SalesBreakdownCard, {
        groupBy: 'course',
        data: COURSE_SALES_FIXTURE,
        loading: false,
        error: null,
        sortBy: 'revenue',
        order: 'desc',
        onSortChange: () => {},
        onPageChange: () => {},
        onRetry: () => {},
      })
    );
    assert.ok(courseHtml.includes('Khóa học bán chạy nhất'));
    assert.ok(courseHtml.includes('Course A1 TypeScript'));
    assert.ok(courseHtml.includes('TeacherA'));
    assert.ok(courseHtml.includes('(Đơn hàng không gắn khóa học)'));
    assert.ok(courseHtml.includes('Trang 1 / 2'));

    const teacherHtml = renderToStaticMarkup(
      React.createElement(SalesBreakdownCard, {
        groupBy: 'teacher',
        data: TEACHER_SALES_FIXTURE,
        loading: false,
        error: null,
        sortBy: 'revenue',
        order: 'desc',
        onSortChange: () => {},
        onPageChange: () => {},
        onRetry: () => {},
      })
    );
    assert.ok(teacherHtml.includes('Doanh thu khóa học theo giảng viên'));
    assert.ok(teacherHtml.includes('chưa triển khai cơ chế tính hoa hồng, lương, ví hay rút tiền'));
    assert.ok(!teacherHtml.includes('Số dư ví'));
    assert.ok(!teacherHtml.includes('Tiền có thể rút'));
  });

  await t.test('OrderStatusBreakdown separates lifecycle statuses from paid/free completed subcategories', () => {
    const { OrderStatusBreakdown } = load('@/components/admin/analytics/order-status-breakdown');
    const html = renderToStaticMarkup(
      React.createElement(OrderStatusBreakdown, {
        data: FINANCIAL_STATS_FIXTURE,
        loading: false,
      })
    );
    assert.ok(html.includes('1. Theo trạng thái xử lý'));
    assert.ok(html.includes('2. Cơ cấu đơn đã hoàn tất'));
    assert.ok(html.includes('Đơn trả phí'));
    assert.ok(html.includes('Đơn miễn phí'));
  });
});

// =========================================================================
// 15-19. API Integration, Sanitized Order Detail, Reconciliation & SePay Restriction
// =========================================================================
test('15-19. Admin Services, Order Detail, Reconciliation/Diagnostics & SePay Safety', async (t) => {
  await t.test('adminOrderService & paymentService call exact STEP 08.2 / STEP 05 endpoints with no-store & Bearer JWT', async () => {
    const storage = new Map([['tmdemy_access_token', 'admin-jwt-token']]);
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
    const { adminOrderService } = load('@/services/admin-order.service');
    const paymentService = load('@/services/payment.service');

    await adminOrderService.getFinancialStats({
      timeRange: '30days',
      timeBasis: 'recognizedAt',
      timezone: 'Asia/Ho_Chi_Minh',
      paymentMethod: 'sepay_bank_transfer',
    });
    await adminOrderService.getSalesBreakdown({
      groupBy: 'teacher',
      timeRange: '12months',
      timeBasis: 'recognizedAt',
      timezone: 'Asia/Ho_Chi_Minh',
      page: 2,
      limit: 10,
      sortBy: 'revenue',
      order: 'desc',
    });
    await adminOrderService.getOrderDetail('33333333-3333-4333-8333-333333333333');
    await paymentService.getAdminPaymentDiagnostics();
    await paymentService.getAdminPaymentReconciliation({
      from: '2026-10-20T00:00:00.000Z',
      to: '2026-11-19T00:00:00.000Z',
      limit: 100,
      external: false,
    });

    assert.equal(calls.length, 5);
    assert.ok(calls[0].url.includes('/api/admin/statistics/financial'));
    assert.ok(calls[0].url.includes('timeBasis=recognizedAt'));
    assert.ok(calls[0].url.includes('timezone=Asia%2FHo_Chi_Minh'));
    assert.equal(calls[0].options.cache, 'no-store');
    assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer admin-jwt-token');

    assert.ok(calls[1].url.includes('/api/admin/statistics/sales'));
    assert.ok(calls[1].url.includes('groupBy=teacher'));
    assert.ok(calls[1].url.includes('page=2'));

    assert.ok(calls[2].url.includes('/api/orders/33333333-3333-4333-8333-333333333333'));
    assert.equal(calls[2].options.cache, 'no-store');

    assert.ok(calls[3].url.includes('/api/payments/admin/diagnostics'));
    assert.equal(calls[3].options.cache, 'no-store');

    assert.ok(calls[4].url.includes('/api/payments/admin/reconciliation'));
    assert.ok(calls[4].url.includes('limit=100'));
    assert.ok(calls[4].url.includes('external=false'));
  });

  await t.test('PaymentDiagnosticsPanel & PaymentReconciliationPanel render live fields with read-only safety', () => {
    const load = loader();
    const { PaymentDiagnosticsPanel } = load('@/components/admin/payments/payment-diagnostics-panel');
    const { PaymentReconciliationPanel } = load('@/components/admin/payments/payment-reconciliation-panel');

    const diagHtml = renderToStaticMarkup(
      React.createElement(PaymentDiagnosticsPanel, {
        data: DIAGNOSTICS_FIXTURE,
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(diagHtml.includes('Chẩn đoán hệ thống Webhook'));
    assert.ok(diagHtml.includes('Chưa có mẫu')); // null ingestionLatency never fabricated
    assert.ok(diagHtml.includes('321 ms'));

    const reconHtml = renderToStaticMarkup(
      React.createElement(PaymentReconciliationPanel, {
        data: RECONCILIATION_FIXTURE,
        loading: false,
        error: null,
        windowDays: 30,
        onWindowDaysChange: () => {},
        onInspectOrder: () => {},
        onRetry: () => {},
      })
    );
    assert.ok(reconHtml.includes('Đối soát thanh toán nội bộ'));
    assert.ok(reconHtml.includes('Chưa cấu hình token'));
    assert.ok(reconHtml.includes('Tắt (Chỉ đọc)'));
    assert.ok(reconHtml.includes('Cần rà soát thủ công'));
    assert.ok(reconHtml.includes('Webhook hết lượt thử lại'));
    assert.ok(reconHtml.includes('Xem đơn'));
    // Must NEVER expose forbidden manual SePay repair/force actions
    assert.ok(!reconHtml.includes('Force SUCCESS'));
    assert.ok(!reconHtml.includes('Giả lập webhook'));
  });

  await t.test('OrderTable separates SePay pending orders from manual approval and blocks manual buttons for SePay', () => {
    const load = loader({
      'next/image': nextImageMock,
      '@/lib/toast': { toast: { success: () => {} } },
    });
    const { OrderTable } = load('@/components/admin/orders/order-table');
    const { canManageManualOrder } = load('@/lib/order-actions');

    const sepayPending = {
      id: 'sepay-order-1',
      code: 'DH-SEPAY-01',
      amount: 499000,
      discount: 0,
      total: 499000,
      status: 'pending',
      paymentMethod: 'sepay_bank_transfer',
      paymentCode: 'TMSEPAY01',
      course: { title: 'Next.js Mastery' },
      user: { username: 'student1', email: 's1@test.com' },
    };
    const manualPending = {
      id: 'manual-order-1',
      code: 'DH-MANUAL-01',
      amount: 299000,
      discount: 0,
      total: 299000,
      status: 'pending',
      paymentMethod: 'manual_bank_transfer',
      course: { title: 'SQL Pro' },
      user: { username: 'student2', email: 's2@test.com' },
    };

    assert.equal(canManageManualOrder(sepayPending), false);
    assert.equal(canManageManualOrder(manualPending), true);

    const sepayOnlyHtml = renderToStaticMarkup(
      React.createElement(OrderTable, {
        orders: [sepayPending],
        loading: false,
        error: null,
        onRetry: () => {},
        onViewDetail: () => {},
        onOpenStatusModal: () => {},
        hasFilters: false,
        onResetFilters: () => {},
      })
    );
    assert.ok(sepayOnlyHtml.includes('Chờ thanh toán'));
    assert.ok(sepayOnlyHtml.includes('TMSEPAY01'));
    assert.ok(!sepayOnlyHtml.includes('Xác nhận duyệt hoàn tất'));

    const manualHtml = renderToStaticMarkup(
      React.createElement(OrderTable, {
        orders: [manualPending],
        loading: false,
        error: null,
        onRetry: () => {},
        onViewDetail: () => {},
        onOpenStatusModal: () => {},
        hasFilters: false,
        onResetFilters: () => {},
      })
    );
    assert.ok(manualHtml.includes('Chờ duyệt'));
    assert.ok(manualHtml.includes('Xác nhận duyệt hoàn tất'));
  });

  await t.test('PaymentSummaryCards separates SePay pending from manual pending and uses responsive grid', () => {
    const load = loader();
    const { PaymentSummaryCards } = load('@/components/admin/payments/payment-summary-cards');
    const html = renderToStaticMarkup(
      React.createElement(PaymentSummaryCards, {
        summary: {
          counts: {
            totalUsers: 90,
            totalStudents: 86,
            totalTeachers: 3,
            totalAdmins: 1,
            totalCourses: 10,
            pendingCourses: 1,
            approvedCourses: 9,
            rejectedCourses: 0,
            totalOrders: 30,
            pendingOrders: 9,
            completedOrders: 21,
            rejectedOrders: 0,
            totalComments: 5,
            manualPendingOrders: 6,
            sepayPendingOrders: 3,
          },
          financials: { totalRevenue: 1390000, conversionRate: 70 },
          pendingTasks: [],
          paymentTasks: { reviewCount: 2, retryExhaustedCount: 1 },
          recentUsers: [],
        },
        financial: FINANCIAL_STATS_FIXTURE,
        diagnostics: DIAGNOSTICS_FIXTURE,
        loading: false,
      })
    );
    assert.ok(html.includes('Đơn SePay chờ thanh toán'));
    assert.ok(html.includes('Đơn thủ công chờ duyệt'));
    assert.ok(html.includes('Giao dịch cần rà soát thủ công'));
    assert.ok(html.includes('Webhook hết lượt thử lại'));
    assert.ok(html.includes('Đơn trả phí đã hoàn tất'));
    assert.ok(html.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'));
  });

  await t.test('OrderDetailModal blocks manual approval for SePay pending orders and shows security notice', () => {
    const load = loader({
      'next/image': nextImageMock,
    });
    const { OrderDetailModal } = load('@/components/admin/orders/order-detail-modal');
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailModal, {
        order: {
          id: '33333333-3333-4333-8333-333333333333',
          code: 'O1-SEPAY',
          amount: 300000,
          discount: 0,
          total: 300000,
          status: 'pending',
          paymentMethod: 'sepay_bank_transfer',
          paymentCode: 'TM082O1',
          course: { id: 'c1', title: 'Course A1 TypeScript' },
          user: { id: 'u1', username: 'StudentOne', email: 's1@step082.test' },
        },
        isOpen: true,
        onClose: () => {},
        onOpenStatusModal: () => {},
      })
    );
    assert.ok(html.includes('O1-SEPAY'));
    assert.ok(html.includes('TM082O1'));
    assert.ok(html.includes('không hỗ trợ duyệt/từ chối thủ công'));
    assert.ok(html.includes('không trả về raw payload, số tài khoản ngân hàng'));
    assert.ok(!html.includes('Duyệt đơn'));
  });
});
