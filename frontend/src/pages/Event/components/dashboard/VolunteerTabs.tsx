import React from 'react';

interface Props {
    activeTab: 'schedule' | 'pending' | 'history' | 'saved';
    onChange: (tab: 'schedule' | 'pending' | 'history' | 'saved') => void;
    pendingCount: number;
}

export const VolunteerTabs: React.FC<Props> = ({ activeTab, onChange, pendingCount }) => {
    return (
        <div className="bg-slate-100 p-1.5 rounded-2xl mb-6 flex">
            {[
                { id: 'schedule', label: 'My Schedule' },
                { id: 'pending', label: `Applications (${pendingCount})` },
                { id: 'history', label: 'History' },
                { id: 'saved', label: 'Saved' }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id as any)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
