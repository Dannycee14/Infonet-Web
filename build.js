import * as esbuild from 'esbuild';

try {
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
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
