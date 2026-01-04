import React from 'react';
import { Registration, Event } from '../../../../types';
import { getFeedbacks } from '../../../../services/api';
import { SkeletonLoader } from '../../../../components/SkeletonLoader';

interface Props {
    loading: boolean;
    activeTab: 'schedule' | 'pending' | 'history' | 'saved';
    scheduledEvents: Registration[];
    pendingEvents: Registration[];
    pastEvents: Registration[];
    bookmarkedEvents: Event[];
    onOpenFeedback: (eventId: string, title: string, feedbackId?: string) => void;
    onViewEvent: (eventId: string) => void; // Added prop
    user: { id: string }; // Minimal user needed for API call
}

const getStatusPill = (status: string) => {
    switch (status) {
        case 'confirmed': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Approved</span>;
        case 'pending': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">⏳ Pending</span>;
        case 'rejected': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">✕ Rejected</span>;
        default: return null;
    }
};

export const VolunteerEventList: React.FC<Props> = ({
    loading, activeTab, scheduledEvents, pendingEvents, pastEvents, bookmarkedEvents, onOpenFeedback, onViewEvent, user
}) => {

    if (loading) {
        return (
            <div className="space-y-3">
                <SkeletonLoader variant="list" count={4} />
            </div>
        );
    }

    // Helper to handle edit logic
    const handleEditClick = async (eventId: string, title: string) => {
        try {
            const feedbacks = await getFeedbacks(user.id, eventId);
            if (feedbacks.length > 0) {
                onOpenFeedback(eventId, title, feedbacks[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (activeTab === 'saved') {
        if (bookmarkedEvents.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <span className="text-3xl mb-2">🔖</span>
                    <p className="text-sm">No saved events.</p>
                </div>
            );
        }
        return (
            <div className="space-y-3 min-h-[200px]">
                {bookmarkedEvents.map(event => (
                    <div key={event.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-between items-center hover:shadow-md transition-shadow">
                        <div>
                            <h4 className="font-bold text-slate-900 text-base">{event.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">📅 {event.date} • 📍 {event.location}</p>
                        </div>
                        <button
                            onClick={() => onViewEvent(event.id)}
                            className="bg-primary-50 text-primary-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-primary-100 transition-colors"
                        >
                            View
                        </button>
                    </div>
                ))}
            </div>
        );
    }

    const eventsToShow = activeTab === 'schedule' ? scheduledEvents : activeTab === 'pending' ? pendingEvents : pastEvents;

    if (eventsToShow.length === 0) {
        const icon = activeTab === 'schedule' ? '📅' : activeTab === 'pending' ? '⏳' : '✅';
        const msg = activeTab === 'schedule' ? 'No confirmed upcoming events.' : activeTab === 'pending' ? 'No pending applications.' : 'No completed events yet.';

        return (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="text-3xl mb-2">{icon}</span>
                <p className="text-sm">{msg}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 min-h-[200px]">
            {eventsToShow.map(reg => (
                <div
                    key={reg.id}
                    onClick={() => onViewEvent(reg.eventId)} // Make entire card clickable
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary-100 hover:shadow-md cursor-pointer transition-all active:scale-[0.99]"
                >
                    <div className="flex items-start gap-4 pointer-events-none"> {/* Disable pointer events on children to prevent misclicks context issues if needed, but here mainly for style */}
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-600' : (activeTab === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600')}`}>
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
                                <span className="text-xs font-bold text-white bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1 rounded-full shadow-sm">+5 Impact Points</span>
                                {!reg.hasFeedback ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenFeedback(reg.eventId, reg.eventTitle || 'Event') }}
                                        className="text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-bold shadow-sm transition-transform active:scale-95"
                                    >
                                        Rate Event
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditClick(reg.eventId, reg.eventTitle || 'Event') }}
                                        className="text-xs text-slate-400 font-medium px-2 hover:text-primary-600 underline decoration-dotted underline-offset-2 transition-colors"
                                    >
                                        Edit Review
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="ml-auto">
                                {getStatusPill(reg.status)}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
