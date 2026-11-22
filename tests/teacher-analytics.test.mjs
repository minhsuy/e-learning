// STEP 08.4 — Teacher Analytics Dashboard & Course Performance Automated Tests
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

const COURSE_UUID = '11111111-1111-4111-8111-111111111111';

const OVERVIEW_FIXTURE = {
  revenue: {
    totalRevenue: 24500000,
    totalOrders: 45,
    completedOrders: 45,
    paidOrders: 42,
    freeOrders: 3,
    averageOrderValue: 544444,
    currency: 'VND',
  },
  students: {
    totalStudents: 42,
    totalEnrollments: 48,
    activeStudents: 35,
    completedStudents: 7,
  },
  courses: {
    total: 5,
    approved: 4,
    pending: 1,
    rejected: 0,
  },
  rating: {
    averageRating: 4.85,
    totalReviews: 38,
  },
};

const REVENUE_FIXTURE = {
  summary: {
    totalRevenue: 15000000,
    totalOrders: 30,
    completedOrders: 30,
    paidOrders: 28,
    freeOrders: 2,
    totalDiscount: 500000,
    averageOrderValue: 500000,
    currency: 'VND',
  },
  timeline: [
    { date: '2026-11-18', revenue: 1500000, orderCount: 3, ordersCount: 3 },
    { date: '2026-11-16', revenue: 0, orderCount: 0, ordersCount: 0 },
    { date: '2026-11-17', revenue: 500000, orderCount: 1, ordersCount: 1 },
  ],
  methodBreakdown: [
    { paymentMethod: 'sepay_bank_transfer', completedOrders: 20, revenue: 12000000 },
    { paymentMethod: 'manual_bank_transfer', completedOrders: 8, revenue: 3000000 },
    { paymentMethod: 'free', completedOrders: 2, revenue: 0 },
  ],
  reporting: {
    timeBasis: 'recognizedAt',
    timezone: 'Asia/Ho_Chi_Minh',
    startDate: '2026-10-19T17:00:00.000Z',
    endDate: '2026-11-18T17:00:00.000Z',
    legacyEstimatedOrders: 3,
    undatedLegacyOrders: 0,
  },
};

const COURSES_STATS_FIXTURE = {
  courses: [
    {
      id: COURSE_UUID,
      _id: COURSE_UUID,
      title: 'Fullstack Next.js & Node.js Architecture',
      slug: 'fullstack-nextjs',
      price: 699000,
      status: 'approved',
      view: 1250,
      totalStudents: 42,
      totalRevenue: 24500000,
      completedOrders: 45,
      paidOrders: 42,
      freeOrders: 3,
      averageRating: 4.85,
      totalReviews: 38,
      createdAt: '2026-02-01T10:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 10, total: 15, totalPages: 2 },
};

const ENROLLMENTS_FIXTURE = {
  summary: {
    totalEnrollments: 42,
    activeCount: 33,
    completedCount: 7,
    canceledCount: 2,
  },
  timeline: [
    { date: '2026-11-18', count: 5 },
    { date: '2026-11-16', count: 0 },
    { date: '2026-11-17', count: 3 },
  ],
};

const LEARNING_FIXTURE = {
  totalStudents: 42,
  averageProgress: 65.4,
  completedStudents: 7,
  completionRate: 16.67,
  certificatesIssued: 6,
  certificateRate: 14.29,
};

const COURSE_PERFORMANCE_FIXTURE = {
  course: {
    id: COURSE_UUID,
    _id: COURSE_UUID,
    title: 'Fullstack Next.js & Node.js Architecture',
    slug: 'fullstack-nextjs',
    price: 699000,
    status: 'approved',
  },
  overview: {
    revenue: {
      totalRevenue: 24500000,
      completedOrders: 45,
      paidOrders: 42,
      freeOrders: 3,
      totalDiscount: 700000,
      averageOrderValue: 544444,
      currency: 'VND',
    },
    students: {
      totalStudents: 42,
      activeStudents: 33,
      completedStudents: 7,
      canceledStudents: 2,
      completionRate: 16.7,
      averageProgress: 65.4,
    },
    engagement: {
      averageRating: 4.85,
      totalReviews: 38,
      ratingDistribution: { '1': 0, '2': 0, '3': 1, '4': 4, '5': 33 },
      certificatesIssued: 6,
      certificateRate: 14.3,
      averageCertificateGrade: 92,
    },
  },
  curriculum: { totalChapters: 5, totalLessons: 24, totalDuration: 18200 },
  quizzes: {
    summary: { totalQuizzes: 4, totalSubmissions: 52, averageScore: 86.5, passRate: 88.4 },
    items: [],
  },
  lessonsFunnel: [],
};

// =========================================================================
// 1-2. Teacher Sidebar Navigation, Breadcrumb & RouteGuard
// =========================================================================
test('1-2. Teacher Analytics Navigation, Breadcrumb & RouteGuard', async (t) => {
  await t.test('TeacherShell enforces requireAuth and allowedRoles=["teacher", "admin"]', () => {
    let capturedProps = null;
    const load = loader({
      '@/components/auth/route-guard': {
        RouteGuard: (props) => {
          capturedProps = props;
          return React.createElement('div', null, props.children);
        },
      },
      [path.join(root, 'src', 'components', 'teacher', 'teacher-sidebar')]: {
        TeacherSidebar: () => React.createElement('aside', null),
      },
      [path.join(root, 'src', 'components', 'teacher', 'teacher-header')]: {
        TeacherHeader: () => React.createElement('header', null),
      },
    });
    const { TeacherShell } = load('@/components/teacher/teacher-shell');
    renderToStaticMarkup(React.createElement(TeacherShell, null, React.createElement('div', null, 'Teacher')));
    assert.equal(capturedProps.requireAuth, true);
    assert.deepEqual(capturedProps.allowedRoles, ['teacher', 'admin']);
  });

  await t.test('TeacherSidebar exposes "Phân tích & Báo cáo" (/teacher/analytics) without duplicates & highlights active route', () => {
    const load = loader({
      'next/link': nextLinkMock,
      'next/navigation': {
        usePathname: () => '/teacher/analytics',
        useRouter: () => ({ push: () => {} }),
      },
      '@/components/common/logo': { Logo: () => React.createElement('span', null, 'TMdemy') },
      '@/hooks/use-auth': { useAuth: () => ({ logout: async () => {} }) },
      '@/lib/toast': { toast: { success: () => {}, error: () => {} } },
    });

    const { TEACHER_NAV_ITEMS, TeacherSidebar, isTeacherNavItemActive } = load(
      '@/components/teacher/teacher-sidebar'
    );

    const paths = TEACHER_NAV_ITEMS.map((i) => i.path);
    const labels = TEACHER_NAV_ITEMS.map((i) => i.label);
    assert.equal(new Set(paths).size, paths.length);
    assert.equal(new Set(labels).size, labels.length);
    assert.ok(TEACHER_NAV_ITEMS.some((i) => i.label === 'Phân tích & Báo cáo' && i.path === '/teacher/analytics'));
    assert.ok(TEACHER_NAV_ITEMS.some((i) => i.path === '/teacher/dashboard'));

    assert.equal(isTeacherNavItemActive('/teacher/analytics', '/teacher/analytics'), true);
    assert.equal(isTeacherNavItemActive('/teacher/analytics', '/teacher/dashboard'), false);

    const html = renderToStaticMarkup(React.createElement(TeacherSidebar, { isOpen: false }));
    assert.ok(html.includes('Phân tích &amp; Báo cáo'));
    assert.ok(html.includes('aria-current="page"'));
    assert.ok(html.includes('-translate-x-full lg:translate-x-0'));
  });

  await t.test('TeacherBreadcrumb renders exact labels for /teacher/analytics and /performance', () => {
    for (const [route, expected] of [
      ['/teacher/analytics', 'Phân tích &amp; Báo cáo'],
      [`/teacher/courses/${COURSE_UUID}/performance`, 'Hiệu suất khóa học'],
    ]) {
      const load = loader({
        'next/link': nextLinkMock,
        'next/navigation': { usePathname: () => route },
      });
      const { TeacherBreadcrumb } = load('@/components/teacher/teacher-breadcrumb');
      const html = renderToStaticMarkup(React.createElement(TeacherBreadcrumb));
      assert.ok(html.includes(expected));
    }
  });
});

// =========================================================================
// 3, 6-10, 19. Six-API Service Integration, Filter Builders, Validation & Errors
// =========================================================================
test('3, 6-10, 19. Six Teacher Statistics APIs, Filters, Validation & Error Normalization', async (t) => {
  const load = loader();
  const helpers = load('@/lib/teacher-analytics');

  await t.test('builds recognizedAt & Asia/Ho_Chi_Minh query params without teacherId', () => {
    const q = helpers.buildTeacherRevenueQueryParams(helpers.DEFAULT_TEACHER_ANALYTICS_FILTERS);
    assert.equal(q.period, '30days');
    assert.equal(q.timeBasis, 'recognizedAt');
    assert.equal(q.timezone, 'Asia/Ho_Chi_Minh');
    assert.equal('teacherId' in q, false);
  });

  await t.test('maps custom period, timezone UTC, owned courseId & safe enrollment fallback', () => {
    const customFilters = {
      period: 'custom',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      timeBasis: 'paidAt',
      timezone: 'UTC',
      courseId: COURSE_UUID,
    };
    const revQ = helpers.buildTeacherRevenueQueryParams(customFilters);
    assert.equal(revQ.period, 'custom');
    assert.equal(revQ.startDate, '2026-10-01');
    assert.equal(revQ.endDate, '2026-10-31');
    assert.equal(revQ.timeBasis, 'paidAt');
    assert.equal(revQ.timezone, 'UTC');
    assert.equal(revQ.courseId, COURSE_UUID);

    const enrQ = helpers.buildTeacherEnrollmentQueryParams(customFilters);
    assert.equal(enrQ.period, '30days');
    assert.equal(enrQ.courseId, COURSE_UUID);
  });

  await t.test('validates custom dates (rejects missing, 2026-02-31, reversed, >5 years)', () => {
    assert.equal(helpers.validateTeacherDateRange('30days').valid, true);
    assert.equal(helpers.validateTeacherDateRange('custom', '', '2026-11-18').valid, false);
    assert.equal(helpers.validateTeacherDateRange('custom', '2026-02-31', '2026-03-05').valid, false);
    assert.equal(helpers.validateTeacherDateRange('custom', '2026-11-20', '2026-11-10').valid, false);
    assert.equal(helpers.validateTeacherDateRange('custom', '2020-01-01', '2026-11-18').valid, false);
    assert.equal(helpers.validateTeacherDateRange('custom', '2026-10-01', '2026-11-18').valid, true);
  });

  await t.test('normalizes revenue & enrollment timelines chronologically preserving zero buckets', () => {
    const revPoints = helpers.normalizeTeacherRevenueTimeline(REVENUE_FIXTURE);
    assert.deepEqual(
      revPoints.map((p) => p.date),
      ['2026-11-16', '2026-11-17', '2026-11-18']
    );
    assert.equal(revPoints[0].revenue, 0);
    assert.equal(revPoints[2].revenue, 1500000);

    const enrPoints = helpers.normalizeTeacherEnrollmentTimeline(ENROLLMENTS_FIXTURE);
    assert.deepEqual(
      enrPoints.map((p) => p.date),
      ['2026-11-16', '2026-11-17', '2026-11-18']
    );
    assert.equal(enrPoints[0].count, 0);
    assert.equal(enrPoints[2].count, 5);
  });

  await t.test('normalizes 401/403/404/400 API errors accurately', () => {
    const { AppApiError } = load('@/types/api');
    for (const statusCode of [401, 403, 404, 400]) {
      const normalized = helpers.normalizeTeacherApiError(
        new AppApiError({ statusCode, message: 'Invalid analytics query parameter' }),
        'fallback'
      );
      assert.equal(normalized.statusCode, statusCode);
      assert.ok(normalized.message.length > 5);
    }
  });

  await t.test('teacherStatisticsService calls all 6 exact endpoints with Bearer JWT, no-store & never teacherId', async () => {
    const storage = new Map([['tmdemy_access_token', 'teacher-jwt-token']]);
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

    const svcLoad = loader();
    const { teacherStatisticsService } = svcLoad('@/services/teacher-statistics.service');

    await teacherStatisticsService.getOverview();
    await teacherStatisticsService.getRevenue({
      period: '30days',
      timeBasis: 'recognizedAt',
      timezone: 'Asia/Ho_Chi_Minh',
      courseId: COURSE_UUID,
    });
    await teacherStatisticsService.getCoursesStats({ page: 2, limit: 10, sortBy: 'revenue', order: 'desc', status: 'approved' });
    await teacherStatisticsService.getEnrollmentsStats({ period: '30days', courseId: COURSE_UUID });
    await teacherStatisticsService.getLearningStats({ courseId: COURSE_UUID });
    await teacherStatisticsService.getCoursePerformance(COURSE_UUID);

    assert.equal(calls.length, 6);
    for (const call of calls) {
      assert.equal(call.options.cache, 'no-store');
      assert.equal(call.options.headers.get('Authorization'), 'Bearer teacher-jwt-token');
      assert.ok(!call.url.includes('teacherId'), `URL ${call.url} must NEVER include teacherId`);
    }
    assert.ok(calls[0].url.endsWith('/api/teacher/statistics/overview'));
    assert.ok(calls[1].url.includes('/api/teacher/statistics/revenue'));
    assert.ok(calls[1].url.includes('timeBasis=recognizedAt'));
    assert.ok(calls[1].url.includes('timezone=Asia%2FHo_Chi_Minh'));
    assert.ok(calls[2].url.includes('/api/teacher/statistics/courses'));
    assert.ok(calls[2].url.includes('page=2'));
    assert.ok(calls[3].url.includes('/api/teacher/statistics/enrollments'));
    assert.ok(calls[4].url.includes('/api/teacher/statistics/learning'));
    assert.ok(calls[5].url.endsWith(`/api/teacher/statistics/course-performance/${COURSE_UUID}`));
  });
});

// =========================================================================
// 4-5, 11-18, 20-21. Teacher Analytics UI & Dashboard Regression Rendering
// =========================================================================
test('4-5, 11-18, 20-21. Teacher Analytics Components & Dashboard Regression', async (t) => {
  const load = loader({
    'next/link': nextLinkMock,
  });

  await t.test('TeacherOverviewKpis maps all 6 KPIs + non-commission disclaimer without wallet/payout claims', () => {
    const { TeacherOverviewKpis } = load('@/components/teacher/analytics/teacher-overview-kpis');
    const html = renderToStaticMarkup(
      React.createElement(TeacherOverviewKpis, {
        data: OVERVIEW_FIXTURE,
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(html.includes('Doanh thu khóa học'));
    assert.ok(html.includes('24.500.000'));
    assert.ok(html.includes('Tổng học viên'));
    assert.ok(html.includes('Khóa học của tôi'));
    assert.ok(html.includes('Đánh giá trung bình'));
    assert.ok(html.includes('4.85 / 5'));
    assert.ok(html.includes('Đơn trả phí'));
    assert.ok(html.includes('Đơn miễn phí'));
    assert.ok(html.includes('không phải hoa hồng, thu nhập ròng, số dư ví hay số tiền có thể rút'));
  });

  await t.test('TeacherRevenueTrendChart renders SVG, legacyEstimatedOrders notice, empty state & error retry', () => {
    const { TeacherRevenueTrendChart } = load('@/components/teacher/analytics/teacher-revenue-trend-chart');
    const html = renderToStaticMarkup(
      React.createElement(TeacherRevenueTrendChart, {
        data: REVENUE_FIXTURE,
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(html.includes('<svg'));
    assert.ok(html.includes('Asia/Ho_Chi_Minh'));
    assert.ok(html.includes('COALESCE(paidAt, createdAt)'));
    assert.ok(html.includes('đơn hàng lịch sử chưa lưu'));

    const emptyHtml = renderToStaticMarkup(
      React.createElement(TeacherRevenueTrendChart, {
        data: { ...REVENUE_FIXTURE, timeline: [] },
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(emptyHtml.includes('Chưa có dữ liệu doanh thu trong chu kỳ này'));
  });

  await t.test('TeacherMethodBreakdownCard separates Free 0 VND orders from monetary Donut chart', () => {
    const { TeacherMethodBreakdownCard } = load('@/components/teacher/analytics/teacher-method-breakdown-card');
    const html = renderToStaticMarkup(
      React.createElement(TeacherMethodBreakdownCard, {
        breakdown: REVENUE_FIXTURE.methodBreakdown,
        loading: false,
      })
    );
    assert.ok(html.includes('SePay / VietQR'));
    assert.ok(html.includes('Thủ công'));
    assert.ok(html.includes('Đơn miễn phí (2 đơn)'));
    assert.ok(html.includes('đóng góp 0 ₫'));
  });

  await t.test('TeacherCoursesRanking renders Top 5 bars, paid/free orders, pagination & performance links', () => {
    const { TeacherCoursesRanking } = load('@/components/teacher/analytics/teacher-courses-ranking');
    const html = renderToStaticMarkup(
      React.createElement(TeacherCoursesRanking, {
        data: COURSES_STATS_FIXTURE,
        overviewCourses: OVERVIEW_FIXTURE.courses,
        loading: false,
        error: null,
        statusFilter: 'all',
        sortBy: 'revenue',
        selectedCourseId: COURSE_UUID,
        onStatusFilterChange: () => {},
        onSortByChange: () => {},
        onPageChange: () => {},
        onSelectCourseForPerformance: () => {},
        onRetry: () => {},
      })
    );
    assert.ok(html.includes('Fullstack Next.js &amp; Node.js Architecture'));
    assert.ok(html.includes('24.500.000'));
    assert.ok(html.includes('Trang 1 / 2'));
    assert.ok(html.includes(`/teacher/courses/${COURSE_UUID}/performance`));
  });

  await t.test('TeacherCoursePerformancePreview renders snapshot & handles 403/404 ownership errors cleanly', () => {
    const { TeacherCoursePerformancePreview } = load(
      '@/components/teacher/analytics/teacher-course-performance-preview'
    );
    const okHtml = renderToStaticMarkup(
      React.createElement(TeacherCoursePerformancePreview, {
        courses: [{ id: COURSE_UUID, title: 'Fullstack Next.js & Node.js Architecture' }],
        selectedCourseId: COURSE_UUID,
        onSelectCourse: () => {},
        data: COURSE_PERFORMANCE_FIXTURE,
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(okHtml.includes('42 trả phí'));
    assert.ok(okHtml.includes('3 miễn phí'));
    assert.ok(okHtml.includes('52 lượt nộp'));
    assert.ok(okHtml.includes('Mở phân tích chuyên sâu'));

    const err403Html = renderToStaticMarkup(
      React.createElement(TeacherCoursePerformancePreview, {
        courses: [],
        selectedCourseId: COURSE_UUID,
        onSelectCourse: () => {},
        data: null,
        loading: false,
        error: { statusCode: 403, message: 'Forbidden' },
        onRetry: () => {},
      })
    );
    assert.ok(err403Html.includes('Không có quyền truy cập khóa học này (403)'));
  });

  await t.test('TeacherEnrollmentAnalytics & TeacherLearningAnalytics render non-monetary trends & exact learning metrics', () => {
    const { TeacherEnrollmentAnalytics } = load('@/components/teacher/analytics/teacher-enrollment-analytics');
    const { TeacherLearningAnalytics } = load('@/components/teacher/analytics/teacher-learning-analytics');

    const enrHtml = renderToStaticMarkup(
      React.createElement(TeacherEnrollmentAnalytics, {
        data: ENROLLMENTS_FIXTURE,
        loading: false,
        error: null,
        periodLabel: '30 ngày gần nhất',
        onRetry: () => {},
      })
    );
    assert.ok(enrHtml.includes('Đang học (ACTIVE)'));
    assert.ok(enrHtml.includes('Đã thu hồi / Hủy'));
    assert.ok(enrHtml.includes('không thay thế cho chỉ tiêu doanh thu tiền tệ'));
    assert.ok(enrHtml.includes('<svg'));

    const learnHtml = renderToStaticMarkup(
      React.createElement(TeacherLearningAnalytics, {
        data: LEARNING_FIXTURE,
        loading: false,
        error: null,
        onRetry: () => {},
      })
    );
    assert.ok(learnHtml.includes('65.4%'));
    assert.ok(learnHtml.includes('16.7%'));
    assert.ok(learnHtml.includes('14.3%'));
    assert.ok(learnHtml.includes('6 chứng chỉ đã được cấp'));
  });

  await t.test('Teacher Dashboard TeacherKpiCards & PerformanceKpiCards preserve layout and show accurate paid/free counts', () => {
    const { TeacherKpiCards } = load('@/components/teacher/dashboard/teacher-kpi-cards');
    const { PerformanceKpiCards } = load('@/components/teacher/performance/performance-kpi-cards');

    const dashHtml = renderToStaticMarkup(
      React.createElement(TeacherKpiCards, { overview: OVERVIEW_FIXTURE, isLoading: false })
    );
    assert.ok(dashHtml.includes('Doanh thu khóa học'));
    assert.ok(dashHtml.includes('42 trả phí'));
    assert.ok(dashHtml.includes('3 miễn phí'));

    const emptyRatingHtml = renderToStaticMarkup(
      React.createElement(TeacherKpiCards, {
        overview: { ...OVERVIEW_FIXTURE, rating: { averageRating: 0, totalReviews: 0 } },
        isLoading: false,
      })
    );
    assert.ok(emptyRatingHtml.includes('Chưa có'));

    const perfHtml = renderToStaticMarkup(
      React.createElement(PerformanceKpiCards, {
        overview: COURSE_PERFORMANCE_FIXTURE.overview,
        isLoading: false,
      })
    );
    assert.ok(perfHtml.includes('42 trả phí'));
    assert.ok(perfHtml.includes('3 miễn phí'));
  });
});
