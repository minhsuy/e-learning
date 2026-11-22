import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const nativeRequire = createRequire(import.meta.url);
function loader(mocks = {}) {
  const cache = new Map();
  function load(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!name.startsWith('@/') && !path.isAbsolute(name)) return nativeRequire(name);
    let filename = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name;
    if (!/\.tsx?$/.test(filename)) filename += fs.existsSync(filename + '.ts') ? '.ts' : '.tsx';
    if (cache.has(filename)) return cache.get(filename).exports;
    const record = { exports: {} }; cache.set(filename, record);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', output)(id => load(id.startsWith('.') ? path.resolve(path.dirname(filename), id) : id), record, record.exports);
    return record.exports;
  }
  return load;
}
test('manual action policy fails closed for SePay, free, unknown and terminal orders', () => {
  const { canManageManualOrder, orderPaymentMethodLabel } = loader()('@/lib/order-actions');
  for (const method of [undefined, null, 'manual_bank_transfer', 'MANUAL_BANK_TRANSFER']) assert.equal(canManageManualOrder({ status: 'PENDING', paymentMethod: method }), true);
  for (const method of ['sepay_bank_transfer', 'FREE', 'unexpected']) assert.equal(canManageManualOrder({ status: 'pending', paymentMethod: method }), false);
  for (const status of ['completed', 'REJECTED']) assert.equal(canManageManualOrder({ status, paymentMethod: null }), false);
  assert.match(orderPaymentMethodLabel('sepay_bank_transfer'), /SePay/);
  assert.notEqual(orderPaymentMethodLabel(null), orderPaymentMethodLabel('free'));
});
test('both management adapters forward server filters and pagination without rebuilding totals', async () => {
  const calls = [], response = { success: true, data: { orders: [], pagination: { page: 2, limit: 10, total: 101, totalPages: 11 } } };
  const load = loader({ '@/lib/api/client': { apiClient: { get: async (...args) => { calls.push(args); return response; } } } });
  const query = { page: 2, limit: 10, status: 'pending', paymentMethod: 'sepay_bank_transfer', courseId: 'course', createdFrom: '2026-11-01T00:00:00Z', createdTo: '2026-12-01T00:00:00Z', paidFrom: '2026-11-01T00:00:00Z', paidTo: '2026-12-01T00:00:00Z', sortBy: 'paidAt', sortOrder: 'asc', search: ' DH123 ' };
  for (const service of [load('@/services/order.service').orderService.getTeacherOrders, load('@/services/admin-order.service').adminOrderService.getOrders]) {
    assert.equal(await service(query), response);
    assert.deepEqual(calls.at(-1)[1].params, { ...query, search: 'DH123' });
  }
});
test('actual Admin table and Teacher detail hide manual actions for SePay and terminal orders', () => {
  const load = loader({ 'next/image': { __esModule: true, default: ({ alt }) => React.createElement('span', null, alt) }, '@/lib/toast': { toast: { success() {}, error() {} } } });
  const Admin = load('@/components/admin/orders/order-table').OrderTable;
  const Teacher = load('@/components/teacher/orders/order-detail-modal').OrderDetailModal;
  const base = { id: 'order-1', code: 'ORDER-CHECK', status: 'pending', amount: 100000, discount: 0, total: 100000, course: { id: 'course', title: 'Test course' }, user: { id: 'user', username: 'Test student', email: 'test@invalid.example' } };
  function markup(Component, order) {
    return renderToStaticMarkup(React.createElement(Component, Component === Admin ? { orders: [order], loading: false, error: null, onRetry() {}, onViewDetail() {}, onOpenStatusModal() {}, hasFilters: false, onResetFilters() {} } : { isOpen: true, order, onClose() {} }));
  }
  for (const Component of [Admin, Teacher]) {
    const manual = markup(Component, { ...base, paymentMethod: 'manual_bank_transfer' });
    const sepay = markup(Component, { ...base, paymentMethod: 'sepay_bank_transfer' });
    assert.match(sepay, /SePay/);
    // Only the manual rendering contains action buttons with these callbacks.
    assert(manual.length > sepay.length);
    assert.doesNotMatch(sepay, /title="(?:Duyệt|Từ chối)/);
    const completed = markup(Component, { ...base, status: 'completed', paymentMethod: null });
    assert.doesNotMatch(completed, /title="(?:Duyệt|Từ chối)/);
  }
});
