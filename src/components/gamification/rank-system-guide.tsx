import React from 'react';
import { getRankBadgeConfig } from '@/hooks/use-gamification';
import { RankName } from '@/types/gamification';

interface RankTier {
  name: RankName;
  minXP: number;
  maxXP: number | string;
  description: string;
}

const RANK_TIERS: RankTier[] = [
  {
    name: 'Beginner',
    minXP: 0,
    maxXP: 499,
    description: 'Học viên mới khởi đầu, tham gia hệ thống và bắt đầu bài học đầu tiên.',
  },
  {
    name: 'Explorer',
    minXP: 500,
    maxXP: 1499,
    description: 'Khám phá và tiếp thu kiến thức, hoàn thành bài học và quiz nền tảng.',
  },
  {
    name: 'Learner',
    minXP: 1500,
    maxXP: 2999,
    description: 'Chăm chỉ tích lũy, duy trì thói quen học tập đều đặn hàng tuần.',
  },
  {
    name: 'Skilled',
    minXP: 3000,
    maxXP: 5999,
    description: 'Học viên vững vàng, hoàn thành nhiều chương mục chuyên sâu.',
  },
  {
    name: 'Advanced',
    minXP: 6000,
    maxXP: 9999,
    description: 'Nâng cao trình độ, đạt điểm số xuất sắc ở các bài thi trắc nghiệm.',
  },
  {
    name: 'Expert',
    minXP: 10000,
    maxXP: 19999,
    description: 'Chuyên gia học tập, điểm tích lũy lớn và chuỗi streak bền bỉ.',
  },
  {
    name: 'Master',
    minXP: 20000,
    maxXP: 'Vô cực',
    description: 'Bậc thầy học tập, đứng đầu bảng xếp hạng toàn cầu TMdemy.',
  },
];

const XP_REWARDS = [
  {
    action: 'Hoàn thành bài học',
    reward: '+70 XP',
    rule: 'Cộng điểm khi bấm hoàn thành bài học lần đầu tiên. Không cộng lặp lại cho cùng 1 bài học.',
    icon: 'school',
  },
  {
    action: 'Hoàn thành bài Quiz',
    reward: '+100 XP',
    rule: 'Cộng điểm thưởng khi nộp bài làm Quiz trắc nghiệm thành công lần đầu.',
    icon: 'quiz',
  },
  {
    action: 'Chuỗi học chuyên cần (Streak)',
    reward: '+20 XP',
    rule: 'Cộng điểm tự động khi có hoạt động học đầu tiên trong ngày theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).',
    icon: 'local_fire_department',
  },
];

export function RankSystemGuide() {
  return (
    <div className="flex flex-col gap-8">
      {/* 1. XP EARNING RULES */}
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[24px]">
            monetization_on
          </span>
          <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Quy Chuẩn Tích Lũy Điểm Thưởng XP
          </h3>
        </div>
        <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
          Hệ thống TMdemy áp dụng cơ chế cấp điểm thưởng minh bạch và bất biến (Idempotency) nhằm ghi nhận trung thực mọi nỗ lực học tập của bạn.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {XP_REWARDS.map((item) => (
            <div
              key={item.action}
              className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] border border-[#f1ebff] dark:border-[#352b47] flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[28px]">
                  {item.icon}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] font-black text-xs shadow-2xs">
                  {item.reward}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  {item.action}
                </h4>
                <p className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] leading-relaxed">
                  {item.rule}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 7 RANK TIERS REFERENCE */}
      <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[24px]">
              military_tech
            </span>
            <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              7 Cấp Bậc Danh Hiệu Học Viên TMdemy
            </h3>
          </div>
          <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
            Cơ chế suy luận động theo tổng điểm XP
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {RANK_TIERS.map((tier) => {
            const conf = getRankBadgeConfig(tier.name);
            return (
              <div
                key={tier.name}
                className="p-4 rounded-xl border border-[#f1ebff] dark:border-[#2f2742] bg-[#fdf8ff] dark:bg-[#181420] flex flex-col justify-between gap-3 shadow-2xs hover:border-[#7240b8] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${conf.badgeBg} ${conf.badgeText} ${conf.borderColor}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{conf.icon}</span>
                    <span>{tier.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#7c7483] dark:text-[#8e8596]">
                    Level {conf.level}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    {tier.minXP.toLocaleString()} XP
                    {typeof tier.maxXP === 'number'
                      ? ` – ${tier.maxXP.toLocaleString()} XP`
                      : ' trở lên'}
                  </div>
                  <p className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] leading-relaxed">
                    {tier.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. LEADERBOARD RULES */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-[#ebe5ff] to-[#f7f1ff] dark:from-[#221c2e] dark:to-[#181420] border border-[#e6dffa] dark:border-[#352b47] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[24px] mt-0.5">
            info
          </span>
          <div className="flex flex-col gap-0.5">
            <h4 className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Thuật toán xếp hạng thi đấu tiêu chuẩn (Standard Competition Ranking 1224)
            </h4>
            <p className="text-[#635a72] dark:text-[#b4a9c7]">
              Nếu hai học viên có cùng tổng điểm XP, cả hai sẽ đồng hạng. Vị trí tiếp theo sẽ tự động nhảy cách tương ứng (ví dụ: Hạng 1, Hạng 1, Hạng 3).
            </p>
          </div>
        </div>
        <span className="text-[11px] text-[#7240b8] dark:text-[#a87ffb] font-semibold shrink-0">
          Múi giờ chuẩn: Asia/Ho_Chi_Minh (UTC+7)
        </span>
      </div>
    </div>
  );
}
