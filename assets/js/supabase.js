// Supabase connection shared by every page.
// The publishable key is meant to be public. Never put the secret key
// (sb_secret_...) in this file.
//
// Load the Supabase library before this file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"></script>
const SUPABASE_URL = 'https://htablmpftjevgidkqssp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lEtQVmUoaFIGJUWguil-Dw_6_2oQ7y-';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
