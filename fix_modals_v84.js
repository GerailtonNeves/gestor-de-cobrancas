const fs = require('fs');

// 1. Update public/js/app.js
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Update abrirModal and fecharModal
const oldAbrirModal = `function abrirModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
    m.removeAttribute('style');
  });
  modal.removeAttribute('style');
  modal.classList.add('active');
}`;

const newAbrirModal = `function abrirModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) {
    console.error('Modal não encontrado:', modalId);
    return;
  }
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
    m.style.display = 'none';
  });
  modal.classList.add('active');
  modal.style.display = 'flex';
}`;

const oldFecharModal = `function fecharModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  modal.classList.remove('active');
  modal.removeAttribute('style');
}`;

const newFecharModal = `function fecharModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
}`;

appJs = appJs.replace(oldAbrirModal, newAbrirModal);
appJs = appJs.replace(oldFecharModal, newFecharModal);

// Update editarPlano
const oldEditarPlano = `function editarPlano(id) {
  const p = globalPlanos.find(item => String(item.id) === String(id));
  if (!p) return;`;

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
  }`;

appJs = appJs.replace(oldEditarPlano, newEditarPlano);

// Update editarApp
const oldEditarApp = `function editarApp(id) {
  const app = globalApps.find(a => String(a.id) === String(id));
  if (!app) return;`;

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
  }`;

appJs = appJs.replace(oldEditarApp, newEditarApp);

// Update editarServidor
const oldEditarServidor = `function editarServidor(id) {
  const srv = globalServidores.find(s => String(s.id) === String(id));
  if (!srv) return;`;

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
  }`;

appJs = appJs.replace(oldEditarServidor, newEditarServidor);

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('✅ public/js/app.js updated');

// 2. Update inline script in public/index.html and index.html
function updateIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Replace head inline abrirModal / fecharModal
  const oldHeadAbrir = `window.abrirModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
        m.removeAttribute('style');
      });
      modal.removeAttribute('style');
      modal.classList.add('active');
    };`;

  const newHeadAbrir = `window.abrirModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
        m.style.display = 'none';
      });
      modal.classList.add('active');
      modal.style.display = 'flex';
    };`;

  const oldHeadFechar = `window.fecharModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      modal.classList.remove('active');
      modal.removeAttribute('style');
    };`;

  const newHeadFechar = `window.fecharModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      modal.classList.remove('active');
      modal.style.display = 'none';
    };`;

  html = html.replace(oldHeadAbrir, newHeadAbrir);
  html = html.replace(oldHeadFechar, newHeadFechar);

  // Bump version to v84.0
  html = html.replace(/styles\.css\?v=\d+\.\d+/g, 'styles.css?v=84.0');
  html = html.replace(/app\.js\?v=\d+\.\d+/g, 'app.js?v=84.0');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Version bumped to v84.0 in ' + filePath);
}

updateIndexHtml('public/index.html');
updateIndexHtml('index.html');
