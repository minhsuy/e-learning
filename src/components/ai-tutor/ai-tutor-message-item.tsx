'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  User,
  Copy,
  Check,
  Video,
  Code2,
} from 'lucide-react';
import { AiTutorMessage } from '@/types/ai-tutor';
import { AiTutorCitationBadge } from './ai-tutor-citation-badge';
import { sanitizeAiTutorAnswer } from '@/lib/sanitize-ai-tutor';
import { toast } from '@/lib/toast';

interface AiTutorMessageItemProps {
  message: AiTutorMessage;
  userAvatar?: string | null;
  userName?: string;
  onSeek?: (seconds: number) => void;
}

export function AiTutorMessageItem({
  message,
  userAvatar,
  userName = 'Bạn',
  onSeek,
}: AiTutorMessageItemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const displayContent = isAssistant ? sanitizeAiTutorAnswer(message.content) : message.content;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setIsCopied(true);
      toast.success('Đã sao chép nội dung vào khay nhớ tạm!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép nội dung.');
    }
  };

  const formattedTime = (() => {
    try {
      const d = new Date(message.createdAt);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <div
      className={`flex items-start gap-3 py-3 ${
        isAssistant ? 'bg-transparent' : 'flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs overflow-hidden ${
          isAssistant
            ? 'bg-white dark:bg-gray-800 ring-2 ring-purple-400/50 p-0.5'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}
      >
        {isAssistant ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/icon.png"
            alt="TMdemy AI Tutor"
            className="w-full h-full rounded-full object-cover"
          />
        ) : userAvatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={userAvatar}
            alt={userName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* Message Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${
          isAssistant ? 'items-start' : 'items-end'
        }`}
      >
        {/* Author & Timestamp */}
        <div
          className={`flex items-center gap-2 mb-1 text-[11px] text-[#7c7483] dark:text-[#968e9e] ${
            isAssistant ? '' : 'flex-row-reverse'
          }`}
        >
          <span className="font-semibold">{isAssistant ? 'AI Tutor' : userName}</span>
          {formattedTime && <span>• {formattedTime}</span>}
        </div>

        {/* Bubble */}
        <div
          className={`relative group rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
            isAssistant
              ? 'bg-white dark:bg-[#1f1a29] border border-[#f1ebff] dark:border-[#352c47] text-[#1c192c] dark:text-[#f4eeff] rounded-tl-sm'
              : 'bg-[#7240b8] text-white rounded-tr-sm'
          }`}
        >
          {/* Assistant Markdown Content */}
          {isAssistant ? (
            <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Code block with syntax styling & copy button
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-[#7240b8] dark:text-[#c4a5ff] font-mono text-[11px] font-semibold"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="my-2 rounded-xl overflow-hidden border border-purple-200/50 dark:border-purple-900/50 bg-[#161220] text-slate-100">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#231c33] text-[10px] text-slate-300 font-mono">
                          <span className="flex items-center gap-1 uppercase tracking-wider">
                            <Code2 className="w-3 h-3 text-[#a87ffb]" />
                            {match ? match[1] : 'code'}
                          </span>
                        </div>
                        <pre className="p-3 text-xs font-mono overflow-x-auto text-slate-200 leading-normal">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed">{children}</li>;
                  },
                  strong({ children }) {
                    return <strong className="font-bold text-[#7240b8] dark:text-[#c4a5ff]">{children}</strong>;
                  },
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Copy Action Button (visible on hover or focus) */}
          <button
            type="button"
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer ${
              isAssistant ? '' : 'text-purple-200 hover:text-white hover:bg-white/20'
            }`}
            title="Sao chép câu trả lời"
            aria-label="Sao chép nội dung"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Video Citations Bar */}
        {isAssistant && message.citations && message.citations.length > 0 && (
          <div className="mt-2.5 w-full flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7240b8] dark:text-[#a87ffb]">
              <Video className="w-3.5 h-3.5" />
              <span>Mốc thời gian liên quan trong video:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, idx) => (
                <AiTutorCitationBadge
                  key={`${citation.chunkId}-${idx}`}
                  citation={citation}
                  onSeek={onSeek}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
