import React, { useEffect, useState } from 'react';
import { User, Registration, Badge, Event } from '../../types';
import {
  getUserRegistrations,
  submitFeedback,
  updateFeedback,
  getUserBadges,
  getBookmarkedEventsDetail,
  getFeedbacks
} from '../../services/api';
import { VolunteerStatsCard } from './components/dashboard/VolunteerStatsCard';
import { VolunteerBadges } from './components/dashboard/VolunteerBadges';
import { VolunteerTabs } from './components/dashboard/VolunteerTabs';
import { VolunteerEventList } from './components/dashboard/VolunteerEventList';

interface Props {
  user: User;
}

// ==========================================
// Component: Volunteer Dashboard
// ==========================================

export const VolunteerDashboard: React.FC<Props> = ({ user }) => {

  // --- State: Data ---
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Event[]>([]);

  // --- State: UI ---
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'pending' | 'history' | 'saved'>('schedule');

  // --- State: Feedback Modal ---
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean, eventId: string, eventTitle: string, feedbackId?: string | null } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // ==========================================
  // Data Fetching
  // ==========================================

  const loadData = async () => {
    try {
      // Fetch all dashboard data in parallel for speed
      const [regsData, badgesData, savedEvents] = await Promise.all([
        getUserRegistrations(user.id),
        getUserBadges(user.id),
        getBookmarkedEventsDetail()
      ]);
      setRegistrations(regsData);
      setBadges(badgesData);
      setBookmarkedEvents(savedEvents);

    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

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
    loadData(); // Refresh to update "Rated" status and points
  };

  const openFeedbackModal = (eventId: string, title: string, feedbackId?: string) => {
    setFeedbackModal({
      isOpen: true,
      eventId,
      eventTitle: title,
      feedbackId
    });
    // Logic for pre-filling fetch is now handled in the List component to pass the ID, 
    // BUT we need the specific Rating/Comment to fill the form state.
    // In this refactor, let's just make sure when the modal opens, if feedbackId is present, we might need to re-fetch or pass data.
    // Optimization: The List component fetches it. We should probably pass the data UP or refetch here. 
    // For simplicity in this step: List handles fetch, but we need to put it into state.

    // Note: The List component implementation I wrote in `VolunteerEventList.tsx` calls `onOpenFeedback` AFTER fetching.
    // But wait, `VolunteerEventList` fetches data inside `handleEditClick`. It doesn't pass the data up.
    // I need to adjust `VolunteerEventList` to pass the `rating` and `comment` too, or fetch it here.
    // Correcting: Let's fetch it here for simplicity securely.
    // Actually, looking at my `VolunteerEventList` implementation, it passed `feedbackId`. 
    // I should have passed the whole feedback object. 
    // Let's assume for now the user clicks, `List` fetches, verifies existence, and passes `id`.
    // We still need to load the content into `rating` / `comment`.

    // QUICK FIX: Since I can't easily change the `List` component I just wrote without another tool call, 
    // I will add a `fetchFeedbackDetails` here if `feedbackId` is provided.
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
        user={user}
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