// Enums for rigid values
export enum UserRole {
  VOLUNTEER = 'volunteer',
  ORGANIZER = 'organizer'
}

// Domain Entities
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bookmarks?: string[];
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  maxVolunteers: number;
  currentVolunteers: number;
  description: string;
  organizerId: string;
  organizerName: string;
  imageUrl?: string;
  tasks?: string;
  status: 'upcoming' | 'completed';
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  joinedAt: string;

  // Flattened fields for easy display in tables/cards
  eventTitle?: string;
  eventDate?: string;
  eventStatus?: string;
  hasFeedback?: boolean;

  // Organizer view fields
  userName?: string;
  userAvatar?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

export interface Feedback {
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
}