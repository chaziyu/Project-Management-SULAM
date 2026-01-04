import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { PageLoader } from '../components/PageLoader';
import { useUserRole } from '../hooks/useUserRole';
import { User, UserRole } from '../types';

// Lazy Load Pages
const AuthPage = lazy(() => import('../pages/Event/AuthPage').then(module => ({ default: module.AuthPage })));
const EventFeed = lazy(() => import('../pages/Event/EventFeed').then(module => ({ default: module.EventFeed })));
const OrganizerDashboard = lazy(() => import('../pages/Event/OrganizerDashboard').then(module => ({ default: module.OrganizerDashboard })));
const VolunteerDashboard = lazy(() => import('../pages/Event/VolunteerDashboard').then(module => ({ default: module.VolunteerDashboard })));

/**
 * Helper to construct the User object from Clerk data.
 */
const useAppUser = (): User | null => {
    const { user, isLoaded } = useUser();
    const { role } = useUserRole();

    if (!isLoaded || !user) return null;

    return {
        id: user.id,
        name: user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        role: (role as UserRole) || UserRole.VOLUNTEER,
        avatar: user.imageUrl,
        bookmarks: []
    };
};

// Wrapper for Dashboard Access
const DashboardWithUser = () => {
    const user = useAppUser();
    if (!user) return <PageLoader />;

    // Route based on role
    return user.role === UserRole.ORGANIZER
        ? <OrganizerDashboard user={user} />
        : <VolunteerDashboard user={user} />;
}

// Wrapper for Feed Access
const FeedWithUser = () => {
    const user = useAppUser();
    const navigate = useNavigate();

    // We allow user to be null (loading) but render Feed anyway so they see skeleton loaders
    // If not logged in, user is null, handled by EventFeed logic
    return <EventFeed user={user} onNavigate={(path) => navigate(`/${path}`)} />;
}

/**
 * Main Routing Configuration.
 * Defines all application routes and access control (Auth/Role guards).
 */
export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/feed" replace />} />

                        {/* Public Feed (but requires SignIn for actions) */}
                        <Route path="/feed" element={
                            <>
                                <SignedIn><FeedWithUser /></SignedIn>
                                <SignedOut><Navigate to="/login" replace /></SignedOut>
                            </>
                        } />

                        {/* Auth Routes */}
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/signup" element={<AuthPage />} />

                        {/* Protected Dashboard */}
                        <Route path="/dashboard" element={
                            <>
                                <SignedIn><DashboardWithUser /></SignedIn>
                                <SignedOut><Navigate to="/login" replace /></SignedOut>
                            </>
                        } />
                    </Routes>
                </Suspense>
            </div>
        </BrowserRouter>
    )
}