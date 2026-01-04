import { useClerk, useUser } from '@clerk/clerk-react';
import { LogOut, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

/**
 * Global Navigation Bar.
 * Responsive component that handles user navigation, auth state display, and mobile menu toggling.
 */
export const Navbar: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Default to Volunteer if no role is found
  const role = (user?.unsafeMetadata?.role as UserRole) || UserRole.VOLUNTEER;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Helper for active link styles
  const getLinkClass = (path: string, isMobile = false) => {
    const active = location.pathname === path;
    const base = isMobile
      ? "block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all"
      : "px-5 py-2 rounded-full text-sm font-medium transition-colors";

    const activeStyle = "bg-primary-50 text-primary-700";
    const inactiveStyle = "text-gray-500 hover:text-gray-900 hover:bg-gray-50";

    return `${base} ${active ? activeStyle : inactiveStyle}`;
  };

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* --- Brand & Desktop Nav --- */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200/50 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="font-bold text-xl text-gray-900">UMission</span>
            </Link>

            {isSignedIn && (
              <div className="hidden md:flex space-x-2">
                <Link to="/feed" className={getLinkClass('/feed')}>Campus Feed</Link>
                <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                  {role === UserRole.ORGANIZER ? 'Dashboard' : 'My Impact'}
                </Link>
              </div>
            )}
          </div>

          {/* --- Desktop User Actions --- */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn && user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-900">{user.fullName}</span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{role}</span>
                </div>
                <img className="h-10 w-10 rounded-full bg-gray-100 object-cover border border-white shadow-sm" src={user.imageUrl} alt="Profile" />
                <button onClick={handleLogout} className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // Hide buttons if on AuthPage (Login/Signup) to avoid redundancy with form tabs
              !['/login', '/signup'].includes(location.pathname) && (
                <div className="flex space-x-3">
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm px-4 py-2">Log in</Link>
                  <Link to="/signup" className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary-700 shadow-md shadow-primary-200 transition-all">Sign up</Link>
                </div>
              )
            )}
          </div>

          {/* --- Mobile Toggle --- */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 rounded-lg hover:bg-gray-100">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg p-4 space-y-2">
          {isSignedIn && user ? (
            <>
              <div className="flex items-center gap-3 p-3 mb-3 bg-gray-50 rounded-xl">
                <img className="h-10 w-10 rounded-full object-cover" src={user.imageUrl} alt="" />
                <div>
                  <p className="font-bold text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500 uppercase">{role}</p>
                </div>
              </div>
              <Link to="/feed" onClick={() => setIsMenuOpen(false)} className={getLinkClass('/feed', true)}>Campus Feed</Link>
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={getLinkClass('/dashboard', true)}>
                {role === UserRole.ORGANIZER ? 'Dashboard' : 'My Impact'}
              </Link>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg">Log Out</button>
            </>
          ) : (
            !['/login', '/signup'].includes(location.pathname) && (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="w-full py-3 text-center text-gray-700 font-medium bg-gray-50 rounded-xl">Log in</Link>
                <Link to="/signup" className="w-full py-3 text-center text-white font-bold bg-primary-600 rounded-xl">Sign up</Link>
              </div>
            )
          )}
        </div>
      )}
    </nav>
  );
};