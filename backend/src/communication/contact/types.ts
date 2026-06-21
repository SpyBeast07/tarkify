import type { CommunicationStatus } from '../shared/types.js';

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  message: string;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
