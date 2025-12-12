import React from 'react';
import { Feedback } from '../../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reviews: Feedback[];
    eventTitle: string;
}

export const ReviewsModal: React.FC<Props> = ({ isOpen, onClose, reviews, eventTitle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full h-[80vh] sm:h-[80vh] sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col relative z-10">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div><h3 className="font-bold text-lg text-slate-900">Student Reviews</h3><p className="text-xs text-slate-500">{eventTitle}</p></div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400"><p>No reviews yet.</p></div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.eventId + review.userId} className="p-4 border border-slate-200/60 rounded-2xl bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-bold text-slate-400">Student Feedback</div>
                                    <div className="flex text-yellow-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                                </div>
                                <p className="text-slate-700 text-sm italic">"{review.comment}"</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
