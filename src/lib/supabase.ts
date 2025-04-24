import { createBrowserClient } from '@supabase/ssr';

// Define a function to create the client
const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Export a singleton instance of the client
export const supabase = createClient(); 