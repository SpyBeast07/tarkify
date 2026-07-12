import * as customerRepository from './repository.js';
import { recordEvent } from '../../audit/service.js';
import { getAuth } from '../../auth.js';
import type {
  CustomerListParams,
  CustomerListResponse,
  CustomerListItem,
  CustomerDetailResponse,
  CustomerFilterOptions,
  AccountStatus,
} from './types.js';

function toListResponse(
  items: CustomerListItem[],
  total: number,
  page: number,
  perPage: number,
): CustomerListResponse {
  return {
    customers: items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function listCustomers(params: CustomerListParams): Promise<CustomerListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { customers, total } = await customerRepository.listCustomers({ ...params, page, perPage });
  return toListResponse(customers, total, page, perPage);
}

export async function getCustomer(id: string): Promise<CustomerDetailResponse | null> {
  const customer = await customerRepository.getCustomerById(id);
  if (!customer) return null;

  const [purchases, downloads, sessions, activity, audit] = await Promise.all([
    customerRepository.getCustomerPurchases(id),
    customerRepository.getCustomerDownloads(id),
    customerRepository.getCustomerSessions(id),
    customerRepository.getRecentActivity(id),
    customerRepository.getCustomerAuditLog(id),
  ]);

  return { customer, purchases, downloads, sessions, activity, audit };
}

export async function getFilterOptions(): Promise<CustomerFilterOptions> {
  const options = await customerRepository.getFilterOptions();
  return { statuses: options.statuses as AccountStatus[] };
}

export async function suspendCustomer(
  customerId: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await customerRepository.updateAccountStatus(customerId, 'SUSPENDED');
  await recordEvent(adminUserId, 'account_suspended' as any, {
    target_user_id: customerId,
  }, ipAddress, userAgent);
}

export async function reactivateCustomer(
  customerId: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await customerRepository.updateAccountStatus(customerId, 'ACTIVE');
  await recordEvent(adminUserId, 'account_reactivated' as any, {
    target_user_id: customerId,
  }, ipAddress, userAgent);
}

export async function deleteCustomer(
  customerId: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await customerRepository.updateAccountStatus(customerId, 'DELETED');
  await recordEvent(adminUserId, 'account_deleted' as any, {
    target_user_id: customerId,
  }, ipAddress, userAgent);
}

export async function resendVerification(
  customerId: string,
  email: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  const auth = getAuth() as any;
  await auth.api.sendVerificationEmail({
    body: { email },
  });
  await recordEvent(adminUserId, 'verification_resent' as any, {
    target_user_id: customerId,
    email,
  }, ipAddress, userAgent);
}

export async function sendPasswordReset(
  customerId: string,
  email: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  const auth = getAuth() as any;
  await auth.api.requestPasswordReset({
    body: { email },
  });
  await recordEvent(adminUserId, 'password_reset_requested' as any, {
    target_user_id: customerId,
    email,
  }, ipAddress, userAgent);
}

export async function revokeSessions(
  customerId: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<number> {
  const count = await customerRepository.deleteSessionsByUserId(customerId);
  await recordEvent(adminUserId, 'customer_sessions_revoked' as any, {
    target_user_id: customerId,
    sessions_revoked: count,
  }, ipAddress, userAgent);
  return count;
}


