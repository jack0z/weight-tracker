const fs = require('fs');
const path = require('path');

try {
  console.log('Running post-build tasks...');
  
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    console.error('Error: Output directory does not exist.');
    process.exit(1);
  }
  
  // Create _redirects file
  const redirectsContent = `
# Netlify redirects for SPA routing
/api/*  /.netlify/functions/:splat  200
/*      /index.html                 200!
`;
  fs.writeFileSync(path.join(outDir, '_redirects'), redirectsContent.trim());
  console.log('✅ Created _redirects file');
  
  // Create _headers file
  const headersContent = `
# Headers for all files
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# JS and CSS specific headers
/*.js
  Content-Type: application/javascript

/*.css
  Content-Type: text/css

# API headers
/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
`;
  fs.writeFileSync(path.join(outDir, '_headers'), headersContent.trim());
  console.log('✅ Created _headers file');
  
  // Copy index.html to 404.html for SPA routing
  const indexPath = path.join(outDir, 'index.html');
  const notFoundPath = path.join(outDir, '404.html');
  
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
    console.log('✅ Created 404.html from index.html');
  } else {
    console.error('⚠️ Warning: index.html not found in output directory.');
  }
  
  // Create subdirectories with index.html files
  const subdirs = ['share'];
  for (const dir of subdirs) {
    const dirPath = path.join(outDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
    
    // Copy index.html to the subdirectory
    const subIndexPath = path.join(dirPath, 'index.html');
    if (!fs.existsSync(subIndexPath) && fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, subIndexPath);
      console.log(`✅ Created ${dir}/index.html`);
    }
  }
  
  // Copy the netlify.toml file if it exists
  const netlifyTomlPath = path.join(process.cwd(), 'netlify.toml');
  if (fs.existsSync(netlifyTomlPath)) {
    fs.copyFileSync(netlifyTomlPath, path.join(outDir, 'netlify.toml'));
    console.log('Copied netlify.toml to the output directory');
  }

  // Copy a special fallback file that only redirects instead of trying to execute JS
  const staticIndexPath = path.join(process.cwd(), 'public', 'index.html');
  const fallbackPath = path.join(outDir, 'fallback.html');
  if (fs.existsSync(staticIndexPath)) {
    fs.copyFileSync(staticIndexPath, fallbackPath);
    console.log('Created fallback.html from static index.html');
  }

  console.log('✅ Post-build tasks completed successfully');
} catch (error) {
  console.error('❌ Error in post-build script:', error);
  process.exit(1);
} 