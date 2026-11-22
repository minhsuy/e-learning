import { ApiPagination } from '@/types/api';

/**
 * TMDEMY — Commission, Teacher Earnings & Admin Financial Management Types (STEP 09.5)
 * Strictly aligned with api/TEACHER_COMMISSION_EARNINGS_API.md (STEP 09.4).
 *
 * All monetary amounts are canonical whole-VND decimal strings (e.g. "280000", "0", "-280000").
 */

export type VndString = string;
export type CommissionTimezone = 'Asia/Ho_Chi_Minh' | 'UTC';
export type TeacherEarningsPeriod = '7days' | '30days' | '12months' | 'custom';
export type AdminEarningsPeriod = '7days' | '30days' | '12months' | 'custom' | 'all';
export type EarningStatus = 'pending' | 'available';
export type LedgerEntryType = 'earning_recognized' | 'earning_released';
export type EarningSortBy = 'recognizedAt' | 'availableAt' | 'teacherAmount';
export type SortOrder = 'asc' | 'desc';

export interface ActivePolicyBrief {
  version: number;
  name: string;
  teacherRateBps: number;
  platformRateBps: number;
  holdingPeriodDays: number;
}

export interface CommissionPolicyRecord extends ActivePolicyBrief {
  id: string;
  status: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
}

export interface EarningPolicySnapshot {
  id: string;
  version: number;
  name: string;
  teacherRateBps: number;
  platformRateBps: number;
  holdingPeriodDays: number;
}

export interface TeacherWalletBalances {
  lifetimeRecognized: VndString;
  pendingBalance: VndString;
  availableBalance: VndString;
  reservedBalance: VndString;
  paidOutBalance: VndString;
}

export interface TeacherCurrentBalancesBrief {
  pendingBalance: VndString;
  availableBalance: VndString;
  reservedBalance: VndString;
  paidOutBalance: VndString;
}

export interface TeacherEarningCounts {
  totalEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
}

export interface EarningsPeriodSummary {
  totalCommissionBase: VndString;
  totalTeacherEarnings: VndString;
  totalPlatformShare: VndString;
  earningCount: number;
}

export interface EarningsTimelinePoint {
  date: string;
  teacherEarnings: VndString;
  platformShare: VndString;
  earningCount: number;
}

export interface EarningsByCourseItem {
  courseId: string;
  courseTitle: string;
  teacherEarnings: VndString;
  earningCount: number;
}

export interface EarningsReportingMeta {
  dateBasis: 'recognizedAt';
  timezone: CommissionTimezone;
  startDate: string | null;
  endDate: string | null;
  granularity: 'day' | 'month';
}

export interface TeacherEarningItem {
  id: string;
  orderId: string;
  orderCode: string | null;
  courseId: string | null;
  originalCourseId: string;
  courseTitle: string;
  paymentMethod: string;
  completionSource: string;
  currency: 'VND';
  grossAmount: VndString;
  discountAmount: VndString;
  commissionBase: VndString;
  teacherRateBps: number;
  platformRateBps: number;
  holdingPeriodDays: number;
  teacherAmount: VndString;
  platformAmount: VndString;
  status: EarningStatus;
  recognizedAt: string;
  availableAt: string;
  releasedAt: string | null;
}

export interface AdminTeacherBrief {
  id: string;
  username: string;
  email: string;
  status: string;
  role?: string;
}

export interface AdminEarningItem extends TeacherEarningItem {
  teacherId: string;
  teacher: AdminTeacherBrief | null;
  paymentTransactionId?: string;
}

export interface TeacherLedgerTransactionItem {
  id: string;
  entryType: LedgerEntryType;
  earningId: string;
  teacherId?: string;
  currency: 'VND';
  pendingDelta: VndString;
  availableDelta: VndString;
  reservedDelta: VndString;
  paidOutDelta: VndString;
  reason: string | null;
  createdAt: string;
}

export interface PaymentEvidenceSummary {
  paymentTransactionId: string;
  status: string;
  transferAmount: VndString;
  processedAt: string | null;
}

// ==========================================
// 1. TEACHER EARNINGS API CONTRACTS (5)
// ==========================================

export interface TeacherEarningsOverviewData {
  currency: 'VND';
  balanceAsOf: string;
  activePolicy: ActivePolicyBrief | null;
  currentBalances: TeacherWalletBalances;
  counts: TeacherEarningCounts;
}

export interface TeacherEarningsOverviewResponse {
  success: boolean;
  message?: string;
  data: TeacherEarningsOverviewData;
}

export interface TeacherEarningsStatsParams {
  period?: TeacherEarningsPeriod;
  startDate?: string;
  endDate?: string;
  timezone?: CommissionTimezone;
  courseId?: string;
}

export interface TeacherEarningsStatsData {
  currency: 'VND';
  balanceAsOf: string;
  reporting: EarningsReportingMeta;
  periodSummary: EarningsPeriodSummary;
  currentBalances: TeacherCurrentBalancesBrief;
  timeline: EarningsTimelinePoint[];
  byCourse: EarningsByCourseItem[];
}

export interface TeacherEarningsStatsResponse {
  success: boolean;
  message?: string;
  data: TeacherEarningsStatsData;
}

export interface TeacherEarningsListParams {
  page?: number;
  limit?: number;
  status?: EarningStatus;
  courseId?: string;
  from?: string;
  to?: string;
  timezone?: CommissionTimezone;
  sortBy?: EarningSortBy;
  order?: SortOrder;
}

export interface TeacherEarningsListData {
  earnings: TeacherEarningItem[];
  pagination: ApiPagination;
}

export interface TeacherEarningsListResponse {
  success: boolean;
  message?: string;
  data: TeacherEarningsListData;
}

export interface TeacherEarningDetailData {
  earning: TeacherEarningItem;
  policy: EarningPolicySnapshot | null;
  ledgerEntries: TeacherLedgerTransactionItem[];
}

export interface TeacherEarningDetailResponse {
  success: boolean;
  message?: string;
  data: TeacherEarningDetailData;
}

export interface TeacherTransactionsParams {
  page?: number;
  limit?: number;
  entryType?: LedgerEntryType;
  from?: string;
  to?: string;
  timezone?: CommissionTimezone;
}

export interface TeacherTransactionsData {
  transactions: TeacherLedgerTransactionItem[];
  pagination: ApiPagination;
}

export interface TeacherTransactionsResponse {
  success: boolean;
  message?: string;
  data: TeacherTransactionsData;
}

// ==========================================
// 2. ADMIN COMMISSION & EARNINGS API CONTRACTS (9)
// ==========================================

export interface AdminCommissionPoliciesData {
  activePolicy: CommissionPolicyRecord | null;
  policies: CommissionPolicyRecord[];
}

export interface AdminCommissionPoliciesResponse {
  success: boolean;
  message?: string;
  data: AdminCommissionPoliciesData;
}

export interface CreateCommissionPolicyPayload {
  name: string;
  teacherRateBps: number;
  platformRateBps: number;
  holdingPeriodDays: number;
  expectedCurrentVersion?: number;
  notes?: string | null;
}

export interface CreateCommissionPolicyData {
  policy: CommissionPolicyRecord;
  supersededPolicyId: string | null;
  activatedAt: string;
}

export interface CreateCommissionPolicyResponse {
  success: boolean;
  message?: string;
  data: CreateCommissionPolicyData;
}

export interface CommissionActivationState {
  id: string | null;
  enabled: boolean;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  changedById: string | null;
  reason: string | null;
}

export interface CommissionActivationHistoryItem {
  id: string;
  enabled: boolean;
  effectiveFrom: string;
  effectiveUntil: string | null;
  changedById: string;
  reason: string;
  createdAt: string;
}

export interface AdminCommissionActivationData {
  currentState: CommissionActivationState;
  history: CommissionActivationHistoryItem[];
}

export interface AdminCommissionActivationResponse {
  success: boolean;
  message?: string;
  data: AdminCommissionActivationData;
}

export interface SetCommissionActivationPayload {
  enabled: boolean;
  reason: string;
}

export interface SetCommissionActivationData {
  window: CommissionActivationState;
  enabled: boolean;
  effectiveFrom: string;
}

export interface SetCommissionActivationResponse {
  success: boolean;
  message?: string;
  data: SetCommissionActivationData;
}

export interface AdminEarningsStatsParams {
  period?: AdminEarningsPeriod;
  startDate?: string;
  endDate?: string;
  timezone?: CommissionTimezone;
  courseId?: string;
  teacherId?: string;
}

export interface AdminOutstandingLiabilities {
  pendingBalance: VndString;
  availableBalance: VndString;
  reservedBalance: VndString;
  totalOutstanding: VndString;
}

export interface AdminEarningsStatsData {
  currency: 'VND';
  balanceAsOf: string;
  reporting: EarningsReportingMeta;
  periodSummary: EarningsPeriodSummary;
  outstandingLiabilities: AdminOutstandingLiabilities;
  settledDisbursements: {
    paidOutBalance: VndString;
  };
  timeline: EarningsTimelinePoint[];
}

export interface AdminEarningsStatsResponse {
  success: boolean;
  message?: string;
  data: AdminEarningsStatsData;
}

export interface AdminEarningsListParams {
  page?: number;
  limit?: number;
  status?: EarningStatus;
  teacherId?: string;
  courseId?: string;
  from?: string;
  to?: string;
  timezone?: CommissionTimezone;
  sortBy?: EarningSortBy;
  order?: SortOrder;
}

export interface AdminEarningsListData {
  earnings: AdminEarningItem[];
  pagination: ApiPagination;
}

export interface AdminEarningsListResponse {
  success: boolean;
  message?: string;
  data: AdminEarningsListData;
}

export interface AdminEarningDetailData {
  earning: AdminEarningItem;
  paymentEvidence: PaymentEvidenceSummary | null;
  policy: EarningPolicySnapshot | null;
  ledgerEntries: TeacherLedgerTransactionItem[];
}

export interface AdminEarningDetailResponse {
  success: boolean;
  message?: string;
  data: AdminEarningDetailData;
}

export interface AdminTeacherEarningsData {
  teacher: AdminTeacherBrief;
  currency: 'VND';
  balanceAsOf: string;
  currentBalances: TeacherWalletBalances;
  counts: TeacherEarningCounts;
  earnings: TeacherEarningItem[];
  pagination: ApiPagination;
}

export interface AdminTeacherEarningsResponse {
  success: boolean;
  message?: string;
  data: AdminTeacherEarningsData;
}

export interface AdminReconciliationParams {
  from?: string;
  to?: string;
  limit?: number;
}

export type ReconciliationStatus = 'CONSISTENT' | 'INCONSISTENT' | 'INCOMPLETE';
export type ReconciliationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';

export type HistoricalOrderClassification =
  | 'RECOGNIZED_VALID'
  | 'CONFIRMED_MISSING_EARNING'
  | 'CONFIRMED_INELIGIBLE'
  | 'INTENTIONALLY_EXCLUDED_FEATURE_DISABLED'
  | 'INSUFFICIENT_HISTORICAL_EVIDENCE'
  | 'INVALID_EARNING';

export interface ReconciliationFinding {
  code: string;
  severity: ReconciliationSeverity;
  orderId?: string;
  earningId?: string;
  teacherId?: string;
  expected?: string;
  actual?: string;
  detail?: string;
}

export interface AdminReconciliationData {
  generatedAt: string;
  automaticRepair: false;
  status: ReconciliationStatus;
  currency: 'VND';
  window: {
    from: string | null;
    to: string | null;
  };
  scan: {
    complete: boolean;
    truncated: boolean;
    limit: number;
    scanned: number;
    excluded: number;
    checkedOrders: number;
    checkedEarnings: number;
    checkedLedgerEntries: number;
    totalOrdersInScope: number;
    totalEarningsInScope: number;
  };
  summary: {
    discrepancyCount: number;
    totalAbsoluteDiscrepancyVnd: VndString;
    netSignedDiscrepancyVnd: VndString;
    affectedTeachers: number;
    affectedEarnings: number;
    affectedOrders: number;
    insufficientEvidenceCount: number;
    intentionallyExcludedCount: number;
    classificationCounts: Record<HistoricalOrderClassification, number>;
    totals: {
      commissionBase: VndString;
      teacherAllocations: VndString;
      platformAllocations: VndString;
      lifetimeRecognizedEarnings: VndString;
      pendingLiability: VndString;
      availableLiability: VndString;
      reservedLiability: VndString;
      paidOutTotal: VndString;
      outstandingLiability: VndString;
    };
  };
  findings: ReconciliationFinding[];
}

export interface AdminReconciliationResponse {
  success: boolean;
  message?: string;
  data: AdminReconciliationData;
}
