import type { ApiOrderItem } from '@/types/order';

/** Presentation only; persisted-role and transition enforcement remains server-side. */
export function canManageManualOrder(order: Pick<ApiOrderItem, 'status' | 'paymentMethod'>) {
  const method = order.paymentMethod?.toLowerCase();
  return order.status.toLowerCase() === 'pending' &&
    (!method || method === 'manual_bank_transfer');
}

export function orderPaymentMethodLabel(method: ApiOrderItem['paymentMethod']) {
  switch (method?.toLowerCase()) {
    case 'sepay_bank_transfer': return 'SePay / VietQR';
    case 'manual_bank_transfer': return 'Chuyển khoản thủ công';
    case 'free': return 'Miễn phí';
    case undefined: case '': return 'Phương thức cũ (chưa phân loại)';
    default: return 'Phương thức chưa được hỗ trợ';
  }
}
