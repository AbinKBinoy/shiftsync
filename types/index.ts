export type UserRole = 'team_lead' | 'member';
export type ShiftStatus = 'assigned' | 'open' | 'swap_pending';
export type SwapType = 'drop' | 'trade';
export type SwapStatus =
  | 'open'
  | 'claimed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled';
export type ScheduleStatus = 'processing' | 'review' | 'published';
export type CommentTargetType = 'shift' | 'swap_request' | 'general';
export type NotificationType =
  | 'swap_request'
  | 'swap_claimed'
  | 'swap_approved'
  | 'swap_rejected'
  | 'schedule_published'
  | 'comment'
  | 'shift_claim_pending'
  | 'shift_claim_approved';
export type NotificationTargetType =
  | 'shift'
  | 'swap_request'
  | 'schedule'
  | 'shift_claim';
export type ShiftClaimStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  require_approval: boolean;
  created_at: string;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  profile?: Profile;
}

export interface ScheduleUpload {
  id: string;
  department_id: string;
  uploaded_by: string;
  image_url: string;
  extracted_data: ExtractionResult | null;
  status: ScheduleStatus;
  schedule_start_date?: string;
  schedule_end_date?: string;
  created_at: string;
}

export interface Shift {
  id: string;
  department_id: string;
  schedule_upload_id: string;
  user_id?: string;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  created_at: string;
  profile?: Profile;
  comment_count?: number;
}

export interface SwapRequest {
  id: string;
  department_id: string;
  requester_id: string;
  original_shift_id: string;
  type: SwapType;
  offered_shift_id?: string;
  responder_id?: string;
  status: SwapStatus;
  approved_by?: string;
  created_at: string;
  resolved_at?: string;
  requester?: Profile;
  responder?: Profile;
  original_shift?: Shift;
  offered_shift?: Shift;
}

export interface Comment {
  id: string;
  department_id: string;
  user_id: string;
  target_type: CommentTargetType;
  target_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface ShiftClaim {
  id: string;
  department_id: string;
  employee_name: string;
  requested_by: string;
  status: ShiftClaimStatus;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  requester?: Profile;
  resolver?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_type: NotificationTargetType;
  target_id: string;
  read: boolean;
  created_at: string;
}

export interface ExtractionResult {
  department_name: string | null;
  schedule_period: {
    start_date: string;
    end_date: string;
  };
  shifts: Array<{
    employee_name: string;
    date: string;
    start_time: string;
    end_time: string;
    confidence: 'high' | 'low';
    raw_date?: string;
  }>;
  warnings: string[];
}
