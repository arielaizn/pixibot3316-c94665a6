import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymhcczxxrgcnyxaqmohj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaGNjenhocmdjbnl4YXFtb2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTc1ODEsImV4cCI6MjA1MDUzMzU4MX0.pqOSe4K9wJvBKj7DKTp2HcJzJrF9g5Scu5dv_fXWXkE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage, // CEP supports localStorage
    persistSession: true,
    autoRefreshToken: true,
  },
});
