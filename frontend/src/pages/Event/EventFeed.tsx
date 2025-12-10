import React, { useEffect, useState } from 'react';
import { Event, User, UserRole } from '../../types'; // Fixed path
import { getEvents, joinEvent, toggleBookmark, getUserBookmarks } from '../../services/api'; // Fixed path

interface Props {
  user: User | null;
  onNavigate: (page: string) => void;
}

export const EventFeed: React.FC<Props> = ({ user, onNavigate }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  
  // Initialize empty, fetch real data in useEffect
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        // FIX: Sort by date (ascending) so soonest events appear first
        const upcoming = data
            .filter(e => e.status === 'upcoming' || !e.status)
            .sortZB((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        setEvents(upcoming);
        setFilteredEvents(upcoming);
      } catch (e) {
        console.error("Failed to load events", e);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
    loadBookmarks();
  }, [user]);

  useEffect(() => {
    let result = events;
    
    if (categoryFilter !== 'All') {
      result = result.filter(e => e.category === categoryFilter);
    }
    
    if (locationFilter !== 'All') {
      if (locationFilter === 'KK') result = result.filter(e => e.location.includes('KK') || e.location.includes('College') || e.location.includes('Nazrin'));
      if (locationFilter === 'Faculty') result = result.filter(e => e.location.includes('FCSIT') || e.location.includes('Faculty') || e.location.includes('Block'));
      if (locationFilter === 'Outdoors') result = result.filter(e => e.location.includes('Tasik') || e.location.includes('Rimba'));
    }

    if (searchTerm) {
      result = result.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredEvents(result);
  }, [categoryFilter, locationFilter, searchTerm, events]);

  const handleJoin = async (eventId: string) => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    setJoiningId(eventId);
    try {
      // Pass real user details here
      await joinEvent(
          eventId, 
          user.id, 
          user.name || "Student", 
          user.avatar || ""
      );
      alert('Request sent! Waiting for organizer approval.');
    } catch (e: any) {
      alert(e.response?.data?.detail || e.message || "Failed to join");
    } finally {
      setJoiningId(null);
    }
  };

  const handleBookmark = async (eventId: string) => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    try {
      const newBookmarks = await toggleBookmark(user.id, eventId);
      setUserBookmarks(newBookmarks);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = ['All', 'Campus Life', 'Education', 'Environment', 'Welfare'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campus Bulletin</h1>
        <p className="text-slate-500 mt-1">Happening around Universiti Malaya</p>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur-md z-30 border-b border-gray-200/50 mb-6 space-y-3 shadow-sm">
        <div className="relative">
           <input 
            type="text" 
            placeholder="Search activities..." 
            className="w-full pl-11 pr-4 h-12 rounded-xl bg-white border-none shadow-sm ring-1 ring-gray-200 text-base focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
           <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        
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
              className={`h-10 px-5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                categoryFilter === c 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                : 'bg-white text-slate-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* List View */}
      {loading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse"></div>)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-slate-900 font-medium">No events found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredEvents.map((event) => {
            const isFull = event.currentVolunteers >= event.maxVolunteers;
            const isBookmarked = userBookmarks.includes(event.id);
            
            // LOGIC FOR ORGANIZERS
            const isOrganizer = user?.role === UserRole.ORGANIZER;
            const isMyEvent = isOrganizer && user?.id === event.organizerId;
            
            const dateParts = event.date.split('-');

            return (
              <div key={event.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col">
                
                {/* Image Area */}
                <div className="relative h-48 w-full shrink-0 bg-gray-100">
                    <img 
                        src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/200`} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    
                    {/* Only show bookmark for volunteers */}
                    {!isOrganizer && (
                      <div className="absolute top-4 right-4 z-10">
                          <button 
                              onClick={(e) => { e.stopPropagation(); handleBookmark(event.id); }}
                              className="p-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm transition-transform active:scale-90"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isBookmarked ? "#ef4444" : "none"} viewBox="0 0 24 24" stroke={isBookmarked ? "#ef4444" : "#64748b"} strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                          </button>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/95 backdrop-blur-md text-slate-700 shadow-sm">
                            {event.category}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex gap-4 mb-3">
                     <div className="flex flex-col items-center justify-center bg-primary-50 rounded-xl w-14 h-14 border border-primary-100 text-primary-700 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-xl font-bold leading-none">{dateParts[2]}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                         <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">{event.title}</h3>
                         <div className="text-xs font-medium text-primary-600 mt-1 truncate">{event.organizerName}</div>
                     </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">{event.description}</p>
                  
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-500 mb-5">
                     <div className="flex items-center bg-slate-50 px-2 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="truncate max-w-[150px]">{event.location}</span>
                     </div>
                     <div className="flex items-center bg-slate-50 px-2 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                        {event.currentVolunteers} / {event.maxVolunteers} Vols
                     </div>
                  </div>

                  {/* SMART BUTTON LOGIC */}
                  {isOrganizer ? (
                     isMyEvent ? (
                       <button 
                        onClick={() => onNavigate('dashboard')}
                        className="w-full h-12 rounded-xl font-bold text-sm bg-white border-2 border-slate-100 text-slate-700 hover:border-primary-500 hover:text-primary-600 transition-colors shadow-sm"
                       >
                         ⚙️ Manage My Event
                       </button>
                     ) : (
                       <div className="w-full h-12 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50 rounded-xl border border-slate-100 italic">
                         View Only Mode
                       </div>
                     )
                  ) : (
                    <button 
                      onClick={() => handleJoin(event.id)}
                      disabled={joiningId === event.id || isFull}
                      className={`w-full h-12 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center ${
                        isFull 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-slate-900 text-white hover:bg-primary-600 shadow-slate-200 hover:shadow-primary-200'
                      }`}
                    >
                      {joiningId === event.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Sending Request...
                          </span>
                      ) : isFull ? 'Quota Full' : 'Join Event'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};