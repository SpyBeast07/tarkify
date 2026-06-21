import type { CommunicationStatus } from '../shared/types.js';

export interface NewsletterFormData {
  email: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
