import React from 'react';
import { Badge } from '../../../../types';

interface Props {
    badges: Badge[];
}

export const VolunteerBadges: React.FC<Props> = ({ badges }) => {
    if (badges.length === 0) return null;

    return (
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
    );
};
