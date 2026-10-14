import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mitkblmftejogdxmewet.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdGtibG1mdGVqb2dkeG1ld2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzIzMDYsImV4cCI6MjA2Mjc0ODMwNn0.7zYkzKWXMios1IJ_rz8UA5Jm63xz59A-qi2EqsqB9-E"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
