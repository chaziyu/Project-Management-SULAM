import axios from 'axios';
import { Event, Registration, Badge, Feedback } from '../types';

// 1. Setup Axios Client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Updates the global Authorization header.
 * Called by App.tsx when Clerk authenticates the user.
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ==========================================
// Event Endpoints
// ==========================================

export const getEvents = async (): Promise<Event[]> => {
  const { data } = await api.get('/events');
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

export const updateEventStatus = async (eventId: string, status: 'upcoming' | 'completed'): Promise<Event> => {
  const { data } = await api.patch(`/events/${eventId}`, { status });
  return data;
};

export const joinEvent = async (eventId: string, userId: string, userName: string, userAvatar: string): Promise<Registration> => {
  const { data } = await api.post(`/events/${eventId}/join`, { userId, userName, userAvatar });
  return data;
};

export const getEventRegistrations = async (eventId: string): Promise<Registration[]> => {
  const { data } = await api.get(`/events/${eventId}/registrations`);
  return data;
};

// ==========================================
// User & Registration Endpoints
// ==========================================

export const getUserRegistrations = async (userId: string): Promise<Registration[]> => {
  const { data } = await api.get(`/users/${userId}/registrations`);
  return data;
};

export const updateRegistrationStatus = async (registrationId: string, status: 'confirmed' | 'rejected'): Promise<Registration> => {
  const { data } = await api.patch(`/registrations/${registrationId}`, { status });
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
// Feedback Endpoints
// ==========================================

export const getEventAverageRating = async (eventId: string): Promise<number> => {
  const { data } = await api.get(`/events/${eventId}/rating`);
  return data.average;
};

export const getFeedbacks = async (userId?: string, eventId?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (eventId) params.append('eventId', eventId);
  
  const { data } = await api.get(`/feedbacks?${params.toString()}`);
  return data;
};

export const submitFeedback = async (data: { eventId: string; userId: string; rating: number; comment: string }): Promise<void> => {
  await api.post('/feedbacks', data);
};

export default api;