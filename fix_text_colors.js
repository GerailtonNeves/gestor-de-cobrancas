const fs = require('fs');
const path = require('path');

// 1. Update public/css/styles.css
let css = fs.readFileSync('public/css/styles.css', 'utf8');

css = css.replace(/--text-main:\s*#[0-9a-fA-F]+;/g, '--text-main: #000000;');
css = css.replace(/--text-muted:\s*#[0-9a-fA-F]+;/g, '--text-muted: #0A0A0A;');
css = css.replace(/--text-brown-muted:\s*#[0-9a-fA-F]+;/g, '--text-brown-muted: #1A1A1A;');

// Inject global text color override right after body rule
if (!css.includes('/* Global Shiny Black Typography Override */')) {
  css += `

/* Global Shiny Black Typography Override */
body, h1, h2, h3, h4, h5, h6, p, label, span, td, th, div, input, select, textarea, button, a {
  color: #000000;
}
.brand-title, .page-header h1, .panel-title, .modal-header h3, .metric-value {
  color: #000000 !important;
  font-weight: 800 !important;
}
.form-control, input, select, textarea {
  color: #000000 !important;
  font-weight: 700 !important;
}
`;
}

fs.writeFileSync('public/css/styles.css', css);

// 2. Update public/index.html and index.html
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/color:\s*#(FFF|fff|ffffff|FFFFFF|E2E8F0)/g, 'color: #000000');
fs.writeFileSync('public/index.html', html);
fs.writeFileSync('index.html', html);

// 3. Update public/js/app.js
let js = fs.readFileSync('public/js/app.js', 'utf8');
js = js.replace(/color:\s*#(FFF|fff|ffffff|FFFFFF|E2E8F0)/g, 'color: #000000');
js = js.replace(/color:\s*['"]#(FFF|fff|ffffff|FFFFFF|E2E8F0)['"]/g, "color: '#000000'");
fs.writeFileSync('public/js/app.js', js);

console.log('✅ All text colors successfully converted to Glossy Shiny Black (#000000)!');
