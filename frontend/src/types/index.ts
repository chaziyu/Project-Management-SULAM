// ==========================================
// Enums & Constants
// ==========================================

export enum UserRole {
  VOLUNTEER = 'volunteer',
  ORGANIZER = 'organizer'
}

// ==========================================
// User Domain
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bookmarks?: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

// ==========================================
// Event Domain
// ==========================================

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  maxVolunteers: number;
  currentVolunteers: number;
  description: string;
  imageUrl?: string;
  tasks?: string;
  status: 'upcoming' | 'completed';

  // Organizer Info
  organizerId: string;
  organizerName: string;
}

export interface EventWithStats extends Event {
  // Aggregated stats from backend (avg rating, count)
  avgRating: number;
  feedbackCount: number;
}

// ==========================================
// Interaction Domain (Registrations, Feedback)
// ==========================================

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  joinedAt: string;

  // Flattened event details (Joined from backend)
  eventTitle?: string;
  eventDate?: string;
  eventStatus?: string;

  // Flags
  hasFeedback?: boolean;

  // Organizer View: User details
  userName?: string;
  userAvatar?: string;
}

export interface Feedback {
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
}