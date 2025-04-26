const fs = require('fs');
const path = require('path');

// Create the _redirects file for Netlify SPA fallback
const redirectsContent = `
# Netlify SPA fallback
/*    /index.html   200
`;

// Ensure the out directory exists
const outDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write the _redirects file
fs.writeFileSync(path.join(outDir, '_redirects'), redirectsContent.trim());
console.log('✅ Created _redirects file for Netlify');

// Copy netlify.toml if it exists at the root
const netlifyTomlSource = path.join(__dirname, '..', 'netlify.toml');
const netlifyTomlDest = path.join(outDir, 'netlify.toml');

if (fs.existsSync(netlifyTomlSource)) {
  fs.copyFileSync(netlifyTomlSource, netlifyTomlDest);
  console.log('✅ Copied netlify.toml to out directory');
}

console.log('✅ Postbuild script completed successfully'); 