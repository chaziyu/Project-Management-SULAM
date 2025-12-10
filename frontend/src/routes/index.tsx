import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { AuthPage } from '../pages/Event/AuthPage';
import { EventFeed } from '../pages/Event/EventFeed';
import { OrganizerDashboard } from '../pages/Event/OrganizerDashboard';
import { VolunteerDashboard } from '../pages/Event/VolunteerDashboard';
import { Navbar } from '../components/Navbar';
import { useUserRole } from '../hooks/useUserRole';
import { User, UserRole } from '../types';

// Wrapper to inject user data for Dashboard
const DashboardWithUser = () => {
    const { user, isLoaded } = useUser();
    const { role } = useUserRole();

    if (!isLoaded || !user) return <div className="p-10 text-center">Loading profile...</div>;

    const appUser: User = {
        id: user.id,
        name: user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        role: (role as UserRole) || UserRole.VOLUNTEER,
        avatar: user.imageUrl,
        bookmarks: [] 
    };

    return role === UserRole.ORGANIZER 
        ? <OrganizerDashboard user={appUser} /> 
        : <VolunteerDashboard user={appUser} />;
}

// Wrapper to inject user data for Feed
const FeedWithUser = () => {
    const { user, isLoaded } = useUser();
    const { role } = useUserRole();
    const navigate = useNavigate(); // FIX: Initialize navigation hook

    if (!isLoaded || !user) return <div className="p-10 text-center">Loading feed...</div>;

    const appUser: User = {
        id: user.id,
        name: user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        role: (role as UserRole) || UserRole.VOLUNTEER,
        avatar: user.imageUrl,
        bookmarks: []
    };

    // FIX: Pass the real navigate function
    return <EventFeed user={appUser} onNavigate={(path) => navigate(`/${path}`)} />;
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    
                    <Route path="/feed"
                        element={
                            <>
                                <SignedIn>
                                    <FeedWithUser />
                                </SignedIn>
                                <SignedOut>
                                    <Navigate to="/login" replace />
                                </SignedOut>
                            </>
                        }
                    />

                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/signup" element={<AuthPage />} />

                    <Route
                        path="/dashboard"
                        element={
                            <>
                                <SignedIn>
                                    <DashboardWithUser />
                                </SignedIn>
                                <SignedOut>
                                    <Navigate to="/login" replace />
                                </SignedOut>
                            </>
                        }
                    />
                </Routes>
            </div>
        </BrowserRouter>
    )
}