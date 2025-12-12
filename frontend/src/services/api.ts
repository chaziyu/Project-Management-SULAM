import axios from 'axios';
import { Event, Registration, Badge, Feedback, EventWithStats } from '../types';

// ==========================================
// API Client Configuration
// ==========================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Dynamic Token Injection ---
// Allows the React app (Clerk) to provide a fresh token on every request.

let getTokenFn: (() => Promise<string | null>) | null = null;

export const setupAxiosInterceptors = (tokenGetter: () => Promise<string | null>) => {
  getTokenFn = tokenGetter;
};

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching auth token:", error);
    }
  }
  return config;
}, (error) => Promise.reject(error));

// ==========================================
// Events
// ==========================================

export const getEvents = async (
  status?: string,
  category?: string,
  search?: string,
  skip: number = 0,
  limit: number = 100
): Promise<Event[]> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (category && category !== 'All') params.append('category', category);
  if (search) params.append('search', search);

  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const { data } = await api.get(`/events?${params.toString()}`);
  return data;
};

export const getOrganizerEvents = async (organizerId: string): Promise<Event[]> => {
  const { data } = await api.get(`/events?organizerId=${organizerId}`);
  return data;
};

export const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
  const { data } = await api.post('/events', eventData);
  return data;
};

export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
  const { data } = await api.put(`/events/${eventId}`, eventData);
  return data;
};

export const updateEventStatus = async (eventId: string, status: 'upcoming' | 'completed'): Promise<Event> => {
  const { data } = await api.patch(`/events/${eventId}`, { status });
  return data;
};

// ==========================================
// Interactions (Join / Volunteers)
// ==========================================

export const joinEvent = async (eventId: string, userId: string, userName: string, userAvatar: string): Promise<Registration> => {
  const { data } = await api.post(`/events/${eventId}/join`, { userId, userName, userAvatar });
  return data;
};

export const getEventRegistrations = async (eventId: string): Promise<Registration[]> => {
  const { data } = await api.get(`/events/${eventId}/registrations`);
  return data;
};

export const updateRegistrationStatus = async (registrationId: string, status: 'confirmed' | 'rejected'): Promise<Registration> => {
  const { data } = await api.patch(`/registrations/${registrationId}`, { status });
  return data;
};

// ==========================================
// User Data (Profile, Bookmarks, Badges)
// ==========================================

export const getUserRegistrations = async (userId: string): Promise<Registration[]> => {
  const { data } = await api.get(`/users/${userId}/registrations`);
  return data;
};

export const getUserBookmarks = async (userId: string): Promise<string[]> => {
  const { data } = await api.get(`/users/${userId}/bookmarks`);
  return data;
};

export const toggleBookmark = async (userId: string, eventId: string): Promise<string[]> => {
  const { data } = await api.post(`/users/${userId}/bookmarks`, { eventId });
  return data;
};

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const { data } = await api.get(`/users/${userId}/badges`);
  return data;
};

// ==========================================
// Feedback
// ==========================================

export const getEventAverageRating = async (eventId: string): Promise<number> => {
  const { data } = await api.get(`/events/${eventId}/rating`);
  return data.average;
};

export const getFeedbacks = async (userId?: string, eventId?: string): Promise<Feedback[]> => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (eventId) params.append('eventId', eventId);

  const { data } = await api.get(`/feedbacks?${params.toString()}`);
  return data;
};

export const submitFeedback = async (data: { eventId: string; userId: string; rating: number; comment: string }): Promise<void> => {
  await api.post('/feedbacks', data);
};

export const updateFeedback = async (feedbackId: string, data: { rating: number; comment: string }): Promise<void> => {
  await api.put(`/feedbacks/${feedbackId}`, data);
};

// ==========================================
// Optimized / Dashboard Specific
// ==========================================

/**
 * Fetches events for the organizer dashboard with pre-aggregated stats (ratings/counts).
 * Prevents N+1 query issues.
 */
export const getOrganizerStats = async (): Promise<EventWithStats[]> => {
  const { data } = await api.get('/organizers/dashboard');
  return data;
};

/**
 * Fetches full event details for bookmarked items in one request.
 */
export const getBookmarkedEventsDetail = async (): Promise<Event[]> => {
  const { data } = await api.get('/users/me/bookmarks/events');
  return data;
};

export default api;