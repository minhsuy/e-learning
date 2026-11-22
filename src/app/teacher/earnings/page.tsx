import React, { Suspense } from 'react';
import { RouteGuard } from '@/components/auth/route-guard';
import { TeacherEarningsView } from '@/components/teacher/earnings/teacher-earnings-view';

export default function TeacherEarningsPage() {
  return (
    <RouteGuard requireAuth allowedRoles={['teacher']}>
      <Suspense
        fallback={
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
            <div className="h-12 w-72 rounded-xl bg-[#f1ebff] dark:bg-[#2b2438]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 rounded-2xl bg-[#f7f1ff] dark:bg-[#1d1926]" />
              ))}
            </div>
            <div className="h-72 w-full rounded-2xl bg-[#f7f1ff] dark:bg-[#1d1926]" />
          </div>
        }
      >
        <TeacherEarningsView />
      </Suspense>
    </RouteGuard>
  );
}
