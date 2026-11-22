'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPaymentPoller } from '@/lib/payment-poller';
import { getOrderPaymentStatus } from '@/services/payment.service';
import type { OrderPaymentStatus } from '@/types/payment';

export function usePaymentStatus(orderId: string) {
  const [status, setStatus] = useState<OrderPaymentStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const poller = useRef<ReturnType<typeof createPaymentPoller> | null>(null);
  useEffect(() => {
    const current = createPaymentPoller({
      request: async signal => {
        const response = await getOrderPaymentStatus(orderId, signal);
        if (!response.success || !response.data || response.data.orderId !== orderId) throw new Error('Không nhận được trạng thái thanh toán hợp lệ.');
        return response.data;
      },
      onStatus: data => { setStatus(data); setError(null); setPaused(false); },
      onError: error => setError(error instanceof Error ? error : new Error('Không thể kiểm tra thanh toán.')),
      onBusy: setBusy,
      onPause: () => setPaused(true),
    });
    poller.current = current;
    if (document.visibilityState === 'hidden') current.suspend();
    void current.start();
    const focus = () => { if (document.visibilityState === 'visible') void current.resume(); };
    const visibility = () => {
      if (document.visibilityState === 'hidden') current.suspend();
      else void current.resume();
    };
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      current.dispose();
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [orderId]);
  const refresh = useCallback(() => { void poller.current?.refresh(); }, []);
  return { status, error, busy, paused, refresh };
}
