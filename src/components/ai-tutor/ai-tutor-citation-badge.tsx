'use client';

import React, { useState } from 'react';
import { Play, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { CitationDto } from '@/types/ai-tutor';

interface AiTutorCitationBadgeProps {
  citation: CitationDto;
  onSeek?: (seconds: number) => void;
  className?: string;
}

export function AiTutorCitationBadge({
  citation,
  onSeek,
  className = '',
}: AiTutorCitationBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSeek = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSeek && typeof citation.startTime === 'number') {
      onSeek(citation.startTime);
    }
  };

  const toggleSnippet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={`inline-flex flex-col text-xs rounded-xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/70 dark:bg-purple-950/30 overflow-hidden transition-all ${className}`}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        {/* Seek button */}
        <button
          type="button"
          onClick={handleSeek}
          className="inline-flex items-center gap-1 font-bold text-[#7240b8] dark:text-[#a87ffb] hover:text-[#5e3299] dark:hover:text-[#c4a5ff] hover:underline transition-colors cursor-pointer"
          title={`Bấm để chuyển video đến mốc ${citation.startTimeFormatted}`}
          aria-label={`Chuyển video đến mốc ${citation.startTimeFormatted}`}
        >
          <div className="w-4 h-4 rounded-full bg-[#7240b8] text-white flex items-center justify-center shrink-0">
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
          </div>
          <span>
            {citation.startTimeFormatted} - {citation.endTimeFormatted}
          </span>
        </button>

        {/* Expand snippet toggle */}
        {citation.snippet && (
          <button
            type="button"
            onClick={toggleSnippet}
            className="p-0.5 text-purple-600/70 dark:text-purple-400/70 hover:text-purple-900 dark:hover:text-purple-200 rounded transition-colors cursor-pointer"
            title={isExpanded ? 'Ẩn trích dẫn' : 'Xem trích dẫn lời giảng'}
            aria-label={isExpanded ? 'Ẩn trích dẫn lời giảng' : 'Xem trích dẫn lời giảng'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Expanded snippet transcript text */}
      {isExpanded && citation.snippet && (
        <div className="px-2.5 pb-2 pt-1 border-t border-purple-200/50 dark:border-purple-900/40 text-[11px] text-[#4b4452] dark:text-[#cdc3d4] leading-relaxed flex items-start gap-1.5 bg-white/60 dark:bg-[#1f1a29]/60">
          <Quote className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
          <p className="italic">{citation.snippet}</p>
        </div>
      )}
    </div>
  );
}

