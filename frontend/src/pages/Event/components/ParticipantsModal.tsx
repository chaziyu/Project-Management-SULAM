import React from 'react';

import { Registration } from '../../../types';
import { SkeletonLoader } from '../../../components/SkeletonLoader';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    participants: Registration[];
    eventTitle: string;
    eventId: string;
    onAction: (regId: string, action: 'confirmed' | 'rejected', eventId: string) => void;
    loading: boolean;
}

/**
 * Modal for Managing Volunteers.
 * Allows organizers to approve or reject volunteer applications.
 */

export const ParticipantsModal: React.FC<Props> = ({
    isOpen, onClose, participants, eventTitle, eventId, onAction, loading
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full h-[80vh] sm:h-[80vh] sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col relative z-10">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div><h3 className="font-bold text-lg text-slate-900">Volunteer Requests</h3><p className="text-xs text-slate-500">{eventTitle}</p></div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? (
                        <div className="space-y-3">
                            <SkeletonLoader variant="list-item" count={5} />
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400"><p>No applications yet.</p></div>
                    ) : (
                        participants.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 border border-slate-200/60 rounded-2xl bg-white shadow-sm">
                                <div className="flex items-center gap-3">
                                    <img src={p.userAvatar || 'https://www.gravatar.com/avatar?d=mp'} className="w-12 h-12 rounded-full bg-gray-100 object-cover border border-slate-100" alt="" />
                                    <div>
                                        <div className="font-bold text-sm text-slate-900">{p.userName}</div>
                                        <div className="text-xs text-slate-400">Applied: {p.joinedAt.split('T')[0]}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {p.status === 'pending' ? (
                                        <>
                                            <button onClick={() => onAction(p.id, 'rejected', eventId)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Reject">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <button onClick={() => onAction(p.id, 'confirmed', eventId)} className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 text-green-500 hover:bg-green-100 transition-colors" title="Approve">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.status === 'confirmed' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>{p.status.toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
