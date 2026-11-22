// STEP 08.5 — Final Payment & Analytics Frontend Acceptance & Targeted Bug-Fix Verification
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

test('STEP 08.5 — Admin-to-Teacher Analytics Route Guard Alignment', async (t) => {
  await t.test('TeacherAnalyticsPage enforces strict allowedRoles=["teacher"] while TeacherShell preserves ["teacher", "admin"]', () => {
    const capturedGuardProps = [];
    const mockRouteGuard = {
      RouteGuard: (props) => {
        capturedGuardProps.push({
          requireAuth: props.requireAuth,
          allowedRoles: props.allowedRoles,
        });
        return React.createElement('div', { 'data-guard': 'teacher-only' }, props.children);
      },
    };
    const load = loader({
      '@/components/auth/route-guard': mockRouteGuard,
      '@/components/teacher/analytics/teacher-analytics-view': {
        TeacherAnalyticsView: () => React.createElement('div', null, 'AnalyticsView'),
      },
    });

    const pageMod = load('@/app/teacher/analytics/page');
    const html = renderToStaticMarkup(React.createElement(pageMod.default));
    assert.match(html, /AnalyticsView/);
    assert.equal(capturedGuardProps.length, 1);
    assert.equal(capturedGuardProps[0].requireAuth, true);
    assert.deepEqual(capturedGuardProps[0].allowedRoles, ['teacher']);

    // Verify TeacherShell still preserves ['teacher', 'admin'] for shared tools (e.g. /teacher/orders)
    const shellSource = fs.readFileSync(path.join(root, 'src/components/teacher/teacher-shell.tsx'), 'utf8');
    assert.match(shellSource, /allowedRoles=\{\['teacher', 'admin'\]\}/);
  });

  await t.test('TeacherDashboardPage and TeacherCoursePerformancePage enforce strict allowedRoles=["teacher"]', () => {
    const dashboardSrc = fs.readFileSync(path.join(root, 'src/app/teacher/dashboard/page.tsx'), 'utf8');
    const performanceSrc = fs.readFileSync(
      path.join(root, 'src/app/teacher/courses/[id]/performance/page.tsx'),
      'utf8'
    );
    assert.match(dashboardSrc, /<RouteGuard\s+requireAuth\s+allowedRoles=\{\['teacher'\]\}>/);
    assert.match(performanceSrc, /<RouteGuard\s+requireAuth\s+allowedRoles=\{\['teacher'\]\}>/);
  });

  await t.test('RouteGuard blocks an authenticated admin from teacher-only analytics routes without rendering children', () => {
    const load = loader({
      'next/navigation': {
        useRouter: () => ({ replace: () => {}, push: () => {} }),
      },
      '@/hooks/use-auth': {
        useAuth: () => ({
          user: { id: 'admin-1', role: 'admin', status: 'ACTIVE' },
          isLoading: false,
          isAuthenticated: true,
          isLocked: false,
        }),
      },
    });
    const { RouteGuard } = load('@/components/auth/route-guard');
    let childMounted = false;
    const Child = () => {
      childMounted = true;
      return React.createElement('div', null, 'SHOULD_NOT_RENDER');
    };
    const html = renderToStaticMarkup(
      React.createElement(RouteGuard, { requireAuth: true, allowedRoles: ['teacher'] }, React.createElement(Child))
    );
    assert.equal(childMounted, false);
    assert.match(html, /Không có quyền truy cập \(403\)/);
    assert.doesNotMatch(html, /SHOULD_NOT_RENDER/);
  });
});

test('STEP 08.5 — Custom Enrollment Fallback Notice & Security Hygiene', async (t) => {
  await t.test('TeacherEnrollmentAnalytics explicitly explains 30-day fallback when revenue uses custom date range', () => {
    const load = loader({});
    const { TeacherEnrollmentAnalytics } = load(
      '@/components/teacher/analytics/teacher-enrollment-analytics'
    );
    const data = {
      summary: { totalEnrollments: 12, activeCount: 8, completedCount: 3, canceledCount: 1 },
      timeline: [{ date: '2026-11-18', count: 2 }],
    };

    const htmlFallback = renderToStaticMarkup(
      React.createElement(TeacherEnrollmentAnalytics, {
        data,
        loading: false,
        error: null,
        periodLabel: '30 ngày qua',
        isCustomPeriodFallback: true,
        onRetry: () => {},
      })
    );
    assert.match(htmlFallback, /role="note"/);
    assert.match(htmlFallback, /Biểu đồ ghi danh chưa hỗ trợ khoảng ngày tùy chọn/);
    assert.match(htmlFallback, /30 ngày qua/);

    const htmlNormal = renderToStaticMarkup(
      React.createElement(TeacherEnrollmentAnalytics, {
        data,
        loading: false,
        error: null,
        periodLabel: '7 ngày qua',
        isCustomPeriodFallback: false,
        onRetry: () => {},
      })
    );
    assert.doesNotMatch(htmlNormal, /Biểu đồ ghi danh chưa hỗ trợ khoảng ngày tùy chọn/);
  });

  await t.test('Frontend payment & analytics sources contain zero embedded SePay secrets or raw webhook payloads', () => {
    const dirs = [
      'src/services/payment.service.ts',
      'src/services/admin-order.service.ts',
      'src/services/admin-dashboard.service.ts',
      'src/services/teacher-statistics.service.ts',
      'src/lib/admin-analytics.ts',
      'src/lib/teacher-analytics.ts',
      'src/lib/payment.ts',
    ];
    for (const rel of dirs) {
      const content = fs.readFileSync(path.join(root, rel), 'utf8');
      assert.doesNotMatch(content, /SEPAY_API_KEY|SEPAY_WEBHOOK_SECRET|rawPayload|JWT_SECRECT/i, `Sensitive token in ${rel}`);
    }
  });

  await t.test('payment poller manual refresh recovers cleanly even if poller was suspended in a background tab', async () => {
    const load = loader({});
    const { createPaymentPoller } = load('@/lib/payment-poller');
    let calls = 0;
    const states = [];
    const poller = createPaymentPoller({
      request: async () => {
        calls++;
        return {
          orderId: 'order-bg',
          status: 'completed',
          paymentState: 'completed',
          paymentMethod: 'sepay_bank_transfer',
          paymentCode: 'DHBG0001',
          paidAt: new Date().toISOString(),
          expiresAt: null,
          courseAccessGranted: true,
        };
      },
      onStatus: (s) => states.push(s.paymentState),
      onError: () => {},
      onBusy: () => {},
      onPause: () => {},
    });
    poller.suspend();
    await poller.start();
    assert.equal(calls, 0);
    await poller.refresh();
    assert.equal(calls, 1);
    assert.deepEqual(states, ['completed']);
    poller.dispose();
  });
});
