import * as esbuild from 'esbuild';

try {
  // Build Speed Insights bundle
  await esbuild.build({
    entryPoints: ['speed-insights.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: 'dist/speed-insights.bundle.js',
    platform: 'browser',
    target: ['es2015'],
  });
  console.log('✅ Speed Insights bundle created successfully!');
  
  // Build Web Analytics bundle
  await esbuild.build({
    entryPoints: ['analytics.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: 'dist/analytics.bundle.js',
    platform: 'browser',
    target: ['es2015'],
  });
  console.log('✅ Web Analytics bundle created successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
