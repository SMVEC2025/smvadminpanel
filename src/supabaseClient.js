import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yirahmvwpjyssttwadco.supabase.co'; // Replace with your URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcmFobXZ3cGp5c3N0dHdhZGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2OTMwNTAsImV4cCI6MjA2MDI2OTA1MH0.MkQzhytRqLhz5IFEvv2iWNaurQdK4xJrVHQref07dg0';               // Replace with your anon key
export const supabase = createClient(supabaseUrl, supabaseKey);
