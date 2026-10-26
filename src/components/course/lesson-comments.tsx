'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { commentService } from '@/services/comment.service';
import { ApiCommentItem } from '@/types/comment';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';

interface LessonCommentsProps {
  lessonId: string;
  courseId: string;
  courseSlug?: string;
  lessonTitle?: string;
  className?: string;
  targetCommentId?: string | null;
  targetParentId?: string | null;
}

export function LessonComments({
  lessonId,
  courseId,
  courseSlug,
  lessonTitle,
  className = '',
  targetCommentId,
  targetParentId,
}: LessonCommentsProps) {
  const searchParams = useSearchParams();
  const highlightTargetId = targetCommentId || searchParams?.get('commentId') || searchParams?.get('comment');
  const parentThreadId = targetParentId || searchParams?.get('parentId');

  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.id || (user as { _id?: string })?._id;

  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightTargetId || null);

  // Comments State
  const [comments, setComments] = useState<ApiCommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Root Comment State
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newCommentError, setNewCommentError] = useState<string | null>(null);

  // Reply State: maps rootCommentId -> text content & submitting state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>(() =>
    parentThreadId ? { [parentThreadId]: true } : {}
  );

  // Edit State: commentId being edited -> draft text
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraftContent, setEditDraftContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Deleting State: commentId being deleted
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Reaction in-flight state (prevents multiple clicks per comment)
  const [reactionInProgress, setReactionInProgress] = useState<Record<string, boolean>>({});

  // Refresh comments for current lesson
  const refreshComments = useCallback(
    async (signal?: AbortSignal) => {
      if (!lessonId) return;
      try {
        const res = await commentService.getLessonComments(lessonId, { signal });
        if (res.data && Array.isArray(res.data)) {
          setComments(res.data);
          setErrorMessage(null);
        } else {
          setComments([]);
        }
      } catch (err: unknown) {
        if (signal?.aborted) return;
        const msg =
          err instanceof AppApiError
            ? err.message
            : 'Không thể tải danh sách bình luận thảo luận.';
        setErrorMessage(msg);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [lessonId]
  );

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    commentService
      .getLessonComments(lessonId, { signal: controller.signal })
      .then((res) => {
        if (isCurrent && res.data) {
          setComments(res.data);
          setErrorMessage(null);
        }
      })
      .catch((err: unknown) => {
        if (isCurrent && !controller.signal.aborted) {
          const msg =
            err instanceof AppApiError
              ? err.message
              : 'Không thể tải danh sách bình luận thảo luận.';
          setErrorMessage(msg);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    // Cleanup and reset states on lesson change
    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [lessonId]);

  // Auto-expand parent thread when navigating to a reply
  useEffect(() => {
    let isCancelled = false;

    const syncTarget = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      if (parentThreadId) {
        setExpandedReplies((prev) => ({ ...prev, [parentThreadId]: true }));
      }
      if (highlightTargetId) {
        setActiveHighlightId(highlightTargetId);
      }
    };

    void syncTarget();

    return () => {
      isCancelled = true;
    };
  }, [parentThreadId, highlightTargetId]);

  // Scroll to target comment and apply highlight animation once comments finish loading
  useEffect(() => {
    if (!isLoading && activeHighlightId) {
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`comment-${activeHighlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);

      const clearTimer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 4500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [isLoading, activeHighlightId]);

  // Group comments into hierarchy: Root comments and their replies
  const { rootComments, repliesMap, totalCount } = useMemo(() => {
    const roots: ApiCommentItem[] = [];
    const replies: Record<string, ApiCommentItem[]> = {};

    comments.forEach((c) => {
      const pId = c.parentId;
      if (!pId) {
        roots.push(c);
      } else {
        if (!replies[pId]) {
          replies[pId] = [];
        }
        replies[pId].push(c);
      }
    });

    // Sort roots: newest first
    roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sort replies: oldest first (chronological conversation flow)
    Object.keys(replies).forEach((pId) => {
      replies[pId].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    return {
      rootComments: roots,
      repliesMap: replies,
      totalCount: comments.length,
    };
  }, [comments]);

  // Handle Create Root Comment
  const handleCreateRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để gửi câu hỏi thảo luận.');
      return;
    }
    const trimmed = newCommentContent.trim();
    if (trimmed.length < 6) {
      setNewCommentError('Nội dung bình luận phải có ít nhất 6 ký tự.');
      return;
    }
    if (trimmed.length > 500) {
      setNewCommentError('Nội dung bình luận tối đa 500 ký tự.');
      return;
    }

    setNewCommentError(null);
    setIsSubmittingNew(true);

    try {
      const res = await commentService.createComment({
        content: trimmed,
        lesson: lessonId,
        course: courseId,
      });

      if (res.data) {
        setComments((prev) => [res.data, ...prev]);
        setNewCommentContent('');
        toast.success('Đã gửi câu hỏi thảo luận thành công!');
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể gửi bình luận.';
      setNewCommentError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Handle Create Reply
  const handleCreateReply = async (parentCommentId: string) => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để trả lời bình luận.');
      return;
    }
    const trimmed = replyContent.trim();
    if (trimmed.length < 6) {
      toast.error('Nội dung câu trả lời phải có tối thiểu 6 ký tự.');
      return;
    }
    if (trimmed.length > 500) {
      toast.error('Nội dung câu trả lời tối đa 500 ký tự.');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await commentService.createComment({
        content: trimmed,
        lesson: lessonId,
        course: courseId,
        parentId: parentCommentId,
      });

      if (res.data) {
        setComments((prev) => [...prev, res.data]);
        setReplyContent('');
        setReplyingToId(null);
        // Ensure replies for this parent are expanded so user sees their reply
        setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));
        toast.success('Đã gửi câu trả lời thành công!');
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể gửi câu trả lời.';
      toast.error(msg);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Edit Comment
  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editDraftContent.trim();
    if (trimmed.length < 6) {
      toast.error('Nội dung chỉnh sửa phải có ít nhất 6 ký tự.');
      return;
    }
    if (trimmed.length > 500) {
      toast.error('Nội dung chỉnh sửa tối đa 500 ký tự.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await commentService.updateComment(commentId, { content: trimmed });
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            (c.id === commentId || c._id === commentId ? { ...c, content: trimmed, updatedAt: res.data.updatedAt } : c)
          )
        );
        setEditingCommentId(null);
        setEditDraftContent('');
        toast.success('Đã cập nhật bình luận thành công!');
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể cập nhật bình luận.';
      toast.error(msg);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      await commentService.deleteComment(commentId);
      // Remove comment and any replies that had this comment as parent
      setComments((prev) =>
        prev.filter((c) => (c.id !== commentId && c._id !== commentId && c.parentId !== commentId))
      );
      toast.success('Đã xóa bình luận thành công.');
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể xóa bình luận.';
      toast.error(msg);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Handle Like / Dislike Toggle
  const handleToggleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để bày tỏ cảm xúc.');
      return;
    }
    if (!currentUserId || reactionInProgress[commentId]) return;

    setReactionInProgress((prev) => ({ ...prev, [commentId]: true }));
    try {
      if (type === 'like') {
        await commentService.likeComment(commentId);
      } else {
        await commentService.dislikeComment(commentId);
      }

      // Re-fetch to get consistent state from server
      const refreshRes = await commentService.getLessonComments(lessonId);
      if (refreshRes.data) {
        setComments(refreshRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể cập nhật cảm xúc.';
      toast.error(msg);
    } finally {
      setReactionInProgress((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Toggle replies accordion
  const toggleRepliesAccordion = (parentId: string) => {
    setExpandedReplies((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f1ebff] dark:border-[#282136]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">
            forum
          </span>
          <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Thảo luận bài học {lessonTitle ? `• ${lessonTitle}` : ''}
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#7240b8] dark:text-[#a87ffb] border border-purple-100 dark:border-purple-900/40">
          {totalCount} thảo luận
        </span>
      </div>

      {/* ==================== 1. NEW COMMENT FORM ==================== */}
      <form onSubmit={handleCreateRootComment} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <img
            src={
              user?.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
            }
            alt={user?.username || 'Học viên'}
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-[#e6dffa] dark:ring-[#382d50] mt-1"
          />

          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={newCommentContent}
              onChange={(e) => {
                setNewCommentContent(e.target.value);
                if (newCommentError) setNewCommentError(null);
              }}
              placeholder={
                isAuthenticated
                  ? 'Đặt câu hỏi chuyên môn hoặc chia sẻ khúc mắc về bài học này (tối thiểu 6 ký tự)...'
                  : 'Vui lòng đăng nhập để tham gia thảo luận bài học...'
              }
              disabled={!isAuthenticated || isSubmittingNew}
              rows={3}
              className="w-full p-3.5 rounded-xl border border-[#e6dffa] dark:border-[#382d50] bg-white dark:bg-[#16131e] text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-all disabled:opacity-60 shadow-xs"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px]">
                <span
                  className={
                    newCommentContent.trim().length > 0 && newCommentContent.trim().length < 6
                      ? 'text-red-500 font-semibold'
                      : 'text-[#635a72] dark:text-[#b4a9c7]'
                  }
                >
                  {newCommentContent.trim().length}/500 ký tự (Tối thiểu 6 ký tự)
                </span>
                {newCommentError && (
                  <span className="text-red-500 font-medium">— {newCommentError}</span>
                )}
              </div>

              {isAuthenticated ? (
                <button
                  type="submit"
                  disabled={
                    isSubmittingNew ||
                    newCommentContent.trim().length < 6 ||
                    newCommentContent.trim().length > 500
                  }
                  className="px-5 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingNew ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Gửi câu hỏi</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={`/login${courseSlug ? `?redirect=/learn/${courseSlug}` : ''}`}
                  className="px-4 py-1.5 rounded-xl bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#7240b8] hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Đăng nhập ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* ==================== 2. COMMENTS LIST & THREADS ==================== */}
      {isLoading ? (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-[#7240b8] border-t-transparent animate-spin" />
          <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
            Đang tải danh sách câu hỏi thảo luận...
          </span>
        </div>
      ) : errorMessage ? (
        <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-rose-500 text-[28px]">error</span>
          <p className="text-xs text-rose-700 dark:text-rose-300">{errorMessage}</p>
          <button
            onClick={() => refreshComments()}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer mt-1"
          >
            Thử tải lại
          </button>
        </div>
      ) : rootComments.length > 0 ? (
        <div className="flex flex-col gap-5">
          {rootComments.map((root) => {
            const rootId = root.id || root._id || '';
            if (!rootId) return null;
            const replies = repliesMap[rootId] || [];
            const hasReplies = replies.length > 0;
            const isRepliesExpanded = !!expandedReplies[rootId];
            const isReplying = replyingToId === rootId;
            const isEditing = editingCommentId === rootId;
            const isAuthor =
              Boolean(currentUserId) &&
              (currentUserId === root.user?.id || currentUserId === root.user?._id);

            const userLiked =
              Boolean(currentUserId) && Array.isArray(root.likes) && root.likes.includes(currentUserId!);
            const userDisliked =
              Boolean(currentUserId) && Array.isArray(root.dislikes) && root.dislikes.includes(currentUserId!);

            const isHighlighted = activeHighlightId === rootId;

            return (
              <div
                key={rootId}
                id={`comment-${rootId}`}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-3 transition-all duration-500 ${
                  isHighlighted
                    ? 'ring-2 ring-[#7240b8] dark:ring-[#a87ffb] bg-purple-50/90 dark:bg-[#281b3d] shadow-md border-[#7240b8]/40'
                    : 'bg-[#f7f1ff] dark:bg-[#16131e] border-[#f1ebff] dark:border-[#282136]'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        root.user?.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={root.user?.username || 'Học viên'}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-[#e6dffa] dark:ring-[#382d50]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          {root.user?.username || 'Học viên TMDEMY'}
                        </span>
                        {root.user?.role?.toUpperCase() === 'TEACHER' && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-[#7240b8] dark:text-[#a87ffb] text-[10px] font-bold">
                            Giảng viên
                          </span>
                        )}
                        {root.user?.role?.toUpperCase() === 'ADMIN' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            Quản trị viên
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#7c7483] dark:text-[#b4a9c7]">
                        {new Date(root.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {root.updatedAt && root.updatedAt !== root.createdAt && ' (đã chỉnh sửa)'}
                      </span>
                    </div>
                  </div>

                  {/* Author Edit / Delete Menu */}
                  {isAuthor && !isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCommentId(rootId);
                          setEditDraftContent(root.content);
                        }}
                        className="p-1 rounded-md text-[#7c7483] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-purple-50 dark:hover:bg-[#282136] transition-colors cursor-pointer"
                        title="Chỉnh sửa bình luận"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteComment(rootId)}
                        disabled={deletingCommentId === rootId}
                        className="p-1 rounded-md text-[#7c7483] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Xóa bình luận"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Comment Content (or Edit Form) */}
                {isEditing ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <textarea
                      value={editDraftContent}
                      onChange={(e) => setEditDraftContent(e.target.value)}
                      disabled={isSubmittingEdit}
                      rows={3}
                      className="w-full p-3 rounded-xl border border-[#7240b8] bg-white dark:bg-[#1d1926] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                        {editDraftContent.trim().length}/500 ký tự
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditDraftContent('');
                          }}
                          disabled={isSubmittingEdit}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-[#635a72] dark:text-[#b4a9c7] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(rootId)}
                          disabled={isSubmittingEdit || editDraftContent.trim().length < 6}
                          className="px-4 py-1.5 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-[#2d2735] dark:text-[#e4deee] leading-relaxed whitespace-pre-line">
                    {root.content}
                  </p>
                )}

                {/* Actions Strip: Like, Dislike, Reply Button */}
                <div className="flex items-center gap-4 pt-1 text-xs">
                  {/* Like Button */}
                  <button
                    onClick={() => handleToggleReaction(rootId, 'like')}
                    disabled={reactionInProgress[rootId]}
                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      userLiked
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-[#7240b8] dark:text-[#a87ffb] font-bold'
                        : 'text-[#635a72] dark:text-[#b4a9c7] hover:bg-purple-50 dark:hover:bg-[#201a2b]'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: userLiked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      thumb_up
                    </span>
                    <span>{root.likes?.length || 0}</span>
                  </button>

                  {/* Dislike Button */}
                  <button
                    onClick={() => handleToggleReaction(rootId, 'dislike')}
                    disabled={reactionInProgress[rootId]}
                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      userDisliked
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                        : 'text-[#635a72] dark:text-[#b4a9c7] hover:bg-rose-50 dark:hover:bg-[#201a2b]'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: userDisliked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      thumb_down
                    </span>
                    <span>{root.dislikes?.length || 0}</span>
                  </button>

                  {/* Reply Button */}
                  <button
                    onClick={() => {
                      if (isReplying) {
                        setReplyingToId(null);
                        setReplyContent('');
                      } else {
                        setReplyingToId(rootId);
                        setReplyContent('');
                      }
                    }}
                    className={`flex items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      isReplying
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-[#7240b8] dark:text-[#a87ffb] font-bold'
                        : 'text-[#635a72] dark:text-[#b4a9c7] hover:text-[#7240b8] dark:hover:text-[#a87ffb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">reply</span>
                    <span>Trả lời</span>
                  </button>

                  {/* View Replies Toggle */}
                  {hasReplies && (
                    <button
                      onClick={() => toggleRepliesAccordion(rootId)}
                      className="text-[#7240b8] dark:text-[#a87ffb] font-semibold flex items-center gap-1 hover:underline cursor-pointer ml-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isRepliesExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                      <span>
                        {isRepliesExpanded
                          ? 'Thu gọn câu trả lời'
                          : `Xem ${replies.length} câu trả lời`}
                      </span>
                    </button>
                  )}
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="pt-2 pl-4 border-l-2 border-[#7240b8]/30 dark:border-[#a87ffb]/30 flex flex-col gap-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Trả lời @${root.user?.username || 'học viên'} (tối thiểu 6 ký tự)...`}
                      disabled={isSubmittingReply}
                      rows={2}
                      className="w-full p-3 rounded-xl border border-[#e6dffa] dark:border-[#382d50] bg-white dark:bg-[#1d1926] text-xs text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                        {replyContent.trim().length}/500 ký tự
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyContent('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-[#635a72] dark:text-[#b4a9c7] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateReply(rootId)}
                          disabled={isSubmittingReply || replyContent.trim().length < 6}
                          className="px-4 py-1.5 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          {isSubmittingReply ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Đang gửi...</span>
                            </>
                          ) : (
                            <span>Gửi câu trả lời</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== NESTED REPLIES ==================== */}
                {hasReplies && isRepliesExpanded && (
                  <div className="pt-2 pl-4 sm:pl-6 border-l-2 border-[#ebe5ff] dark:border-[#282136] flex flex-col gap-3 mt-1">
                    {replies.map((reply) => {
                      const replyId = reply.id || reply._id || '';
                      if (!replyId) return null;
                      const isReplyAuthor =
                        Boolean(currentUserId) &&
                        (currentUserId === reply.user?.id || currentUserId === reply.user?._id);
                      const isReplyEditing = editingCommentId === replyId;
                      const replyLiked =
                        Boolean(currentUserId) &&
                        Array.isArray(reply.likes) &&
                        reply.likes.includes(currentUserId!);
                      const replyDisliked =
                        Boolean(currentUserId) &&
                        Array.isArray(reply.dislikes) &&
                        reply.dislikes.includes(currentUserId!);

                      const isReplyHighlighted = activeHighlightId === replyId;

                      return (
                        <div
                          key={replyId}
                          id={`comment-${replyId}`}
                          className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all duration-500 ${
                            isReplyHighlighted
                              ? 'ring-2 ring-[#7240b8] dark:ring-[#a87ffb] bg-purple-50/90 dark:bg-[#2e1f48] shadow-md border-[#7240b8]/40'
                              : 'bg-white/80 dark:bg-[#1a1622] border-[#f1ebff] dark:border-[#282136]'
                          }`}
                        >
                          {/* Reply Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  reply.user?.avatar ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                                }
                                alt={reply.user?.username || 'Học viên'}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-[#e6dffa] dark:ring-[#382d50]"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                                    {reply.user?.username || 'Học viên TMDEMY'}
                                  </span>
                                  {reply.user?.role?.toUpperCase() === 'TEACHER' && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-[#7240b8] dark:text-[#a87ffb] text-[9px] font-bold">
                                      Giảng viên
                                    </span>
                                  )}
                                  {reply.user?.role?.toUpperCase() === 'ADMIN' && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[9px] font-bold">
                                      Quản trị viên
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#7c7483] dark:text-[#b4a9c7]">
                                  {new Date(reply.createdAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {reply.updatedAt && reply.updatedAt !== reply.createdAt && ' (đã chỉnh sửa)'}
                                </span>
                              </div>
                            </div>

                            {/* Reply Author Edit/Delete */}
                            {isReplyAuthor && !isReplyEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(replyId);
                                    setEditDraftContent(reply.content);
                                  }}
                                  className="p-1 rounded text-[#7c7483] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors cursor-pointer"
                                  title="Chỉnh sửa câu trả lời"
                                >
                                  <span className="material-symbols-outlined text-[15px]">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(replyId)}
                                  disabled={deletingCommentId === replyId}
                                  className="p-1 rounded text-[#7c7483] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Xóa câu trả lời"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Reply Content */}
                          {isReplyEditing ? (
                            <div className="flex flex-col gap-2 pt-1">
                              <textarea
                                value={editDraftContent}
                                onChange={(e) => setEditDraftContent(e.target.value)}
                                disabled={isSubmittingEdit}
                                rows={2}
                                className="w-full p-2.5 rounded-lg border border-[#7240b8] bg-white dark:bg-[#1d1926] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-none"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-[#635a72] dark:text-[#b4a9c7]">
                                  {editDraftContent.trim().length}/500 ký tự
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditDraftContent('');
                                    }}
                                    disabled={isSubmittingEdit}
                                    className="px-2.5 py-1 rounded text-xs font-semibold text-[#635a72] dark:text-[#b4a9c7] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(replyId)}
                                    disabled={isSubmittingEdit || editDraftContent.trim().length < 6}
                                    className="px-3 py-1 rounded bg-[#7240b8] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                                  >
                                    {isSubmittingEdit ? 'Đang lưu...' : 'Lưu'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[#2d2735] dark:text-[#e4deee] leading-relaxed whitespace-pre-line">
                              {reply.content}
                            </p>
                          )}

                          {/* Reply Reactions Strip */}
                          <div className="flex items-center gap-3 pt-0.5 text-xs">
                            <button
                              onClick={() => handleToggleReaction(replyId, 'like')}
                              disabled={reactionInProgress[replyId]}
                              className={`flex items-center gap-1 py-0.5 px-2 rounded transition-colors cursor-pointer text-[11px] ${
                                replyLiked
                                  ? 'bg-purple-100 dark:bg-purple-950/60 text-[#7240b8] dark:text-[#a87ffb] font-bold'
                                  : 'text-[#635a72] dark:text-[#b4a9c7] hover:bg-purple-50 dark:hover:bg-[#201a2b]'
                              }`}
                            >
                              <span
                                className="material-symbols-outlined text-[14px]"
                                style={{ fontVariationSettings: replyLiked ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                thumb_up
                              </span>
                              <span>{reply.likes?.length || 0}</span>
                            </button>

                            <button
                              onClick={() => handleToggleReaction(replyId, 'dislike')}
                              disabled={reactionInProgress[replyId]}
                              className={`flex items-center gap-1 py-0.5 px-2 rounded transition-colors cursor-pointer text-[11px] ${
                                replyDisliked
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                                  : 'text-[#635a72] dark:text-[#b4a9c7] hover:bg-rose-50 dark:hover:bg-[#201a2b]'
                              }`}
                            >
                              <span
                                className="material-symbols-outlined text-[14px]"
                                style={{ fontVariationSettings: replyDisliked ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                thumb_down
                              </span>
                              <span>{reply.dislikes?.length || 0}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 text-center flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[#f7f1ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#282136]">
          <div className="w-14 h-14 rounded-full bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
            <span className="material-symbols-outlined text-[30px]">chat_bubble_outline</span>
          </div>
          <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Chưa có câu hỏi thảo luận nào
          </h4>
          <p className="text-xs text-[#635a72] dark:text-[#b4a9c7] max-w-sm">
            Hãy là người đầu tiên đặt câu hỏi để cùng thảo luận và giải đáp thắc mắc với giảng viên và các bạn học viên khác.
          </p>
        </div>
      )}
    </div>
  );
}
