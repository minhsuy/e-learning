'use client';

import React from 'react';
import { MessageSquare, CheckCircle2, MessageCircle, CornerDownRight, Info } from 'lucide-react';
import { TeacherCommentKpis } from '@/types/teacher-comment';
import { cn } from '@/lib/utils';

interface CommentKpiCardsProps {
  kpis: TeacherCommentKpis;
  loading: boolean;
}

export function CommentKpiCards({ kpis, loading }: CommentKpiCardsProps) {
  const cards = [
    {
      id: 'total',
      label: 'Tổng bình luận khóa học',
      value: kpis.totalComments !== null ? new Intl.NumberFormat('vi-VN').format(kpis.totalComments) : null,
      icon: MessageSquare,
      iconBg: 'bg-[#f7f1ff] dark:bg-[#2b2438]',
      iconColor: 'text-[#7240b8] dark:text-[#a87ffb]',
      borderColor: 'hover:border-[#7240b8]/40 dark:hover:border-[#a87ffb]/40',
      badge: 'Khóa học của bạn',
      badgeColor: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
      subtext: 'Thảo luận trong các bài giảng',
    },
    {
      id: 'approved',
      label: 'Trạng thái kiểm duyệt',
      value: kpis.approvedComments !== null ? new Intl.NumberFormat('vi-VN').format(kpis.approvedComments) : null,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700/50',
      badge: 'Đã duyệt',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      subtext: 'Đang hiển thị cho học viên',
    },
    {
      id: 'root',
      label: 'Thảo luận mở đầu',
      value: kpis.rootComments !== null ? new Intl.NumberFormat('vi-VN').format(kpis.rootComments) : null,
      icon: MessageCircle,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'hover:border-blue-300 dark:hover:border-blue-700/50',
      badge: 'Chủ đề gốc',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
      subtext: 'Thắc mắc trực tiếp về bài học',
    },
    {
      id: 'replies',
      label: 'Câu trả lời & Phản hồi',
      value: kpis.repliesCount !== null ? new Intl.NumberFormat('vi-VN').format(kpis.repliesCount) : null,
      icon: CornerDownRight,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'hover:border-amber-300 dark:hover:border-amber-700/50',
      badge: 'Trao đổi',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
      subtext: 'Phản hồi giữa học viên & giảng viên',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className={cn(
                'p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-left transition-all duration-200 group relative overflow-hidden shadow-xs',
                card.borderColor
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200',
                    card.iconBg,
                    card.iconColor
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-wide',
                    card.badgeColor
                  )}
                >
                  {card.badge}
                </span>
              </div>

              <div>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] font-medium mb-1">
                  {card.label}
                </p>

                {loading ? (
                  <div className="h-7 w-24 bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse rounded-md mt-1" />
                ) : (
                  <p className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                    {card.value ?? '—'}
                  </p>
                )}

                <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] mt-1 truncate">
                  {card.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[#635a72] dark:text-[#a9a0b2] px-1">
        <Info className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
        <span>
          Danh sách bình luận được tự động giới hạn trong các khóa học do bạn sở hữu. Giảng viên có quyền gỡ bỏ các bình luận không phù hợp trong khóa học của mình.
        </span>
      </div>
    </div>
  );
}
