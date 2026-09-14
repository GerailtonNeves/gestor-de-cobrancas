const fs = require('fs');

let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Remove top window assignments if placed before definitions
appJs = appJs.replace(/window\.editarPlano = editarPlano;?\n?/g, '');
appJs = appJs.replace(/window\.editarApp = editarApp;?\n?/g, '');
appJs = appJs.replace(/window\.editarServidor = editarServidor;?\n?/g, '');
appJs = appJs.replace(/window\.abrirModalNovoPlano = abrirModalNovoPlano;?\n?/g, '');
appJs = appJs.replace(/window\.abrirModalNovoApp = abrirModalNovoApp;?\n?/g, '');
appJs = appJs.replace(/window\.abrirModalNovoServidor = abrirModalNovoServidor;?\n?/g, '');
appJs = appJs.replace(/window\.abrirModal = abrirModal;?\n?/g, '');
appJs = appJs.replace(/window\.fecharModal = fecharModal;?\n?/g, '');

// Place window exposures immediately after their function definitions
appJs = appJs.replace(
  /async function editarPlano\(id\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.editarPlano = editarPlano;'
);

appJs = appJs.replace(
  /async function editarApp\(id\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.editarApp = editarApp;'
);

appJs = appJs.replace(
  /async function editarServidor\(id\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.editarServidor = editarServidor;'
);

appJs = appJs.replace(
  /function abrirModalNovoPlano\(\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.abrirModalNovoPlano = abrirModalNovoPlano;'
);

appJs = appJs.replace(
  /function abrirModalNovoApp\(\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.abrirModalNovoApp = abrirModalNovoApp;'
);

appJs = appJs.replace(
  /function abrirModalNovoServidor\(\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.abrirModalNovoServidor = abrirModalNovoServidor;'
);

appJs = appJs.replace(
  /function abrirModal\(modalId\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.abrirModal = abrirModal;'
);

appJs = appJs.replace(
  /function fecharModal\(modalId\) \{[\s\S]*?\n\}/,
  (match) => match + '\nwindow.fecharModal = fecharModal;'
);

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('✅ public/js/app.js updated with window assignments after function definitions');

// Bump version to v88.0
function updateIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/styles\.css\?v=\d+\.\d+/g, 'styles.css?v=88.0');
  html = html.replace(/app\.js\?v=\d+\.\d+/g, 'app.js?v=88.0');
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Version bumped to v88.0 in ' + filePath);
}

updateIndexHtml('public/index.html');
updateIndexHtml('index.html');
