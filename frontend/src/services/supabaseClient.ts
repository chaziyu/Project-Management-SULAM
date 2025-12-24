import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- Dynamic Token Injection for Supabase ---
let getTokenFn: ((options?: any) => Promise<string | null>) | null = null;

export const setupSupabaseAuth = (tokenGetter: (options?: any) => Promise<string | null>) => {
  getTokenFn = tokenGetter;
};

/**
 * Custom fetch wrapper to inject the Clerk token.
 */
const customFetch = async (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);

  if (getTokenFn) {
    try {
      // Request a token specifically signed for Supabase (using the 'supabase' template)
      const token = await getTokenFn({ template: 'supabase' });

      // Only attach if we have a token. Supabase works anonymously too if policies allow,
      // but for "authenticated" role sections, we need this token.
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (error) {
      console.warn("Supabase fetch: Error getting token", error);
    }
  }

  return fetch(url, { ...options, headers });
};

/**
 * Shared Supabase Client with Clerk Auth Injection.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
});