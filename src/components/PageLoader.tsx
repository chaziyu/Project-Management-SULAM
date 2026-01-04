import React from 'react';

/**
 * Full-screen loading indicator.
 * Used during route transitions or data fetching.
 */
export const PageLoader: React.FC = () => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-700">
            <div className="relative">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-primary-400/20 blur-xl rounded-full scale-150 animate-pulse"></div>

                {/* Spinner */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <h3 className="text-slate-900 font-bold text-lg mb-1">UMission</h3>
                <p className="text-slate-400 text-sm font-medium animate-pulse tracking-wide uppercase">Preparing your mission...</p>
            </div>
        </div>
    );
};
