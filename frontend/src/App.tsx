import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setupAxiosInterceptors } from './services/api' // Updated import
import { setupSupabaseAuth } from './services/supabaseClient'
import AppRoutes from './routes/'
import { PageLoader } from './components/PageLoader'

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
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <PageLoader />
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
