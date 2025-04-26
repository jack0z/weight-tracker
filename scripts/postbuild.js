const fs = require('fs');
const path = require('path');

// Create _redirects file in the out directory
const redirectsContent = `
# Netlify redirects for SPA routing
/api/*  /.netlify/functions/:splat  200
/*      /index.html                 200!
`;

try {
  // Ensure the output directory exists
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    console.error('Output directory "out" does not exist');
    process.exit(1);
  }

  // Write the _redirects file
  fs.writeFileSync(path.join(outDir, '_redirects'), redirectsContent.trim());
  console.log('Created _redirects file in the output directory');

  // Copy the netlify.toml file if it exists
  const netlifyTomlPath = path.join(process.cwd(), 'netlify.toml');
  if (fs.existsSync(netlifyTomlPath)) {
    fs.copyFileSync(netlifyTomlPath, path.join(outDir, 'netlify.toml'));
    console.log('Copied netlify.toml to the output directory');
  }

  // Copy the _headers file if it exists
  const headersPath = path.join(process.cwd(), 'public', '_headers');
  if (fs.existsSync(headersPath)) {
    fs.copyFileSync(headersPath, path.join(outDir, '_headers'));
    console.log('Copied _headers to the output directory');
  }

  // Check if we have a 404.html and copy from index.html if not
  const notFoundPath = path.join(outDir, '404.html');
  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
    console.log('Created 404.html from index.html');
  }

  // Copy a special fallback file that only redirects instead of trying to execute JS
  const staticIndexPath = path.join(process.cwd(), 'public', 'index.html');
  const fallbackPath = path.join(outDir, 'fallback.html');
  if (fs.existsSync(staticIndexPath)) {
    fs.copyFileSync(staticIndexPath, fallbackPath);
    console.log('Created fallback.html from static index.html');
  }

  console.log('Post-build tasks completed successfully');
} catch (error) {
  console.error('Error in post-build script:', error);
  process.exit(1);
} 