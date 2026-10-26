'use client';

import React, { useState } from 'react';
import { RouteGuard } from '@/components/auth/route-guard';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RouteGuard requireAuth allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#fdf8ff] dark:bg-[#131118] text-[#1c192c] dark:text-[#f4eeff] transition-colors duration-150">
        {/* Responsive Admin Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="lg:pl-72 flex flex-col min-h-screen">
          {/* Top Admin Header */}
          <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

          {/* Page Content */}
          <main className="flex-1 pt-16 bg-[#fdf8ff] dark:bg-[#131118] transition-colors duration-150">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
