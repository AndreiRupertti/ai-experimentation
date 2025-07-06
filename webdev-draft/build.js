#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

async function buildProject() {
  console.log('🏗️  Building React Component Draft Tool...');
  
  // Create dist directory
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  try {
    // Read and process HTML file
    const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    // Update script src to point to minified JS
    const updatedHtml = htmlContent.replace(
      '<script src="src/app.js"></script>',
      '<script src="app.min.js"></script>'
    );

    // Minify HTML
    const minifiedHtml = await minify(updatedHtml, {
      removeComments: true,
      collapseWhitespace: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      useShortDoctype: true,
      removeAttributeQuotes: true
    });

    // Write minified HTML
    fs.writeFileSync(path.join(distDir, 'index.html'), minifiedHtml);
    console.log('✅ HTML minified and saved to dist/index.html');

    console.log('🎉 Build complete! Files are ready in the dist/ directory.');
    console.log('💡 Run "npm run serve" to preview the built site.');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildProject();
