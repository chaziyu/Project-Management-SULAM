import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { AuthPage } from '../pages/Event/AuthPage';
import { EventFeed } from '../pages/Event/EventFeed';
import { OrganizerDashboard } from '../pages/Event/OrganizerDashboard';
import { VolunteerDashboard } from '../pages/Event/VolunteerDashboard';
import { Navbar } from '../components/Navbar';
import { useUserRole } from '../hooks/useUserRole';
import { User, UserRole } from '../types';

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
    if (!user) return <div className="p-10 text-center">Loading profile...</div>;

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

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    
                    {/* Public Feed (but requires SignIn for actions) */}
                    <Route path="/feed" element={
                        <>
                            <SignedIn><FeedWithUser /></SignedIn>
                            <SignedOut><Navigate to="/login" replace /></SignedOut>
                        </>
                    }/>

                    {/* Auth Routes */}
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/signup" element={<AuthPage />} />

                    {/* Protected Dashboard */}
                    <Route path="/dashboard" element={
                        <>
                            <SignedIn><DashboardWithUser /></SignedIn>
                            <SignedOut><Navigate to="/login" replace /></SignedOut>
                        </>
                    }/>
                </Routes>
            </div>
        </BrowserRouter>
    )
}