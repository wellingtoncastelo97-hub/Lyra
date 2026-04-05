import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cpveybfypwiqaefcvqoo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_n8jik7EPV5QVTahIyNIB0A_RgXtwEW1';
const fallbackAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD || (import.meta.env.DEV ? 'lyra2024' : '');

export const getAdminSupabaseClient = () => {
    const adminPassword = localStorage.getItem('lyra_admin_secret') || fallbackAdminPassword;
    const headers = adminPassword
        ? {
            'x-lyra-admin-password': adminPassword,
        }
        : {};

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers,
        },
    });
};
