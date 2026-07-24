const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['webview/index.tsx'],
  bundle: true,
  outfile: 'out/webview.js',
  format: 'iife',
  minify: true,
  sourcemap: true,
}).catch(() => process.exit(1));
