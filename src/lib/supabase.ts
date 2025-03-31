
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://blbxnxuircaduvwkibxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYnhueHVpcmNhZHV2d2tpYnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDMxODEsImV4cCI6MjA1ODk3OTE4MX0.xFw7sCoTQMB7pdFbh6a6qghopVXmN3KQFh9lvQePkpE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
