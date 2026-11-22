'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { AiTutorChatPanel } from './ai-tutor-chat-panel';

export interface AiTutorFloatingChatProps {
  lessonId: string;
  lessonTitle?: string;
  isEnrolled?: boolean;
  onSeek?: (seconds: number) => void;
}

export function AiTutorFloatingChat({
  lessonId,
  lessonTitle,
  isEnrolled = true,
  onSeek,
}: AiTutorFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const prevLessonIdRef = useRef(lessonId);

  // If lesson changes, reset unread state
  useEffect(() => {
    if (prevLessonIdRef.current !== lessonId) {
      prevLessonIdRef.current = lessonId;
      setHasUnread(false);
    }
  }, [lessonId]);

  // Handle Escape key to minimize chat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop (only on small screens when open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Floating Messenger Chat Window (Mounted continuously to preserve state) */}
      <div
        role="dialog"
        aria-label="Cửa sổ trò chuyện TMdemy AI Tutor"
        aria-modal="false"
        className={`fixed z-50 flex flex-col overflow-hidden bg-white dark:bg-gray-900 border border-purple-200/80 dark:border-purple-900/60 shadow-2xl transition-all duration-200 ease-out
          inset-x-0 bottom-0 top-14 rounded-t-2xl sm:inset-auto sm:right-6 sm:bottom-24 sm:w-[410px] sm:h-[580px] sm:max-h-[calc(100vh-120px)] sm:rounded-2xl
          ${
            isOpen
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
          }
        `}
      >
        <AiTutorChatPanel
          lessonId={lessonId}
          lessonTitle={lessonTitle}
          isEnrolled={isEnrolled}
          onSeek={onSeek}
          onClose={handleClose}
          showCloseButton={true}
          className="h-full border-l-0"
        />
      </div>

      {/* Floating Messenger-Style Launcher Bubble */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center">
        <button
          type="button"
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          aria-label={isOpen ? 'Thu nhỏ TMdemy AI Tutor' : 'Mở TMdemy AI Tutor'}
          aria-expanded={isOpen}
          title={isOpen ? 'Thu nhỏ AI Tutor' : 'Mở TMdemy AI Tutor — Trợ lý bài học'}
          className={`group relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-xl hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400
            w-14 h-14 sm:w-16 sm:h-16
            ${
              isOpen
                ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-300 dark:ring-purple-700 scale-95'
                : 'bg-white dark:bg-gray-900 ring-2 ring-purple-500/30 hover:ring-purple-500 hover:scale-105 active:scale-95'
            }
          `}
        >
          {isOpen ? (
            /* Close/Minimize icon when window is active */
            <div className="flex items-center justify-center">
              <ChevronDown className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:translate-y-0.5" />
            </div>
          ) : (
            /* AI Tutor Avatar when collapsed */
            <div className="relative w-full h-full p-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="TMdemy AI Tutor"
                className="w-full h-full rounded-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Sparkle decorative badge */}
              <span className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                <Sparkles className="w-2.5 h-2.5" />
              </span>

              {/* Unread / Active notification indicator */}
              {hasUnread ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 ring-2 ring-white dark:ring-gray-900" />
                </span>
              ) : (
                /* Online status dot */
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
              )}
            </div>
          )}
        </button>

        {/* Hover Pill Label on Desktop (when collapsed) */}
        {!isOpen && (
          <div className="hidden lg:flex items-center pointer-events-none absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-gray-900/90 dark:bg-gray-800/95 text-white text-xs font-semibold shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <span>Hỏi AI Tutor</span>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-900/90 dark:border-l-gray-800/95" />
          </div>
        )}
      </div>
    </>
  );
}
