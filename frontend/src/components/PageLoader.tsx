import React from 'react';

export const PageLoader: React.FC = () => {
    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-medium animate-pulse">Loading...</p>
            </div>
        </div>
    );
};
