'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  BarChart3,
  ShieldCheck,
  Power,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { AdminEarningsExplorer } from './admin-earnings-explorer';
import { AdminPolicyPanel } from './admin-policy-panel';
import { AdminActivationPanel } from './admin-activation-panel';
import { AdminReconciliationPanel } from './admin-reconciliation-panel';

type AdminCommissionTab = 'explorer' | 'policies' | 'activation' | 'reconciliation';

export function AdminCommissionsView() {
  const [activeTab, setActiveTab] = useState<AdminCommissionTab>('explorer');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý Hoa hồng & Đối soát Tài chính
            </h1>
            <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              Cấu hình chính sách chia sẻ hoa hồng, kích hoạt hệ thống, theo dõi công nợ ví giảng viên và đối soát toàn vẹn sổ cái.
            </p>
          </div>
        </div>

        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-white dark:bg-[#17141f] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] text-xs font-semibold text-[#7240b8] dark:text-[#c4a6ff] self-start md:self-auto transition-colors"
        >
          <span>Xem Phân tích Doanh số Thương mại</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'explorer' as const, label: 'Tổng quan & Thu nhập', icon: BarChart3 },
          { id: 'policies' as const, label: 'Chính sách hoa hồng', icon: ShieldCheck },
          { id: 'activation' as const, label: 'Kích hoạt tính năng', icon: Power },
          { id: 'reconciliation' as const, label: 'Đối soát tài chính', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-[#7240b8] text-[#7240b8] dark:border-[#a87ffb] dark:text-[#c4a6ff]'
                  : 'border-transparent text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'explorer' && <AdminEarningsExplorer />}
      {activeTab === 'policies' && <AdminPolicyPanel />}
      {activeTab === 'activation' && <AdminActivationPanel />}
      {activeTab === 'reconciliation' && <AdminReconciliationPanel />}
    </div>
  );
}
