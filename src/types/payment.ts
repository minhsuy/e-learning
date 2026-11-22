import type { ApiResponse } from './api';
import type { ApiOrderItem, CreateOrderPayload } from './order';

export type PaymentState = 'pending' | 'completed' | 'rejected' | 'expired' | 'manual_review';
export interface PaymentOrder extends ApiOrderItem {
  id: string;
  _id: string;
  code: string;
  status: 'pending' | 'completed' | 'rejected';
  couponId: string | null;
  paymentMethod: 'sepay_bank_transfer' | 'free';
  paymentCode: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  rejectedReason: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface PaymentInstructions {
  paymentCode: string;
  amount: string;
  bankAccount: { bankName: string; accountNumber: string; accountName: string };
  transferContent: string;
  qrUrl: string;
  expiresAt: string;
}
export interface PaymentCheckoutData {
  order: PaymentOrder;
  payment: PaymentInstructions | null;
  reused: boolean;
}
export interface OrderPaymentStatus {
  orderId: string;
  status: 'pending' | 'completed' | 'rejected';
  paymentMethod: string | null;
  paymentCode: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  paymentState: PaymentState;
  courseAccessGranted: boolean;
}
export type PaymentCheckoutPayload = CreateOrderPayload;
export type PaymentCheckoutResponse = ApiResponse<PaymentCheckoutData>;
export type PaymentStatusResponse = ApiResponse<OrderPaymentStatus>;

export type PaymentOrderSummary = Pick<PaymentOrder, 'id' | 'code' | 'amount' | 'discount' | 'total'> & {
  courseId: string | null;
  course: ApiOrderItem['course'] | null;
};
export interface PaymentInstructionsData {
  status: OrderPaymentStatus;
  order: PaymentOrderSummary;
  payment: PaymentInstructions | null;
}
export type PaymentInstructionsResponse = ApiResponse<PaymentInstructionsData>;

// =========================================================================
// Admin Payment Reconciliation & Diagnostics Types (STEP 05 / STEP 08.3)
// =========================================================================

export type ReconciliationFindingKind =
  | 'COMPLETED_WITHOUT_PAYMENT'
  | 'SUCCESS_ORDER_NOT_COMPLETED'
  | 'COMPLETED_WITHOUT_ENROLLMENT'
  | 'DUPLICATE_INCOMING'
  | 'MANUAL_REVIEW'
  | 'UNMATCHED_INCOMING'
  | 'LATE_TRANSFER'
  | 'EXPIRED_UNPAID'
  | 'STALLED_INBOX'
  | 'RETRY_EXHAUSTED'
  | 'INVALID_COUPON_CAPACITY'
  | 'PROVIDER_CORRELATION';

export type ReconciliationFindingOutcome =
  | 'MATCHED'
  | 'AMBIGUOUS_MATCH'
  | 'MISSING_INTERNAL_RECORD'
  | 'MISSING_PROVIDER_CONFIRMATION'
  | 'DUPLICATE_PAYMENT'
  | 'AMOUNT_MISMATCH'
  | 'REQUIRES_MANUAL_REVIEW';

export interface PaymentReconciliationFinding {
  kind: ReconciliationFindingKind | string;
  outcome: ReconciliationFindingOutcome | string;
  orderId?: string;
  transactionId?: string;
  eventId?: string;
  couponId?: string;
  providerUuid?: string;
  matchConfidence?: 'HIGH_CONFIDENCE_CANDIDATE' | 'AMBIGUOUS' | 'NONE' | string;
}

export type ReconciliationExternalStatus =
  | 'NOT_CONFIGURED'
  | 'NOT_REQUESTED'
  | 'AVAILABLE'
  | 'UNAVAILABLE';

export interface PaymentReconciliationData {
  generatedAt: string;
  window: {
    from: string;
    to: string;
  };
  internal: {
    complete: boolean;
    limit: number;
    scanned: {
      orders: number;
      transactions: number;
      unresolvedEvents: number;
    };
    excluded: {
      legacyPaid: number;
      free: number;
    };
  };
  external: {
    status: ReconciliationExternalStatus | string;
    complete: boolean;
    nextCursor: string | null;
    transactions: number;
    reason?: string;
    environment?: string;
  };
  durableProviderUuidMappingSupported: boolean;
  automaticRepair: boolean;
  findings: PaymentReconciliationFinding[];
}

export interface PaymentReconciliationResponse {
  success: boolean;
  data: PaymentReconciliationData;
  error?: string;
}

export interface GetPaymentReconciliationParams {
  from?: string;
  to?: string;
  limit?: number;
  external?: boolean;
}

export interface PaymentDiagnosticsData {
  generatedAt: string;
  inbox: {
    received: number;
    processing: number;
    processed: number;
    failed: number;
    totalReceived: number;
    pending: number;
    retryExhausted: number;
  };
  manualReviewTransactions: number;
  unmatchedIncomingTransactions: number;
  oldestPendingAgeMs: number | null;
  processingLatency: {
    averageMs: number | null;
    samples: number;
    scope: string;
  };
  ingestionLatency: {
    samples: number;
    accepted: number;
    failed: number;
    averageMs: number | null;
    scope: string;
  };
}

export interface PaymentDiagnosticsResponse {
  success: boolean;
  data: PaymentDiagnosticsData;
  error?: string;
}
