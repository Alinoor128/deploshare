export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type ShareType = 'file' | 'text';
export type PlanType = 'FREE' | 'PRO' | 'BUSINESS';
export type ReportReason = 'spam' | 'malware' | 'copyright' | 'abuse' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'rejected';
export type ShareEventType =
  | 'view'
  | 'download'
  | 'password_success'
  | 'password_failure'
  | 'revoke'
  | 'access_failure'
  | 'purged';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Share {
  id: string;
  owner_id: string | null;
  share_code: string;
  title: string | null;
  type: ShareType;
  storage_path: string | null;
  text_content: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  password_hash: string | null;
  expires_at: string;
  max_downloads: number | null;
  download_count: number;
  view_count: number;
  burn_after_download: boolean;
  consumed: boolean;
  allow_download: boolean;
  revoked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShareEvent {
  id: string;
  share_id: string;
  event_type: ShareEventType;
  created_at: string;
}

export interface Report {
  id: string;
  share_id: string;
  reporter_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  shares?: Share;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  status: string;
  started_at: string;
  expires_at: string | null;
}

export interface RateLimit {
  id: string;
  identifier: string;
  attempts: number;
  locked_until: string | null;
  last_attempt_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  rate_limit_per_minute: number;
  last_used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
}

export interface CleanupLog {
  id: string;
  triggered_by: string;
  shares_deleted: number;
  files_removed: number;
  bytes_reclaimed: number;
  duration_ms: number;
  created_at: string;
}

export interface PurgeResult {
  sharesDeleted: number;
  filesRemoved: number;
  bytesReclaimed: number;
  durationMs: number;
}

export interface SharePublicView {
  id: string;
  share_code: string;
  title: string | null;
  type: ShareType;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  text_content: string | null;
  expires_at: string;
  max_downloads: number | null;
  download_count: number;
  burn_after_download: boolean;
  allow_download: boolean;
  created_at: string;
  is_password_protected: boolean;
  preview_url?: string | null;
  revoked?: boolean;
  consumed?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  requiresPassword?: boolean;
}

export interface Review {
  id: string;
  user_id?: string | null;
  name: string;
  role: string;
  rating: number;
  comment: string;
  is_verified: boolean;
  created_at: string;
}
