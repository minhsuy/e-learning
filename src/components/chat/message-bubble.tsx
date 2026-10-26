'use client';

import React, { useState } from 'react';
import { Message } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isMe,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(d);
    } catch {
      return '';
    }
  };

  const senderName = message.sender?.username || (isMe ? 'Bạn' : 'Người dùng');
  const senderAvatar = message.sender?.avatar;
  const timeFormatted = formatMessageTime(message.createdAt);

  // Parse code snippet if present (```language ... ```)
  const codeBlockMatch = message.content.match(/```(\w*)\n([\s\S]*?)```/);
  const plainText = codeBlockMatch
    ? message.content.replace(/```(\w*)\n([\s\S]*?)```/, '').trim()
    : message.content;

  if (isMe) {
    return (
      <div
        className="group relative flex flex-col items-end gap-1 max-w-xl md:max-w-2xl ml-auto animate-in fade-in duration-150"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-end gap-1.5 relative">
          {/* Action buttons (Visible on hover on desktop or via state) */}
          {showActions && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#1d1926] shadow-sm border border-[#f1ebff] dark:border-[#2f2742] animate-in fade-in zoom-in-95 duration-100 mr-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(message)}
                  title="Sửa tin nhắn"
                  className="w-7 h-7 flex items-center justify-center rounded text-[#635a72] dark:text-[#b4a9c7] hover:text-[#7240b8] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
                      onDelete(message.id || (message as { _id?: string })._id || '');
                    }
                  }}
                  title="Xóa tin nhắn"
                  className="w-7 h-7 flex items-center justify-center rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
            </div>
          )}

          {/* Outgoing Bubble */}
          <div className="flex flex-col items-end">
            <div className="p-3.5 md:p-4 rounded-2xl rounded-tr-xs bg-[#7240b8] text-white shadow-sm text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words max-w-full">
              {plainText && <div>{plainText}</div>}

              {/* Code Snippet attachment */}
              {codeBlockMatch && (
                <div className="mt-2 w-full bg-[#181420] text-emerald-300 rounded-xl p-3 shadow-inner border border-white/10 font-mono text-xs overflow-x-auto text-left">
                  {codeBlockMatch[1] && (
                    <span className="text-[10px] text-white/50 block mb-1 uppercase font-semibold">
                      {codeBlockMatch[1]}
                    </span>
                  )}
                  <code>{codeBlockMatch[2]}</code>
                </div>
              )}
            </div>

            {/* Message Meta Info */}
            <div className="flex items-center gap-1.5 mt-1 pr-1 text-[11px] text-[#7c7483] dark:text-[#8e8596]">
              {message.isEdited && (
                <span className="italic text-[10px] opacity-80">(đã chỉnh sửa)</span>
              )}
              <span>{timeFormatted}</span>
              <span
                className="material-symbols-outlined text-[14px] text-[#7240b8] dark:text-[#a87ffb]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                done_all
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Incoming Message Bubble
  return (
    <div className="flex items-start gap-2.5 max-w-xl md:max-w-2xl animate-in fade-in duration-150">
      {senderAvatar ? (
        <img
          src={senderAvatar}
          alt={senderName}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 ring-1 ring-[#e6dffa] dark:ring-[#3d3252]"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 mt-1 text-xs font-bold ring-1 ring-[#e6dffa] dark:ring-[#3d3252]">
          {senderName.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="text-[11px] font-semibold text-[#635a72] dark:text-[#b4a9c7] mb-1">
          {senderName}
        </span>
        <div className="p-3.5 md:p-4 rounded-2xl rounded-tl-xs bg-white dark:bg-[#1d1926] text-[#1c192c] dark:text-[#f4eeff] shadow-xs border border-[#f1ebff] dark:border-[#2f2742] text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words w-full">
          {plainText && <div>{plainText}</div>}

          {/* Code Snippet attachment */}
          {codeBlockMatch && (
            <div className="mt-2 w-full bg-[#181420] text-emerald-300 rounded-xl p-3 shadow-inner border border-white/10 font-mono text-xs overflow-x-auto text-left">
              {codeBlockMatch[1] && (
                <span className="text-[10px] text-white/50 block mb-1 uppercase font-semibold">
                  {codeBlockMatch[1]}
                </span>
              )}
              <code>{codeBlockMatch[2]}</code>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1 pl-1 text-[11px] text-[#7c7483] dark:text-[#8e8596]">
          <span>{timeFormatted}</span>
          {message.isEdited && (
            <span className="italic text-[10px] opacity-80">(đã chỉnh sửa)</span>
          )}
        </div>
      </div>
    </div>
  );
}
