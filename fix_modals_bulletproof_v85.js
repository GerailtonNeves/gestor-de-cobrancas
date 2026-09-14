const fs = require('fs');

// 1. Update public/js/app.js
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Replace abrirModal function with absolute bulletproof inline styling
const newAbrirModalCode = `function abrirModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) {
    console.error('Modal não encontrado:', modalId);
    return;
  }
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
    m.style.display = 'none';
    m.style.opacity = '0';
    m.style.visibility = 'hidden';
    m.style.pointerEvents = 'none';
  });
  modal.classList.add('active');
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
  modal.style.pointerEvents = 'auto';

  const modalBox = modal.querySelector('.modal-box');
  if (modalBox) {
    modalBox.style.display = 'block';
    modalBox.style.opacity = '1';
    modalBox.style.visibility = 'visible';
    modalBox.style.transform = 'translateY(0)';
  }
}`;

const newFecharModalCode = `function fecharModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
  modal.style.opacity = '0';
  modal.style.visibility = 'hidden';
  modal.style.pointerEvents = 'none';

  const modalBox = modal.querySelector('.modal-box');
  if (modalBox) {
    modalBox.style.opacity = '0';
    modalBox.style.visibility = 'hidden';
  }
}`;

// Replace abrirModal and fecharModal in app.js
appJs = appJs.replace(/function abrirModal\(modalId\) \{[\s\S]*?\n\}/, newAbrirModalCode);
appJs = appJs.replace(/function fecharModal\(modalId\) \{[\s\S]*?\n\}/, newFecharModalCode);

// Ensure abrirModalNovoPlano, abrirModalNovoApp, abrirModalNovoServidor are bulletproof
const newAbrirModalNovoPlano = `function abrirModalNovoPlano() {
  const pId = document.getElementById('planoId'); if (pId) pId.value = '';
  const pTitle = document.getElementById('modalPlanoTitle');
  if (pTitle) pTitle.innerHTML = '<i class="fa-solid fa-tv" style="color: var(--neon-blue);"></i> Cadastrar Novo Plano de Canais';
  const fPlano = document.getElementById('formPlano'); if (fPlano) fPlano.reset();
  if (document.getElementById('planoDesconto')) document.getElementById('planoDesconto').value = '0.00';
  if (typeof calcularValorFinalPlanoModal === 'function') calcularValorFinalPlanoModal();
  abrirModal('modalPlano');
}`;

const newAbrirModalNovoApp = `function abrirModalNovoApp() {
  const aId = document.getElementById('appId'); if (aId) aId.value = '';
  const aTitle = document.getElementById('modalAppTitle');
  if (aTitle) aTitle.innerHTML = '<i class="fa-solid fa-mobile-screen-button" style="color: var(--neon-blue);"></i> Cadastrar Aplicativo / App';
  const fApp = document.getElementById('formApp'); if (fApp) fApp.reset();
  abrirModal('modalApp');
}`;

const newAbrirModalNovoServidor = `function abrirModalNovoServidor() {
  const sId = document.getElementById('servidorId'); if (sId) sId.value = '';
  const sTitle = document.getElementById('modalServidorTitle');
  if (sTitle) sTitle.innerHTML = '<i class="fa-solid fa-server" style="color: var(--emerald-primary);"></i> Cadastrar Servidor / Painel';
  const fSrv = document.getElementById('formServidor'); if (fSrv) fSrv.reset();
  abrirModal('modalServidor');
}`;

appJs = appJs.replace(/function abrirModalNovoPlano\(\) \{[\s\S]*?\n\}/, newAbrirModalNovoPlano);
appJs = appJs.replace(/function abrirModalNovoApp\(\) \{[\s\S]*?\n\}/, newAbrirModalNovoApp);
appJs = appJs.replace(/function abrirModalNovoServidor\(\) \{[\s\S]*?\n\}/, newAbrirModalNovoServidor);

// Ensure editarPlano, editarApp, editarServidor are bulletproof
const newEditarPlano = `function editarPlano(id) {
  const cleanId = String(id || '').trim();
  let p = globalPlanos.find(item => String(item.id).trim() === cleanId);
  if (!p && cleanId) {
    p = globalPlanos.find(item => String(item.id).trim().toLowerCase() === cleanId.toLowerCase());
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

const newEditarApp = `function editarApp(id) {
  const cleanId = String(id || '').trim();
  let app = globalApps.find(a => String(a.id).trim() === cleanId);
  if (!app && cleanId) {
    app = globalApps.find(a => String(a.id).trim().toLowerCase() === cleanId.toLowerCase());
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

const newEditarServidor = `function editarServidor(id) {
  const cleanId = String(id || '').trim();
  let srv = globalServidores.find(s => String(s.id).trim() === cleanId);
  if (!srv && cleanId) {
    srv = globalServidores.find(s => String(s.id).trim().toLowerCase() === cleanId.toLowerCase());
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
console.log('✅ public/js/app.js updated');

// 2. Update inline script in public/index.html and index.html
function updateIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  const newHeadAbrir = `window.abrirModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
        m.style.display = 'none';
        m.style.opacity = '0';
        m.style.visibility = 'hidden';
        m.style.pointerEvents = 'none';
      });
      modal.classList.add('active');
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.style.pointerEvents = 'auto';

      const modalBox = modal.querySelector('.modal-box');
      if (modalBox) {
        modalBox.style.display = 'block';
        modalBox.style.opacity = '1';
        modalBox.style.visibility = 'visible';
        modalBox.style.transform = 'translateY(0)';
      }
    };`;

  const newHeadFechar = `window.fecharModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';

      const modalBox = modal.querySelector('.modal-box');
      if (modalBox) {
        modalBox.style.opacity = '0';
        modalBox.style.visibility = 'hidden';
      }
    };`;

  html = html.replace(/window\.abrirModal = function\(modalId\) \{[\s\S]*?\};/, newHeadAbrir);
  html = html.replace(/window\.fecharModal = function\(modalId\) \{[\s\S]*?\};/, newHeadFechar);

  // Bump version to v85.0
  html = html.replace(/styles\.css\?v=\d+\.\d+/g, 'styles.css?v=85.0');
  html = html.replace(/app\.js\?v=\d+\.\d+/g, 'app.js?v=85.0');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Version bumped to v85.0 in ' + filePath);
}

updateIndexHtml('public/index.html');
updateIndexHtml('index.html');
