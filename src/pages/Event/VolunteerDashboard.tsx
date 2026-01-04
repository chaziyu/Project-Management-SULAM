import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getBookmarkedEventsDetail,
  getFeedbacks,
  getUserBadges,
  getUserRegistrations,
  submitFeedback,
  updateFeedback,
  getEvent
} from '../../services/api';
import { Badge, Event, User } from '../../types';
import { VolunteerBadges } from './components/dashboard/VolunteerBadges';
import { VolunteerEventList } from './components/dashboard/VolunteerEventList';
import { VolunteerStatsCard } from './components/dashboard/VolunteerStatsCard';
import { VolunteerTabs } from './components/dashboard/VolunteerTabs';
import { EventDetailsModal } from './components/EventDetailsModal';

interface Props {
  user: User;
}

// ==========================================
// Component: Volunteer Dashboard
// Displays user activity, points, and allows feedback submission.
// ==========================================

export const VolunteerDashboard: React.FC<Props> = ({ user }) => {

  // ==========================================
  // Data Fetching
  // ==========================================
  const queryClient = useQueryClient();

  // --- Data Fetching (React Query) ---
  const { data: registrations = [], isLoading: loadingRegs } = useQuery({
    queryKey: ['userRegistrations', user.id],
    queryFn: () => getUserRegistrations(user.id),
    staleTime: 1000 * 60 * 5
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['userBadges', user.id],
    queryFn: () => getUserBadges(user.id),
    staleTime: 1000 * 60 * 30
  });

  const { data: bookmarkedEvents = [] } = useQuery({
    queryKey: ['bookmarkedEventsDetail', user.id],
    queryFn: () => getBookmarkedEventsDetail(),
    staleTime: 1000 * 60 * 5
  });

  const loading = loadingRegs;

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['userRegistrations', user.id] });
    queryClient.invalidateQueries({ queryKey: ['userBadges', user.id] });
  };

  // --- State: UI ---
  const [activeTab, setActiveTab] = useState<'schedule' | 'pending' | 'history' | 'saved'>('schedule');

  // --- State: Feedback Modal ---
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean, eventId: string, eventTitle: string, feedbackId?: string | null } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // --- State: Details Modal ---
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ==========================================
  // Interaction Handlers
  // ==========================================

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackModal) return;

    const feedbackId = feedbackModal.feedbackId;

    if (feedbackId) {
      await updateFeedback(feedbackId, { rating, comment });
    } else {
      await submitFeedback({
        eventId: feedbackModal.eventId,
        userId: user.id,
        rating,
        comment
      });
    }

    setFeedbackModal(null);
    setRating(5);
    setComment('');
    refreshData(); // Refresh to update "Rated" status and points
  };

  const openFeedbackModal = (eventId: string, title: string, feedbackId?: string) => {
    setFeedbackModal({
      isOpen: true,
      eventId,
      eventTitle: title,
      feedbackId
    });

    // Pre-fill if editing
    if (feedbackId) {
      getFeedbacks(user.id, eventId).then(feedbacks => {
        if (feedbacks.length > 0) {
          setRating(feedbacks[0].rating);
          setComment(feedbacks[0].comment);
        }
      });
    } else {
      setRating(5);
      setComment('');
    }
  };

  const handleViewDetails = async (eventId: string) => {
    try {
      // Check if it's a bookmarked event -> we already have the full object
      const bookmarked = bookmarkedEvents.find(e => e.id === eventId);
      if (bookmarked) {
        setViewEvent(bookmarked);
        setShowDetailsModal(true);
        return;
      }

      // Otherwise fetch fresh
      const eventData = await getEvent(eventId);
      setViewEvent(eventData);
      setShowDetailsModal(true);
    } catch (e) {
      console.error("Failed to load event details", e);
      alert("Could not load event details.");
    }
  };


  // ==========================================
  // Helper Logic
  // ==========================================

  const scheduledEvents = registrations.filter(r => r.eventStatus === 'upcoming' && r.status === 'confirmed');
  const pendingEvents = registrations.filter(r => r.eventStatus === 'upcoming' && r.status === 'pending');
  const pastEvents = registrations.filter(r => r.eventStatus === 'completed' && r.status === 'confirmed');
  const totalPoints = pastEvents.length * 5;

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">

      <VolunteerStatsCard
        user={user}
        totalPoints={totalPoints}
        completedCount={pastEvents.length}
      />

      <VolunteerBadges badges={badges} />

      <VolunteerTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        pendingCount={pendingEvents.length}
      />

      {/* Content Area */}
      <VolunteerEventList
        loading={loading}
        activeTab={activeTab}
        scheduledEvents={scheduledEvents}
        pendingEvents={pendingEvents}
        pastEvents={pastEvents}
        bookmarkedEvents={bookmarkedEvents}
        onOpenFeedback={openFeedbackModal}
        onViewEvent={handleViewDetails} // Passed handler
        user={user}
      />

      <EventDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        event={viewEvent}
      />

      {/* Responsive Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFeedbackModal(null)}></div>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md p-6 animate-slide-up sm:animate-fade-in-up relative z-10">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Rate Activity</h3>
              <p className="text-sm text-slate-500 mt-1">How was <span className="font-semibold text-slate-800">{feedbackModal.eventTitle}</span>?</p>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-transform hover:scale-110 active:scale-90 focus:outline-none ${star <= rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Any feedback for the organizers?"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>

              <button type="submit" className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};