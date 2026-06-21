import type { CommunicationStatus } from '../shared/types.js';

export interface FeedbackFormData {
  name?: string;
  email?: string;
  product: string;
  rating: number;
  message: string;
}

export interface FeedbackRecord {
  id: string;
  name: string | null;
  email: string | null;
  product: string;
  rating: number;
  message: string;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
