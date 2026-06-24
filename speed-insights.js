// Vercel Speed Insights initialization
// This script imports and initializes Speed Insights for the static site

import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
// The script will automatically collect Core Web Vitals and send them to Vercel
injectSpeedInsights({
  // Enable debug mode in development
  debug: false,
  // Optional: Configure sample rate (1 = 100% of events)
  sampleRate: 1
});
