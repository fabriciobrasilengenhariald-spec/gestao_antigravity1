import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente devem ser configuradas no .env.local ou na Vercel.
// Removida a chave hardcoded por segurança.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zdcypvdhvrqfwydxqlxg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const isSupabaseConfigured = () => {
    return SUPABASE_URL && SUPABASE_URL.includes('supabase.co') && SUPABASE_KEY && SUPABASE_KEY.length > 10;
}