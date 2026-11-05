'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface LessonSummaryViewerProps {
  summary?: string | null;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function CodeBlockRenderer({
  language,
  value,
}: {
  language?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-4 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-[#1a1625] text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#221c30] border-b border-[#2d2540] text-slate-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#a87ffb]" />
          <span className="text-[11px] font-mono uppercase font-bold text-[#cbb4fb]">
            {language || 'CODE'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-[#2e2642] transition-colors cursor-pointer"
          title="Sao chép mã nguồn"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-200">
        <pre className="m-0 whitespace-pre">{value}</pre>
      </div>
    </div>
  );
}

export function LessonSummaryViewer({
  summary,
  isLoading = false,
  emptyTitle = 'Chưa có nội dung tóm tắt',
  emptyDescription = 'Bài học này chưa có nội dung tóm tắt do AI tạo. Giảng viên có thể khởi tạo tóm tắt từ video bài giảng.',
  className = '',
}: LessonSummaryViewerProps) {
  if (isLoading) {
    return (
      <div className={`space-y-4 p-6 animate-pulse ${className}`}>
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/5" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-5/6" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-4/6" />
        <div className="h-24 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full mt-4" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-3/4" />
      </div>
    );
  }

  const cleanSummary = summary?.trim();

  if (!cleanSummary) {
    return (
      <div
        className={`p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#1a1625] space-y-3 ${className}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
          {emptyTitle}
        </h3>
        <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto leading-relaxed">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none text-[#1c192c] dark:text-[#f4eeff] ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] border-b border-[#eceaf3] dark:border-[#352e43] pb-2.5 mb-4 mt-6 first:mt-0 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff] mb-3 mt-5 border-l-4 border-[#7240b8] dark:border-[#a87ffb] pl-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mb-2 mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 space-y-1.5 mb-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1.5 mb-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#7240b8] dark:border-[#a87ffb] bg-[#f7f1ff]/60 dark:bg-[#282234]/60 p-3.5 my-4 rounded-r-xl text-xs sm:text-sm italic text-slate-700 dark:text-slate-300">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="border-t border-[#eceaf3] dark:border-[#352e43] my-6" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-[#eceaf3] dark:border-[#352e43] shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#f7f1ff] dark:bg-[#282234] border-b border-[#eceaf3] dark:border-[#352e43] font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#eceaf3] dark:divide-[#352e43]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50 dark:hover:bg-[#252030] transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="p-3 font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-3 text-slate-700 dark:text-slate-300 align-top leading-relaxed">
              {children}
            </td>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isMultiLine = codeString.includes('\n');

            if (match || isMultiLine) {
              return (
                <CodeBlockRenderer
                  language={match ? match[1] : undefined}
                  value={codeString}
                />
              );
            }

            return (
              <code
                className="font-mono text-[11px] sm:text-xs px-1.5 py-0.5 rounded-md bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#cbb4fb] font-semibold border border-[#eceaf3] dark:border-[#352e43]"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ href, children }) => {
            const isSafe =
              href &&
              (href.startsWith('http://') ||
                href.startsWith('https://') ||
                href.startsWith('/'));
            if (!isSafe) {
              return <span>{children}</span>;
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline"
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            );
          },
        }}
      >
        {cleanSummary}
      </ReactMarkdown>
    </div>
  );
}
