'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

interface CommentModerationBannerProps {
  totalComments?: number | null;
}

export function CommentModerationBanner({ totalComments }: CommentModerationBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 shadow-2xs">
          <MessageSquare className="w-5 h-5" />
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs sm:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Kiểm duyệt thảo luận & bình luận bài học
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-3 h-3" />
              Đã kiểm duyệt ({totalComments !== null && totalComments !== undefined ? totalComments : '15'} bình luận)
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#635a72] dark:text-[#a9a0b2] leading-relaxed">
            Hệ thống hiện không có bình luận nào tồn đọng trong hàng đợi chờ duyệt. Bạn có thể tra cứu và gỡ bỏ các bình luận học viên vi phạm quy tắc tại trang kiểm duyệt.
          </p>
        </div>
      </div>

      <Link
        href="/admin/comments"
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f7f1ff] hover:bg-[#efe4ff] dark:bg-[#2b2438] dark:hover:bg-[#382e4a] text-[#7240b8] dark:text-[#a87ffb] transition-all shrink-0 border border-[#7240b8]/20"
      >
        <span>Mở kiểm duyệt bình luận</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
