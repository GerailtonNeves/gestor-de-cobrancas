const fs = require('fs');

// 1. Update server.js
let serverCode = fs.readFileSync('server.js', 'utf8');

serverCode = serverCode.replace(
  "app.post('/api/cobrancas/:id/dar-baixa', async (req, res) => {",
  "app.post(['/api/cobrancas/:id/dar-baixa', '/api/cobrancas/dar-baixa'], async (req, res) => {"
);

serverCode = serverCode.replace(
  "const targetId = req.params.id !== 'undefined' && req.params.id !== 'null' ? req.params.id : (req.body.cobrancaId || req.body.clienteId);",
  `const rawId = req.params.id;
  const targetId = (rawId && rawId !== 'undefined' && rawId !== 'null' && rawId !== 'dar-baixa')
    ? rawId
    : (req.body.cobrancaId || req.body.clienteId || req.body.id);`
);

fs.writeFileSync('server.js', serverCode, 'utf8');
console.log('✅ server.js updated');

// 2. Update public/js/app.js
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

const oldDomLoaded = `document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMobileMenu();
  loadAllData();
  setupForms();
  
  // Polling para checagem de envios automáticos, status do WhatsApp e dashboard
  setInterval(checkAlertasPendentes, 5000);
  setInterval(checkWhatsAppStatus, 3000);
  checkWhatsAppStatus();
});`;

const newDomLoaded = `function startApp() {
  initTabs();
  initMobileMenu();
  loadAllData();
  setupForms();
  
  setInterval(checkAlertasPendentes, 5000);
  setInterval(checkWhatsAppStatus, 3000);
  checkWhatsAppStatus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}`;

if (appJs.includes(oldDomLoaded)) {
  appJs = appJs.replace(oldDomLoaded, newDomLoaded);
  console.log('✅ app.js startApp replaced');
} else {
  console.log('⚠️ oldDomLoaded pattern not matched directly, checking...');
}

const oldDarBaixaRapida = `async function darBaixaRapida(id) {
  let cleanId = (id && typeof id === 'string') ? id.trim() : (typeof id === 'number' ? String(id) : null);
  let cob = cleanId ? globalCobrancas.find(c => c.id === cleanId) : null;
  let cli = null;
  if (cob) {
    cli = globalClientes.find(c => c.id === cob.clienteId);
  } else if (cleanId) {
    cli = globalClientes.find(c => c.id === cleanId);
    if (cli) {
      cob = globalCobrancas.find(c => c.clienteId === cli.id && c.status === 'PENDENTE');
    }
  }

  if (!cob && globalCobrancas.length > 0) {
    cob = globalCobrancas.find(c => c.status === 'PENDENTE') || globalCobrancas[0];
    if (cob) cli = globalClientes.find(c => c.id === cob.clienteId);
  }

  const targetId = cob ? cob.id : (cli ? cli.id : (cleanId || ''));`;

const newDarBaixaRapida = `async function darBaixaRapida(id) {
  let cleanId = (id && typeof id === 'string') ? id.trim() : (typeof id === 'number' ? String(id) : null);
  let cob = cleanId ? globalCobrancas.find(c => c.id === cleanId) : null;
  let cli = null;
  if (cob) {
    cli = globalClientes.find(c => c.id === cob.clienteId);
  } else if (cleanId) {
    cli = globalClientes.find(c => c.id === cleanId);
    if (cli) {
      cob = globalCobrancas.find(c => c.clienteId === cli.id && c.status === 'PENDENTE');
    }
  }

  if (!cob && globalCobrancas.length > 0) {
    cob = globalCobrancas.find(c => c.status === 'PENDENTE') || globalCobrancas[0];
    if (cob) cli = globalClientes.find(c => c.id === cob.clienteId);
  }

  if (!cob && !cli && !cleanId) {
    Swal.fire({
      icon: 'warning',
      title: 'Nenhuma Cobrança Selecionada',
      text: 'Selecione uma cobrança ou cliente pendente para dar baixa.',
      background: '#FFFFFF',
      color: '#000000'
    });
    return;
  }

  const targetId = cob ? cob.id : (cli ? cli.id : (cleanId || ''));`;

if (appJs.includes(oldDarBaixaRapida)) {
  appJs = appJs.replace(oldDarBaixaRapida, newDarBaixaRapida);
  console.log('✅ darBaixaRapida updated with guard clause');
}

const oldFetchDarBaixa = `      const res = await fetch(\`/api/cobrancas/\${targetId}/dar-baixa\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proximoVencimento: proxIso,
          observacao: 'Baixa efetuada com sucesso pelo painel',
          enviarNotificacaoWhatsApp: true
        })
      });
      const data = await res.json();`;

const newFetchDarBaixa = `      const url = targetId ? \`/api/cobrancas/\${targetId}/dar-baixa\` : '/api/cobrancas/dar-baixa';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cobrancaId: targetId,
          proximoVencimento: proxIso,
          observacao: 'Baixa efetuada com sucesso pelo painel',
          enviarNotificacaoWhatsApp: true
        })
      });
      let data = {};
      try {
        data = await res.json();
      } catch(parseErr) {
        data = { success: false, error: 'Erro ao ler resposta do servidor.' };
      }`;

if (appJs.includes(oldFetchDarBaixa)) {
  appJs = appJs.replace(oldFetchDarBaixa, newFetchDarBaixa);
  console.log('✅ fetch in darBaixaRapida updated to handle empty targetId and parse errors');
}

const oldFormBaixa = `  // 3. Form Baixa
  document.getElementById('formBaixa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('baixaCobrancaId').value;
    const bodyData = {
      dataPagamento: document.getElementById('baixaData').value,
      proximoVencimento: document.getElementById('baixaProximoVencimento').value,
      observacao: document.getElementById('baixaObservacao').value,
      enviarNotificacaoWhatsApp: document.getElementById('baixaEnviarWhatsApp').checked
    };

    try {
      const res = await fetch(\`/api/cobrancas/\${id}/dar-baixa\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (res.ok && data.success) {`;

const newFormBaixa = `  // 3. Form Baixa
  document.getElementById('formBaixa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('baixaCobrancaId').value;
    const bodyData = {
      cobrancaId: id,
      dataPagamento: document.getElementById('baixaData').value,
      proximoVencimento: document.getElementById('baixaProximoVencimento').value,
      observacao: document.getElementById('baixaObservacao').value,
      enviarNotificacaoWhatsApp: document.getElementById('baixaEnviarWhatsApp').checked
    };

    try {
      const url = id ? \`/api/cobrancas/\${id}/dar-baixa\` : '/api/cobrancas/dar-baixa';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      let data = {};
      try {
        data = await res.json();
      } catch(parseErr) {
        data = { success: false, error: 'Resposta inválida do servidor.' };
      }

      if (res.ok && data.success) {`;

if (appJs.includes(oldFormBaixa)) {
  appJs = appJs.replace(oldFormBaixa, newFormBaixa);
  console.log('✅ formBaixa submit handler updated');
}

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('✅ public/js/app.js written');

function bumpVersions(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/styles\.css\?v=82\.0/g, 'styles.css?v=83.0');
  html = html.replace(/app\.js\?v=82\.0/g, 'app.js?v=83.0');
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Version bumped to v83.0 in ' + filePath);
}

bumpVersions('public/index.html');
bumpVersions('index.html');
