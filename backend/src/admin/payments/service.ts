import * as paymentRepository from './repository.js';
import { recordEvent } from '../../audit/service.js';
import type { PaymentListParams, PaymentListResponse, PaymentListItem, PaymentDetail, PaymentAuditEntry, RefundInfo, ReceiptInfo } from './types.js';

function toListResponse(
  items: PaymentListItem[],
  total: number,
  page: number,
  perPage: number,
): PaymentListResponse {
  return {
    payments: items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function listPayments(params: PaymentListParams): Promise<PaymentListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { payments, total } = await paymentRepository.listPayments({ ...params, page, perPage });
  return toListResponse(payments, total, page, perPage);
}

export async function getPayment(id: string): Promise<{
  payment: PaymentDetail;
  refund: RefundInfo;
  receipt: ReceiptInfo | null;
  audit: PaymentAuditEntry[];
} | null> {
  const payment = await paymentRepository.getPaymentById(id);
  if (!payment) return null;

  const [refund, receipt, audit] = await Promise.all([
    paymentRepository.getRefundInfo(id),
    paymentRepository.getReceiptInfo(id),
    paymentRepository.getPaymentAuditLog(id),
  ]);

  return { payment, refund, receipt, audit };
}

export async function recordPaymentViewed(
  paymentId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(userId, 'payment_viewed' as any, {
    payment_id: paymentId,
  }, ipAddress, userAgent);
}

export async function recordReceiptViewed(
  paymentId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(userId, 'receipt_viewed' as any, {
    receipt_id: paymentId,
  }, ipAddress, userAgent);
}

export async function getProductOptions(): Promise<{ id: string; name: string }[]> {
  return paymentRepository.getProductOptions();
}
