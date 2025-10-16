// Supabase Configuration
// This file initializes the Supabase client for QuizWhiz application

// Supabase project configuration
const supabaseUrl = 'https://iskkmumyzisbnfqfeesc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlza2ttdW15emlzYm5mcWZlZXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTg4NjIsImV4cCI6MjA3MzI3NDg2Mn0.itbaWgNXoDl-VEk7fTwNM5ThAECDHKi1WbJCAWMvcms'

// Wait for Supabase SDK to be loaded from CDN
const waitForSupabaseSDK = () => {
  if (typeof window.supabase !== 'undefined') {
    // Create Supabase client using the global object
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    // Make client available globally
    if (typeof window !== 'undefined') {
      window.supabaseClient = supabaseClient;
    }
    
    // Make configuration available globally
    if (typeof window !== 'undefined') {
      window.supabaseConfig = {
        url: supabaseUrl,
        anonKey: supabaseAnonKey
      }
      
      // Dispatch ready event for bootstrap sequence
      document.dispatchEvent(new CustomEvent('supabase-ready'))
      
      console.log('Supabase client initialized successfully')
    }
  } else {
    // Retry after a short delay
    setTimeout(waitForSupabaseSDK, 50);
  }
};

// Start waiting for SDK
waitForSupabaseSDK();