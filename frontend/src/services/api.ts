import axios from 'axios';
import { Event, Registration, Badge, Feedback } from '../types';

// 1. Setup Axios Client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- NEW: Dynamic Token Handling ---
let getTokenFn: (() => Promise<string | null>) | null = null;

/**
 * Stores the Clerk getToken function so the API can use it later.
 */
export const setupAxiosInterceptors = (tokenGetter: () => Promise<string | null>) => {
  getTokenFn = tokenGetter;
};

// Add a request interceptor to fetch a fresh token before EVERY request
api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching fresh token:", error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==========================================
// Event Endpoints
// ==========================================

export const getEvents = async (status?: string): Promise<Event[]> => {
  const query = status ? `?status=${status}` : '';
  const { data } = await api.get(`/events${query}`);
  return data;
};

export const getOrganizerEvents = async (organizerId: string): Promise<Event[]> => {
  const { data } = await api.get(`/events?organizerId=${organizerId}`);
  return data;
};

// FIX: Corrected 'constHf' to 'const'
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

// Add this function near createEvent
export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
  const { data } = await api.put(`/events/${eventId}`, eventData);
  return data;
};
export default api;