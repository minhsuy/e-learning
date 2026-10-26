'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/theme-context';
import { Theme } from '@/types/theme';

interface ThemeToggleProps {
  className?: string;
  align?: 'left' | 'right';
}

export function ThemeToggle({ className = '', align = 'right' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const options: { id: Theme; label: string; icon: string }[] = [
    { id: 'light', label: 'Giao diện sáng', icon: 'light_mode' },
    { id: 'dark', label: 'Giao diện tối', icon: 'dark_mode' },
    { id: 'system', label: 'Theo hệ thống', icon: 'desktop_windows' },
  ];

  const currentIcon =
    theme === 'system'
      ? resolvedTheme === 'dark'
        ? 'dark_mode'
        : 'light_mode'
      : theme === 'dark'
      ? 'dark_mode'
      : 'light_mode';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Chuyển đổi giao diện sáng/tối"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="p-2 rounded-lg text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#7240b8] dark:focus:ring-[#a87ffb] cursor-pointer flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform duration-200">
          {currentIcon}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-48 rounded-xl bg-white dark:bg-[#1d1926] shadow-lg border border-[#f1ebff] dark:border-[#352e43] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider border-b border-[#f7f1ff] dark:border-[#2b2438]">
            Chế độ giao diện
          </div>
          <div className="py-1">
            {options.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  role="menuitem"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]'
                      : 'text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-[#7240b8] dark:text-[#a87ffb]">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
