export type CommunicationStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';

export interface CommunicationRecord {
  id: string;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiSuccessResponse {
  success: true;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}
