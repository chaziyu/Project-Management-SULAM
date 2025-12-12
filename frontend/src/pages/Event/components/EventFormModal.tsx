import React from 'react';
import { Event } from '../../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: any;
    setFormData: (data: any) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    uploading: boolean;
    isEditing: boolean;
}

export const EventFormModal: React.FC<Props> = ({
    isOpen, onClose, onSubmit, formData, setFormData, onImageUpload, uploading, isEditing
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-10">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-900">{isEditing ? 'Edit Activity' : 'Plan Activity'}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Event Banner</label>
                            <div className="flex items-center gap-4">
                                {formData.imageUrl && (<img src={formData.imageUrl} alt="Preview" className="h-16 w-24 object-cover rounded-lg border border-slate-200" />)}
                                <label className={`cursor-pointer bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 flex-1 text-center flex flex-col items-center justify-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <span className="text-xs">{uploading ? 'Uploading...' : (formData.imageUrl ? 'Change Image' : 'Upload Image')}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label><input type="text" required placeholder="e.g. Gotong Royong KK12" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-700 mb-1">Date</label><input type="date" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Category</label><select className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}><option>Campus Life</option><option>Education</option><option>Environment</option><option>Welfare</option></select></div></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Location / Venue</label><input type="text" required placeholder="e.g., DTC, Tasik Varsiti" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Max Volunteers</label><input type="number" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.maxVolunteers} onChange={e => setFormData({ ...formData, maxVolunteers: parseInt(e.target.value) })} /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Description</label><textarea required placeholder="What will students be doing?" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Volunteer Roles & Tasks</label><textarea required placeholder="• Role A (Qty)&#10;• Role B (Qty)" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 text-sm font-mono" value={formData.tasks} onChange={e => setFormData({ ...formData, tasks: e.target.value })}></textarea><p className="text-[10px] text-slate-400 mt-1">Be specific so students know what to expect.</p></div>
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 bg-white">
                    <button onClick={onSubmit} disabled={uploading} className="w-full py-3.5 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-transform active:scale-95 disabled:opacity-50">
                        {uploading ? 'Uploading Image...' : (isEditing ? 'Save Changes' : 'Publish Event')}
                    </button>
                </div>
            </div>
        </div>
    );
};
