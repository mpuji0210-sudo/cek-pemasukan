// js/supabase.js
const SUPABASE_URL = "https://kifhgviiifkruqpytfdu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b1v8iNcpfJJpbFCByAxB6A_BqbmljdR";
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
