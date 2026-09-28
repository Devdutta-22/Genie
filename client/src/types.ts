export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  college: string;
  course: string;
  year: string;
  department: string;
  location_name: string;
  latitude: number;
  longitude: number;
  rating: number;
  rating_count: number;
  completed_gigs: number;
  completion_rate: number;
  response_rate: number;
  availability: string;
  is_active: number;
  bio: string;
  skills?: { skill: string; level: string }[];
  reviews?: RatingReview[];
}

export type GigCategory = 'All' | 'Design' | 'Tech/Coding' | 'Academics' | 'Logistics' | 'Delivery' | 'Events' | 'Media';

export type GigStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'MATCHING'
  | 'NOTIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'PAID'
  | 'RATED'
  | 'CLOSED'
  | 'CANCELLED';

export interface Gig {
  id: string;
  poster_id: string;
  poster_name?: string;
  poster_avatar?: string;
  poster_rating?: number;
  poster_course?: string;
  assigned_worker_id?: string | null;
  worker_name?: string;
  worker_avatar?: string;
  worker_course?: string;
  worker_rating?: number;
  title: string;
  description: string;
  category: GigCategory;
  budget: number;
  platform_fee: number;
  worker_payout: number;
  location_name: string;
  latitude: number;
  longitude: number;
  deadline: string;
  urgency: 'Low' | 'Normal' | 'Urgent';
  status: GigStatus;
  skills: string[];
  distanceMeters?: number | null;
  submission_notes?: string | null;
  submission_link?: string | null;
  created_at: string;
  assigned_at?: string | null;
  completed_at?: string | null;
}

export interface CandidateMatch {
  userId: string;
  name: string;
  course: string;
  year: string;
  avatar: string;
  locationName: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  skillMatchScore: number;
  matchedSkills: string[];
  distanceScore: number;
  availabilityScore: number;
  ratingScore: number;
  reliabilityScore: number;
  matchScore: number;
  recommendedWave: number;
  isAvailable: boolean;
}

export interface MatchingResult {
  gig: Gig;
  candidates: CandidateMatch[];
  summary: {
    totalStudents: number;
    eligibleCount: number;
    wave1Count: number;
    wave2Count: number;
    wave3Count: number;
    wave4Count: number;
  };
}

export interface ChatMessage {
  id: string;
  gig_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  receiver_id: string;
  message: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  gig_id: string;
  user_id: string;
  wave: number;
  distance_meters: number;
  match_score: number;
  status: 'UNREAD' | 'READ' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  created_at: string;
  gig_title?: string;
  gig_category?: string;
  gig_budget?: number;
  gig_location?: string;
  gig_deadline?: string;
  gig_status?: GigStatus;
  poster_name?: string;
  poster_avatar?: string;
}

export interface RatingReview {
  id: string;
  gig_id: string;
  from_user_id: string;
  to_user_id: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  rating: number;
  communication_rating: number;
  quality_rating: number;
  reliability_rating: number;
  review: string;
  created_at: string;
}
