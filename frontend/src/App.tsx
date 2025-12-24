import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setupAxiosInterceptors } from './services/api' // Updated import
import { setupSupabaseAuth } from './services/supabaseClient'
import AppRoutes from './routes/'

/**
 * Root Application Component.
 * Handles authentication initialization and global routing.
 */
function App() {
  const { getToken, isLoaded } = useAuth();
  const [authReady, setAuthReady] = useState(false);

  // Initialize Axios interceptors with the Clerk token provider
  // This ensures all API requests have the Authorization header if logged in
  useEffect(() => {
    if (isLoaded) {
      setupAxiosInterceptors(getToken);
      setupSupabaseAuth(getToken);
      setAuthReady(true);
    }
  }, [isLoaded, getToken]);

  // Loading State: Wait for Clerk + Axios setup before rendering routes
  if (!isLoaded || !authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading UMission...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
    </>
  )
}

export default App
