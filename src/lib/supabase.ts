import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service Role Key ile bağlanıyoruz, böylece güvenlik kurallarını (RLS) aşıp doğrudan yazabiliyoruz.
// Hackathon / MVP projeleri için en hızlı yoldur.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
