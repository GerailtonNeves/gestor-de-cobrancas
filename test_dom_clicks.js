const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

let htmlContent = fs.readFileSync('public/index.html', 'utf8');
const jsContent = fs.readFileSync('public/js/app.js', 'utf8');

const dom = new JSDOM(htmlContent, {
  runScripts: "dangerously",
  url: "http://localhost:3030/"
});

const { window } = dom;
const { document } = window;

// Mock Swal
window.Swal = {
  fire: () => Promise.resolve({ isConfirmed: true }),
  showLoading: () => {}
};

// Mock fetch
window.fetch = async (url) => {
  if (url.includes('/api/planos')) {
    return {
      ok: true,
      json: async () => [
        { id: 'plano_1', nome: 'Plano De Canais 1 Telas', categoria: 'Plano IPTV', valor: 35, validade: 'Mensal', telas: '1 Tela', descricao: 'Desc' }
      ]
    };
  }
  if (url.includes('/api/apps')) {
    return {
      ok: true,
      json: async () => [
        { id: 'app_1', nome: 'Bleessd Player', categoria: 'Smart TV', descricao: 'Desc' }
      ]
    };
  }
  if (url.includes('/api/servidores')) {
    return {
      ok: true,
      json: async () => [
        { id: 'srv_1', nome: 'Servidor: X3', categoria: 'Servidor Principal', descricao: 'Desc' }
      ]
    };
  }
  return { ok: true, json: async () => [] };
};

// Execute app.js in window
const scriptEl = document.createElement("script");
scriptEl.textContent = jsContent;
document.body.appendChild(scriptEl);

function checkModalState(modalId) {
  const m = document.getElementById(modalId);
  if (!m) return `MODAL NOT FOUND: ${modalId}`;
  return `ID: ${modalId} | display: "${m.style.display}" | active: ${m.classList.contains('active')} | opacity: "${m.style.opacity}" | visibility: "${m.style.visibility}"`;
}

console.log('\n--- INITIAL STATE ---');
console.log(checkModalState('modalPlano'));
console.log(checkModalState('modalApp'));
console.log(checkModalState('modalServidor'));

console.log('\n--- SIMULATING CLICK: btnNovoPlano ---');
const btnPlano = document.getElementById('btnNovoPlano');
if (btnPlano) {
  btnPlano.click();
  console.log('After btnNovoPlano click:', checkModalState('modalPlano'));
} else {
  console.error('btnNovoPlano not found!');
}

console.log('\n--- SIMULATING CLICK: btnNovoApp ---');
const btnApp = document.getElementById('btnNovoApp');
if (btnApp) {
  btnApp.click();
  console.log('After btnNovoApp click:', checkModalState('modalApp'));
} else {
  console.error('btnNovoApp not found!');
}

console.log('\n--- SIMULATING CLICK: btnNovoServidor ---');
const btnSrv = document.getElementById('btnNovoServidor');
if (btnSrv) {
  btnSrv.click();
  console.log('After btnNovoServidor click:', checkModalState('modalServidor'));
} else {
  console.error('btnNovoServidor not found!');
}

console.log('\n--- SIMULATING FUNCTION CALL: editarPlano("plano_1") ---');
try {
  window.editarPlano('plano_1');
  console.log('After editarPlano("plano_1"):', checkModalState('modalPlano'));
} catch(e) {
  console.error('Error in editarPlano:', e.message);
}

console.log('\n--- SIMULATING FUNCTION CALL: editarApp("app_1") ---');
try {
  window.editarApp('app_1');
  console.log('After editarApp("app_1"):', checkModalState('modalApp'));
} catch(e) {
  console.error('Error in editarApp:', e.message);
}

console.log('\n--- SIMULATING FUNCTION CALL: editarServidor("srv_1") ---');
try {
  window.editarServidor('srv_1');
  console.log('After editarServidor("srv_1"):', checkModalState('modalServidor'));
} catch(e) {
  console.error('Error in editarServidor:', e.message);
}
