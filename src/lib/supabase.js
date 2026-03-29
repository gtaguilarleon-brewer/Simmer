import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uehpssdmqwdoalrlgznz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlaHBzc2RtcXdkb2Fscmxnem56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzOTM2NDUsImV4cCI6MjA1ODk2OTY0NX0.GiiJHMIuRRIwAbEwxW-wjJNwFaj-afGJoUbmi3PYih0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
