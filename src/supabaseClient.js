import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cpveybfypwiqaefcvqoo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_n8jik7EPV5QVTahIyNIB0A_RgXtwEW1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
