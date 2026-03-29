import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uehpssdmqwdoalrlgznz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_QvEZd0guWrv6kX9iIKipcw_b05UY501";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
