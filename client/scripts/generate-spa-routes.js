import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[SPA Route Generator] dist/index.html not found! Run vite build first.');
  process.exit(1);
}

const routes = [
  'register',
  'login',
  'dashboard',
  'creator',
  'reviewer',
  'knowledge',
  'analytics',
  'audit',
  'settings',
  'inspection'
];

console.log('[SPA Route Generator] Generating static route fallbacks for Render & CDN hosting...');

const indexContent = fs.readFileSync(indexPath, 'utf-8');

// 1. Create directory-based fallbacks: dist/<route>/index.html
for (const route of routes) {
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  const destPath = path.join(routeDir, 'index.html');
  fs.writeFileSync(destPath, indexContent);
  console.log(`  ✓ Generated: dist/${route}/index.html`);

  // Also create dist/<route>.html for web servers supporting clean URLs
  const cleanHtmlPath = path.join(distDir, `${route}.html`);
  fs.writeFileSync(cleanHtmlPath, indexContent);
}

// 2. Create 404.html and 200.html fallbacks
fs.writeFileSync(path.join(distDir, '404.html'), indexContent);
console.log('  ✓ Generated: dist/404.html (Custom 404 SPA fallback)');

fs.writeFileSync(path.join(distDir, '200.html'), indexContent);
console.log('  ✓ Generated: dist/200.html (Surge/SPA fallback)');

// 3. Ensure _redirects file exists in dist
const redirectsPath = path.join(distDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
  fs.writeFileSync(redirectsPath, '/*    /index.html   200\n');
  console.log('  ✓ Generated: dist/_redirects');
}

console.log('[SPA Route Generator] Successfully generated all static route fallbacks!\n');
