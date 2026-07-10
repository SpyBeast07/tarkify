import * as orderRepository from './repository.js';
import { recordEvent } from '../../audit/service.js';
import type { OrderListParams, OrderListResponse, OrderListItem, OrderDetail, OrderEntitlement, OrderDownloadToken, OrderEmailLog, OrderAuditEntry } from './types.js';

function toListResponse(
  items: OrderListItem[],
  total: number,
  page: number,
  perPage: number,
): OrderListResponse {
  return {
    orders: items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function listOrders(params: OrderListParams): Promise<OrderListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { orders, total } = await orderRepository.listOrders({ ...params, page, perPage });
  return toListResponse(orders, total, page, perPage);
}

export async function getOrder(id: string): Promise<{
  order: OrderDetail;
  entitlements: OrderEntitlement[];
  downloadTokens: OrderDownloadToken[];
  emailLogs: OrderEmailLog[];
  audit: OrderAuditEntry[];
} | null> {
  const order = await orderRepository.getOrderById(id);
  if (!order) return null;

  const [entitlements, downloadTokens, emailLogs, audit] = await Promise.all([
    orderRepository.getEntitlementsByPurchaseId(id),
    orderRepository.getDownloadTokensByPurchaseId(id),
    orderRepository.getEmailLogsByPurchase(id, order.customer_email),
    orderRepository.getAuditLogByEntity(id),
  ]);

  return { order, entitlements, downloadTokens, emailLogs, audit };
}

export async function recordOrderViewed(
  orderId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(userId, 'order_viewed' as any, {
    order_id: orderId,
  }, ipAddress, userAgent);
}

export async function recordPaymentViewed(
  purchaseId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(userId, 'payment_viewed' as any, {
    payment_id: purchaseId,
  }, ipAddress, userAgent);
}

export async function recordReceiptViewed(
  purchaseId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(userId, 'receipt_viewed' as any, {
    receipt_id: purchaseId,
  }, ipAddress, userAgent);
}

export async function getProductOptions(): Promise<{ id: string; name: string }[]> {
  return orderRepository.getProductOptions();
}

export async function getAllStatuses(): Promise<string[]> {
  return orderRepository.getAllPurchaseStatuses();
}
