/**
 * Notification gating
 *
 * Centralised check for whether a given notification toggle is enabled.
 * Every ADMIN notification trigger site routes through `notify()` so the
 * toggle logic lives in exactly one place (no duplicated checks across the
 * codebase).
 *
 * These toggles control ADMIN notifications only. Customer transactional
 * emails (purchase receipt, download link, contact/career acknowledgements,
 * newsletter confirmations, verification, password reset, admin replies,
 * test emails) are always sent and bypass this gate.
 *
 * Toggle → admin notification mapping:
 *   - adminEmailAlerts : New Order Notifications (a payment completed)
 *   - paymentAlerts    : Payment Issue Notifications (failed verification,
 *                        refunds processed, webhook processing errors)
 *   - feedbackAlerts   : Feedback Notifications (new feedback submitted)
 *   - contactAlerts    : Contact Form Notifications (new contact submission)
 *   - careerAlerts     : Career Application Notifications (new application)
 *   - newsletterAlerts : Newsletter Notifications (new subscriber)
 *   - systemAlerts     : System Notifications (email delivery failures)
 */

import { getSettings } from '../admin/settings/service.js';
import type { NotificationsSettings } from '../admin/settings/types.js';

export type NotificationKey = keyof NotificationsSettings;

/**
 * Returns true when the given notification toggle is enabled.
 * Defaults to enabled if the setting is missing.
 */
export async function isNotificationEnabled(key: NotificationKey): Promise<boolean> {
  const settings = await getSettings('notifications');
  return settings[key] !== false;
}

/**
 * Run the email-sending function only if the toggle is enabled.
 * Returns the result of `fn` (or null when the notification is disabled).
 * Errors thrown by `fn` propagate so callers can still `.catch()` them.
 */
export async function notify<T>(key: NotificationKey, fn: () => Promise<T>): Promise<T | null> {
  if (await isNotificationEnabled(key)) return fn();
  return null;
}
