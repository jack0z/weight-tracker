const fs = require('fs');
const path = require('path');

// Create _redirects file in the out directory
const redirectsContent = `
# Netlify redirects for SPA routing
/api/*  /.netlify/functions/:splat  200
/*      /index.html                 200
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

  console.log('Post-build tasks completed successfully');
} catch (error) {
  console.error('Error in post-build script:', error);
  process.exit(1);
} 