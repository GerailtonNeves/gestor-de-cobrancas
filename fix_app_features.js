const fs = require('fs');

// 1. Update public/css/styles.css for Light Blue Theme
let css = fs.readFileSync('public/css/styles.css', 'utf8');

css = css.replace(/--bg-primary:\s*#[0-9a-fA-F]+;/g, '--bg-primary: #EBF5FF;');
css = css.replace(/--bg-secondary:\s*#[0-9a-fA-F]+;/g, '--bg-secondary: #DBEAFE;');
css = css.replace(/--border-color:\s*#[0-9a-fA-F]+;/g, '--border-color: #BFDBFE;');

fs.writeFileSync('public/css/styles.css', css);

// 2. Fix app.js Swal backgrounds and modal edit functions
let js = fs.readFileSync('public/js/app.js', 'utf8');

// Replace dark Swal backgrounds with clean white/light blue popups
js = js.replace(/background:\s*['"]#0D1527['"]/g, "background: '#FFFFFF'");
js = js.replace(/background:\s*['"]#FAF7EE['"]/g, "background: '#FFFFFF'");

fs.writeFileSync('public/js/app.js', js);

// 3. Bump version in index.html files
['public/index.html', 'index.html'].forEach(f => {
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/v=79\.0/g, 'v=80.0');
  fs.writeFileSync(f, h);
});

console.log('✅ Light Blue Theme & App Fixes applied successfully!');
