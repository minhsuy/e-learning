'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
  readOnly?: boolean;
  onChange?: (newCode: string) => void;
  maxHeight?: string;
}

export function CodeSnippet({
  code,
  language = 'javascript',
  title,
  readOnly = true,
  onChange,
  maxHeight = '320px',
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = code.split('\n');

  return (
    <div className="rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-[#1a1625] text-slate-100 overflow-hidden shadow-xs flex flex-col font-mono text-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#221c30] border-b border-[#2d2540] text-slate-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#a87ffb]" />
          <span className="font-semibold text-[11px] text-slate-200">
            {title || language.toUpperCase()}
          </span>
          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#2e2642] text-[#cbb4fb] font-sans font-bold">
            {language}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-sans font-medium text-slate-300 hover:text-white hover:bg-[#2e2642] transition-colors"
          title="Sao chép mã nguồn"
          aria-label="Sao chép mã nguồn"
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

      {/* Code Body */}
      {readOnly ? (
        <div
          className="overflow-auto p-3.5 leading-relaxed selection:bg-[#7240b8]/40 selection:text-white"
          style={{ maxHeight }}
        >
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-[#251f35]/50 transition-colors">
                  <td className="w-8 pr-3 text-right select-none text-slate-500 font-mono text-[11px] align-top">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre font-mono text-slate-200 text-xs break-all">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative flex min-h-[160px]" style={{ maxHeight }}>
          <div className="w-10 select-none bg-[#161220] py-3 text-right pr-2 text-slate-500 font-mono text-[11px] border-r border-[#2d2540]">
            {lines.map((_, idx) => (
              <div key={idx} className="leading-5">
                {idx + 1}
              </div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent p-3 text-slate-200 font-mono text-xs leading-5 resize-none outline-hidden overflow-auto focus:ring-1 focus:ring-[#7240b8]"
            rows={Math.max(6, lines.length)}
          />
        </div>
      )}
    </div>
  );
}
