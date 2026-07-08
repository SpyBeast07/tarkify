/**
 * Email provider abstraction.
 *
 * All email providers must implement this interface.
 * The EmailService depends only on this interface — not on any specific provider.
 */

import type { SendEmailOptions, SendEmailResult } from './types.js';

export interface EmailProvider {
  readonly name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}
