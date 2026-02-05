import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uvecrllugptstymxnxrj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZWNybGx1Z3B0c3R5bXhueHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjcxMjQsImV4cCI6MjA4NTgwMzEyNH0.SgNTXQoo9JJZwfcjK6GcXrDqphzpG-6XEiua_wRpb0Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
