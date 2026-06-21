import type { CommunicationStatus } from '../shared/types.js';

export interface CareerFormData {
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  portfolio_url?: string;
  cover_letter?: string;
}

export interface CareerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  portfolio_url: string | null;
  cover_letter: string | null;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
