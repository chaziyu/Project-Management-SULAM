import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setAuthToken } from './services/api'
import AppRoutes from './routes/'

function App() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const setupToken = async () => {
      // 1. Wait for Clerk to finish loading
      if (isLoaded) {
        if (isSignedIn) {
          try {
            // 2. Fetch the secure token
            const token = await getToken();
            // 3. Set it in the API headers
            setAuthToken(token);
          } catch (error) {
            console.error("Error fetching token:", error);
            setAuthToken(null);
          }
        } else {
          setAuthToken(null);
        }
        // 4. Signal that the app is ready to render
        setAuthReady(true);
      }
    };
    setupToken();
  }, [isLoaded, isSignedIn, getToken]);

  // Show a loading spinner while we wait for auth to initialize
  if (!isLoaded || !authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading VolunteerHub...</p>
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