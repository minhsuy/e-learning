'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import { telegramTeacherService } from '@/services/telegram-teacher.service';
import { AppApiError } from '@/types/api';
import {
  TeacherTelegramLinkTokenData,
  TeacherTelegramStatusData,
} from '@/types/telegram';

export interface UseTeacherTelegramReturn {
  status: TeacherTelegramStatusData | null;
  isLoadingStatus: boolean;
  isGeneratingToken: boolean;
  isUnlinking: boolean;
  error: string | null;
  linkData: TeacherTelegramLinkTokenData | null;
  isModalOpen: boolean;
  isConfirmUnlinkOpen: boolean;
  fetchStatus: () => Promise<void>;
  openLinkModal: () => Promise<void>;
  closeLinkModal: () => void;
  openConfirmUnlink: () => void;
  closeConfirmUnlink: () => void;
  unlink: () => Promise<boolean>;
}

/**
 * Custom React hook managing the Telegram Teacher Account Linking lifecycle (TG-02B).
 *
 * Handles initial status check, token generation, 3-second auto-polling during
 * modal visibility, token expiration tracking, and secure unlinking confirmation.
 */
export function useTeacherTelegram(): UseTeacherTeacherTelegramReturn {
  const [status, setStatus] = useState<TeacherTelegramStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isGeneratingToken, setIsGeneratingToken] = useState<boolean>(false);
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [linkData, setLinkData] = useState<TeacherTelegramLinkTokenData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmUnlinkOpen, setIsConfirmUnlinkOpen] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const isPollingRef = useRef<boolean>(false);
  const isLinkedRef = useRef<boolean>(false);

  // Synchronize ref with state for polling closure safety
  useEffect(() => {
    isLinkedRef.current = Boolean(status?.isLinked);
  }, [status?.isLinked]);

  // Primary status fetcher
  const fetchStatus = useCallback(async () => {
    try {
      const res = await telegramTeacherService.getStatus();
      if (res.success && res.data) {
        setStatus(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        // If 404, teacher is unlinked
        if (err.statusCode === 404) {
          setStatus({ isLinked: false, account: null });
        } else {
          setError(err.message);
        }
      } else {
        setError('Không thể kiểm tra trạng thái liên kết Telegram.');
      }
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isCurrent = true;

    async function load() {
      await Promise.resolve();
      if (!isCurrent) return;
      setIsLoadingStatus(true);
      await fetchStatus();
    }

    void load();

    return () => {
      isCurrent = false;
    };
  }, [fetchStatus, reloadKey]);

  // Generate 15-min linking token & open modal
  const openLinkModal = useCallback(async () => {
    setIsGeneratingToken(true);
    setError(null);

    try {
      const res = await telegramTeacherService.generateLinkToken();
      if (res.success && res.data) {
        setLinkData(res.data);
        setIsModalOpen(true);
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        if (err.statusCode === 409) {
          toast.warning('Tài khoản Giảng viên đã được liên kết với một tài khoản Telegram.');
          // Refresh status to synchronize UI
          setReloadKey((k) => k + 1);
        } else if (err.statusCode === 429) {
          toast.error('Bạn đã tạo mã quá nhiều lần trong 15 phút. Vui lòng thử lại sau.');
        } else {
          toast.error(err.message || 'Không thể tạo mã liên kết Telegram.');
        }
      } else {
        toast.error('Lỗi kết nối khi tạo mã liên kết Telegram.');
      }
    } finally {
      setIsGeneratingToken(false);
    }
  }, []);

  // Close modal and destroy in-memory token
  const closeLinkModal = useCallback(() => {
    setIsModalOpen(false);
    setLinkData(null);
  }, []);

  const openConfirmUnlink = useCallback(() => {
    setIsConfirmUnlinkOpen(true);
  }, []);

  const closeConfirmUnlink = useCallback(() => {
    if (!isUnlinking) {
      setIsConfirmUnlinkOpen(false);
    }
  }, [isUnlinking]);

  // Execute unlinking with confirmation
  const unlink = useCallback(async (): Promise<boolean> => {
    setIsUnlinking(true);

    try {
      const res = await telegramTeacherService.unlinkAccount();
      if (res.success) {
        toast.success('Hủy liên kết tài khoản Telegram thành công!');
        setStatus({ isLinked: false, account: null });
        setIsConfirmUnlinkOpen(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tmdemy:telegram-unlinked'));
        }
        return true;
      }
      return false;
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        toast.error(err.message || 'Hủy liên kết thất bại.');
      } else {
        toast.error('Lỗi kết nối khi hủy liên kết tài khoản Telegram.');
      }
      return false;
    } finally {
      setIsUnlinking(false);
    }
  }, []);

  // 3-Second Auto-Polling while Linking Modal is Open
  useEffect(() => {
    if (!isModalOpen || !linkData || isLinkedRef.current) {
      return;
    }

    const pollInterval = setInterval(async () => {
      // Prevent overlapping requests
      if (isPollingRef.current) return;

      // Check if token has expired locally
      if (linkData.expiresAt && new Date(linkData.expiresAt).getTime() <= Date.now()) {
        clearInterval(pollInterval);
        return;
      }

      isPollingRef.current = true;
      try {
        const res = await telegramTeacherService.getStatus();
        if (res.success && res.data?.isLinked) {
          setStatus(res.data);
          toast.success('🎉 Liên kết tài khoản Telegram thành công!');
          setIsModalOpen(false);
          setLinkData(null);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tmdemy:telegram-linked'));
          }
          clearInterval(pollInterval);
        }
      } catch {
        // Silently tolerate transient polling errors
      } finally {
        isPollingRef.current = false;
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      isPollingRef.current = false;
    };
  }, [isModalOpen, linkData]);

  return {
    status,
    isLoadingStatus,
    isGeneratingToken,
    isUnlinking,
    error,
    linkData,
    isModalOpen,
    isConfirmUnlinkOpen,
    fetchStatus,
    openLinkModal,
    closeLinkModal,
    openConfirmUnlink,
    closeConfirmUnlink,
    unlink,
  };
}

export type UseTeacherTeacherTelegramReturn = UseTeacherTelegramReturn;

