import React from 'react';
import { User } from '../../../../types';

interface Props {
    user: User;
    totalPoints: number;
    completedCount: number;
}

export const VolunteerStatsCard: React.FC<Props> = ({ user, totalPoints, completedCount }) => {
    return (
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
                            <span className="font-bold text-sm">{totalPoints} Impact Points</span>
                        </div>
                        <div className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                            <span className="font-bold text-sm">{completedCount} Events Completed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
