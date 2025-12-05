const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://vkvqnfdrvbbilbbzkxpk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdnFuZmRydmJiaWxiYnpreHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDMyMDQsImV4cCI6MjA4MDI3OTIwNH0.PEwI5qAE5fPOw4ohDxVzUBrxwTpFIkH9fgyBVdvfuwY";

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
