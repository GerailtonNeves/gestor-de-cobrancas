const fs = require('fs');

let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Replace form listeners in setupForms with safe null checks
appJs = appJs.replace(
  "document.getElementById('formCobranca').addEventListener('submit', async (e) => {",
  "const fCobEl = document.getElementById('formCobranca');\n  if (fCobEl) fCobEl.addEventListener('submit', async (e) => {"
);

appJs = appJs.replace(
  "document.getElementById('formCliente').addEventListener('submit', async (e) => {",
  "const fCliEl = document.getElementById('formCliente');\n  if (fCliEl) fCliEl.addEventListener('submit', async (e) => {"
);

appJs = appJs.replace(
  "document.getElementById('formBaixa').addEventListener('submit', async (e) => {",
  "const fBxaEl = document.getElementById('formBaixa');\n  if (fBxaEl) fBxaEl.addEventListener('submit', async (e) => {"
);

appJs = appJs.replace(
  "document.getElementById('formMeusDados').addEventListener('submit', async (e) => {",
  "const fPixEl = document.getElementById('formMeusDados');\n  if (fPixEl) fPixEl.addEventListener('submit', async (e) => {"
);

appJs = appJs.replace(
  "document.getElementById('formPlano').addEventListener('submit', async (e) => {",
  "const fPlanoEl = document.getElementById('formPlano');\n  if (fPlanoEl) fPlanoEl.addEventListener('submit', async (e) => {"
);

appJs = appJs.replace(
  "document.getElementById('formApp').addEventListener('submit', async (e) => {",
  "const fAppEl = document.getElementById('formApp');\n  if (fAppEl) fAppEl.addEventListener('submit', async (e) => {"
);

appJs = appJs.replace(
  "document.getElementById('formServidor').addEventListener('submit', async (e) => {",
  "const fSrvEl = document.getElementById('formServidor');\n  if (fSrvEl) fSrvEl.addEventListener('submit', async (e) => {"
);

// Ensure functions are assigned to window immediately when defined
const windowExposuresTop = `
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.switchTab = switchTab;
window.abrirModalNovoPlano = abrirModalNovoPlano;
window.editarPlano = editarPlano;
window.deletarPlano = deletarPlano;
window.fecharModalPlano = fecharModalPlano;
window.copiarPromoPlano = copiarPromoPlano;
window.criarCobrancaDePlano = criarCobrancaDePlano;
window.abrirModalNovoApp = abrirModalNovoApp;
window.editarApp = editarApp;
window.deletarApp = deletarApp;
window.fecharModalApp = fecharModalApp;
window.abrirModalNovoServidor = abrirModalNovoServidor;
window.editarServidor = editarServidor;
window.deletarServidor = deletarServidor;
window.fecharModalServidor = fecharModalServidor;
window.abrirModalNovoCliente = abrirModalNovoCliente;
window.editarCliente = editarCliente;
window.abrirModalNovaCobranca = abrirModalNovaCobranca;
window.abrirModalNovaCobrancaComCliente = abrirModalNovaCobrancaComCliente;
window.darBaixaRapida = darBaixaRapida;
window.abrirModalBaixa = darBaixaRapida;
window.abrirModalBaixaFn = darBaixaRapida;
`;

if (!appJs.includes("window.editarPlano = editarPlano;")) {
  appJs = windowExposuresTop + "\n" + appJs;
} else {
  // Insert at top of global declarations
  appJs = appJs.replace("function startApp() {", windowExposuresTop + "\nfunction startApp() {");
}

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('✅ public/js/app.js updated with safe null checks and top-level window assignments');

// Bump version to v87.0
function updateIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/styles\.css\?v=\d+\.\d+/g, 'styles.css?v=87.0');
  html = html.replace(/app\.js\?v=\d+\.\d+/g, 'app.js?v=87.0');
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Version bumped to v87.0 in ' + filePath);
}

updateIndexHtml('public/index.html');
updateIndexHtml('index.html');
