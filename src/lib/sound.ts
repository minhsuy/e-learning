/**
 * TMDEMY — Sound Notification Service & Web Audio Synthesizer
 *
 * Provides a lightweight, dependency-free audio chime using Web Audio API:
 * - Zero external audio file dependencies (no 404s, zero bandwidth)
 * - Soft, gentle, two-tone chime (E5 -> A5 with exponential gain envelope)
 * - Autoplay restriction handling (catches unhandled promise rejection safely)
 * - Global persistence in localStorage ('tmdemy_sound_enabled')
 * - Audio throttling / debouncing (minimum 600ms between chimes)
 * - De-duplication via unique message / notification ID tracking
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tmdemy_sound_enabled';
const EVENT_NAME = 'tmdemy_sound_setting_changed';
const THROTTLE_MS = 600;

// Shared AudioContext (initialized lazily upon first user interaction or trigger)
let audioCtx: AudioContext | null = null;
let lastPlayTimestamp = 0;
const recentlyPlayedIds = new Set<string>();

/**
 * Check if sound notifications are enabled.
 * Defaults to true if not explicitly set to 'false'.
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

/**
 * Update sound notification preference and broadcast to other components.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { enabled } })
    );
  } catch {
    // Ignore localStorage write failures (e.g. private mode quota)
  }
}

/**
 * Lazily initialize the Web Audio context in the browser.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }

  return audioCtx;
}

export interface PlaySoundOptions {
  id?: string;
  source?: 'message' | 'notification';
}

/**
 * Play a gentle two-tone notification chime.
 * Handles deduplication, cooldown throttling, and browser autoplay restrictions.
 */
export function playNotificationSound(options: PlaySoundOptions = {}): void {
  if (typeof window === 'undefined') return;

  // 1. Check user preference
  if (!isSoundEnabled()) return;

  // 2. Check deduplication by ID
  if (options.id) {
    if (recentlyPlayedIds.has(options.id)) return;
    recentlyPlayedIds.add(options.id);
    // Auto-expire cached ID after 10 seconds
    setTimeout(() => {
      recentlyPlayedIds.delete(options.id!);
    }, 10000);
  }

  // 3. Check throttle limit (prevent audio buzzing from simultaneous events)
  const now = Date.now();
  if (now - lastPlayTimestamp < THROTTLE_MS) return;
  lastPlayTimestamp = now;

  // 4. Synthesize gentle chime via Web Audio API
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Handle suspended AudioContext (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Ignored: browser autoplay policy restriction before user gesture
      });
    }

    const startTime = ctx.currentTime;

    // Master Gain for pleasant volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, startTime);
    masterGain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
    masterGain.connect(ctx.destination);

    // Note 1: E5 (659.25 Hz) - subtle chime prompt
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, startTime);
    osc1.connect(masterGain);
    osc1.start(startTime);
    osc1.stop(startTime + 0.12);

    // Note 2: A5 (880 Hz) - gentle harmonic confirmation
    const note2Start = startTime + 0.07;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, note2Start);
    osc2.connect(masterGain);
    osc2.start(note2Start);
    osc2.stop(startTime + 0.35);
  } catch {
    // Fail silently without breaking page execution
  }
}

/**
 * React hook to synchronize sound notification toggle state across components.
 */
export function useSoundSetting() {
  const [soundEnabled, setSoundState] = useState<boolean>(() => isSoundEnabled());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSoundState(e.newValue !== 'false');
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
        setSoundState(customEvent.detail.enabled);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_NAME, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
    };
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundState(next);
    setSoundEnabled(next);
    if (next) {
      // Provide an immediate gentle sound preview so the user knows audio works
      playNotificationSound();
    }
  }, [soundEnabled]);

  const updateSound = useCallback((val: boolean) => {
    setSoundState(val);
    setSoundEnabled(val);
    if (val) {
      playNotificationSound();
    }
  }, []);

  return {
    soundEnabled,
    toggleSound,
    setSound: updateSound,
  };
}
