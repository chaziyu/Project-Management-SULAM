import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getEvents, getUserBookmarks, joinEvent, toggleBookmark } from '../../services/api';
import { Event, User, UserRole } from '../../types';

interface Props {
  user: User | null;
  onNavigate: (page: string) => void;
}

export const EventFeed: React.FC<Props> = ({ user, onNavigate }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // --- Filtering State ---
  // Filters are applied server-side for efficiency where possible
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce Search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Interactive State
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  const LIMIT = 6;
  const initialLoadDone = useRef(false);

  // 1. Load Events
  const loadEvents = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const skip = isLoadMore ? events.length : 0;

      const [newEvents, bookmarksData] = await Promise.all([
        getEvents('upcoming', categoryFilter, debouncedSearch, skip, LIMIT),
        // Only fetch bookmarks on initial load or if user changed
        (!isLoadMore && user) ? getUserBookmarks(user.id) : Promise.resolve(null)
      ]);

      if (bookmarksData) setUserBookmarks(bookmarksData as string[]);

      if (isLoadMore) {
        setEvents(prev => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }

      setHasMore(newEvents.length === LIMIT);
    } catch (e) {
      console.error("Failed to load feed", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryFilter, debouncedSearch, user, events.length]); // Dependency on events.length is tricky for loadMore, usually handled by ref or passing value directly.

  // 2. Initial & Filter Change Effect
  useEffect(() => {
    // Reset and load
    setEvents([]);
    setHasMore(true);
    loadEvents(false);
  }, [categoryFilter, debouncedSearch, user?.id]);
  // Note: user.id added to reload if user logs in/out. 
  // removed `loadEvents` from dep array to avoid loops, purely relying on filter changes.

  // 3. User Actions
  const handleJoin = async (eventId: string) => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    setJoiningId(eventId);
    try {
      await joinEvent(
        eventId,
        user.id,
        user.name || "Student",
        user.avatar || ""
      );
      alert('Request sent! Waiting for organizer approval.');
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to join");
    } finally {
      setJoiningId(null);
    }
  };

  const handleBookmark = async (eventId: string) => {
    if (!user) return onNavigate('auth');

    // Optimistic UI Update
    const isCurrentlyBookmarked = userBookmarks.includes(eventId);
    const newBookmarksList = isCurrentlyBookmarked
      ? userBookmarks.filter(id => id !== eventId)
      : [...userBookmarks, eventId];

    setUserBookmarks(newBookmarksList);
    setBookmarkingId(eventId);

    try {
      await toggleBookmark(user.id, eventId);
    } catch (e) {
      console.error("Bookmark failed", e);
      // Revert on failure
      setUserBookmarks(userBookmarks);
    } finally {
      setBookmarkingId(null);
    }
  };

  // 4. Client-side Location Filtering (applied after fetch)
  // Since we fetch paginated data, applying client-side filter might hide all results.
  // Ideally this should be backend, but for now we filter what we have.
  const displayedEvents = events.filter(e => {
    // Hide events where quota is full
    if (e.currentVolunteers >= e.maxVolunteers) return false;
    
    if (locationFilter === 'All') return true;
    const keywords: Record<string, string[]> = {
      'KK': ['KK', 'College', 'Nazrin'],
      'Faculty': ['FCSIT', 'Faculty', 'Block'],
      'Outdoors': ['Tasik', 'Rimba']
    };
    const targets = keywords[locationFilter] || [];
    return targets.some(k => e.location.includes(k));
  });


  // --- RENDER HELPERS ---
  const isOrganizer = user?.role === UserRole.ORGANIZER;
  const categories = ['All', 'Campus Life', 'Education', 'Environment', 'Welfare'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campus Bulletin</h1>
        <p className="text-slate-500 mt-1">Happening around Universiti Malaya</p>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-16 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur-md z-30 border-b border-gray-200/50 mb-6 space-y-3 shadow-sm">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search activities..."
            className="w-full pl-11 pr-4 h-12 rounded-xl bg-white border-none shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
        </div>

        {/* Chips */}
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          <select
            className="h-10 px-4 rounded-full bg-white ring-1 ring-gray-200 text-sm font-medium text-slate-700 outline-none flex-shrink-0"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="All">🗺️ Anywhere in UM</option>
            <option value="KK">🏠 Residential Colleges</option>
            <option value="Faculty">🏫 Faculties</option>
            <option value="Outdoors">🌲 Outdoors</option>
          </select>

          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`h-10 px-5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${categoryFilter === c
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-slate-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards */}
      {loading && events.length === 0 ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse"></div>)}
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-900 font-medium">No events found</p>
          <p className="text-slate-400 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayedEvents.map((event) => {
            const isFull = event.currentVolunteers >= event.maxVolunteers;
            const isBookmarked = userBookmarks.includes(event.id);
            const isMyEvent = isOrganizer && user?.id === event.organizerId;
            const day = event.date.split('-')[2];
            const month = new Date(event.date).toLocaleString('default', { month: 'short' });

            return (
              <div key={event.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col">
                {event.imageUrl && (
                  <div className="h-48 w-full overflow-hidden relative">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm border border-white/50">
                        {event.category}
                      </div>
                      {!isOrganizer && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBookmark(event.id); }}
                          className={`w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition-all active:scale-90 ${isBookmarked ? 'bg-red-500 text-white' : 'bg-white text-slate-400 hover:text-red-500'}`}
                        >
                          {bookmarkingId === event.id ? '...' : (isBookmarked ? '♥' : '♡')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex gap-4 mb-3">
                    <div className="flex flex-col items-center justify-center bg-primary-50 rounded-xl w-14 h-14 border border-primary-100 text-primary-700 shrink-0">
                      <span className="text-[10px] font-bold uppercase">{month}</span>
                      <span className="text-xl font-bold leading-none">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{event.title}</h3>
                      <div className="text-xs font-medium text-primary-600 mt-1 truncate">{event.organizerName}</div>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">{event.description}</p>

                  {/* Show tasks if available */}
                  {event.tasks && (
                    <div className="mb-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                      <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Volunteer Roles</span>
                      <p className="text-xs text-slate-700 mt-1 whitespace-pre-line">{event.tasks}</p>
                    </div>
                  )}

                  {/* Action Button Logic */}
                  {isOrganizer ? (
                    isMyEvent ? (
                      <button onClick={() => onNavigate('dashboard')} className="w-full h-12 rounded-xl font-bold text-sm bg-white border-2 border-slate-100 text-slate-700 hover:border-primary-500 hover:text-primary-600 transition-colors">
                        ⚙️ Manage My Event
                      </button>
                    ) : (
                      <div className="w-full h-12 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50 rounded-xl border border-slate-100 italic">
                        View Only
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => handleJoin(event.id)}
                      disabled={joiningId === event.id || isFull}
                      className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center ${isFull
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-primary-600 shadow-lg'
                        }`}
                    >
                      {joiningId === event.id ? 'Sending...' : (isFull ? 'Quota Full' : 'Join Event')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {displayedEvents.length > 0 && hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => loadEvents(true)}
            disabled={loadingMore}
            className="bg-white border text-slate-600 border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Events'}
          </button>
        </div>
      )}
    </div>
  );
};
