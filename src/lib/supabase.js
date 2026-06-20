import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

console.log("ORVIX_SUPABASE_URL", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
