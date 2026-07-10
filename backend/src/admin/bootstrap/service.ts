import { hashPassword, verifyPassword as betterVerify } from '@better-auth/utils/password';
import * as bootstrapRepository from './repository.js';
import type { BootstrapResult, BootstrapAdminConfig, BootstrapAdminUser } from './types.js';

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await betterVerify(hash, password);
  } catch {
    return false;
  }
}

export async function bootstrapAdmin(config: BootstrapAdminConfig): Promise<BootstrapResult[]> {
  const logs: BootstrapResult[] = [];
  const email = normalizeEmail(config.email);

  const allAdmins = await bootstrapRepository.findAllAdmins();
  const matchedAdmin = allAdmins.find(a => normalizeEmail(a.email) === email);
  const extraAdmins = allAdmins.filter(a => normalizeEmail(a.email) !== email);

  if (!matchedAdmin) {
    const hashedPassword = await hashPassword(config.password);
    const user = await bootstrapRepository.createAdmin(email, config.name, hashedPassword);
    logs.push({ action: 'created', detail: `Admin account created: ${user.email}` });
  } else {
    const updates = await syncExistingAdmin(matchedAdmin, config);
    logs.push(...updates);
  }

  if (extraAdmins.length > 0) {
    for (const extra of extraAdmins) {
      await bootstrapRepository.revokeUserSessions(extra.id);
      await bootstrapRepository.updateRole(extra.id, 'customer');
      logs.push({
        action: 'extra_admins_revoked',
        detail: `Extra admin ${extra.email} (${extra.id}) role changed to customer and sessions revoked`,
      });
    }
  }

  const targetUser = matchedAdmin || null;
  if (targetUser || allAdmins.length > 0) {
    const adminId = matchedAdmin?.id || allAdmins.find(a => normalizeEmail(a.email) === email)?.id;
    if (adminId) {
      await bootstrapRepository.revokeUserSessions(adminId);
    }
  }

  if (logs.length === 0) {
    logs.push({ action: 'unchanged', detail: 'No changes required' });
  }

  return logs;
}

async function syncExistingAdmin(
  user: BootstrapAdminUser,
  config: BootstrapAdminConfig,
): Promise<BootstrapResult[]> {
  const logs: BootstrapResult[] = [];
  const email = normalizeEmail(config.email);
  let needsSessionRevoke = false;

  if (normalizeEmail(user.email) !== email) {
    await bootstrapRepository.updateAdminEmail(user.id, email);
    logs.push({ action: 'updated', detail: `Admin email updated to: ${email}` });
    needsSessionRevoke = true;
  }

  if ((user.name ?? '') !== config.name) {
    await bootstrapRepository.updateAdminName(user.id, config.name);
    logs.push({ action: 'updated', detail: `Admin name updated to: ${config.name}` });
    needsSessionRevoke = true;
  }

  if (!user.email_verified) {
    await bootstrapRepository.updateEmailVerified(user.id);
    logs.push({ action: 'updated', detail: `Admin email_verified set to true` });
  }

  if (user.account_status !== 'ACTIVE') {
    await bootstrapRepository.updateAccountStatus(user.id);
    logs.push({ action: 'updated', detail: `Admin account_status set to ACTIVE` });
  }

  if (user.role !== 'admin') {
    await bootstrapRepository.updateRole(user.id, 'admin');
    logs.push({ action: 'updated', detail: `Admin role set to admin` });
  }

  const account = await bootstrapRepository.findCredentialAccount(user.id);

  if (!account) {
    const hashedPassword = await hashPassword(config.password);
    await bootstrapRepository.updateAccountPassword(user.id, hashedPassword);
    logs.push({ action: 'updated', detail: `Admin credential account created with new password` });
    needsSessionRevoke = true;
  } else if (account.password) {
    const isMatch = await verifyPassword(account.password, config.password);
    if (!isMatch) {
      const hashedPassword = await hashPassword(config.password);
      await bootstrapRepository.updateAccountPassword(user.id, hashedPassword);
      logs.push({ action: 'updated', detail: `Admin password updated` });
      needsSessionRevoke = true;
    }
  } else {
    const hashedPassword = await hashPassword(config.password);
    await bootstrapRepository.updateAccountPassword(user.id, hashedPassword);
    logs.push({ action: 'updated', detail: `Admin password set (was null)` });
    needsSessionRevoke = true;
  }

  if (needsSessionRevoke) {
    await bootstrapRepository.revokeUserSessions(user.id);
  }

  if (logs.length === 0) {
    logs.push({ action: 'unchanged', detail: `Admin ${email} is up to date` });
  }

  return logs;
}
