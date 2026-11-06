'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface LogoProps {
  /**
   * Size variant or specific pixel size for the logo icon.
   * - 'sm': 24px
   * - 'md': 32px (default, ideal for navigation & sidebars)
   * - 'lg': 40px (ideal for auth cards & headers)
   * - 'xl': 48px
   * - number: exact pixel dimensions
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;

  /**
   * Whether to render the 'TMdemy' brand text alongside the icon.
   * @default true
   */
  showText?: boolean;

  /**
   * Optional subtitle text under 'TMdemy' (e.g. 'Học tập đỉnh cao', 'Cổng Quản Trị').
   */
  subtitle?: string;

  /**
   * Custom CSS classes for the root container.
   */
  className?: string;

  /**
   * Custom CSS classes for the logo image element.
   */
  imageClassName?: string;

  /**
   * Custom CSS classes for the brand text.
   */
  textClassName?: string;

  /**
   * Custom CSS classes for the subtitle text.
   */
  subtitleClassName?: string;

  /**
   * If provided, wraps the logo inside a Next.js `<Link>`.
   */
  href?: string;

  /**
   * Click event handler.
   */
  onClick?: () => void;

  /**
   * Next.js Image preload priority.
   * @default true
   */
  priority?: boolean;
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg' | 'xl', { px: number; textClass: string }> = {
  sm: { px: 24, textClass: 'text-lg' },
  md: { px: 32, textClass: 'text-xl' },
  lg: { px: 40, textClass: 'text-2xl' },
  xl: { px: 48, textClass: 'text-3xl' },
};

/**
 * Official TMdemy Brand Logo Component
 *
 * Uses `/logo.png` from public assets.
 * Supports multiple size presets, optional subtitles, and Link wrapping.
 */
export function Logo({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
  imageClassName = '',
  textClassName = '',
  subtitleClassName = '',
  href,
  onClick,
  priority = true,
}: LogoProps) {
  const isPreset = typeof size === 'string' && size in SIZE_MAP;
  const pixelSize = isPreset
    ? SIZE_MAP[size as keyof typeof SIZE_MAP].px
    : typeof size === 'number'
    ? size
    : 32;

  const defaultTextClass = isPreset
    ? SIZE_MAP[size as keyof typeof SIZE_MAP].textClass
    : 'text-xl';

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        href ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={!href ? onClick : undefined}
    >
      {/* Brand Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src="/logo.png"
          alt="TMdemy Logo"
          width={pixelSize}
          height={pixelSize}
          priority={priority}
          className={`w-full h-full object-contain ${imageClassName}`}
        />
      </div>

      {/* Brand Text & Optional Subtitle */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-bold tracking-tight text-[#7240b8] dark:text-[#a87ffb] leading-tight ${defaultTextClass} ${textClassName}`}
          >
            TMdemy
          </span>
          {subtitle && (
            <span
              className={`text-[10px] uppercase font-bold tracking-widest text-[#7240b8] dark:text-[#a87ffb] opacity-85 leading-tight mt-0.5 ${subtitleClassName}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

