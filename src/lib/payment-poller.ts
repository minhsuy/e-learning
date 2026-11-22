import type { OrderPaymentStatus } from '@/types/payment';

export interface PaymentPollerOptions {
  request: (signal: AbortSignal) => Promise<OrderPaymentStatus>;
  onStatus: (status: OrderPaymentStatus) => void;
  onError: (error: unknown) => void;
  onBusy: (busy: boolean) => void;
  onPause: () => void;
  interval?: number;
  timeout?: number;
  maxDuration?: number;
}

/** One request at a time; bounded network retries and total automatic waiting. */
export function createPaymentPoller(options: PaymentPollerOptions) {
  let disposed = false;
  let busy = false;
  let failures = 0;
  let terminal = false;
  let suspended = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  const started = Date.now();
  const interval = options.interval ?? 2500;

  async function refresh(manual = false) {
    if (disposed || busy || suspended) return;
    clearTimeout(timer);
    if (manual) failures = 0;
    busy = true;
    options.onBusy(true);
    controller = new AbortController();
    const deadline = setTimeout(() => controller?.abort(), options.timeout ?? 12000);
    try {
      const result = await options.request(controller.signal);
      if (disposed) return;
      terminal = result.paymentState !== 'pending';
      failures = 0;
      options.onStatus(result);
    } catch (error) {
      if (disposed) return;
      failures++;
      const code = (error as { statusCode?: number })?.statusCode;
      if (code && code >= 400 && code < 500 && code !== 429) failures = 4;
      options.onError(error);
    } finally {
      clearTimeout(deadline);
      busy = false;
      if (!disposed) {
        options.onBusy(false);
        if (!suspended && !terminal && failures < 4 && Date.now() - started < (options.maxDuration ?? 30 * 60 * 1000)) {
          timer = setTimeout(() => void refresh(), Math.min(interval * 2 ** failures, 20000));
        } else if (!suspended && !terminal) options.onPause();
      }
    }
  }
  return {
    refresh: () => {
      suspended = false;
      return refresh(true);
    },
    start: () => refresh(),
    suspend() { suspended = true; clearTimeout(timer); },
    resume() { suspended = false; return refresh(true); },
    dispose() { disposed = true; clearTimeout(timer); controller?.abort(); },
  };
}
