const fs = require('fs');

// 1. Update public/js/app.js
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Ensure all "Editar" buttons have type="button"
appJs = appJs.replace(
  `onclick="editarPlano('\${plano.id}')"`,
  `type="button" onclick="editarPlano('\${plano.id}')"`
);
appJs = appJs.replace(
  `onclick="editarApp('\${app.id}')"`,
  `type="button" onclick="editarApp('\${app.id}')"`
);
appJs = appJs.replace(
  `onclick="editarServidor('\${srv.id}')"`,
  `type="button" onclick="editarServidor('\${srv.id}')"`
);

// Ensure abrirModal force sets style attributes
const abrirModalFinal = `function abrirModal(modalId) {
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

const fecharModalFinal = `function fecharModal(modalId) {
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

appJs = appJs.replace(/function abrirModal\(modalId\) \{[\s\S]*?\n\}/, abrirModalFinal);
appJs = appJs.replace(/function fecharModal\(modalId\) \{[\s\S]*?\n\}/, fecharModalFinal);

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('✅ public/js/app.js updated with v90.0 fixes');

// 2. Update public/sw.js
const swContent = `self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
`;
fs.writeFileSync('public/sw.js', swContent, 'utf8');
if (fs.existsSync('sw.js')) fs.writeFileSync('sw.js', swContent, 'utf8');
console.log('✅ sw.js updated to bypass and purge all static caches');

// 3. Update public/index.html and index.html
function updateIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Head unregister script
  const headCacheKill = `<script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let r of registrations) { r.unregister(); }
      }).catch(function(e) {});
    }
    if (window.caches) {
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
      }).catch(function(e) {});
    }

    window.abrirModal = function(modalId) {
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
    };

    window.fecharModal = function(modalId) {
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
    };
  </script>`;

  html = html.replace(/<script>[\s\S]*?window\.fecharModal = function[\s\S]*?<\/script>/, headCacheKill);

  // Bump version to v90.0
  html = html.replace(/styles\.css\?v=\d+\.\d+/g, 'styles.css?v=90.0');
  html = html.replace(/app\.js\?v=\d+\.\d+/g, 'app.js?v=90.0');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Version bumped to v90.0 in ' + filePath);
}

updateIndexHtml('public/index.html');
updateIndexHtml('index.html');
