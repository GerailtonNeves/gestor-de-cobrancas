const fs = require('fs');

// 1. Update public/css/styles.css for bulletproof CSS modal rules
let css = fs.readFileSync('public/css/styles.css', 'utf8');

const oldModalCss = `/* Modal Customization */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(4, 8, 16, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s ease, visibility 0.25s ease;
  padding: 1rem;
}

.modal-overlay.active {
  display: flex !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

.modal-box {
  background: var(--bg-secondary);
  border: 1px solid var(--neon-blue);
  border-radius: 20px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.25);
  transform: translateY(20px);
  transition: transform 0.25s ease;
  overflow: hidden;
  position: relative;
  z-index: 1000000;
}

.modal-overlay.active .modal-box {
  transform: translateY(0);
  opacity: 1 !important;
  visibility: visible !important;
}`;

const newModalCss = `/* Modal Customization Bulletproof */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(4, 8, 16, 0.82);
  backdrop-filter: blur(10px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s ease, visibility 0.25s ease;
  padding: 1rem;
}

.modal-overlay.active {
  display: flex !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

.modal-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transform: translateY(20px);
  transition: transform 0.25s ease;
  overflow: hidden;
  position: relative;
  z-index: 1000000;
  opacity: 0;
  visibility: hidden;
}

.modal-overlay.active .modal-box {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateY(0) !important;
}`;

if (css.includes('.modal-overlay {')) {
  // Replace the modal overlay section cleanly
  const startIdx = css.indexOf('/* Modal Customization');
  const endIdx = css.indexOf('.modal-header {');
  if (startIdx !== -1 && endIdx !== -1) {
    css = css.substring(0, startIdx) + newModalCss + '\n\n' + css.substring(endIdx);
  }
}

fs.writeFileSync('public/css/styles.css', css);

// 2. Update head inline script in public/index.html & index.html
let html = fs.readFileSync('public/index.html', 'utf8');

const oldHeadScript = `    window.abrirModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
        m.style.setProperty('display', 'none', 'important');
        m.style.setProperty('opacity', '0', 'important');
        m.style.setProperty('visibility', 'hidden', 'important');
        m.style.setProperty('pointer-events', 'none', 'important');
        const b = m.querySelector('.modal-box');
        if (b) {
          b.style.setProperty('opacity', '0', 'important');
          b.style.setProperty('visibility', 'hidden', 'important');
        }
      });
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      modal.classList.add('active');
      const box = modal.querySelector('.modal-box');
      if (box) {
        box.style.setProperty('display', 'block', 'important');
        box.style.setProperty('opacity', '1', 'important');
        box.style.setProperty('visibility', 'visible', 'important');
        box.style.setProperty('transform', 'translateY(0)', 'important');
      }
    };

    window.fecharModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('pointer-events', 'none', 'important');
      const box = modal.querySelector('.modal-box');
      if (box) {
        box.style.setProperty('opacity', '0', 'important');
        box.style.setProperty('visibility', 'hidden', 'important');
        box.style.setProperty('transform', 'translateY(20px)', 'important');
      }
    };`;

const newHeadScript = `    window.abrirModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
        m.removeAttribute('style');
      });
      modal.removeAttribute('style');
      modal.classList.add('active');
    };

    window.fecharModal = function(modalId) {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!modal) return;
      modal.classList.remove('active');
      modal.removeAttribute('style');
    };`;

if (html.includes('window.abrirModal = function')) {
  const hStart = html.indexOf('window.abrirModal = function');
  const hEnd = html.indexOf('window.abrirModalNovoPlano = function');
  if (hStart !== -1 && hEnd !== -1) {
    html = html.substring(0, hStart) + newHeadScript + '\n\n    ' + html.substring(hEnd);
  }
}

// Clean up button onclick handlers in HTML to simply call function
html = html.replace(/onclick="if \(typeof abrirModalNovoPlano === 'function'\) \{ abrirModalNovoPlano\(\); \} else \{ abrirModal\('modalPlano'\); \}"/g, 'onclick="abrirModalNovoPlano()"');
html = html.replace(/onclick="if \(typeof abrirModalNovoApp === 'function'\) \{ abrirModalNovoApp\(\); \} else \{ abrirModal\('modalApp'\); \}"/g, 'onclick="abrirModalNovoApp()"');
html = html.replace(/onclick="if \(typeof abrirModalNovoServidor === 'function'\) \{ abrirModalNovoServidor\(\); \} else \{ abrirModal\('modalServidor'\); \}"/g, 'onclick="abrirModalNovoServidor()"');

fs.writeFileSync('public/index.html', html);
fs.writeFileSync('index.html', html);

// 3. Update app.js abrirModal and fecharModal
let js = fs.readFileSync('public/js/app.js', 'utf8');

const oldJsModal = `function abrirModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;

  // Fechar qualquer outro modal ativo
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
    m.style.setProperty('display', 'none', 'important');
    m.style.setProperty('opacity', '0', 'important');
    m.style.setProperty('visibility', 'hidden', 'important');
    m.style.setProperty('pointer-events', 'none', 'important');
    const b = m.querySelector('.modal-box');
    if (b) {
      b.style.setProperty('opacity', '0', 'important');
      b.style.setProperty('visibility', 'hidden', 'important');
    }
  });

  // Forçar exibição visível do modal solicitado
  modal.style.setProperty('display', 'flex', 'important');
  modal.style.setProperty('opacity', '1', 'important');
  modal.style.setProperty('visibility', 'visible', 'important');
  modal.style.setProperty('pointer-events', 'auto', 'important');
  modal.classList.add('active');

  const box = modal.querySelector('.modal-box');
  if (box) {
    box.style.setProperty('display', 'block', 'important');
    box.style.setProperty('opacity', '1', 'important');
    box.style.setProperty('visibility', 'visible', 'important');
    box.style.setProperty('transform', 'translateY(0)', 'important');
  }
}

function fecharModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;

  modal.classList.remove('active');
  modal.style.setProperty('display', 'none', 'important');
  modal.style.setProperty('opacity', '0', 'important');
  modal.style.setProperty('visibility', 'hidden', 'important');
  modal.style.setProperty('pointer-events', 'none', 'important');

  const box = modal.querySelector('.modal-box');
  if (box) {
    box.style.setProperty('opacity', '0', 'important');
    box.style.setProperty('visibility', 'hidden', 'important');
    box.style.setProperty('transform', 'translateY(20px)', 'important');
  }
}`;

const newJsModal = `function abrirModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
    m.removeAttribute('style');
  });
  modal.removeAttribute('style');
  modal.classList.add('active');
}

function fecharModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  modal.classList.remove('active');
  modal.removeAttribute('style');
}`;

if (js.includes('function abrirModal(modalId) {')) {
  const jStart = js.indexOf('function abrirModal(modalId) {');
  const jEnd = js.indexOf('window.abrirModal = abrirModal;');
  if (jStart !== -1 && jEnd !== -1) {
    js = js.substring(0, jStart) + newJsModal + '\n\n' + js.substring(jEnd);
  }
}

fs.writeFileSync('public/js/app.js', js);

console.log('🎉 Applied Bulletproof Clean Modals system!');
