const fs = require('fs');

// 1. Update server.js to add individual GET endpoints for planos, apps, servidores
let serverCode = fs.readFileSync('server.js', 'utf8');

const getEndpointsCode = `
app.get('/api/planos/:id', (req, res) => {
  const db = getDB();
  const cleanId = String(req.params.id || '').trim().toLowerCase();
  const p = db.planos.find(item => String(item.id).trim().toLowerCase() === cleanId);
  if (!p) return res.status(404).json({ error: "Plano não encontrado" });
  res.json(p);
});

app.get('/api/apps/:id', (req, res) => {
  const db = getDB();
  const cleanId = String(req.params.id || '').trim().toLowerCase();
  const appItem = db.apps.find(item => String(item.id).trim().toLowerCase() === cleanId);
  if (!appItem) return res.status(404).json({ error: "Aplicativo não encontrado" });
  res.json(appItem);
});

app.get('/api/servidores/:id', (req, res) => {
  const db = getDB();
  const cleanId = String(req.params.id || '').trim().toLowerCase();
  const srv = db.servidores.find(item => String(item.id).trim().toLowerCase() === cleanId);
  if (!srv) return res.status(404).json({ error: "Servidor não encontrado" });
  res.json(srv);
});
`;

if (!serverCode.includes("app.get('/api/planos/:id'")) {
  serverCode = serverCode.replace(
    "app.get('/api/planos', (req, res) => {",
    getEndpointsCode + "\napp.get('/api/planos', (req, res) => {"
  );
  fs.writeFileSync('server.js', serverCode, 'utf8');
  console.log('✅ server.js updated with GET /api/planos/:id, /api/apps/:id, /api/servidores/:id');
}

// 2. Update public/js/app.js for editarPlano, editarApp, editarServidor
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

const newEditarPlano = `async function editarPlano(id) {
  const cleanId = String(id || '').trim();
  let p = globalPlanos.find(item => String(item.id).trim() === cleanId);
  if (!p && cleanId) {
    p = globalPlanos.find(item => String(item.id).trim().toLowerCase() === cleanId.toLowerCase());
  }
  if (!p && cleanId) {
    try {
      const res = await fetch(\`/api/planos/\${encodeURIComponent(cleanId)}\`);
      if (res.ok) {
        p = await res.json();
        if (p && p.id) {
          const idx = globalPlanos.findIndex(item => String(item.id).trim() === String(p.id).trim());
          if (idx >= 0) globalPlanos[idx] = p; else globalPlanos.push(p);
        }
      }
    } catch(err) {
      console.error('Erro ao buscar plano por ID:', err);
    }
  }

  if (!p) {
    console.warn('Plano não encontrado para editar ID:', id);
    abrirModalNovoPlano();
    return;
  }

  const pId = document.getElementById('planoId'); if (pId) pId.value = p.id;
  const pTitle = document.getElementById('modalPlanoTitle');
  if (pTitle) pTitle.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Plano de Canais';
  const pNome = document.getElementById('planoNome'); if (pNome) pNome.value = p.nome || '';
  
  const pCat = document.getElementById('planoCategoria');
  if (pCat) {
    pCat.value = p.categoria || 'Plano IPTV';
    if (!pCat.value && p.categoria) {
      const opt = Array.from(pCat.options).find(o => o.value.toLowerCase().includes(String(p.categoria).toLowerCase()));
      if (opt) pCat.value = opt.value;
    }
  }

  const pVal = document.getElementById('planoValidade');
  if (pVal) {
    pVal.value = p.validade || 'Mensal (30 dias)';
    if (!pVal.value && p.validade) {
      const opt = Array.from(pVal.options).find(o => o.value.toLowerCase().includes(String(p.validade).toLowerCase()));
      if (opt) pVal.value = opt.value;
    }
  }

  const pTelas = document.getElementById('planoTelas');
  if (pTelas) {
    pTelas.value = p.telas || '1 Tela';
    if (!pTelas.value && p.telas) {
      const opt = Array.from(pTelas.options).find(o => o.value.includes(String(p.telas)));
      if (opt) pTelas.value = opt.value;
    }
  }

  const pValor = document.getElementById('planoValor'); if (pValor) pValor.value = p.valor || '';
  const pDesc = document.getElementById('planoDesconto'); if (pDesc) pDesc.value = p.desconto || 0;
  const pCor = document.getElementById('planoCorBadge'); if (pCor) pCor.value = p.corBadge || 'neon-green';
  const pDet = document.getElementById('planoDescricao'); if (pDet) pDet.value = p.descricao || '';
  
  if (typeof calcularValorFinalPlanoModal === 'function') calcularValorFinalPlanoModal();
  abrirModal('modalPlano');
}`;

const newEditarApp = `async function editarApp(id) {
  const cleanId = String(id || '').trim();
  let app = globalApps.find(a => String(a.id).trim() === cleanId);
  if (!app && cleanId) {
    app = globalApps.find(a => String(a.id).trim().toLowerCase() === cleanId.toLowerCase());
  }
  if (!app && cleanId) {
    try {
      const res = await fetch(\`/api/apps/\${encodeURIComponent(cleanId)}\`);
      if (res.ok) {
        app = await res.json();
        if (app && app.id) {
          const idx = globalApps.findIndex(a => String(a.id).trim() === String(app.id).trim());
          if (idx >= 0) globalApps[idx] = app; else globalApps.push(app);
        }
      }
    } catch(err) {
      console.error('Erro ao buscar app por ID:', err);
    }
  }

  if (!app) {
    console.warn('App não encontrado para editar ID:', id);
    abrirModalNovoApp();
    return;
  }

  const aId = document.getElementById('appId'); if (aId) aId.value = app.id;
  const aTitle = document.getElementById('modalAppTitle');
  if (aTitle) aTitle.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Aplicativo';
  const aNome = document.getElementById('appNome'); if (aNome) aNome.value = app.nome || '';
  const aCat = document.getElementById('appCategoria'); if (aCat) aCat.value = app.categoria || '';
  const aDesc = document.getElementById('appDescricao'); if (aDesc) aDesc.value = app.descricao || '';

  abrirModal('modalApp');
}`;

const newEditarServidor = `async function editarServidor(id) {
  const cleanId = String(id || '').trim();
  let srv = globalServidores.find(s => String(s.id).trim() === cleanId);
  if (!srv && cleanId) {
    srv = globalServidores.find(s => String(s.id).trim().toLowerCase() === cleanId.toLowerCase());
  }
  if (!srv && cleanId) {
    try {
      const res = await fetch(\`/api/servidores/\${encodeURIComponent(cleanId)}\`);
      if (res.ok) {
        srv = await res.json();
        if (srv && srv.id) {
          const idx = globalServidores.findIndex(s => String(s.id).trim() === String(srv.id).trim());
          if (idx >= 0) globalServidores[idx] = srv; else globalServidores.push(srv);
        }
      }
    } catch(err) {
      console.error('Erro ao buscar servidor por ID:', err);
    }
  }

  if (!srv) {
    console.warn('Servidor não encontrado para editar ID:', id);
    abrirModalNovoServidor();
    return;
  }

  const sId = document.getElementById('servidorId'); if (sId) sId.value = srv.id;
  const sTitle = document.getElementById('modalServidorTitle');
  if (sTitle) sTitle.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Servidor';
  const sNome = document.getElementById('servidorNome'); if (sNome) sNome.value = srv.nome || '';
  const sCat = document.getElementById('servidorCategoria'); if (sCat) sCat.value = srv.categoria || '';
  const sDesc = document.getElementById('servidorDescricao'); if (sDesc) sDesc.value = srv.descricao || '';

  abrirModal('modalServidor');
}`;

appJs = appJs.replace(/function editarPlano\(id\) \{[\s\S]*?\n\}/, newEditarPlano);
appJs = appJs.replace(/function editarApp\(id\) \{[\s\S]*?\n\}/, newEditarApp);
appJs = appJs.replace(/function editarServidor\(id\) \{[\s\S]*?\n\}/, newEditarServidor);

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('✅ public/js/app.js updated with async edit functions');

// Bump version to v86.0
function updateIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/styles\.css\?v=\d+\.\d+/g, 'styles.css?v=86.0');
  html = html.replace(/app\.js\?v=\d+\.\d+/g, 'app.js?v=86.0');
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Version bumped to v86.0 in ' + filePath);
}

updateIndexHtml('public/index.html');
updateIndexHtml('index.html');
