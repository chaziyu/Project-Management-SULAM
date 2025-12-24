import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- Dynamic Token Injection for Supabase ---
let getTokenFn: (() => Promise<string | null>) | null = null;

export const setupSupabaseAuth = (tokenGetter: () => Promise<string | null>) => {
  getTokenFn = tokenGetter;
};

/**
 * Custom fetch wrapper to inject the Clerk token.
 */
const customFetch = async (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);

  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      // Only attach if we have a token. Supabase works anonymously too if policies allow,
      // but for "authenticated" role sections, we need this token.
      // NOTE: This assumes your Supabase project is configured to accept Clerk JWTs!
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