import { query } from '../db.js';
import * as linkingRepository from './repository.js';
import type { LinkingResult } from './types.js';
import type { Purchase } from '../types/index.js';

export async function linkPurchasesToUser(userId: string): Promise<LinkingResult> {
  const userResult = await query<{ email: string }>(
    'SELECT email FROM users WHERE id = $1',
    [userId]
  );
  const userRow = userResult.rows[0];
  if (!userRow) {
    throw new Error(`User not found: ${userId}`);
  }

  return linkPurchasesToUserByEmail(userId, userRow.email);
}

export async function linkPurchasesToUserByEmail(
  userId: string,
  email: string
): Promise<LinkingResult> {
  const { purchasesLinked, entitlementsLinked } =
    await linkingRepository.linkPurchasesAndEntitlements(userId, email);

  if (purchasesLinked > 0 || entitlementsLinked > 0) {
    await linkingRepository.insertLinkingLog(
      userId,
      email,
      purchasesLinked,
      entitlementsLinked
    );
  }

  return {
    userId,
    email,
    purchasesLinked,
    entitlementsLinked,
    timestamp: new Date().toISOString(),
  };
}

export async function findGuestPurchases(email: string): Promise<Purchase[]> {
  return linkingRepository.findGuestPurchases(email);
}

export async function alreadyLinked(email: string): Promise<boolean> {
  const purchases = await linkingRepository.findGuestPurchases(email);
  return purchases.length === 0;
}
