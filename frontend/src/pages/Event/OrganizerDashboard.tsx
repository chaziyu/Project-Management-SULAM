import React, { useEffect, useState } from 'react';
import { User, Event, Registration } from '../../types';
import { 
  createEvent, getOrganizerEvents, updateEventStatus, getEventAverageRating, 
  getFeedbacks, getEventRegistrations, updateRegistrationStatus 
} from '../../services/api';

interface Props { user: User; }
interface EventWithStats extends Event { avgRating?: number; feedbackCount?: number; }

export const OrganizerDashboard: React.FC<Props> = ({ user }) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [participantModal, setParticipantModal] = useState<{isOpen: boolean, eventId: string, eventTitle: string} | null>(null);
  const [currentParticipants, setCurrentParticipants] = useState<Registration[]>([]);
  const [formData, setFormData] = useState({
    title: '', date: '', location: '', category: 'Campus Life',
    maxVolunteers: 20, description: '', tasks: '', imageUrl: ''
  });

  const fetchEvents = async () => {
    try {
      const data = await getOrganizerEvents(user.id);
      const enhancedData = await Promise.all(data.map(async (e) => {
        if (e.status === 'completed') {
          const rating = await getEventAverageRating(e.id);
          const feedbacks = await getFeedbacks(undefined, e.id);
          return { ...e, avgRating: rating, feedbackCount: feedbacks.length };
        }
        return e;
      }));
      setEvents(enhancedData);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchEvents(); }, [user.id]);

  useEffect(() => {
    if (participantModal?.isOpen) fetchParticipants(participantModal.eventId);
  }, [participantModal?.isOpen]);

  const fetchParticipants = async (eventId: string) => {
    const participants = await getEventRegistrations(eventId);
    setCurrentParticipants(participants);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, imageUrl: dataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent({ ...formData, organizerId: user.id, organizerName: user.name });
    setShowModal(false);
    fetchEvents();
    setFormData({ title: '', date: '', location: '', category: 'Campus Life', maxVolunteers: 20, description: '', tasks: '', imageUrl: '' });
  };

  const handleConclude = async (eventId: string) => {
    if (confirm('Conclude event?')) {
      await updateEventStatus(eventId, 'completed');
      fetchEvents();
    }
  };

  const handleParticipantAction = async (registrationId: string, action: 'confirmed' | 'rejected', eventId: string) => {
      await updateRegistrationStatus(registrationId, action);
      fetchParticipants(eventId);
      fetchEvents();
  };

  const filteredEvents = events.filter(e => e.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold text-slate-900">Club Admin</h1><p className="text-slate-500 text-sm">{user.name}</p></div>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 shadow-lg shadow-primary-200 transition-transform hover:-translate-y-0.5">+ New Event</button>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-xl mb-6 w-fit">
        <button onClick={() => setActiveTab('upcoming')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Active</button>
        <button onClick={() => setActiveTab('completed')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>History</button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200"><p className="text-slate-400 text-sm font-medium">No events found.</p></div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded-md uppercase tracking-wider">{event.category}</span><span className="text-xs font-medium text-slate-400">{event.date}</span></div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{event.title}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">📍 {event.location}</p>
                {activeTab === 'completed' && (<div className="mt-4 flex items-center gap-4 bg-yellow-50 p-3 rounded-xl w-fit border border-yellow-100"><div className="flex items-center text-yellow-600 gap-1"><span className="text-xl font-bold">{event.avgRating || 0}</span><span>★</span></div><span className="text-xs font-medium text-yellow-700">{event.feedbackCount} Student Reviews</span></div>)}
              </div>
              <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0 justify-between lg:justify-center">
                 <div className="flex items-center gap-6 bg-slate-50 px-5 py-3 rounded-xl"><div className="text-center lg:text-right"><div className="text-2xl font-bold text-slate-900 leading-none">{event.currentVolunteers}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Joined</div></div></div>
                 {activeTab === 'upcoming' && (<div className="flex flex-col gap-2 w-full lg:w-auto"><button onClick={() => setParticipantModal({isOpen: true, eventId: event.id, eventTitle: event.title})} className="w-full lg:w-40 h-10 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Manage Volunteers</button><button onClick={() => handleConclude(event.id)} className="w-full lg:w-40 h-10 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors">Conclude Event</button></div>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-10">
            <div className="flex justify-between items-center p-5 border-b border-slate-100"><h3 className="font-bold text-lg text-slate-900">Plan Campus Activity</h3><button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">✕</button></div>
            <div className="flex-1 overflow-y-auto p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-xs font-bold text-slate-700 mb-1">Event Banner</label><div className="flex items-center gap-4">{formData.imageUrl && (<img src={formData.imageUrl} alt="Preview" className="h-16 w-24 object-cover rounded-lg border border-slate-200" />)}<label className="cursor-pointer bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 flex-1 text-center flex flex-col items-center justify-center"><span className="text-xs">{formData.imageUrl ? 'Change Image' : 'Upload Image'}</span><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label></div></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label><input type="text" required placeholder="e.g. Gotong Royong KK12" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-700 mb-1">Date</label><input type="date" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Category</label><select className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Campus Life</option><option>Education</option><option>Environment</option><option>Welfare</option></select></div></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Location / Venue</label><input type="text" required placeholder="e.g., DTC, Tasik Varsiti" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Max Volunteers</label><input type="number" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.maxVolunteers} onChange={e => setFormData({...formData, maxVolunteers: parseInt(e.target.value)})} /></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Description</label><textarea required placeholder="What will students be doing?" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Volunteer Roles & Tasks</label><textarea required placeholder="• Role A (Qty)&#10;• Role B (Qty)" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm font-mono" value={formData.tasks} onChange={e => setFormData({...formData, tasks: e.target.value})}></textarea><p className="text-[10px] text-slate-400 mt-1">Be specific so students know what to expect.</p></div></form></div>
            <div className="p-5 border-t border-slate-100 bg-white"><button onClick={handleSubmit} className="w-full py-3.5 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-transform active:scale-95">Publish Event</button></div>
          </div>
        </div>
      )}

      {participantModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setParticipantModal(null)}></div>
            <div className="bg-white w-full h-[80vh] sm:h-[80vh] sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col relative z-10">
                <div className="flex justify-between items-center p-5 border-b border-slate-100"><div><h3 className="font-bold text-lg text-slate-900">Volunteer Requests</h3><p className="text-xs text-slate-500">{participantModal.eventTitle}</p></div><button onClick={() => setParticipantModal(null)} className="text-slate-400 hover:text-slate-600">✕</button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">{currentParticipants.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-slate-400"><p>No applications yet.</p></div>) : (currentParticipants.map(p => (<div key={p.id} className="flex items-center justify-between p-4 border border-slate-200/60 rounded-2xl bg-white shadow-sm"><div className="flex items-center gap-3"><img src={p.userAvatar || 'https://www.gravatar.com/avatar?d=mp'} className="w-12 h-12 rounded-full bg-gray-100 object-cover border border-slate-100" alt=""/><div><div className="font-bold text-sm text-slate-900">{p.userName}</div><div className="text-xs text-slate-400">Applied: {p.joinedAt.split('T')[0]}</div></div></div><div className="flex gap-2">{p.status === 'pending' ? (<><button onClick={() => handleParticipantAction(p.id, 'rejected', participantModal.eventId)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Reject"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button><button onClick={() => handleParticipantAction(p.id, 'confirmed', participantModal.eventId)} className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 text-green-500 hover:bg-green-100 transition-colors" title="Approve"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></button></>) : (<span className={`text-xs font-bold px-3 py-1 rounded-full ${p.status === 'confirmed' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>{p.status.toUpperCase()}</span>)}</div></div>)))}</div>
            </div>
          </div>
      )}
    </div>
  );
};