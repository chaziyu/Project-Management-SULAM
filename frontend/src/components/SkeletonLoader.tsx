import React from 'react';

interface SkeletonProps {
    variant?: 'card' | 'list' | 'list-item' | 'text' | 'circle';
    className?: string;
    count?: number;
}

/**
 * Premium Skeleton Loader with shimmer effect.
 */
export const SkeletonLoader: React.FC<SkeletonProps> = ({
    variant = 'text',
    className = '',
    count = 1
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'card':
                return 'h-40 w-full rounded-2xl';
            case 'list':
                return 'h-20 w-full rounded-xl';
            case 'list-item':
                return 'h-16 w-full rounded-lg';
            case 'circle':
                return 'h-12 w-12 rounded-full';
            case 'text':
            default:
                return 'h-4 w-full rounded';
        }
    };

    const renderSkeleton = (index: number) => (
        <div
            key={index}
            className={`relative overflow-hidden bg-slate-100 ${getVariantClasses()} ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
    );

    return (
        <div className="space-y-3 w-full">
            {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
        </div>
    );
};
