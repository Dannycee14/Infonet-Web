// Vercel Web Analytics initialization
// This script imports and initializes Web Analytics for the static site

import { inject } from '@vercel/analytics';

// Initialize Web Analytics
// The script will automatically track page views and send them to Vercel
inject({
  // Enable debug mode in development
  debug: false,
  // Optional: Configure sample rate (1 = 100% of events)
  mode: 'production'
});
