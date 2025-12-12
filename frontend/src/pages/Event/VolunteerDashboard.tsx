import React, { useEffect, useState } from 'react';
import { User, Registration, Badge, Event } from '../../types'; // Fixed path
import {
  getUserRegistrations,
  submitFeedback,
  getUserBadges,
  getEvents,
  getUserBookmarks,
  getBookmarkedEventsDetail // Imported getBookmarkedEventsDetail
} from '../../services/api'; // Fixed path

interface Props {
  user: User;
}

export const VolunteerDashboard: React.FC<Props> = ({ user }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'saved'>('upcoming');

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean, eventId: string, eventTitle: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadData = async () => {
    try {
      const [regsData, badgesData, savedEvents] = await Promise.all([
        getUserRegistrations(user.id),
        getUserBadges(user.id),
        getBookmarkedEventsDetail() // OPTIMIZATION: Fetch only saved events directly
      ]);
      setRegistrations(regsData);
      setBadges(badgesData);
      setBookmarkedEvents(savedEvents);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackModal) return;

    await submitFeedback({
      eventId: feedbackModal.eventId,
      userId: user.id,
      rating,
      comment
    });

    setFeedbackModal(null);
    setRating(5);
    setComment('');
    loadData();
  };

  const upcomingEvents = registrations.filter(r => r.eventStatus === 'upcoming');
  const pastEvents = registrations.filter(r => r.eventStatus === 'completed' && r.status === 'confirmed');

  const totalPoints = pastEvents.length * 5;

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Approved</span>;
      case 'pending': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">⏳ Pending</span>;
      case 'rejected': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">✕ Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">

      {/* Student ID Card Style - Enhanced Gradients */}
      <div className="bg-gradient-to-br from-emerald-600 via-primary-600 to-teal-700 rounded-3xl shadow-xl shadow-primary-200 text-white p-6 sm:p-8 mb-8 relative overflow-hidden transform transition hover:scale-[1.01]">

        {/* Decorative Background Circles */}
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="relative">
            <img src={user.avatar} className="h-24 w-24 rounded-full border-4 border-white/30 bg-white/10 shadow-lg" alt="Profile" />
            <div className="absolute bottom-0 right-0 bg-yellow-400 border-2 border-primary-600 w-6 h-6 rounded-full"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight mb-1">{user.name}</h2>
            <p className="text-primary-100 font-medium text-sm mb-5 opacity-90">Student Volunteer • {user.email}</p>

            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <div className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                <span className="text-yellow-300 mr-2 text-lg">★</span>
                <span className="font-bold text-sm">{totalPoints} Merit Stars</span>
              </div>
              <div className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                <span className="font-bold text-sm">{pastEvents.length} Events Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {badges.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-slate-800 mb-3 text-base px-1">Your Achievements</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar">
            {badges.map(badge => (
              <div key={badge.id} className={`flex-shrink-0 w-28 p-4 rounded-2xl border-2 border-white shadow-sm flex flex-col items-center text-center transition-transform hover:-translate-y-1 ${badge.color}`}>
                <div className="text-3xl mb-2 drop-shadow-sm">{badge.icon}</div>
                <div className="font-bold text-xs leading-tight mb-1">{badge.name}</div>
                <div className="text-[10px] opacity-80 leading-tight">{badge.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl mb-6 flex">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'history', label: 'History' },
          { id: 'saved', label: `Saved (${bookmarkedEvents.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>)}
        </div>
      ) : (
        <div className="space-y-3 min-h-[200px]">
          {activeTab === 'saved' ? (
            bookmarkedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="text-3xl mb-2">🔖</span>
                <p className="text-sm">No saved events.</p>
              </div>
            ) : (
              bookmarkedEvents.map(event => (
                <div key={event.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{event.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">📅 {event.date} • 📍 {event.location}</p>
                  </div>
                  <span className="bg-primary-50 text-primary-700 text-xs px-3 py-1.5 rounded-lg font-bold">View</span>
                </div>
              ))
            )
          ) : activeTab === 'upcoming' && upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <span className="text-3xl mb-2">📋</span>
              <p className="text-sm">No upcoming requests.</p>
            </div>
          ) : activeTab === 'history' && pastEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <span className="text-3xl mb-2">⏳</span>
              <p className="text-sm">No completed events yet.</p>
            </div>
          ) : (
            (activeTab === 'upcoming' ? upcomingEvents : pastEvents).map(reg => (
              <div key={reg.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary-100 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${activeTab === 'upcoming' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{reg.eventTitle}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                      <span>📅 {reg.eventDate}</span>
                      {reg.eventStatus === 'completed' && <span className="text-green-600">● Completed</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                  {activeTab === 'history' ? (
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <span className="text-xs font-bold text-white bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1 rounded-full shadow-sm">+5 Merit</span>
                      {!reg.hasFeedback ? (
                        <button
                          onClick={() => setFeedbackModal({ isOpen: true, eventId: reg.eventId, eventTitle: reg.eventTitle || 'Event' })}
                          className="text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-bold shadow-sm transition-transform active:scale-95"
                        >
                          Rate Event
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium px-2">Rated ✓</span>
                      )}
                    </div>
                  ) : (
                    <div className="ml-auto">
                      {getStatusPill(reg.status)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

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