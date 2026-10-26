'use client';

import React, { useEffect, useState } from 'react';
import { conversationService } from '@/services/conversation.service';
import { courseService } from '@/services/course.service';
import { Conversation } from '@/types/conversation';
import { toast } from '@/lib/toast';

interface InstructorOption {
  id: string;
  name: string;
  avatar?: string;
  courseTitle: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customReceiverId, setCustomReceiverId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;

    async function loadInstructors() {
      setIsLoading(true);
      try {
        const res = await courseService.getCourses({ limit: 20 });
        if (isCurrent && res.success && Array.isArray(res.data)) {
          const map = new Map<string, InstructorOption>();

          res.data.forEach((course) => {
            const raw = course as unknown as {
              instructorId?: string;
              instructor?: { id?: string; _id?: string; username?: string; name?: string; avatar?: string };
              author?: { id?: string; _id?: string; username?: string; name?: string; avatar?: string };
            };

            const instId = raw.instructor?.id || raw.instructor?._id || raw.instructorId || raw.author?.id || raw.author?._id;
            const instName = raw.instructor?.username || raw.instructor?.name || raw.author?.username || course.instructorName || 'Giảng viên TMdemy';
            const instAvatar = raw.instructor?.avatar || raw.author?.avatar;

            if (instId && !map.has(instId)) {
              map.set(instId, {
                id: instId,
                name: instName,
                avatar: instAvatar,
                courseTitle: course.title,
              });
            }
          });

          setInstructors(Array.from(map.values()));
        }
      } catch {
        if (isCurrent) {
          setInstructors([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadInstructors();

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartConversation = async (receiverId: string) => {
    if (!receiverId.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await conversationService.createConversation({
        receiverId: receiverId.trim(),
        isGroup: false,
      });

      if (res.success && res.data) {
        toast.success('Đã mở cuộc trò chuyện!');
        onConversationCreated(res.data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tmdemy:conversations-updated'));
        }
        onClose();
      } else {
        toast.error(res.message || 'Không thể tạo cuộc trò chuyện');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#1d1926] rounded-2xl shadow-2xl border border-[#f1ebff] dark:border-[#2f2742] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#f1ebff] dark:border-[#2f2742] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Soạn Tin Nhắn Mới
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                Chọn giảng viên để bắt đầu trao đổi trực tiếp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Custom receiver ID input option */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              Mã định danh người nhận (ID)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customReceiverId}
                onChange={(e) => setCustomReceiverId(e.target.value)}
                placeholder="Nhập User UUID của đối phương..."
                className="flex-1 h-9 px-3 bg-[#f7f1ff] dark:bg-[#221c2e] rounded-xl text-xs text-[#1c192c] dark:text-[#f4eeff] border border-transparent focus:border-[#7240b8] focus:bg-white dark:focus:bg-[#1d1926] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => handleStartConversation(customReceiverId)}
                disabled={!customReceiverId.trim() || isSubmitting}
                className="px-3.5 h-9 rounded-xl bg-[#7240b8] hover:bg-[#5f339c] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                Bắt đầu
              </button>
            </div>
          </div>

          <div className="relative flex items-center my-1">
            <div className="flex-grow border-t border-[#f1ebff] dark:border-[#2f2742]" />
            <span className="flex-shrink mx-3 text-[11px] text-[#7c7483] dark:text-[#8e8596] font-semibold uppercase tracking-wider">
              Hoặc chọn giảng viên
            </span>
            <div className="flex-grow border-t border-[#f1ebff] dark:border-[#2f2742]" />
          </div>

          {/* List of instructors */}
          <div className="flex flex-col gap-2">
            {isLoading && (
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoading && instructors.length === 0 && (
              <div className="p-6 text-center text-xs text-[#635a72] dark:text-[#b4a9c7]">
                Chưa có danh sách giảng viên. Hãy nhập trực tiếp User ID ở trên.
              </div>
            )}

            {!isLoading &&
              instructors.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => handleStartConversation(inst.id)}
                  disabled={isSubmitting}
                  className="w-full text-left p-3 rounded-xl border border-[#f1ebff] dark:border-[#2f2742] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] hover:border-[#7240b8] transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        inst.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          inst.name
                        )}&background=ebe5ff&color=7240b8`
                      }
                      alt={inst.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-[#e6dffa] dark:ring-[#3d3252]"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {inst.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#ebe5ff] dark:bg-[#2b2438] text-[#5b27a1] dark:text-[#d6c4ff] text-[10px] font-semibold shrink-0">
                          Giảng viên
                        </span>
                      </div>
                      <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] truncate">
                        Khóa học: {inst.courseTitle}
                      </span>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-[18px] text-[#7240b8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    arrow_forward
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
