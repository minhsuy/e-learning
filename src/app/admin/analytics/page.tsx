import React, { Suspense } from 'react';
import { AdminAnalyticsView } from '@/components/admin/analytics/admin-analytics-view';

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 w-64 rounded-xl bg-[#f1ebff] dark:bg-[#2b2438]" />
          <div className="h-28 w-full rounded-2xl bg-[#f7f1ff] dark:bg-[#1d1926]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-[#f7f1ff] dark:bg-[#1d1926]" />
            ))}
          </div>
          <div className="h-72 w-full rounded-2xl bg-[#f7f1ff] dark:bg-[#1d1926]" />
        </div>
      }
    >
      <AdminAnalyticsView />
    </Suspense>
  );
}
