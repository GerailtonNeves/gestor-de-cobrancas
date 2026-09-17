// State Global da Aplicação
let globalClientes = [];
let globalCobrancas = [];
let globalPlanos = [];
let globalApps = [];
let globalServidores = [];
let globalModelosMensagens = [];
let globalMeusDados = {};
let financeChartInstance = null;

// Helpers robustos de formato de data e hora para inputs HTML5 (compatível com iOS/Android WebKit)
function formatDateForInput(dateVal) {
  if (!dateVal) return '';
  let str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.split('T')[0].split(' ')[0];
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const parts = str.split('/');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return str;
}

function formatDateTimeForInput(dateVal) {
  if (!dateVal) return '';
  let str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    return str.substring(0, 16);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.split(/[ T]/);
    const datePart = parts[0];
    const timePart = (parts[1] || '12:00').substring(0, 5);
    return `${datePart}T${timePart}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const parts = str.split(' ');
    const dParts = parts[0].split('/');
    const timePart = (parts[1] || '12:00').substring(0, 5);
    return `${dParts[2]}-${dParts[1]}-${dParts[0]}T${timePart}`;
  }
  return str;
}

// Helper universal para visibilidade de Modals no Celular e Computador
function abrirModal(modalId) {
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
}
window.abrirModal = abrirModal;

function fecharModal(modalId) {
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
}
window.fecharModal = fecharModal;

window.switchTab = switchTab;

window.abrirModalNovoPlano = function() {
  try {
    const pId = document.getElementById('planoId'); if (pId) pId.value = '';
    const fPlano = document.getElementById('formPlano'); if (fPlano) fPlano.reset();
    if (document.getElementById('planoDesconto')) document.getElementById('planoDesconto').value = '0.00';
    if (typeof calcularValorFinalPlanoModal === 'function') calcularValorFinalPlanoModal();
  } catch(e) { console.error('Erro reset plano:', e); }
  abrirModal('modalPlano');
};

window.abrirModalNovoApp = function() {
  try {
    const aId = document.getElementById('appId'); if (aId) aId.value = '';
    const fApp = document.getElementById('formApp'); if (fApp) fApp.reset();
  } catch(e) { console.error('Erro reset app:', e); }
  abrirModal('modalApp');
};

window.abrirModalNovoServidor = function() {
  try {
    const sId = document.getElementById('servidorId'); if (sId) sId.value = '';
    const fSrv = document.getElementById('formServidor'); if (fSrv) fSrv.reset();
  } catch(e) { console.error('Erro reset servidor:', e); }
  abrirModal('modalServidor');
};

window.abrirModalNovoCliente = function() {
  try {
    const cId = document.getElementById('clienteId'); if (cId) cId.value = '';
    const fCli = document.getElementById('formCliente'); if (fCli) fCli.reset();
  } catch(e) { console.error('Erro reset cliente:', e); }
  abrirModal('modalCliente');
};

window.abrirModalNovaCobranca = function() {
  try {
    const cobId = document.getElementById('cobrancaId'); if (cobId) cobId.value = '';
    const fCob = document.getElementById('formCobranca'); if (fCob) fCob.reset();
  } catch(e) { console.error('Erro reset cobranca:', e); }
  abrirModal('modalCobranca');
};

window.fecharModalPlano = function() { fecharModal('modalPlano'); };
window.fecharModalApp = function() { fecharModal('modalApp'); };
window.fecharModalServidor = function() { fecharModal('modalServidor'); };
window.fecharModalCliente = function() { fecharModal('modalCliente'); };
window.fecharModalCobranca = function() { fecharModal('modalCobranca'); };
window.fecharModalBaixa = function() { fecharModal('modalBaixa'); };

let reciboAtual = null;

function gerarReciboHtml(data) {
  const dtPagtoBr = data.dataPagamento ? (data.dataPagamento.includes('T') ? data.dataPagamento.split('T')[0].split('-').reverse().join('/') : data.dataPagamento.split('-').reverse().join('/')) : '-';
  const dtVencBr = data.dataVencimento ? (data.dataVencimento.includes('T') ? data.dataVencimento.split('T')[0].split('-').reverse().join('/') : data.dataVencimento.split('-').reverse().join('/')) : '-';
  const dtProxBr = (data.proximoVencimento && data.proximoVencimento !== '-') ? (data.proximoVencimento.includes('T') ? data.proximoVencimento.split('T')[0].split('-').reverse().join('/') : data.proximoVencimento.split('-').reverse().join('/')) : '-';

  const empresa = data.empresa || {};
  const nomeEmpresa = empresa.nomeTitular || 'Gestor de Cobranças';

  return `
    <div class="recibo-card" id="reciboPrintArea" style="background: #FFFFFF; border-radius: 12px; border: 1px solid #CBD5E1; padding: 1.5rem; color: #000000; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative;">
      
      <div class="recibo-header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 1rem; margin-bottom: 1.25rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 900; color: #059669; margin: 0 0 0.25rem 0;">📄 RECIBO DE PAGAMENTO</h2>
          <div style="font-size: 0.85rem; color: #475569; font-weight: 700;">Comprovante de Quitação & Renovação</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.85rem; font-weight: 800; color: #0F172A;">Nº RECIBO</div>
          <div style="font-size: 1.1rem; font-weight: 900; color: #059669; font-family: monospace;">${data.idRecibo || 'REC-0000'}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #F1F5F9; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0; margin-bottom: 1.25rem;">
        <div>
          <span style="font-size: 0.75rem; color: #64748B; font-weight: 800; text-transform: uppercase;">CLIENTE</span>
          <div style="font-size: 1.05rem; font-weight: 800; color: #0F172A; margin-top: 0.15rem;">${data.clienteNome || '-'}</div>
          <div style="font-size: 0.85rem; color: #059669; font-weight: 700; margin-top: 0.15rem;"><i class="fa-brands fa-whatsapp"></i> ${formatPhone(data.clienteTelefone)}</div>
        </div>
        <div>
          <span style="font-size: 0.75rem; color: #64748B; font-weight: 800; text-transform: uppercase;">EMISSOR / PROVEDOR</span>
          <div style="font-size: 1rem; font-weight: 800; color: #0F172A; margin-top: 0.15rem;">${nomeEmpresa}</div>
          ${empresa.banco ? `<div style="font-size: 0.8rem; color: #475569;">${empresa.banco} | ${empresa.tipoChave || 'PIX'}: ${empresa.chavePix || ''}</div>` : ''}
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: #E2E8F0; color: #0F172A; font-weight: 800;">
              <th style="padding: 0.6rem 0.75rem; text-align: left; border-radius: 6px 0 0 6px;">Descrição do Serviço</th>
              <th style="padding: 0.6rem 0.75rem; text-align: center;">Telas</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right; border-radius: 0 6px 6px 0;">Valor Pago</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 0.75rem; font-weight: 700; color: #1E293B;">${data.descricao || 'Renovação Mensal de Plano'}</td>
              <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: #0284C7;">${data.qtdTelas || 1} Tela(s)</td>
              <td style="padding: 0.75rem; text-align: right; font-weight: 900; color: #059669; font-size: 1.1rem;">${formatCurrency(data.valor)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 0.85rem; border-radius: 10px; margin-bottom: 1.25rem;">
        <div>
          <span style="font-size: 0.72rem; color: #047857; font-weight: 800; text-transform: uppercase;">DATA DO PAGAMENTO</span>
          <div style="font-size: 0.95rem; font-weight: 800; color: #065F46; margin-top: 0.1rem;">${dtPagtoBr}</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: #047857; font-weight: 800; text-transform: uppercase;">VENCIMENTO ORIGINAL</span>
          <div style="font-size: 0.95rem; font-weight: 800; color: #065F46; margin-top: 0.1rem;">${dtVencBr}</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: #047857; font-weight: 800; text-transform: uppercase;">PRÓXIMA RENOVAÇÃO</span>
          <div style="font-size: 0.95rem; font-weight: 900; color: #0284C7; margin-top: 0.1rem;">${dtProxBr}</div>
        </div>
      </div>

      <div class="recibo-stamp" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #CBD5E1; padding-top: 1rem;">
        <div style="font-size: 0.8rem; color: #64748B;">
          <div><strong>Status:</strong> <span style="color: #059669; font-weight: 800;">CONFIRMADO E QUITADO</span></div>
          ${data.observacaoBaixa ? `<div style="margin-top: 0.2rem;"><em>Obs: ${data.observacaoBaixa}</em></div>` : ''}
        </div>
        <div style="border: 2px solid #059669; color: #059669; padding: 0.35rem 0.85rem; border-radius: 8px; font-weight: 900; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px; transform: rotate(-3deg); box-shadow: 0 2px 4px rgba(5,150,105,0.15);">
          ✓ PAGO & RENOVADO
        </div>
      </div>

    </div>
  `;
}

window.abrirModalRecibo = async function(cobrancaId) {
  try {
    const container = document.getElementById('modalReciboConteudo');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748B;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #059669;"></i>
          <p style="margin-top: 0.75rem; font-weight: 600;">Carregando recibo digital...</p>
        </div>
      `;
    }
    abrirModal('modalRecibo');

    const res = await fetch(`/api/cobrancas/${cobrancaId}/recibo`);
    if (!res.ok) throw new Error('Não foi possível buscar o recibo.');

    const data = await res.json();
    reciboAtual = data;

    if (container) {
      container.innerHTML = gerarReciboHtml(data);
    }
  } catch (err) {
    console.error('Erro ao carregar recibo:', err);
    Swal.fire({ icon: 'error', title: 'Erro no Recibo', text: err.message || 'Erro ao carregar dados do recibo.', background: '#FFFFFF', color: '#000000' });
    fecharModal('modalRecibo');
  }
};

window.fecharModalRecibo = function() {
  fecharModal('modalRecibo');
};

window.imprimirRecibo = function() {
  if (!reciboAtual) return;
  const content = document.getElementById('reciboPrintArea');
  if (!content) return;

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo - ${reciboAtual.clienteNome}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #fff; padding: 20px; }
        .recibo-card { width: 100%; max-width: 700px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      ${content.outerHTML}
      <script>
        setTimeout(() => { window.print(); window.close(); }, 500);
      </script>
    </body>
    </html>
  `);
  win.document.close();
};

window.enviarReciboWhatsApp = function() {
  if (reciboAtual && reciboAtual.linkWhatsApp) {
    window.open(reciboAtual.linkWhatsApp, '_blank');
  } else {
    Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Nenhum recibo carregado para envio.', background: '#FFFFFF', color: '#000000' });
  }
};

window.abrirModalBaixa = function(id) {
  if (typeof window.abrirModalBaixaFn === 'function') {
    window.abrirModalBaixaFn(id);
  } else {
    if (id && document.getElementById('baixaCobrancaId')) document.getElementById('baixaCobrancaId').value = id;
    abrirModal('modalBaixa');
  }
};


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
window.deletarCliente = deletarCliente;
window.fecharModalCliente = fecharModalCliente;

window.abrirModalNovaCobranca = abrirModalNovaCobranca;
window.abrirModalNovaCobrancaComCliente = abrirModalNovaCobrancaComCliente;
window.editarCobranca = editarCobranca;
window.deletarCobranca = deletarCobranca;
window.fecharModalCobranca = fecharModalCobranca;

window.darBaixaRapida = darBaixaRapida;
window.abrirModalBaixa = darBaixaRapida;
window.abrirModalBaixaFn = darBaixaRapida;
window.fecharModalBaixa = fecharModalBaixa;

function startApp() {
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
}

// -------------------------------------------------------------
// 1. GERENCIADOR DE ABAS & NAVEGAÇÃO
// -------------------------------------------------------------
function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = item.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Esconder todas as abas
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(c => c.style.display = 'none');

  // Remover active dos botões de nav
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(i => i.classList.remove('active'));

  // Ativar aba selecionada
  const targetContent = document.getElementById(`tab-${tabName}`);
  if (targetContent) {
    targetContent.style.display = 'block';
  }

  const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (targetNav) {
    targetNav.classList.add('active');
  }

  // Fechar sidebar mobile se aberta
  document.getElementById('sidebar').classList.remove('mobile-open');

  // Recarregar dados específicos da aba
  if (tabName === 'dashboard') loadDashboardData();
  if (tabName === 'planos') renderCardsPlanos();
  if (tabName === 'apps') renderCardsApps();
  if (tabName === 'servidores') renderCardsServidores();
  if (tabName === 'cobrancas') renderTabelaCobrancas();
  if (tabName === 'contas-recebidas') renderTabelaContasRecebidas();
  if (tabName === 'clientes') renderTabelaClientes();
  if (tabName === 'envios-agendados') renderTabelaEnvios();
  if (tabName === 'whatsapp-qr') checkWhatsAppStatus();
  if (tabName === 'meus-dados') fillFormMeusDados();
  if (tabName === 'modelos-mensagens') fetchModelosMensagens();
  if (tabName === 'configuracoes-admin') loadConfiguracoesAdmin();
}

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}

// -------------------------------------------------------------
// 2. CARREGAMENTO E SINCRONIZAÇÃO DE DADOS
// -------------------------------------------------------------
async function loadAllData() {
  await Promise.all([
    fetchMeusDados(),
    fetchClientes(),
    fetchCobrancas(),
    fetchPlanos(),
    fetchApps(),
    fetchServidores(),
    fetchModelosMensagens(),
    loadConfiguracoesAdmin()
  ]);
  
  loadDashboardData();
  populateClienteSelect();
  populateClientOptionsSelects();
  populateCobrancaOptionsSelects();
}

async function fetchPlanos() {
  try {
    const res = await fetch('/api/planos');
    globalPlanos = await res.json();
    renderCardsPlanos();
    populateClientOptionsSelects();
    populateCobrancaOptionsSelects();
  } catch (err) {
    console.error('Erro ao buscar planos:', err);
  }
}

async function fetchApps() {
  try {
    const res = await fetch('/api/apps');
    globalApps = await res.json();
    renderCardsApps();
    populateClientOptionsSelects();
    populateCobrancaOptionsSelects();
  } catch (err) {
    console.error('Erro ao buscar aplicativos:', err);
  }
}

async function fetchServidores() {
  try {
    const res = await fetch('/api/servidores');
    globalServidores = await res.json();
    renderCardsServidores();
    populateClientOptionsSelects();
    populateCobrancaOptionsSelects();
  } catch (err) {
    console.error('Erro ao buscar servidores:', err);
  }
}

const defaultModelosMensagensFallback = [
  { id: "tpl_lembrete", titulo: "📌 Lembrete de Cobrança (Em Dia)", categoria: "Cobrança" },
  { id: "tpl_vencido", titulo: "⚠️ Notificação de Plano Vencido", categoria: "Atrasados" },
  { id: "tpl_renovacao", titulo: "🎉 Aviso de Renovação (Baixa Quitada)", categoria: "Renovação" },
  { id: "tpl_promocao_indicacao", titulo: "🎁 Promoção: Indique 2 Amigos & Ganhe Mensalidade Grátis", categoria: "Promoções" },
  { id: "tpl_indicacao_desconto", titulo: "🤝 Programa de Indicação (Ganhe Desconto na Próxima Fatura)", categoria: "Indicações" }
];

function getListaModelosParaDropdown() {
  if (Array.isArray(globalModelosMensagens) && globalModelosMensagens.length > 0) {
    return globalModelosMensagens;
  }
  return defaultModelosMensagensFallback;
}

function populateClientOptionsSelects() {
  const selPlano = document.getElementById('cliPlanoId');
  const selSrv = document.getElementById('cliServidorId');
  const selApp = document.getElementById('cliAppId');
  const selModelo = document.getElementById('cliModeloId');

  if (selPlano) {
    selPlano.innerHTML = `<option value="">-- Nenhum Plano Selecionado --</option>` +
      globalPlanos.map(p => {
        const vBruto = p.valor || 0;
        const desc = p.desconto || 0;
        const vFinal = Math.max(0, vBruto - desc);
        const descText = desc > 0 ? ` (Desc. - ${formatCurrency(desc)})` : '';
        return `<option value="${p.id}">${p.nome} - ${formatCurrency(vFinal)}${descText}</option>`;
      }).join('');
  }

  if (selSrv) {
    selSrv.innerHTML = `<option value="">-- Nenhum Servidor --</option>` +
      globalServidores.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  }

  if (selApp) {
    selApp.innerHTML = `<option value="">-- Nenhum App --</option>` +
      globalApps.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
  }

  if (selModelo) {
    const listaMod = getListaModelosParaDropdown();
    selModelo.innerHTML = `<option value="">-- Seleção Automática (Padrão do Sistema) --</option>` +
      listaMod.map(m => `<option value="${m.id}">${m.titulo} (${m.categoria || 'Geral'})</option>`).join('');
  }
}

async function fetchMeusDados() {
  try {
    const res = await fetch('/api/meus-dados');
    globalMeusDados = await res.json();
    updateSidebarPixBadge();
  } catch (err) {
    console.error('Erro ao buscar meus dados:', err);
  }
}

async function fetchClientes() {
  try {
    const res = await fetch('/api/clientes');
    globalClientes = await res.json();
    populateClienteSelect();
    renderTabelaClientes();
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
  }
}

async function fetchCobrancas() {
  try {
    const res = await fetch('/api/cobrancas');
    globalCobrancas = await res.json();
    renderTabelaCobrancas();
    renderTabelaContasRecebidas();
    renderTabelaEnvios();
    renderTabelaProximosVencer();
  } catch (err) {
    console.error('Erro ao buscar cobranças:', err);
  }
}

function updateSidebarPixBadge() {
  const el = document.getElementById('sidebarPixKey');
  if (el) {
    if (globalMeusDados && globalMeusDados.chavePix) {
      el.textContent = `${globalMeusDados.tipoChave || 'PIX'}: ${globalMeusDados.chavePix}`;
    } else {
      el.textContent = 'Não configurado';
    }
  }
}

// -------------------------------------------------------------
// 3. DASHBOARD & GRÁFICOS
// -------------------------------------------------------------
async function loadDashboardData() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();

    document.getElementById('dashTotalPendente').textContent = formatCurrency(data.totalPendente);
    document.getElementById('dashTotalRecebido').textContent = formatCurrency(data.totalRecebido);
    if (document.getElementById('dashTotalAVencer2Dias')) {
      document.getElementById('dashTotalAVencer2Dias').textContent = `${data.countAVencer2Dias || 0} Planos (${formatCurrency(data.totalAVencer2Dias || 0)})`;
    }

    renderFinanceChart(data.totalPendente, data.totalRecebido, data.totalVencido);
    renderProximosEnviosDash();
    renderTabelaProximosVencer();
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

function renderFinanceChart(pendente, recebido, vencido) {
  const ctx = document.getElementById('financeChart');
  if (!ctx || typeof Chart === 'undefined') return;

  if (financeChartInstance) {
    financeChartInstance.destroy();
  }

  financeChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Contas Recebidas', 'A Receber (Pendentes)', 'Vencidas'],
      datasets: [{
        data: [recebido, pendente, vencido],
        backgroundColor: ['#059669', '#0284C7', '#DC2626'],
        borderWidth: 3,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#0F172A', font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } }
        }
      }
    }
  });
}

function renderProximosEnviosDash() {
  const container = document.getElementById('dashProximosEnviosList');
  if (!container) return;

  const pendentesAgendados = globalCobrancas
    .filter(c => c.status === 'PENDENTE' && c.statusEnvio === 'AGENDADO')
    .sort((a, b) => new Date(a.dataHoraEnvio) - new Date(b.dataHoraEnvio))
    .slice(0, 4);

  if (pendentesAgendados.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-brown-muted); padding: 1.5rem 0;">Nenhum envio agendado pendente.</div>`;
    return;
  }

  container.innerHTML = pendentesAgendados.map(cob => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px dashed var(--border-color);">
      <div>
        <div style="font-weight: 700; color: #000000; font-size: 0.9rem;">${cob.clienteNome}</div>
        <div style="font-size: 0.75rem; color: var(--text-brown-muted);">
          <i class="fa-regular fa-clock" style="color: var(--emerald-primary);"></i> ${formatDateTime(cob.dataHoraEnvio)}
        </div>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
        <div style="font-weight: 700; color: var(--emerald-light); font-size: 0.9rem;">${formatCurrency(cob.valor)}</div>
        <div style="display: flex; gap: 0.3rem;">
          <button class="btn-success-sm" onclick="abrirModalBaixa('${cob.id}')" title="Dar Baixa no Recebimento">
            <i class="fa-solid fa-check"></i> Baixa
          </button>
          <button class="btn-whatsapp-sm" onclick="dispararWhatsApp('${cob.id}')" title="Enviar Notificação">
            <i class="fa-brands fa-whatsapp"></i> Enviar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderTabelaProximosVencer() {
  const container = document.getElementById('proximosVencerCardsGrid');
  const dashContainer = document.getElementById('dashProximosVencerList');
  const badgeNav = document.getElementById('navBadgeAVencer');
  const badgeTotal = document.getElementById('badgeTotalProximosVencerCount');

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Filtrar cobranças pendentes (inclui vencidos e a vencer em até 2 dias)
  const proximas = globalCobrancas.filter(cob => {
    if (cob.status !== 'PENDENTE' || !cob.dataVencimento) return false;
    const dateStr = cob.dataVencimento.split('T')[0];
    const parts = dateStr.split('-');
    let venc;
    if (parts.length === 3) {
      venc = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      venc = new Date(dateStr);
    }
    venc.setHours(0, 0, 0, 0);
    const diffDays = Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  });

  // Atualizar contadores
  if (badgeNav) badgeNav.textContent = proximas.length;
  if (badgeTotal) badgeTotal.textContent = `${proximas.length} ${proximas.length === 1 ? 'Plano' : 'Planos'}`;

  // 1. RENDERIZAR PAINEL RESUMIDO NO DASHBOARD
  if (dashContainer) {
    if (proximas.length === 0) {
      dashContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #64748B; padding: 1.5rem; background: #FFFFFF; border-radius: 12px;">
          <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: #10B981; margin-bottom: 0.5rem;"></i>
          <p style="margin: 0; font-weight: 700; color: #0F172A;">Nenhum plano a vencer ou vencido!</p>
        </div>
      `;
    } else {
      dashContainer.innerHTML = proximas.map(cob => {
        const cli = globalClientes.find(c => c.id === cob.clienteId);
        const planoObj = cli ? globalPlanos.find(p => p.id === cli.planoId) : null;

        const dateStr = cob.dataVencimento.split('T')[0];
        const parts = dateStr.split('-');
        const venc = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        venc.setHours(0, 0, 0, 0);
        const diffDays = Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        let rotuloUrgencia = 'Vence em 2 Dias';
        let corUrgencia = '#D97706';
        let bgUrgencia = '#FEF3C7';
        if (diffDays < 0) {
          rotuloUrgencia = `🚨 VENCIDO (${Math.abs(diffDays)}d atrás)`;
          corUrgencia = '#DC2626';
          bgUrgencia = '#FEE2E2';
        } else if (diffDays === 0) {
          rotuloUrgencia = '🚨 VENCE HOJE!';
          corUrgencia = '#DC2626';
          bgUrgencia = '#FEE2E2';
        } else if (diffDays === 1) {
          rotuloUrgencia = '⚠️ VENCE AMANHÃ (1 Dia)';
          corUrgencia = '#D97706';
          bgUrgencia = '#FEF3C7';
        }

        return `
          <div style="background: #FFFFFF; border: 1.5px solid ${corUrgencia}; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem; box-shadow: 0 4px 14px rgba(0,0,0,0.04); transition: transform 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #E2E8F0; padding-bottom: 0.6rem;">
              <strong style="color: #0F172A; font-size: 1rem; font-weight: 800;">${cob.clienteNome}</strong>
              <span class="badge" style="background: ${bgUrgencia}; color: ${corUrgencia}; border: 1.5px solid ${corUrgencia}; font-weight: 900; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 8px;">${rotuloUrgencia}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; color: #334155; font-weight: 700;">
              <span><i class="fa-solid fa-tv" style="color: #0284C7; margin-right: 0.35rem;"></i> ${planoObj ? planoObj.nome : 'Plano IPTV'}</span>
              <strong style="color: #059669; font-size: 1.15rem; font-weight: 900;">${formatCurrency(cob.valor)}</strong>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem;">
              <button class="btn-success-sm" style="flex: 1; justify-content: center; font-size: 0.82rem; padding: 0.5rem; font-weight: 800; border-radius: 10px; background: #059669; color: #FFFFFF;" onclick="abrirModalBaixa('${cob.id}')">
                <i class="fa-solid fa-circle-check"></i> Dar Baixa
              </button>
              <button class="btn-whatsapp-sm" style="flex: 1; justify-content: center; font-size: 0.82rem; padding: 0.5rem; font-weight: 800; border-radius: 10px; background: #25D366; color: #FFFFFF;" onclick="dispararWhatsApp('${cob.id}')">
                <i class="fa-brands fa-whatsapp"></i> Enviar
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 2. RENDERIZAR ABA DEDICADA DE PLANOS PRÓXIMOS A VENCER
  if (container) {
    const filterInput = document.getElementById('filterProximosVencer');
    const query = filterInput ? filterInput.value.toLowerCase().trim() : '';

    const proximasFiltradas = proximas.filter(cob => {
      if (!query) return true;
      const nome = (cob.clienteNome || '').toLowerCase();
      const tel = (cob.clienteTelefone || '').toLowerCase();
      const desc = (cob.descricao || '').toLowerCase();
      return nome.includes(query) || tel.includes(query) || desc.includes(query);
    });

    if (proximasFiltradas.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; background: #FFFFFF; padding: 3rem 1.5rem; border-radius: 16px; border: 1.5px solid #CBD5E1; color: #64748B;">
          <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #10B981; margin-bottom: 1rem;"></i>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #0F172A;">Nenhum plano a vencer ou vencido</h3>
          <p style="font-size: 0.9rem; margin-top: 0.35rem;">Todos os planos dos seus clientes estão em dia ou com vencimentos mais distantes!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = proximasFiltradas.map(cob => {
      const cli = globalClientes.find(c => c.id === cob.clienteId);
      const planoObj = cli ? globalPlanos.find(p => p.id === cli.planoId) : null;

      const dateStr = cob.dataVencimento.split('T')[0];
      const parts = dateStr.split('-');
      const venc = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      venc.setHours(0, 0, 0, 0);
      const diffDays = Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      let rotuloUrgencia = 'Vence em 2 Dias';
      let corUrgencia = '#D97706';
      let bgUrgencia = '#FEF3C7';
      if (diffDays < 0) {
        rotuloUrgencia = `🚨 VENCIDO (${Math.abs(diffDays)}d atrás)`;
        corUrgencia = '#DC2626';
        bgUrgencia = '#FEE2E2';
      } else if (diffDays === 0) {
        rotuloUrgencia = '🚨 VENCE HOJE!';
        corUrgencia = '#DC2626';
        bgUrgencia = '#FEE2E2';
      } else if (diffDays === 1) {
        rotuloUrgencia = '⚠️ VENCE AMANHÃ (1 Dia)';
        corUrgencia = '#D97706';
        bgUrgencia = '#FEF3C7';
      }

      return `
        <div class="card card-hover" style="background: #FFFFFF !important; border: 2px solid ${corUrgencia}; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06); display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem;">
          <div>
            <!-- CABEÇALHO -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 0.85rem;">
              <h3 style="font-size: 1.2rem; font-weight: 900; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 0.55rem;">
                <i class="fa-solid fa-user-circle" style="color: #0284C7;"></i> ${cob.clienteNome}
              </h3>
              <span class="badge" style="background: ${bgUrgencia}; color: ${corUrgencia}; border: 1.5px solid ${corUrgencia}; font-weight: 900; font-size: 0.82rem; padding: 0.3rem 0.65rem;">
                ${rotuloUrgencia}
              </span>
            </div>

            <!-- CONTATO WHATSAPP -->
            <div style="background: #F8FAFC; padding: 0.75rem 0.9rem; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="font-size: 0.88rem; color: #0F172A; font-weight: 800; display: flex; align-items: center; gap: 0.45rem;">
                <i class="fa-brands fa-whatsapp" style="font-size: 1.2rem; color: #10B981;"></i> ${formatPhone(cob.clienteTelefone)}
              </div>
              <button class="btn-whatsapp-sm" style="font-size: 0.78rem; padding: 0.3rem 0.65rem; font-weight: 800; background: #10B981; color: #FFFFFF;" onclick="window.open('https://wa.me/${cob.clienteTelefone}', '_blank')">
                <i class="fa-brands fa-whatsapp"></i> Conversar
              </button>
            </div>

            <!-- DETALHES DO PLANO & VALOR -->
            <div style="background: #FFFBEB; padding: 0.85rem 1rem; border-radius: 12px; border: 1.5px solid #FCD34D; margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <strong style="color: #92400E; font-size: 0.9rem;"><i class="fa-solid fa-tv" style="color: #D97706;"></i> ${planoObj ? planoObj.nome : 'Plano de Canais'}</strong>
                <div style="font-size: 1.35rem; font-weight: 900; color: #D97706;">
                  ${formatCurrency(cob.valor)}
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: #78350F; font-weight: 700;">
                <span>Vencimento: <strong>${formatDate(cob.dataVencimento)}</strong></span>
                <span>Envio WhatsApp: <strong>${formatDateTime(cob.dataHoraEnvio)}</strong></span>
              </div>
            </div>

            ${cob.descricao ? `<p style="font-size: 0.82rem; color: #475569; background: #F1F5F9; padding: 0.55rem; border-radius: 8px; margin-bottom: 0.85rem; font-weight: 600;"><i class="fa-regular fa-file-lines"></i> ${cob.descricao}</p>` : ''}
          </div>

          <!-- AÇÕES RÁPIDAS -->
          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1.5px solid #E2E8F0; padding-top: 0.85rem;">
            <button class="btn-success-sm" style="width: 100%; justify-content: center; font-size: 0.9rem; padding: 0.6rem; background: #059669; color: #FFFFFF; font-weight: 800; border-radius: 8px;" onclick="abrirModalBaixa('${cob.id}')" title="Dar Baixa no Pagamento">
              <i class="fa-solid fa-check-circle"></i> Dar Baixa no Pagamento
            </button>
            <button class="btn-whatsapp-sm" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 0.5rem; font-weight: 800;" onclick="dispararWhatsApp('${cob.id}')" title="Disparar Notificação no WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> Disparar Lembrete WhatsApp
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}
window.renderTabelaProximosVencer = renderTabelaProximosVencer;

// -------------------------------------------------------------
// 4. GESTÃO DE COBRANÇAS (TABELA & CARDS)
// -------------------------------------------------------------
let cobrancasViewMode = 'table';

function setCobrancasViewMode(mode) {
  cobrancasViewMode = mode;
  const tableView = document.getElementById('cobrancasTableView');
  const cardsView = document.getElementById('cobrancasCardsView');
  const btnTable = document.getElementById('btnViewCobrancasTable');
  const btnCards = document.getElementById('btnViewCobrancasCards');

  if (mode === 'cards') {
    if (tableView) tableView.style.display = 'none';
    if (cardsView) cardsView.style.display = 'block';
    if (btnTable) btnTable.classList.remove('active');
    if (btnCards) btnCards.classList.add('active');
  } else {
    if (tableView) tableView.style.display = 'block';
    if (cardsView) cardsView.style.display = 'none';
    if (btnTable) btnTable.classList.add('active');
    if (btnCards) btnCards.classList.remove('active');
  }
}

/**
 * Helper para calcular o status visual do plano baseado na data de vencimento e status do pagamento.
 * Regras:
 * - 🟢 Verde (Ativo): Pagamento em dia / mais de 2 dias antes do vencimento (ou PAGO)
 * - 🟡 Amarelo (Plano a Vencer): Faltam de 0 a 2 dias para o vencimento
 * - 🔴 Vermelho (Plano Vencido): Vencimento no passado e cobrança pendente
 */
function calcularStatusPlano(dataVencimento, isPago = false) {
  if (isPago) {
    return {
      statusKey: 'ATIVO',
      text: 'Ativo (Em Dia)',
      badgeClass: 'badge-ativo',
      color: '#00FF88',
      badgeHtml: `<span class="badge badge-ativo"><i class="fa-solid fa-circle-check"></i> Ativo (Em Dia)</span>`
    };
  }

  if (!dataVencimento) {
    return {
      statusKey: 'ATIVO',
      text: 'Ativo (Em Dia)',
      badgeClass: 'badge-ativo',
      color: '#00FF88',
      badgeHtml: `<span class="badge badge-ativo"><i class="fa-solid fa-circle-check"></i> Ativo (Em Dia)</span>`
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dateStr = dataVencimento.split('T')[0];
  const parts = dateStr.split('-');
  let venc;
  if (parts.length === 3) {
    venc = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else {
    venc = new Date(dateStr);
    venc.setHours(0, 0, 0, 0);
  }

  const diffTime = venc.getTime() - hoje.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      statusKey: 'VENCIDO',
      text: 'Plano Vencido',
      badgeClass: 'badge-vencido',
      color: '#EF4444',
      badgeHtml: `<span class="badge badge-vencido"><i class="fa-solid fa-circle-xmark"></i> Plano Vencido</span>`
    };
  } else if (diffDays <= 2) {
    let labelTxt = 'Vence em 2 Dias';
    if (diffDays === 0) labelTxt = 'Vence Hoje';
    else if (diffDays === 1) labelTxt = 'Vence em 1 Dia';
    return {
      statusKey: 'A_VENCER',
      text: labelTxt,
      badgeClass: 'badge-a-vencer',
      color: '#F59E0B',
      badgeHtml: `<span class="badge badge-a-vencer"><i class="fa-solid fa-triangle-exclamation"></i> ${labelTxt}</span>`
    };
  } else {
    return {
      statusKey: 'ATIVO',
      text: 'Ativo (Em Dia)',
      badgeClass: 'badge-ativo',
      color: '#00FF88',
      badgeHtml: `<span class="badge badge-ativo"><i class="fa-solid fa-circle-check"></i> Ativo (Em Dia)</span>`
    };
  }
}

function obterStatusCliente(cli) {
  const cobrancasCliente = globalCobrancas.filter(c => c.clienteId === cli.id);

  if (cobrancasCliente.length === 0) {
    return calcularStatusPlano(null, true);
  }

  const pendentes = cobrancasCliente.filter(c => c.status === 'PENDENTE');
  if (pendentes.length > 0) {
    pendentes.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
    return calcularStatusPlano(pendentes[0].dataVencimento, false);
  }

  const pagas = cobrancasCliente.filter(c => c.status === 'PAGO');
  if (pagas.length > 0) {
    pagas.sort((a, b) => (b.dataPagamento || '').localeCompare(a.dataPagamento || ''));
    const ultimaPaga = pagas[0];
    if (ultimaPaga.proximoVencimento) {
      return calcularStatusPlano(ultimaPaga.proximoVencimento, false);
    }
  }

  return calcularStatusPlano(null, true);
}

function filtrarTabelaCobrancas() {
  renderTabelaCobrancas();
}
window.filtrarTabelaCobrancas = filtrarTabelaCobrancas;

function renderTabelaCobrancas() {
  const tbody = document.getElementById('cobrancasTableBody');
  const grid = document.getElementById('cobrancasCardsGrid');
  if (!tbody && !grid) return;

  const filterInput = document.getElementById('filterCobrancas');
  const query = filterInput ? filterInput.value.toLowerCase().trim() : '';

  if (globalCobrancas.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-brown-muted); padding: 2rem;">Nenhuma cobrança cadastrada.</td></tr>`;
    if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">Nenhuma cobrança cadastrada. Clique no botão acima para adicionar!</div>`;
    return;
  }

  // Ordenar cobranças por ordem de criação (ID descendente) e aplicar filtro de pesquisa
  const cobrancasOrdenadas = [...globalCobrancas].sort((a, b) => {
    const numA = parseInt((a.id || '').replace(/\D/g, '')) || 0;
    const numB = parseInt((b.id || '').replace(/\D/g, '')) || 0;
    return numB - numA;
  }).filter(cob => {
    if (!query) return true;
    const nome = (cob.clienteNome || '').toLowerCase();
    const tel = (cob.clienteTelefone || '').toLowerCase();
    const desc = (cob.descricao || '').toLowerCase();
    return nome.includes(query) || tel.includes(query) || desc.includes(query);
  });

  if (cobrancasOrdenadas.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-brown-muted); padding: 2rem;">Nenhuma renovação encontrada com este termo.</td></tr>`;
    if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">Nenhuma renovação encontrada com este termo de pesquisa.</div>`;
    return;
  }

  // 1. RENDERIZAR TABELA
  if (tbody) {
    tbody.innerHTML = cobrancasOrdenadas.map(cob => {
      const cli = globalClientes.find(c => c.id === cob.clienteId);
      const planoObj = cli ? globalPlanos.find(p => p.id === cli.planoId) : null;
      const srvObj = cli ? globalServidores.find(s => s.id === cli.servidorId) : null;
      const appObj = cli ? globalApps.find(a => a.id === cli.appId) : null;

      let badgeStatus;
      let statusObj;

      if (cob.status === 'PAGO') {
        badgeStatus = `<span class="badge badge-pago"><i class="fa-solid fa-check"></i> Pago</span>`;
        statusObj = { color: 'var(--neon-green)' };
      } else {
        statusObj = calcularStatusPlano(cob.dataVencimento, false);
        badgeStatus = statusObj.badgeHtml;
      }

      const dataHoraFormatted = formatDateTime(cob.dataHoraEnvio);
      let badgeEnvio = `<span class="badge badge-agendado" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;"><i class="fa-regular fa-clock" style="color: var(--emerald-primary);"></i> <strong>${dataHoraFormatted}</strong></span>`;
      
      if (cob.statusEnvio === 'ENVIADO') {
        const dataEnvioFormat = cob.dataEnvioRealizado ? formatDateTime(cob.dataEnvioRealizado) : dataHoraFormatted;
        badgeEnvio = `<span class="badge badge-enviado" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;"><i class="fa-solid fa-paper-plane"></i> Enviado em ${dataEnvioFormat}</span>`;
      }

      const planoText = planoObj ? `<div style="font-size: 0.75rem; color: var(--neon-blue); font-weight: 600;"><i class="fa-solid fa-tv"></i> ${planoObj.nome}</div>` : '';

      return `
        <tr>
          <td>
            <strong style="color: #000000;">${cob.clienteNome}</strong>
            <div style="font-size: 0.75rem; color: var(--text-brown-muted);"><i class="fa-brands fa-whatsapp"></i> ${formatPhone(cob.clienteTelefone)}</div>
            ${planoText}
          </td>
          <td>
            <strong style="color: var(--emerald-light); font-size: 0.95rem;">${formatCurrency(cob.valor)}</strong>
            ${cob.desconto > 0 ? `<div style="font-size: 0.72rem; color: var(--neon-pink, #ff2a85); margin-top: 0.15rem;"><i class="fa-solid fa-tag"></i> Desc: -${formatCurrency(cob.desconto)}</div>` : ''}
          </td>
          <td><strong style="color: #000000;">${formatDate(cob.dataVencimento)}</strong></td>
          <td>${badgeEnvio}</td>
          <td><span style="font-size: 0.85rem; color: var(--text-brown-muted);">${cob.descricao}</span></td>
          <td>${badgeStatus}</td>
          <td style="text-align: right; white-space: nowrap;">
            ${cob.status === 'PENDENTE' ? `
              <button class="btn-success-sm" title="Dar Baixa (Registrar Recebimento)" onclick="abrirModalBaixa('${cob.id}')">
                <i class="fa-solid fa-check"></i> Dar Baixa
              </button>
              <button class="btn-whatsapp-sm" title="Disparar no WhatsApp" onclick="dispararWhatsApp('${cob.id}')">
                <i class="fa-brands fa-whatsapp"></i> Enviar
              </button>
            ` : ''}
            <button class="btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;" title="Editar" onclick="editarCobranca('${cob.id}')">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-danger-sm" title="Excluir" onclick="deletarCobranca('${cob.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. RENDERIZAR CARDS DE COBRANÇA ULTRA DETALHADOS
  if (grid) {
    grid.innerHTML = cobrancasOrdenadas.map(cob => {
      const cli = globalClientes.find(c => c.id === cob.clienteId);
      const planoObj = cli ? globalPlanos.find(p => p.id === cli.planoId) : null;
      const srvObj = cli ? globalServidores.find(s => s.id === cli.servidorId) : null;
      const appObj = cli ? globalApps.find(a => a.id === cli.appId) : null;

      let badgeStatus;
      let statusObj;

      if (cob.status === 'PAGO') {
        badgeStatus = `<span class="badge badge-pago"><i class="fa-solid fa-check"></i> Pago</span>`;
        statusObj = { color: 'var(--neon-green)' };
      } else {
        statusObj = calcularStatusPlano(cob.dataVencimento, false);
        badgeStatus = statusObj.badgeHtml;
      }

      const dataHoraFormatted = formatDateTime(cob.dataHoraEnvio);
      let badgeEnvio = `<span class="badge badge-agendado" style="font-size: 0.8rem;"><i class="fa-regular fa-clock"></i> ${dataHoraFormatted}</span>`;
      if (cob.statusEnvio === 'ENVIADO') {
        const dataEnvioFormat = cob.dataEnvioRealizado ? formatDateTime(cob.dataEnvioRealizado) : dataHoraFormatted;
        badgeEnvio = `<span class="badge badge-enviado" style="font-size: 0.8rem;"><i class="fa-solid fa-paper-plane"></i> Enviado em ${dataEnvioFormat}</span>`;
      }

      const cliObj = globalClientes.find(c => c.id === cob.clienteId);
      const qtdTelasInt = cob.qtdTelas || (cliObj ? cliObj.qtdTelas : 1) || 1;
      const telasBadge = `<span class="badge badge-agendado" style="font-size: 0.75rem; background: rgba(124,58,237,0.15); color: #A78BFA; border-color: #7C3AED;"><i class="fa-solid fa-desktop"></i> ${qtdTelasInt === 1 ? '1 Tela' : qtdTelasInt + ' Telas'}</span>`;

      const planoBadge = planoObj ? `<span class="badge badge-agendado" style="font-size: 0.75rem;"><i class="fa-solid fa-tv"></i> ${planoObj.nome}</span>` : '';
      const srvBadge = srvObj ? `<span class="badge badge-pago" style="font-size: 0.75rem; background: rgba(0,240,255,0.15); color: var(--neon-blue);"><i class="fa-solid fa-server"></i> ${srvObj.nome}</span>` : '';
      const appBadge = appObj ? `<span class="badge badge-vencido" style="font-size: 0.75rem; background: rgba(16,185,129,0.15); color: var(--emerald-light);"><i class="fa-solid fa-mobile-screen-button"></i> ${appObj.nome}</span>` : '';

      return `
        <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid ${statusObj.color}; box-shadow: 0 8px 32px rgba(0,0,0,0.37);">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              ${badgeStatus}
              <span style="font-size: 0.8rem; color: var(--text-brown-muted); font-weight: 600;"><i class="fa-regular fa-calendar-days"></i> Venc: ${formatDate(cob.dataVencimento)}</span>
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 800; color: #000000; margin-bottom: 0.35rem;">${cob.clienteNome}</h3>
            <div style="font-size: 0.85rem; color: var(--emerald-light); font-weight: 600; margin-bottom: 0.75rem;">
              <i class="fa-brands fa-whatsapp"></i> ${formatPhone(cob.clienteTelefone)}
            </div>

            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              ${telasBadge} ${planoBadge} ${srvBadge} ${appBadge}
            </div>

            <div style="font-size: 1.6rem; font-weight: 800; color: var(--emerald-light); margin-bottom: 0.75rem; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap;">
              <span>${formatCurrency(cob.valor)}</span>
              ${(cob.valorBruto && cob.valorBruto > cob.valor) ? `<span style="font-size: 0.8rem; color: var(--text-brown-muted); text-decoration: line-through;">Bruto: ${formatCurrency(cob.valorBruto)}</span>` : ''}
              ${cob.desconto > 0 ? `<span style="font-size: 0.8rem; color: var(--neon-pink, #ff2a85); font-weight: 600;"><i class="fa-solid fa-tag"></i> Desc: -${formatCurrency(cob.desconto)}</span>` : ''}
            </div>

            <p style="font-size: 0.85rem; color: var(--text-brown-muted); margin-bottom: 0.75rem; background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
              ${cob.descricao}
            </p>

            <div style="font-size: 0.8rem; margin-bottom: 1rem; background: rgba(0,255,136,0.04); padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px dashed var(--neon-green);">
              <strong style="color: var(--neon-green);"><i class="fa-solid fa-clock"></i> Envio Agendado WhatsApp:</strong>
              <div style="margin-top: 0.25rem;">${badgeEnvio}</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
            ${cob.status === 'PENDENTE' ? `
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn-success-sm" style="flex: 1; justify-content: center;" onclick="abrirModalBaixa('${cob.id}')">
                  <i class="fa-solid fa-check"></i> Dar Baixa
                </button>
                <button class="btn-whatsapp-sm" style="flex: 1; justify-content: center;" onclick="dispararWhatsApp('${cob.id}')">
                  <i class="fa-brands fa-whatsapp"></i> Disparar Envio
                </button>
              </div>
            ` : ''}

            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" title="Editar" onclick="editarCobranca('${cob.id}')">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
              <button class="btn-danger-sm" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" title="Excluir" onclick="deletarCobranca('${cob.id}')">
                <i class="fa-solid fa-trash"></i> Excluir
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function filtrarTabelaCobrancas() {
  const query = document.getElementById('filterCobrancas').value.toLowerCase();
  const rows = document.querySelectorAll('#cobrancasTableBody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

function populateCobrancaOptionsSelects() {
  const selPlano = document.getElementById('cobPlanoId');
  const selSrv = document.getElementById('cobServidorId');
  const selApp = document.getElementById('cobAppId');
  const selModelo = document.getElementById('cobModeloId');

  if (selPlano) {
    selPlano.innerHTML = `<option value="">-- Selecione o Plano --</option>` +
      globalPlanos.map(p => {
        const vBruto = p.valor || 0;
        const desc = p.desconto || 0;
        const vFinal = Math.max(0, vBruto - desc);
        const descText = desc > 0 ? ` (Desc. - ${formatCurrency(desc)})` : '';
        return `<option value="${p.id}">${p.nome} - ${formatCurrency(vFinal)}${descText}</option>`;
      }).join('');
  }

  if (selSrv) {
    selSrv.innerHTML = `<option value="">-- Nenhum Servidor --</option>` +
      globalServidores.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  }

  if (selApp) {
    selApp.innerHTML = `<option value="">-- Nenhum App --</option>` +
      globalApps.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
  }

  if (selModelo) {
    const listaMod = getListaModelosParaDropdown();
    selModelo.innerHTML = `<option value="">-- Seleção Automática (Padrão do Sistema) --</option>` +
      listaMod.map(m => `<option value="${m.id}">${m.titulo} (${m.categoria || 'Geral'})</option>`).join('');
  }
}

function calcularValorCobComDesconto() {
  const planoId = document.getElementById('cobPlanoId') ? document.getElementById('cobPlanoId').value : '';
  const plano = globalPlanos.find(p => p.id === planoId);

  const brutoEl = document.getElementById('cobValorBruto');
  const descEl = document.getElementById('cobDesconto');
  const valorEl = document.getElementById('cobValor');
  const telasEl = document.getElementById('cobQtdTelas');

  const qtdTelas = parseInt(telasEl ? telasEl.value : 1) || 1;

  let baseUnitVal = 0;
  if (plano && plano.valor > 0) {
    baseUnitVal = parseFloat(plano.valor) || 0;
  } else if (brutoEl && brutoEl.dataset.unitPrice) {
    baseUnitVal = parseFloat(brutoEl.dataset.unitPrice) || 0;
  } else if (brutoEl && brutoEl.value !== '') {
    baseUnitVal = parseFloat(brutoEl.value) / qtdTelas;
  }

  if (baseUnitVal > 0 && brutoEl) {
    brutoEl.dataset.unitPrice = baseUnitVal;
    const totalBruto = baseUnitVal * qtdTelas;
    brutoEl.value = totalBruto.toFixed(2);
  }

  const bruto = parseFloat(brutoEl ? brutoEl.value : 0) || 0;
  const desc = parseFloat(descEl ? descEl.value : 0) || 0;
  const finalVal = Math.max(0, bruto - desc);

  if (valorEl) {
    valorEl.value = finalVal.toFixed(2);
  }
}

function calcularDeValorFinalCob() {
  const brutoEl = document.getElementById('cobValorBruto');
  const descEl = document.getElementById('cobDesconto');
  const valorEl = document.getElementById('cobValor');
  const telasEl = document.getElementById('cobQtdTelas');

  if (!valorEl || !brutoEl) return;
  const vFinal = parseFloat(valorEl.value) || 0;
  const desc = parseFloat(descEl ? descEl.value : 0) || 0;
  const vBruto = vFinal + desc;
  brutoEl.value = vBruto.toFixed(2);

  const qtdTelas = parseInt(telasEl ? telasEl.value : 1) || 1;
  brutoEl.dataset.unitPrice = (vBruto / qtdTelas).toFixed(2);
}

function abrirModalNovaCobranca() {
  document.getElementById('cobrancaId').value = '';
  document.getElementById('modalCobrancaTitle').innerHTML = `<i class="fa-solid fa-plus-circle"></i> Cadastrar Nova Renovação`;
  document.getElementById('formCobranca').reset();

  if (document.getElementById('cobQtdTelas')) document.getElementById('cobQtdTelas').value = '1';
  if (document.getElementById('cobValorBruto')) document.getElementById('cobValorBruto').value = '';
  if (document.getElementById('cobDesconto')) document.getElementById('cobDesconto').value = '0.00';
  if (document.getElementById('cobValor')) document.getElementById('cobValor').value = '';

  populateClienteSelect();
  populateCobrancaOptionsSelects();

  if (document.getElementById('cobModeloId')) {
    document.getElementById('cobModeloId').value = '';
  }

  abrirModal('modalCobranca');

  // Definir data padrão para hoje em fuso horário local
  const setDatasCob = () => {
    const agora = new Date();
    const yyyy = agora.getFullYear();
    const mm = String(agora.getMonth() + 1).padStart(2, '0');
    const dd = String(agora.getDate()).padStart(2, '0');
    const hh = String(agora.getHours()).padStart(2, '0');
    const mi = String(agora.getMinutes()).padStart(2, '0');

    const dataHoje = `${yyyy}-${mm}-${dd}`;
    const agoraIso = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;

    const vencEl = document.getElementById('cobVencimento');
    const envioEl = document.getElementById('cobDataHoraEnvio');

    if (vencEl) vencEl.value = dataHoje;
    if (envioEl) envioEl.value = agoraIso;
  };

  setDatasCob();
  setTimeout(setDatasCob, 50);
}

function editarCobranca(id) {
  const cob = globalCobrancas.find(c => c.id === id);
  if (!cob) return;

  populateClienteSelect();
  populateCobrancaOptionsSelects();

  document.getElementById('cobrancaId').value = cob.id;
  document.getElementById('modalCobrancaTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Renovação`;
  document.getElementById('cobClienteId').value = cob.clienteId;

  const vBruto = (cob.valorBruto !== undefined && cob.valorBruto !== null) ? cob.valorBruto : (cob.valor || '');
  const vDesc = (cob.desconto !== undefined && cob.desconto !== null) ? cob.desconto : 0;

  if (document.getElementById('cobQtdTelas')) document.getElementById('cobQtdTelas').value = cob.qtdTelas || '1';
  if (document.getElementById('cobValorBruto')) document.getElementById('cobValorBruto').value = vBruto;
  if (document.getElementById('cobDesconto')) document.getElementById('cobDesconto').value = vDesc;
  if (document.getElementById('cobValor')) document.getElementById('cobValor').value = cob.valor;

  document.getElementById('cobVencimento').value = formatDateForInput(cob.dataVencimento);
  document.getElementById('cobDataHoraEnvio').value = formatDateTimeForInput(cob.dataHoraEnvio);
  document.getElementById('cobDescricao').value = cob.descricao;

  if (document.getElementById('cobModeloId')) {
    document.getElementById('cobModeloId').value = cob.modeloMensagemId || '';
  }

  // Tentar encontrar plano/servidor/app do cliente
  const cli = globalClientes.find(c => c.id === cob.clienteId);
  if (cli) {
    if (cli.planoId) document.getElementById('cobPlanoId').value = cli.planoId;
    if (cli.servidorId) document.getElementById('cobServidorId').value = cli.servidorId;
    if (cli.appId) document.getElementById('cobAppId').value = cli.appId;
  }

  abrirModal('modalCobranca');
}

function fecharModalCobranca() {
  fecharModal('modalCobranca');
}

async function deletarCobranca(id) {
  const confirm = await Swal.fire({
    title: 'Excluir Cobrança?',
    text: "Esta ação não poderá ser desfeita.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#FFFFFF',
    color: '#000000'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/cobrancas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Cobrança excluída!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchCobrancas();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Erro ao excluir cobrança:', err);
    }
  }
}

// -------------------------------------------------------------
// 5. DAR BAIXA NAS COBRANÇAS (CONTAS RECEBIDAS)
// -------------------------------------------------------------
function populateBaixaClienteSelect(selectedId) {
  const sel = document.getElementById('baixaClienteSelect');
  if (!sel) return;

  sel.innerHTML = '<option value="">-- Selecione o Cliente para Dar Baixa --</option>';

  let targetCobId = null;

  globalClientes.forEach(cli => {
    const cobPendente = globalCobrancas.find(c => c.clienteId === cli.id && c.status === 'PENDENTE');
    const cobQualquer = globalCobrancas.find(c => c.clienteId === cli.id);
    const cobIdToUse = cobPendente ? cobPendente.id : (cobQualquer ? cobQualquer.id : cli.id);
    const dataVencStr = cobPendente ? formatDate(cobPendente.dataVencimento) : (cobQualquer ? formatDate(cobQualquer.dataVencimento) : 'Sem data');
    const valStr = cobPendente ? formatCurrency(cobPendente.valor) : (cobQualquer ? formatCurrency(cobQualquer.valor) : 'R$ 0,00');

    const isSelected = (selectedId === cli.id || selectedId === cobIdToUse || (cobPendente && selectedId === cobPendente.id));
    if (isSelected) targetCobId = cobIdToUse;

    const opt = document.createElement('option');
    opt.value = cobIdToUse;
    opt.textContent = `${cli.nome} | Venc: ${dataVencStr} | ${valStr}`;
    if (isSelected) opt.selected = true;
    sel.appendChild(opt);
  });

  if (!sel.value && sel.options.length > 1) {
    sel.selectedIndex = 1;
    targetCobId = sel.value;
  }

  if (targetCobId) {
    onBaixaClienteSelectChange(targetCobId);
  }
}

function onBaixaClienteSelectChange(val) {
  if (!val) return;
  if (document.getElementById('baixaCobrancaId')) {
    document.getElementById('baixaCobrancaId').value = val;
  }

  let cob = globalCobrancas.find(c => c.id === val);
  if (!cob) {
    cob = globalCobrancas.find(c => c.clienteId === val && c.status === 'PENDENTE');
    if (!cob) cob = globalCobrancas.find(c => c.clienteId === val);
  }

  let baseDate = new Date();
  if (cob && cob.dataVencimento) {
    const parts = cob.dataVencimento.split('T')[0].split('-').map(Number);
    if (parts.length === 3) {
      baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (baseDate < hoje) baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 30);
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');
  const proxIso = `${yyyy}-${mm}-${dd}`;

  if (document.getElementById('baixaProximoVencimento')) {
    document.getElementById('baixaProximoVencimento').value = proxIso;
  }
}
window.onBaixaClienteSelectChange = onBaixaClienteSelectChange;

function abrirModalBaixaForm(id) {
  populateBaixaClienteSelect(id);

  const agora = new Date();
  const yyyyNow = agora.getFullYear();
  const mmNow = String(agora.getMonth() + 1).padStart(2, '0');
  const ddNow = String(agora.getDate()).padStart(2, '0');
  const hhNow = String(agora.getHours()).padStart(2, '0');
  const miNow = String(agora.getMinutes()).padStart(2, '0');
  const agoraLocal = `${yyyyNow}-${mmNow}-${ddNow}T${hhNow}:${miNow}`;

  if (document.getElementById('baixaData')) document.getElementById('baixaData').value = agoraLocal;
  if (document.getElementById('baixaObservacao')) document.getElementById('baixaObservacao').value = 'Pagamento recebido e confirmado via PIX';
  if (document.getElementById('baixaEnviarWhatsApp')) document.getElementById('baixaEnviarWhatsApp').checked = true;

  abrirModal('modalBaixa');
}

async function darBaixaRapida(id) {
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

  const targetId = cob ? cob.id : (cli ? cli.id : (cleanId || ''));
  const nomeCliente = cob ? cob.clienteNome : (cli ? cli.nome : 'Cliente');
  const valorCob = cob ? cob.valor : (cli ? (cli.valorBruto || 35) : 35);
  
  let baseDate = new Date();
  if (cob && cob.dataVencimento) {
    const parts = cob.dataVencimento.split('T')[0].split('-').map(Number);
    if (parts.length === 3) baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (baseDate < hoje) baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 30);
  
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');
  const proxIso = `${yyyy}-${mm}-${dd}`;
  const proxDataBr = `${dd}/${mm}/${yyyy}`;

  const result = await Swal.fire({
    title: '🎉 Confirmar Baixa & Renovação?',
    html: `
      <div style="text-align: left; background: #F8FAFC; padding: 1.25rem; border-radius: 12px; border: 1.5px solid #059669; margin-top: 0.5rem; color: #0F172A; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <p style="margin-bottom: 0.5rem; font-size: 1rem; color: #0F172A;">👤 Cliente: <strong style="color: #059669;">${nomeCliente}</strong></p>
        <p style="margin-bottom: 0.5rem; font-size: 1rem; color: #0F172A;">💰 Valor Recebido: <strong style="color: #059669;">${formatCurrency(valorCob)}</strong></p>
        <p style="margin: 0; font-size: 1rem; color: #0F172A;">📅 Próximo Vencimento: <strong style="color: #0284C7;">${proxDataBr}</strong></p>
      </div>
      <p style="margin-top: 0.85rem; font-size: 0.85rem; color: #475569;">
        O plano do cliente será alterado para <strong>ATIVO (Em Dia)</strong> e a renovação do próximo mês será agendada!
      </p>
    `,
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: '🟢 Confirmar Baixa Agora',
    denyButtonText: '⚙️ Opções Avançadas',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#059669',
    denyButtonColor: '#0284C7',
    cancelButtonColor: '#64748B',
    background: '#FFFFFF',
    color: '#1E293B'
  });

  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: 'Processando Baixa...',
        text: 'Aguarde um instante',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: '#FFFFFF',
        color: '#1E293B'
      });

      const url = targetId ? `/api/cobrancas/${targetId}/dar-baixa` : '/api/cobrancas/dar-baixa';
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
      }

      if (res.ok && data.success) {
        try {
          await fetchClientes();
          await fetchCobrancas();
          loadDashboardData();
          renderTabelaClientes();
          renderTabelaCobrancas();
          renderTabelaContasRecebidas();
        } catch (uiErr) {
          console.warn('Aviso ao atualizar listas locais:', uiErr);
        }

        const resSwal = await Swal.fire({
          icon: 'success',
          title: '🎉 Baixa Concluída com Sucesso!',
          text: `A baixa de ${nomeCliente} foi registrada e o plano foi renovado para ${proxDataBr}! Deseja enviar a mensagem de confirmação para o cliente via WhatsApp?`,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: '📱 Enviar Mensagem no WhatsApp',
          denyButtonText: '📄 Ver Recibo Digital',
          cancelButtonText: 'OK / Fechar',
          confirmButtonColor: '#059669',
          denyButtonColor: '#0284C7',
          cancelButtonColor: '#64748B',
          background: '#FFFFFF',
          color: '#0F172A'
        });

        if (resSwal.isConfirmed && data.linkWhatsAppRenovacao) {
          try { window.open(data.linkWhatsAppRenovacao, '_blank'); } catch(e) {}
        } else if (resSwal.isDenied && targetId) {
          abrirModalRecibo(targetId);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro ao Dar Baixa',
          text: data.error || 'Não foi possível registrar a baixa.',
          background: '#FFFFFF',
          color: '#1E293B'
        });
      }
    } catch (err) {
      console.error('Erro na baixa rápida:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro de Conexão',
        text: 'Servidor não respondeu.',
        background: '#FFFFFF',
        color: '#1E293B'
      });
    }
  } else if (result.isDenied) {
    abrirModalBaixaForm(targetId);
  }
}

function abrirModalBaixa(id) {
  darBaixaRapida(id);
}

window.darBaixaRapida = darBaixaRapida;
window.abrirModalBaixa = darBaixaRapida;
window.abrirModalBaixaFn = darBaixaRapida;

function fecharModalBaixa() {
  fecharModal('modalBaixa');
}

let contasRecebidasViewMode = 'table';

function setContasRecebidasViewMode(mode) {
  contasRecebidasViewMode = mode;
  const tableView = document.getElementById('contasRecebidasTableView');
  const cardsView = document.getElementById('contasRecebidasCardsView');
  const btnTable = document.getElementById('btnViewContasRecebidasTable');
  const btnCards = document.getElementById('btnViewContasRecebidasCards');

  if (mode === 'cards') {
    if (tableView) tableView.style.display = 'none';
    if (cardsView) cardsView.style.display = 'block';
    if (btnTable) btnTable.classList.remove('active');
    if (btnCards) btnCards.classList.add('active');
  } else {
    if (tableView) tableView.style.display = 'block';
    if (cardsView) cardsView.style.display = 'none';
    if (btnTable) btnTable.classList.add('active');
    if (btnCards) btnCards.classList.remove('active');
  }
}

function renderTabelaContasRecebidas() {
  const tbody = document.getElementById('contasRecebidasTableBody');
  const grid = document.getElementById('contasRecebidasCardsGrid');
  const totalEl = document.getElementById('totalContasRecebidasVal');
  if (!tbody && !grid) return;

  const cobrancasPagas = globalCobrancas.filter(c => c.status === 'PAGO');
  const totalValor = cobrancasPagas.reduce((sum, c) => sum + c.valor, 0);

  if (totalEl) totalEl.textContent = formatCurrency(totalValor);

  if (cobrancasPagas.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-brown-muted); padding: 2rem;">Nenhuma conta recebida com baixa efetuada.</td></tr>`;
    if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">Nenhuma conta recebida com baixa efetuada.</div>`;
    return;
  }

  // 1. RENDERIZAR TABELA
  if (tbody) {
    tbody.innerHTML = cobrancasPagas.map(cob => `
      <tr>
        <td>
          <strong style="color: #000000;">${cob.clienteNome}</strong>
          <div style="font-size: 0.75rem; color: var(--text-brown-muted);"><i class="fa-brands fa-whatsapp"></i> ${formatPhone(cob.clienteTelefone)}</div>
        </td>
        <td><strong style="color: var(--emerald-light); font-size: 1rem;">${formatCurrency(cob.valor)}</strong></td>
        <td>${formatDate(cob.dataVencimento)}</td>
        <td><span style="color: var(--emerald-light); font-weight: 600;">${formatDateTime(cob.dataPagamento)}</span></td>
        <td><span style="color: var(--neon-blue); font-weight: 700;"><i class="fa-solid fa-calendar-day"></i> ${formatDate(cob.proximoVencimento)}</span></td>
        <td>${cob.descricao}</td>
        <td style="text-align: right; white-space: nowrap; display: flex; gap: 0.4rem; justify-content: flex-end;">
          <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; background: #ECFDF5; color: #047857; border-color: #6EE7B7; font-weight: 800;" onclick="abrirModalRecibo('${cob.id}')" title="Ver Recibo Digital">
            <i class="fa-solid fa-file-invoice-dollar"></i> Recibo
          </button>
          <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="reverterBaixa('${cob.id}')" title="Voltar para A Receber">
            <i class="fa-solid fa-rotate-left" style="color: var(--neon-blue);"></i> Voltar
          </button>
        </td>
      </tr>
    `).join('');
  }

  // 2. RENDERIZAR CARDS
  if (grid) {
    grid.innerHTML = cobrancasPagas.map(cob => `
      <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid var(--emerald-primary);">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <span class="badge badge-pago"><i class="fa-solid fa-circle-check"></i> Pago</span>
            <span style="font-size: 0.8rem; color: var(--emerald-light); font-weight: 600;"><i class="fa-solid fa-calendar-check"></i> ${formatDateTime(cob.dataPagamento)}</span>
          </div>

          <h3 style="font-size: 1.15rem; font-weight: 800; color: #000000; margin-bottom: 0.35rem;">${cob.clienteNome}</h3>
          <div style="font-size: 0.85rem; color: var(--emerald-light); font-weight: 600; margin-bottom: 0.75rem;">
            <i class="fa-brands fa-whatsapp"></i> ${formatPhone(cob.clienteTelefone)}
          </div>

          <div style="font-size: 1.6rem; font-weight: 800; color: var(--emerald-light); margin-bottom: 0.75rem;">
            ${formatCurrency(cob.valor)}
          </div>

          <p style="font-size: 0.85rem; color: var(--text-brown-muted); margin-bottom: 0.75rem; background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
            ${cob.descricao}
          </p>

          <div style="font-size: 0.8rem; margin-bottom: 1rem; color: var(--neon-blue);">
            <strong>Próximo Vencimento:</strong> ${formatDate(cob.proximoVencimento)}
          </div>
        </div>

        <div style="display: flex; gap: 0.4rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
          <button class="btn-secondary" style="flex: 1; padding: 0.4rem; font-size: 0.8rem; background: #ECFDF5; color: #047857; border-color: #6EE7B7; font-weight: 800; justify-content: center;" onclick="abrirModalRecibo('${cob.id}')" title="Ver Recibo Digital">
            <i class="fa-solid fa-file-invoice-dollar"></i> Ver Recibo Digital
          </button>
          <button class="btn-secondary" style="flex: 1; padding: 0.4rem; font-size: 0.8rem; justify-content: center;" onclick="reverterBaixa('${cob.id}')">
            <i class="fa-solid fa-rotate-left" style="color: var(--neon-blue);"></i> Voltar
          </button>
        </div>
      </div>
    `).join('');
  }
}

async function reverterBaixa(id) {
  const confirm = await Swal.fire({
    title: 'Voltar para Cobranças Pendentes?',
    text: "Esta cobrança será removida de Contas Recebidas e retornará para a lista de A Receber.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#00F0FF',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, Reverter Baixa!',
    cancelButtonText: 'Cancelar',
    background: '#FFFFFF',
    color: '#000000'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/cobrancas/${id}/reverter-baixa`, { method: 'POST' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Cobrança Revertida!', text: 'Retornou para a lista de A Receber.', timer: 1800, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchCobrancas();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Erro ao reverter baixa:', err);
    }
  }
}

// -------------------------------------------------------------
// 6. ENVIOS DE WHATSAPP
// -------------------------------------------------------------
async function dispararWhatsApp(id) {
  try {
    const res = await fetch(`/api/cobrancas/${id}/disparar-whatsapp`, { method: 'POST' });
    const data = await res.json();

    if (data.success && data.linkWhatsApp) {
      // Abrir o WhatsApp Web em uma nova janela/aba
      window.open(data.linkWhatsApp, '_blank');

      Swal.fire({
        icon: 'success',
        title: 'Mensagem do WhatsApp Gerada!',
        text: 'A janela de envio do WhatsApp foi aberta com a mensagem formatada contendo seus dados PIX.',
        confirmButtonColor: '#10B981',
        background: '#FFFFFF',
        color: '#000000'
      });

      await fetchCobrancas();
      loadDashboardData();
    }
  } catch (err) {
    console.error('Erro ao disparar WhatsApp:', err);
  }
}

function renderTabelaEnvios() {
  const tbody = document.getElementById('enviosTableBody');
  if (!tbody) return;

  const cobrancasEnvio = globalCobrancas
    .filter(c => c.status === 'PENDENTE')
    .sort((a, b) => new Date(a.dataHoraEnvio) - new Date(b.dataHoraEnvio));

  if (cobrancasEnvio.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-brown-muted); padding: 2rem;">Nenhum envio agendado pendente.</td></tr>`;
    return;
  }

  tbody.innerHTML = cobrancasEnvio.map(cob => {
    let badge = `<span class="badge badge-agendado"><i class="fa-regular fa-clock"></i> Agendado</span>`;
    if (cob.statusEnvio === 'PRONTO_PARA_DISPARO') {
      badge = `<span class="badge badge-vencido" style="background: rgba(16, 185, 129, 0.2); color: var(--emerald-light);"><i class="fa-solid fa-bell"></i> Hora de Enviar!</span>`;
    }

    return `
      <tr>
        <td><strong style="color: #000000;">${cob.clienteNome}</strong></td>
        <td>${formatPhone(cob.clienteTelefone)}</td>
        <td><strong style="color: var(--emerald-light);">${formatCurrency(cob.valor)}</strong></td>
        <td><i class="fa-regular fa-calendar-check" style="color: var(--emerald-primary);"></i> ${formatDateTime(cob.dataHoraEnvio)}</td>
        <td>${badge}</td>
        <td style="text-align: right;">
          <button class="btn-whatsapp-sm" onclick="dispararWhatsApp('${cob.id}')">
            <i class="fa-brands fa-whatsapp"></i> Disparar Agora
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 7. CLIENTES (TABELA & CARDS)
// -------------------------------------------------------------
let clientesViewMode = 'table';

function setClientesViewMode(mode) {
  clientesViewMode = mode;
  const tableView = document.getElementById('clientesTableView');
  const cardsView = document.getElementById('clientesCardsView');
  const btnTable = document.getElementById('btnViewClientesTable');
  const btnCards = document.getElementById('btnViewClientesCards');

  if (mode === 'cards') {
    if (tableView) tableView.style.display = 'none';
    if (cardsView) cardsView.style.display = 'block';
    if (btnTable) btnTable.classList.remove('active');
    if (btnCards) btnCards.classList.add('active');
  } else {
    if (tableView) tableView.style.display = 'block';
    if (cardsView) cardsView.style.display = 'none';
    if (btnTable) btnTable.classList.add('active');
    if (btnCards) btnCards.classList.remove('active');
  }
}

function abrirModalNovaCobrancaComCliente(clienteId) {
  abrirModalNovaCobranca();
  const selCli = document.getElementById('cobClienteId');
  if (selCli) {
    selCli.value = clienteId;
    selCli.dispatchEvent(new Event('change'));
  }
}

function filtrarTabelaClientes() {
  renderTabelaClientes();
}
window.filtrarTabelaClientes = filtrarTabelaClientes;

function renderTabelaClientes() {
  const tbody = document.getElementById('clientesTableBody');
  const grid = document.getElementById('clientesCardsGrid');

  if (!tbody && !grid) return;

  const filterInput = document.getElementById('filterClientes');
  const query = filterInput ? filterInput.value.toLowerCase().trim() : '';

  const clientesFiltrados = globalClientes.filter(cli => {
    if (!query) return true;
    const nome = (cli.nome || '').toLowerCase();
    const tel = (cli.telefone || '').toLowerCase();
    const planoObj = globalPlanos.find(p => p.id === cli.planoId);
    const planoNome = planoObj ? planoObj.nome.toLowerCase() : '';
    return nome.includes(query) || tel.includes(query) || planoNome.includes(query);
  });

  if (clientesFiltrados.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-brown-muted); padding: 2rem;">Nenhum cliente encontrado.</td></tr>`;
    if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">Nenhum cliente encontrado com este termo de pesquisa.</div>`;
    return;
  }

  // 1. RENDERIZAR TABELA
  if (tbody) {
    tbody.innerHTML = clientesFiltrados.map(cli => {
      const planoObj = globalPlanos.find(p => p.id === cli.planoId);
      const srvObj = globalServidores.find(s => s.id === cli.servidorId);
      const appObj = globalApps.find(a => a.id === cli.appId);
      const modeloObj = globalModelosMensagens.find(m => m.id === cli.modeloMensagemId);
      const statusObj = obterStatusCliente(cli);
      const cobPendente = globalCobrancas.find(c => c.clienteId === cli.id && c.status === 'PENDENTE');

      const badgePlano = planoObj 
        ? `<span class="badge badge-agendado" style="font-size: 0.8rem; padding: 0.25rem 0.6rem;"><i class="fa-solid fa-tv"></i> ${planoObj.nome} (${formatCurrency(planoObj.valor)})</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">-</span>`;

      const badgeSrv = srvObj 
        ? `<span class="badge badge-pago" style="background: rgba(0, 240, 255, 0.15); color: var(--neon-blue); border-color: var(--neon-blue); font-size: 0.8rem; padding: 0.25rem 0.6rem;"><i class="fa-solid fa-server"></i> ${srvObj.nome}</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">-</span>`;

      const badgeApp = appObj 
        ? `<span class="badge badge-vencido" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald-light); border-color: var(--emerald-primary); font-size: 0.8rem; padding: 0.25rem 0.6rem;"><i class="fa-solid fa-mobile-screen-button"></i> ${appObj.nome}</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">-</span>`;

      const badgeModelo = modeloObj 
        ? `<span class="badge badge-pago" style="background: rgba(0, 240, 255, 0.15); color: var(--neon-blue); border-color: var(--neon-blue); font-size: 0.8rem; padding: 0.25rem 0.6rem;"><i class="fa-solid fa-comment-dots"></i> ${modeloObj.titulo}</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">Padrão</span>`;

      return `
        <tr>
          <td><strong style="color: #000000;">${cli.nome}</strong></td>
          <td><span style="color: var(--emerald-light); font-weight: 600;"><i class="fa-brands fa-whatsapp"></i> ${formatPhone(cli.telefone)}</span></td>
          <td>${statusObj.badgeHtml}</td>
          <td>${badgePlano}</td>
          <td>${badgeSrv}</td>
          <td>${badgeApp}</td>
          <td>${badgeModelo}</td>
          <td><span style="font-size: 0.85rem; color: var(--text-brown-muted);">${cli.notas || '-'}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            ${cobPendente ? `
              <button class="btn-success-sm" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; background: var(--emerald-primary); color: #000; font-weight: 800;" onclick="abrirModalBaixa('${cobPendente.id}')" title="Dar Baixa no Recebimento">
                <i class="fa-solid fa-check"></i> Dar Baixa
              </button>
            ` : ''}
            <button class="btn-whatsapp-sm" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;" onclick="abrirModalDispararModelo(null, '${cli.id}')" title="Escolher Modelo de Mensagem e Enviar">
              <i class="fa-solid fa-paper-plane"></i> Enviar Mensagem
            </button>
            <button class="btn-success-sm" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;" onclick="abrirModalNovaCobrancaComCliente('${cli.id}')" title="Gerar Renovação">
              <i class="fa-solid fa-plus-circle"></i> Renovação
            </button>
            <button class="btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;" onclick="editarCliente('${cli.id}')">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-danger-sm" onclick="deletarCliente('${cli.id}')">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. RENDERIZAR CARDS VISUAIS ELEGANTES E ALTAMENTE ESTRUTURADOS
  if (grid) {
    grid.innerHTML = clientesFiltrados.map(cli => {
      const planoObj = globalPlanos.find(p => p.id === cli.planoId);
      const srvObj = globalServidores.find(s => s.id === cli.servidorId);
      const appObj = globalApps.find(a => a.id === cli.appId);
      const modeloObj = globalModelosMensagens.find(m => m.id === cli.modeloMensagemId);
      const statusObj = obterStatusCliente(cli);
      const cobPendente = globalCobrancas.find(c => c.clienteId === cli.id && c.status === 'PENDENTE');

      const qtdTelasInt = parseInt(cli.qtdTelas || (cobPendente ? cobPendente.qtdTelas : 1)) || 1;

      const badgePlano = planoObj 
        ? `<span class="badge badge-agendado" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-tv"></i> ${planoObj.nome} (${formatCurrency(planoObj.valor)})</span>` 
        : `<span style="color: #64748B; font-size: 0.8rem; font-weight: 600;">Sem plano</span>`;

      const badgeSrv = srvObj 
        ? `<span class="badge badge-pago" style="background: #E0F2FE; color: #0284C7; border: 1px solid #38BDF8; font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-server"></i> ${srvObj.nome}</span>` 
        : `<span style="color: #64748B; font-size: 0.8rem; font-weight: 600;">Sem servidor</span>`;

      const badgeApp = appObj 
        ? `<span class="badge badge-vencido" style="background: #D1FAE5; color: #059669; border: 1px solid #34D399; font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-mobile-screen-button"></i> ${appObj.nome}</span>` 
        : `<span style="color: #64748B; font-size: 0.8rem; font-weight: 600;">Sem app</span>`;

      const badgeModelo = modeloObj 
        ? `<span class="badge badge-pago" style="background: #F3E8FF; color: #7E22CE; border: 1px solid #C084FC; font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-comment-dots"></i> ${modeloObj.titulo}</span>` 
        : `<span style="color: #64748B; font-size: 0.8rem; font-weight: 600;">Padrão</span>`;

      // Cálculos Financeiros com Desconto por Tela
      const valPlano = planoObj ? (planoObj.valor || 0) : 0;
      const valBruto = valPlano * qtdTelasInt;
      const valDesconto = parseFloat(cli.desconto) || 0;
      const valFinal = Math.max(0, valBruto - valDesconto);

      return `
        <div class="card card-hover" style="background: #FFFFFF !important; border: 1.5px solid #CBD5E1; border-radius: 16px; padding: 1.2rem; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05); display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem;">
          <div>
            <!-- SEÇÃO 1: NOME & STATUS DO CLIENTE -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 0.85rem;">
              <h3 style="font-size: 1.2rem; font-weight: 900; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 0.55rem;">
                <i class="fa-solid fa-user-circle" style="color: #0284C7;"></i> ${cli.nome}
              </h3>
              ${statusObj.badgeHtml}
            </div>

            <!-- SEÇÃO 2: CONTATO WHATSAPP -->
            <div style="background: #F8FAFC; padding: 0.75rem 0.9rem; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="font-size: 0.88rem; color: #0F172A; font-weight: 800; display: flex; align-items: center; gap: 0.45rem;">
                <i class="fa-brands fa-whatsapp" style="font-size: 1.2rem; color: #10B981;"></i> ${formatPhone(cli.telefone)}
              </div>
              <button class="btn-whatsapp-sm" style="font-size: 0.78rem; padding: 0.3rem 0.65rem; font-weight: 800; background: #10B981; color: #FFFFFF;" onclick="window.open('https://wa.me/${cli.telefone}', '_blank')">
                <i class="fa-brands fa-whatsapp"></i> Conversar
              </button>
            </div>

            <!-- SEÇÃO 3: RESUMO FINANCEIRO -->
            <div style="background: #F0FDF4; padding: 0.85rem 1rem; border-radius: 12px; border: 1.5px solid #86EFAC; margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge" style="background: #E0F2FE; color: #0284C7; border: 1px solid #7DD3FC; font-weight: 800; font-size: 0.8rem;">
                  <i class="fa-solid fa-desktop"></i> ${qtdTelasInt === 1 ? '1 Tela' : qtdTelasInt + ' Telas'}
                </span>
                <div style="font-size: 1.4rem; font-weight: 900; color: #059669;">
                  ${formatCurrency(valFinal)}
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #475569; font-weight: 600;">
                <span>Plano Bruto (${qtdTelasInt}x): <strong>${formatCurrency(valBruto)}</strong></span>
                ${valDesconto > 0 ? `<span style="color: #E11D48; font-weight: 800;"><i class="fa-solid fa-tag"></i> Desc: -${formatCurrency(valDesconto)}</span>` : '<span>Sem desconto</span>'}
              </div>
            </div>

            <!-- SEÇÃO 4: DETALHES DOS SERVIÇOS ATRIBUÍDOS -->
            <div style="background: #F1F5F9; padding: 0.85rem; border-radius: 12px; border: 1px solid #CBD5E1; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.85rem;">
              <div style="font-size: 0.84rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.35rem;">
                <strong style="color: #475569;"><i class="fa-solid fa-tv" style="color: #0284C7;"></i> Plano de Canais:</strong>
                ${badgePlano}
              </div>
              <div style="font-size: 0.84rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.35rem;">
                <strong style="color: #475569;"><i class="fa-solid fa-server" style="color: #0284C7;"></i> Servidor / Painel:</strong>
                ${badgeSrv}
              </div>
              <div style="font-size: 0.84rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.35rem;">
                <strong style="color: #475569;"><i class="fa-solid fa-mobile-screen-button" style="color: #10B981;"></i> Aplicativo / App:</strong>
                ${badgeApp}
              </div>
              <div style="font-size: 0.84rem; display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #475569;"><i class="fa-solid fa-comment-dots" style="color: #0284C7;"></i> Modelo Mensagem:</strong>
                ${badgeModelo}
              </div>
            </div>

            <!-- SEÇÃO 5: DISPARO AGENDADO / VENCIMENTO -->
            ${cobPendente ? `
              <div style="background: #EFF6FF; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1.5px dashed #3B82F6; margin-bottom: 0.85rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.83rem; margin-bottom: 0.3rem;">
                  <span style="color: #1D4ED8; font-weight: 800;"><i class="fa-solid fa-clock"></i> Disparo Agendado:</span>
                  <span style="color: #0F172A; font-weight: 700;">${formatDateTime(cobPendente.dataHoraEnvio)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.83rem;">
                  <span style="color: #475569; font-weight: 700;"><i class="fa-regular fa-calendar"></i> Data de Vencimento:</span>
                  <span style="color: #059669; font-weight: 900;">${formatDate(cobPendente.dataVencimento)}</span>
                </div>
              </div>
            ` : ''}

            ${cli.notas ? `<p style="font-size: 0.82rem; color: #475569; background: #FFFBEB; border: 1px solid #FDE68A; padding: 0.55rem; border-radius: 8px; margin-bottom: 0.85rem; font-weight: 600;"><i class="fa-regular fa-comment"></i> ${cli.notas}</p>` : ''}
          </div>

          <!-- SEÇÃO 6: AÇÕES RÁPIDAS -->
          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1.5px solid #E2E8F0; padding-top: 0.85rem;">
            ${cobPendente ? `
              <button class="btn-success-sm" style="width: 100%; justify-content: center; font-size: 0.9rem; padding: 0.6rem; background: #059669; color: #FFFFFF; font-weight: 800; border-radius: 8px;" onclick="abrirModalBaixa('${cobPendente.id}')" title="Dar Baixa no Recebimento">
                <i class="fa-solid fa-check-circle"></i> Dar Baixa no Pagamento
              </button>
            ` : ''}
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn-whatsapp-sm" style="flex: 1; justify-content: center; font-size: 0.8rem; padding: 0.45rem; font-weight: 700;" onclick="abrirModalDispararModelo(null, '${cli.id}')" title="Escolher Modelo de Mensagem e Enviar">
                <i class="fa-solid fa-paper-plane"></i> Enviar Mensagem
              </button>
              <button class="btn-success-sm" style="flex: 1; justify-content: center; font-size: 0.8rem; padding: 0.45rem; font-weight: 700;" onclick="abrirModalNovaCobrancaComCliente('${cli.id}')" title="Gerar Renovação Manual">
                <i class="fa-solid fa-plus-circle"></i> + Renovação
              </button>
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button class="btn-secondary" style="flex: 1; justify-content: center; padding: 0.4rem; font-size: 0.8rem; font-weight: 700;" onclick="editarCliente('${cli.id}')">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
              <button class="btn-danger-sm" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; font-weight: 700;" onclick="deletarCliente('${cli.id}')" title="Excluir Cliente">
                <i class="fa-solid fa-trash"></i> Excluir
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function populateClienteSelect() {
  const select = document.getElementById('cobClienteId');
  if (!select) return;

  select.innerHTML = `<option value="">-- Selecione o Cliente --</option>` +
    globalClientes.map(c => `<option value="${c.id}">${c.nome} (${formatPhone(c.telefone)})</option>`).join('');
}


function sincronizarDataEnvioCliente() {
  const vencEl = document.getElementById('cliDataVencimento');
  const envioEl = document.getElementById('cliDataHoraEnvio');
  if (!vencEl || !envioEl) return;
  const valVenc = vencEl.value;
  if (!valVenc) return;
  const currentEnvio = envioEl.value;
  let timePart = '';
  if (currentEnvio && currentEnvio.includes('T')) {
    timePart = currentEnvio.split('T')[1];
  } else {
    const agora = new Date();
    const hh = String(agora.getHours()).padStart(2, '0');
    const mi = String(agora.getMinutes()).padStart(2, '0');
    timePart = `${hh}:${mi}`;
  }
  envioEl.value = `${valVenc}T${timePart}`;
}

function calcularValorClienteComDesconto() {
  const planoId = document.getElementById('cliPlanoId') ? document.getElementById('cliPlanoId').value : '';
  const plano = globalPlanos.find(p => p.id === planoId);

  const brutoEl = document.getElementById('cliValorBruto');
  const descEl = document.getElementById('cliDesconto');
  const valorEl = document.getElementById('cliValor');
  const telasEl = document.getElementById('cliQtdTelas');

  const qtdTelas = parseInt(telasEl ? telasEl.value : 1) || 1;

  let baseUnitVal = 0;
  if (plano && plano.valor > 0) {
    baseUnitVal = parseFloat(plano.valor) || 0;
  } else if (brutoEl && brutoEl.dataset.unitPrice) {
    baseUnitVal = parseFloat(brutoEl.dataset.unitPrice) || 0;
  } else if (brutoEl && brutoEl.value !== '') {
    baseUnitVal = parseFloat(brutoEl.value) / qtdTelas;
  }

  if (baseUnitVal > 0 && brutoEl) {
    brutoEl.dataset.unitPrice = baseUnitVal;
    const totalBruto = baseUnitVal * qtdTelas;
    brutoEl.value = totalBruto.toFixed(2);
  }

  const bruto = parseFloat(brutoEl ? brutoEl.value : 0) || 0;
  const desc = parseFloat(descEl ? descEl.value : 0) || 0;
  const finalVal = Math.max(0, bruto - desc);

  if (valorEl) {
    valorEl.value = finalVal.toFixed(2);
  }
}

function calcularDeValorFinalCliente() {
  const brutoEl = document.getElementById('cliValorBruto');
  const descEl = document.getElementById('cliDesconto');
  const valorEl = document.getElementById('cliValor');
  const telasEl = document.getElementById('cliQtdTelas');

  if (!valorEl || !brutoEl) return;
  const vFinal = parseFloat(valorEl.value) || 0;
  const desc = parseFloat(descEl ? descEl.value : 0) || 0;
  const vBruto = vFinal + desc;
  brutoEl.value = vBruto.toFixed(2);

  const qtdTelas = parseInt(telasEl ? telasEl.value : 1) || 1;
  brutoEl.dataset.unitPrice = (vBruto / qtdTelas).toFixed(2);
}

function autoPreencherPlanoCliente() {
  const planoId = document.getElementById('cliPlanoId').value;
  const plano = globalPlanos.find(p => p.id === planoId);

  const brutoEl = document.getElementById('cliValorBruto');
  const descEl = document.getElementById('cliDesconto');

  if (plano) {
    if (brutoEl) {
      brutoEl.dataset.unitPrice = plano.valor || 0;
    }
    if (descEl && (plano.desconto !== undefined && plano.desconto !== null)) {
      descEl.value = (parseFloat(plano.desconto) || 0).toFixed(2);
    }
    calcularValorClienteComDesconto();
  }
}

function abrirModalNovoCliente() {
  document.getElementById('clienteId').value = '';
  document.getElementById('modalClienteTitle').innerHTML = `<i class="fa-solid fa-user-plus"></i> Cadastrar Cliente`;
  document.getElementById('formCliente').reset();
  
  // Preenche as opções dos dropdowns no modal de cliente
  populateClientOptionsSelects();

  if (document.getElementById('cliQtdTelas')) document.getElementById('cliQtdTelas').value = '1';
  if (document.getElementById('cliValorBruto')) {
    document.getElementById('cliValorBruto').value = '';
    delete document.getElementById('cliValorBruto').dataset.unitPrice;
  }
  if (document.getElementById('cliDesconto')) document.getElementById('cliDesconto').value = '0.00';
  if (document.getElementById('cliValor')) document.getElementById('cliValor').value = '';
  if (document.getElementById('cliModeloId')) document.getElementById('cliModeloId').value = '';
  if (document.getElementById('cliGerarCobranca')) document.getElementById('cliGerarCobranca').checked = true;

  abrirModal('modalCliente');

  // Data e Hora do DIA ATUAL DO USUÁRIO no fuso horário local
  const setDatasCliente = () => {
    const agora = new Date();
    const yyyy = agora.getFullYear();
    const mm = String(agora.getMonth() + 1).padStart(2, '0');
    const dd = String(agora.getDate()).padStart(2, '0');
    const hh = String(agora.getHours()).padStart(2, '0');
    const mi = String(agora.getMinutes()).padStart(2, '0');

    const dataHojeLocal = `${yyyy}-${mm}-${dd}`;
    const dataHoraAgoraLocal = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;

    const vencEl = document.getElementById('cliDataVencimento');
    const envioEl = document.getElementById('cliDataHoraEnvio');

    if (vencEl) vencEl.value = dataHojeLocal;
    if (envioEl) envioEl.value = dataHoraAgoraLocal;
  };

  setDatasCliente();
  setTimeout(setDatasCliente, 50);

  // Auto-selecionar o primeiro plano cadastrado se houver para já preencher o valor inicial automaticamente
  const selPlano = document.getElementById('cliPlanoId');
  if (selPlano && globalPlanos && globalPlanos.length > 0) {
    selPlano.value = globalPlanos[0].id;
    autoPreencherPlanoCliente();
  }
}

function editarCliente(id) {
  const cli = globalClientes.find(c => c.id === id);
  if (!cli) return;

  populateClientOptionsSelects();

  document.getElementById('clienteId').value = cli.id;
  document.getElementById('modalClienteTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Cliente`;
  document.getElementById('cliNome').value = cli.nome;
  document.getElementById('cliTelefone').value = cli.telefone;
  document.getElementById('cliEmail').value = cli.email || '';
  document.getElementById('cliNotas').value = cli.notas || '';
  document.getElementById('cliPlanoId').value = cli.planoId || '';
  document.getElementById('cliServidorId').value = cli.servidorId || '';
  document.getElementById('cliAppId').value = cli.appId || '';
  if (document.getElementById('cliQtdTelas')) document.getElementById('cliQtdTelas').value = cli.qtdTelas || '1';

  // Buscar cobrança pendente do cliente
  const cobCli = globalCobrancas.filter(c => c.clienteId === cli.id && c.status === 'PENDENTE')[0];
  if (cobCli) {
    if (document.getElementById('cliValorBruto')) document.getElementById('cliValorBruto').value = cobCli.valorBruto || cobCli.valor;
    if (document.getElementById('cliDesconto')) document.getElementById('cliDesconto').value = cobCli.desconto || 0;
    if (document.getElementById('cliValor')) document.getElementById('cliValor').value = cobCli.valor;
    if (document.getElementById('cliDataVencimento')) document.getElementById('cliDataVencimento').value = formatDateForInput(cobCli.dataVencimento);
    if (document.getElementById('cliDataHoraEnvio')) document.getElementById('cliDataHoraEnvio').value = formatDateTimeForInput(cobCli.dataHoraEnvio);
    if (document.getElementById('cliModeloId')) {
      document.getElementById('cliModeloId').value = cli.modeloMensagemId || cobCli.modeloMensagemId || '';
    }
  } else {
    calcularValorClienteComDesconto();
  }

  abrirModal('modalCliente');
}

function fecharModalCliente() {
  fecharModal('modalCliente');
}

async function deletarCliente(id) {
  const confirm = await Swal.fire({
    title: 'Excluir Cliente?',
    text: "Cobranças vinculadas continuarão registradas.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#FFFFFF',
    color: '#000000'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Cliente excluído!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchClientes();
      }
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
    }
  }
}

// -------------------------------------------------------------
// 8. FORMULÁRIOS & CONFIGURAÇÃO DOS DADOS PIX
// -------------------------------------------------------------
function fillFormMeusDados() {
  if (!globalMeusDados) return;
  document.getElementById('pixNomeTitular').value = globalMeusDados.nomeTitular || '';
  document.getElementById('pixTipoChave').value = globalMeusDados.tipoChave || 'CPF/CNPJ';
  document.getElementById('pixChave').value = globalMeusDados.chavePix || '';
  document.getElementById('pixBanco').value = globalMeusDados.banco || '';
  document.getElementById('pixInstrucoes').value = globalMeusDados.instrucoes || '';
}

function setupForms() {
  // Event listeners para botões do Catálogo
  const btnPlano = document.getElementById('btnNovoPlano');
  if (btnPlano) btnPlano.addEventListener('click', (e) => { e.preventDefault(); abrirModalNovoPlano(); });

  const btnApp = document.getElementById('btnNovoApp');
  if (btnApp) btnApp.addEventListener('click', (e) => { e.preventDefault(); abrirModalNovoApp(); });

  const btnSrv = document.getElementById('btnNovoServidor');
  if (btnSrv) btnSrv.addEventListener('click', (e) => { e.preventDefault(); abrirModalNovoServidor(); });

  // Event listeners para auto-preenchimento no Modal de Cobrança
  const cobClienteSelect = document.getElementById('cobClienteId');
  const cobPlanoSelect = document.getElementById('cobPlanoId');
  const cobServidorSelect = document.getElementById('cobServidorId');
  const cobAppSelect = document.getElementById('cobAppId');

  function autoAtualizarDescricaoEValor() {
    const planoId = document.getElementById('cobPlanoId').value;
    const plano = globalPlanos.find(p => p.id === planoId);

    if (plano) {
      if (document.getElementById('cobValorBruto')) document.getElementById('cobValorBruto').value = plano.valor || '';
      if (document.getElementById('cobDesconto')) document.getElementById('cobDesconto').value = plano.desconto || '0.00';
      calcularValorCobComDesconto();
    }

    const descInput = document.getElementById('cobDescricao');
    if (descInput && (!descInput.value || descInput.value.includes('RENOVE SEU PLANO') || descInput.value.includes('SEU PLANO DE CANAIS') || descInput.value.includes('Servidor'))) {
      descInput.value = 'SEU PLANO DE CANAIS O VENCIMENTO É HOJE RENOVE PARA NÃO FICAR SEM ASSISTIR !';
    }
  }

  if (cobClienteSelect) {
    cobClienteSelect.addEventListener('change', (e) => {
      const cliId = e.target.value;
      const cli = globalClientes.find(c => c.id === cliId);
      if (cli) {
        if (cli.planoId) document.getElementById('cobPlanoId').value = cli.planoId;
        if (cli.servidorId) document.getElementById('cobServidorId').value = cli.servidorId;
        if (cli.appId) document.getElementById('cobAppId').value = cli.appId;
        autoAtualizarDescricaoEValor();
      }
    });
  }

  if (cobPlanoSelect) cobPlanoSelect.addEventListener('change', autoAtualizarDescricaoEValor);
  if (cobServidorSelect) cobServidorSelect.addEventListener('change', autoAtualizarDescricaoEValor);
  if (cobAppSelect) cobAppSelect.addEventListener('change', autoAtualizarDescricaoEValor);

  // 1. Form Cobrança
  const fCobEl = document.getElementById('formCobranca');
  if (fCobEl) fCobEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cobrancaId').value;
    const descEl = document.getElementById('cobDescricao');
    const valorBrutoEl = document.getElementById('cobValorBruto');
    const descontoEl = document.getElementById('cobDesconto');
    const valorEl = document.getElementById('cobValor');

    const vBruto = valorBrutoEl && valorBrutoEl.value !== '' ? parseFloat(valorBrutoEl.value) : parseFloat(valorEl.value || 0);
    const vDesc = descontoEl && descontoEl.value !== '' ? parseFloat(descontoEl.value) : 0;
    const vFinal = parseFloat(valorEl.value || 0);

    const bodyData = {
      clienteId: document.getElementById('cobClienteId').value,
      qtdTelas: document.getElementById('cobQtdTelas') ? parseInt(document.getElementById('cobQtdTelas').value) || 1 : 1,
      valorBruto: vBruto,
      desconto: vDesc,
      valor: vFinal,
      dataVencimento: document.getElementById('cobVencimento').value,
      dataHoraEnvio: document.getElementById('cobDataHoraEnvio').value,
      descricao: (descEl && descEl.value) ? descEl.value : 'SEU PLANO DE CANAIS O VENCIMENTO É HOJE RENOVE PARA NÃO FICAR SEM ASSISTIR !',
      modeloMensagemId: document.getElementById('cobModeloId') ? document.getElementById('cobModeloId').value : null
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/cobrancas/${id}` : '/api/cobrancas';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (res.ok) {
        fecharModalCobranca();
        Swal.fire({ icon: 'success', title: id ? 'Cobrança Atualizada!' : 'Cobrança Cadastrada!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchCobrancas();
        loadDashboardData();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro ao Salvar Cobrança', text: data.error || 'Preencha todos os campos obrigatórios.', background: '#FFFFFF', color: '#000000' });
      }
    } catch (err) {
      console.error('Erro ao salvar cobrança:', err);
      Swal.fire({ icon: 'error', title: 'Erro na Conexão', text: 'Não foi possível se comunicar com o servidor.', background: '#FFFFFF', color: '#000000' });
    }
  });

  // 2. Form Cliente
  const fCliEl = document.getElementById('formCliente');
  if (fCliEl) fCliEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('clienteId').value;
    const bodyData = {
      nome: document.getElementById('cliNome').value,
      telefone: document.getElementById('cliTelefone').value,
      email: document.getElementById('cliEmail').value,
      notas: document.getElementById('cliNotas').value,
      planoId: document.getElementById('cliPlanoId').value,
      servidorId: document.getElementById('cliServidorId').value,
      appId: document.getElementById('cliAppId').value,
      modeloMensagemId: document.getElementById('cliModeloId') ? document.getElementById('cliModeloId').value : '',
      qtdTelas: document.getElementById('cliQtdTelas') ? parseInt(document.getElementById('cliQtdTelas').value) || 1 : 1,
      valorBruto: document.getElementById('cliValorBruto') ? parseFloat(document.getElementById('cliValorBruto').value || 0) : 0,
      desconto: document.getElementById('cliDesconto') ? parseFloat(document.getElementById('cliDesconto').value || 0) : 0
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/clientes/${id}` : '/api/clientes';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (res.ok) {
        // Se for um novo cliente e a opção de gerar cobrança automática estiver marcada
        const chkCobranca = document.getElementById('cliGerarCobranca');
        const dtVenc = document.getElementById('cliDataVencimento') ? document.getElementById('cliDataVencimento').value : '';
        const dtEnvio = document.getElementById('cliDataHoraEnvio') ? document.getElementById('cliDataHoraEnvio').value : '';
        const valFinal = document.getElementById('cliValor') ? parseFloat(document.getElementById('cliValor').value || 0) : 0;
        const valBruto = document.getElementById('cliValorBruto') ? parseFloat(document.getElementById('cliValorBruto').value || valFinal) : valFinal;
        const desc = document.getElementById('cliDesconto') ? parseFloat(document.getElementById('cliDesconto').value || 0) : 0;
        const qtdTelasVal = document.getElementById('cliQtdTelas') ? parseInt(document.getElementById('cliQtdTelas').value || 1) : 1;

        const modId = document.getElementById('cliModeloId') ? document.getElementById('cliModeloId').value : null;

        if (!id && chkCobranca && chkCobranca.checked && valFinal > 0 && dtVenc) {
          try {
            await fetch('/api/cobrancas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clienteId: data.id,
                qtdTelas: qtdTelasVal,
                valorBruto: valBruto,
                desconto: desc,
                valor: valFinal,
                dataVencimento: dtVenc,
                dataHoraEnvio: dtEnvio || `${dtVenc}T09:00`,
                descricao: 'SEU PLANO DE CANAIS O VENCIMENTO É HOJE RENOVE PARA NÃO FICAR SEM ASSISTIR !',
                modeloMensagemId: modId || null
              })
            });
          } catch (cobErr) {
            console.error('Erro ao agendar cobrança automática:', cobErr);
          }
        }

        fecharModalCliente();
        Swal.fire({ icon: 'success', title: id ? 'Cliente Atualizado!' : 'Cliente e Cobrança Agendada com Sucesso!', timer: 1800, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchClientes();
        await fetchCobrancas();
        loadDashboardData();
        populateClienteSelect();

        // Se foi o cadastro de um NOVO cliente, direciona para a aba de Clientes para ver o cliente cadastrado imediatamente
        if (!id) {
          switchTab('clientes');
        }
      } else {
        Swal.fire({ icon: 'error', title: 'Erro ao Salvar Cliente', text: data.error || 'Nome e WhatsApp são obrigatórios.', background: '#FFFFFF', color: '#000000' });
      }
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      Swal.fire({ icon: 'error', title: 'Erro na Conexão', text: 'Não foi possível salvar o cliente no servidor.', background: '#FFFFFF', color: '#000000' });
    }
  });

  // 3. Form Baixa
  const fBxaEl = document.getElementById('formBaixa');
  if (fBxaEl) fBxaEl.addEventListener('submit', async (e) => {
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
      const url = id ? `/api/cobrancas/${id}/dar-baixa` : '/api/cobrancas/dar-baixa';
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

      if (res.ok && data.success) {
        fecharModalBaixa();

        const proxDataBr = bodyData.proximoVencimento ? bodyData.proximoVencimento.split('-').reverse().join('/') : '';
        const cobrancaBaixadaId = (data.cobranca && data.cobranca.id) ? data.cobranca.id : id;

        const resSwal = await Swal.fire({
          icon: 'success',
          title: '🎉 Baixa Concluída com Sucesso!',
          text: `A baixa foi efetuada e o plano foi renovado para ${proxDataBr}! Deseja enviar a mensagem de confirmação para o cliente via WhatsApp?`,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: '📱 Enviar Mensagem no WhatsApp',
          denyButtonText: '📄 Ver Recibo Digital',
          cancelButtonText: 'OK / Fechar',
          confirmButtonColor: '#059669',
          denyButtonColor: '#0284C7',
          cancelButtonColor: '#64748B',
          background: '#FFFFFF',
          color: '#0F172A'
        });

        if (resSwal.isConfirmed && data.linkWhatsAppRenovacao) {
          try { window.open(data.linkWhatsAppRenovacao, '_blank'); } catch(e) {}
        } else if (resSwal.isDenied && cobrancaBaixadaId) {
          abrirModalRecibo(cobrancaBaixadaId);
        }

        await fetchClientes();
        await fetchCobrancas();
        loadDashboardData();
        renderTabelaClientes();
        renderTabelaCobrancas();
        renderTabelaContasRecebidas();
      }
    } catch (err) {
      console.error('Erro ao dar baixa:', err);
      Swal.fire({ icon: 'error', title: 'Erro ao Dar Baixa', text: 'Não foi possível processar a baixa no servidor.', background: '#FFFFFF', color: '#000000' });
    }
  });

  // 4. Form Meus Dados PIX
  const fPixEl = document.getElementById('formMeusDados');
  if (fPixEl) fPixEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bodyData = {
      nomeTitular: document.getElementById('pixNomeTitular').value,
      tipoChave: document.getElementById('pixTipoChave').value,
      chavePix: document.getElementById('pixChave').value,
      banco: document.getElementById('pixBanco').value,
      instrucoes: document.getElementById('pixInstrucoes').value
    };

    try {
      const res = await fetch('/api/meus-dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Dados PIX Salvos com Sucesso!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchMeusDados();
      }
    } catch (err) {
      console.error('Erro ao salvar dados PIX:', err);
    }
  });

  // 5. Form Plano / App IPTV
  const fPlanoEl = document.getElementById('formPlano');
  if (fPlanoEl) fPlanoEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('planoId').value;
    const vRaw = document.getElementById('planoValor') ? document.getElementById('planoValor').value : '0';
    const dRaw = document.getElementById('planoDesconto') ? document.getElementById('planoDesconto').value : '0';
    
    const valParsed = parseFloat(vRaw.toString().replace(',', '.')) || 0;
    const descParsed = parseFloat(dRaw.toString().replace(',', '.')) || 0;
    const nomeVal = document.getElementById('planoNome') ? document.getElementById('planoNome').value.trim() : '';

    if (!nomeVal || valParsed <= 0) {
      Swal.fire({ icon: 'warning', title: 'Campos Obrigatórios', text: 'Informe o Nome do Plano e um Valor válido.', background: '#FFFFFF', color: '#000000' });
      return;
    }

    const bodyData = {
      nome: nomeVal,
      categoria: document.getElementById('planoCategoria') ? document.getElementById('planoCategoria').value : 'Plano IPTV',
      validade: document.getElementById('planoValidade') ? document.getElementById('planoValidade').value : 'Mensal',
      telas: document.getElementById('planoTelas') ? document.getElementById('planoTelas').value : '1 Tela',
      valor: valParsed,
      desconto: descParsed,
      corBadge: document.getElementById('planoCorBadge') ? document.getElementById('planoCorBadge').value : 'neon-blue',
      descricao: document.getElementById('planoDescricao') ? document.getElementById('planoDescricao').value : ''
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/planos/${id}` : '/api/planos';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        fecharModalPlano();
        Swal.fire({ icon: 'success', title: id ? 'Plano Atualizado!' : 'Plano Cadastrado com Sucesso!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchPlanos();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro ao Salvar Plano', text: data.error || 'Verifique se preencheu os campos corretamente.', background: '#FFFFFF', color: '#000000' });
      }
    } catch (err) {
      console.error('Erro ao salvar plano:', err);
      Swal.fire({ icon: 'error', title: 'Erro na Conexão', text: 'Não foi possível salvar o plano no servidor.', background: '#FFFFFF', color: '#000000' });
    }
  });

  // 6. Form Aplicativo / App
  const fAppEl = document.getElementById('formApp');
  if (fAppEl) fAppEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('appId').value;
    const nomeVal = document.getElementById('appNome') ? document.getElementById('appNome').value.trim() : '';

    if (!nomeVal) {
      Swal.fire({ icon: 'warning', title: 'Nome Obrigatório', text: 'Informe o Nome do Aplicativo.', background: '#FFFFFF', color: '#000000' });
      return;
    }

    const bodyData = {
      nome: nomeVal,
      categoria: document.getElementById('appCategoria') ? document.getElementById('appCategoria').value : 'Aplicativo',
      descricao: document.getElementById('appDescricao') ? document.getElementById('appDescricao').value : ''
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/apps/${id}` : '/api/apps';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        fecharModalApp();
        Swal.fire({ icon: 'success', title: id ? 'App Atualizado!' : 'App Cadastrado com Sucesso!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchApps();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro ao Salvar App', text: data.error || 'Preencha o nome do aplicativo.', background: '#FFFFFF', color: '#000000' });
      }
    } catch (err) {
      console.error('Erro ao salvar app:', err);
      Swal.fire({ icon: 'error', title: 'Erro na Conexão', text: 'Não foi possível salvar o app no servidor.', background: '#FFFFFF', color: '#000000' });
    }
  });

  // 7. Form Servidor
  const fSrvEl = document.getElementById('formServidor');
  if (fSrvEl) fSrvEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('servidorId').value;
    const nomeVal = document.getElementById('servidorNome') ? document.getElementById('servidorNome').value.trim() : '';

    if (!nomeVal) {
      Swal.fire({ icon: 'warning', title: 'Nome Obrigatório', text: 'Informe o Nome do Servidor.', background: '#FFFFFF', color: '#000000' });
      return;
    }

    const bodyData = {
      nome: nomeVal,
      categoria: document.getElementById('servidorCategoria') ? document.getElementById('servidorCategoria').value : 'Servidor',
      descricao: document.getElementById('servidorDescricao') ? document.getElementById('servidorDescricao').value : ''
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/servidores/${id}` : '/api/servidores';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        fecharModalServidor();
        Swal.fire({ icon: 'success', title: id ? 'Servidor Atualizado!' : 'Servidor Cadastrado com Sucesso!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchServidores();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro ao Salvar Servidor', text: data.error || 'Preencha o nome do servidor.', background: '#FFFFFF', color: '#000000' });
      }
    } catch (err) {
      console.error('Erro ao salvar servidor:', err);
      Swal.fire({ icon: 'error', title: 'Erro na Conexão', text: 'Não foi possível salvar o servidor no servidor.', background: '#FFFFFF', color: '#000000' });
    }
  });

  // 8. Form Modelo de Mensagem
  const formModelo = document.getElementById('formModeloMensagem');
  if (formModelo) {
    formModelo.addEventListener('submit', salvarModeloMensagem);
  }

  // 9. Form Disparar Modelo
  const formDisparar = document.getElementById('formDispararModelo');
  if (formDisparar) {
    formDisparar.addEventListener('submit', dispararModeloSelecionado);
  }
}

// -------------------------------------------------------------
// 9. POLLING DE ALERTAS DE ENVIO AUTOMÁTICO WHATSAPP
// -------------------------------------------------------------
async function checkAlertasPendentes() {
  try {
    if (typeof Swal !== 'undefined' && Swal.isVisible && Swal.isVisible()) return;
    const res = await fetch('/api/alertas-pendentes');
    if (!res.ok) return;
    const alertas = await res.json();

    if (Array.isArray(alertas) && alertas.length > 0) {
      const alerta = alertas[0];
      Swal.fire({
        title: '🔔 Chegou a Hora de Enviar a Renovação!',
        html: `
          <div style="text-align: left; background: #F8FAFC; padding: 1.25rem; border-radius: 12px; border: 1.5px solid #10B981; color: #0F172A; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <p style="margin-bottom: 0.6rem; font-size: 1rem; color: #0F172A;"><strong style="color: #0F172A;">Cliente:</strong> ${alerta.clienteNome}</p>
            <p style="margin-bottom: 0.6rem; font-size: 1rem; color: #0F172A;"><strong style="color: #0F172A;">Valor:</strong> <span style="color: #059669; font-weight: 800;">${formatCurrency(alerta.valor)}</span></p>
            <p style="margin-bottom: 0; font-size: 0.95rem; color: #334155;"><strong style="color: #0F172A;">Descrição:</strong> ${alerta.descricao}</p>
          </div>
          <p style="margin-top: 1rem; font-size: 0.95rem; color: #475569; font-weight: 500;">Clique no botão abaixo para abrir o WhatsApp Web e disparar o envio automaticamente.</p>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="fa-brands fa-whatsapp"></i> Disparar WhatsApp Agora',
        cancelButtonText: 'Depois',
        confirmButtonColor: '#25D366',
        cancelButtonColor: '#64748B',
        background: '#FFFFFF',
        color: '#0F172A'
      }).then((result) => {
        if (result.isConfirmed && alerta.linkWhatsApp) {
          window.open(alerta.linkWhatsApp, '_blank');
        }
      });

      fetchCobrancas();
      loadDashboardData();
    }
  } catch (err) {
    // Erros silenciosos no polling
  }
}

// -------------------------------------------------------------
// 10. FORMATADORES AUXILIARES
// -------------------------------------------------------------
function formatCurrency(val) {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatDateTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPhone(phoneStr) {
  if (!phoneStr) return '-';
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.length === 13) { // 5581999887766
    return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  return phoneStr;
}

// -------------------------------------------------------------
// 11. MONITORAMENTO E CONEXÃO QR CODE DO WHATSAPP
// -------------------------------------------------------------
async function checkWhatsAppStatus() {
  try {
    const res = await fetch('/api/whatsapp/status');
    const data = await res.json();

    const badge = document.getElementById('waStatusBadge');
    const qrImg = document.getElementById('waQrCodeImg');
    const connectedBox = document.getElementById('waConnectedInfo');
    const userNumText = document.getElementById('waUserNumberText');

    if (!badge) return;

    if (data.status === 'CONNECTED') {
      badge.className = 'badge badge-pago';
      badge.style.fontSize = '1rem';
      badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> WhatsApp Conectado (Robô Automático Ativo)`;

      if (qrImg) qrImg.style.display = 'none';
      if (connectedBox) connectedBox.style.display = 'block';
      if (userNumText) userNumText.textContent = `Número registrado: ${data.userNumber || 'Dispositivo Ativo'}`;
    } else if (data.status === 'SCAN_QR' && data.qrCodeDataUrl) {
      badge.className = 'badge badge-pendente';
      badge.style.fontSize = '1rem';
      badge.innerHTML = `<i class="fa-solid fa-qrcode"></i> Escaneie o QR Code abaixo no seu Celular`;

      if (qrImg) {
        qrImg.src = data.qrCodeDataUrl;
        qrImg.style.display = 'block';
      }
      if (connectedBox) connectedBox.style.display = 'none';
    } else if (data.status === 'GENERATING_QR') {
      badge.className = 'badge badge-agendado';
      badge.style.fontSize = '1rem';
      badge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Gerando QR Code Instantâneo... (Aguarde 2s)`;

      if (qrImg) qrImg.style.display = 'none';
      if (connectedBox) connectedBox.style.display = 'none';
    } else {
      badge.className = 'badge badge-vencido';
      badge.style.fontSize = '1rem';
      badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> WhatsApp Desconectado`;

      if (qrImg) qrImg.style.display = 'none';
      if (connectedBox) connectedBox.style.display = 'none';
    }
  } catch (err) {
    // Silencioso
  }
}

async function reconectarWhatsApp() {
  try {
    const badge = document.getElementById('waStatusBadge');
    if (badge) {
      badge.className = 'badge badge-agendado';
      badge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Gerando Novo QR Code...`;
    }

    const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
    const data = await res.json();

    Swal.fire({
      icon: 'info',
      title: '⚡ Gerando QR Code...',
      text: 'O QR Code aparecerá na tela em instantes.',
      timer: 1500,
      showConfirmButton: false,
      background: '#FFFFFF',
      color: '#000000'
    });

    // Polling rápido a cada 1 segundo para exibir o QR Code imediatamente quando for gerado pelo robô
    let count = 0;
    const intervalId = setInterval(async () => {
      count++;
      await checkWhatsAppStatus();
      const qrImg = document.getElementById('waQrCodeImg');
      if ((qrImg && qrImg.style.display === 'block') || count >= 15) {
        clearInterval(intervalId);
      }
    }, 1000);

  } catch (err) {
    console.error('Erro ao reconectar WhatsApp:', err);
  }
}

async function testarEnvioWhatsApp() {
  const { value: formValues } = await Swal.fire({
    title: '🚀 Testar Envio no WhatsApp',
    html: `
      <div style="text-align: left;">
        <label style="font-size: 0.85rem; color: #475569; font-weight: 700; margin-bottom: 0.35rem; display: block;">WhatsApp do Destinatário (DDD + Número)</label>
        <input id="swal-input-tel" class="swal2-input" placeholder="Ex: 11972560991" style="background: #F8FAFC; color: #0F172A; border: 1.5px solid #CBD5E1; margin: 0 0 1rem 0; width: 100%; font-size: 0.95rem;">
        <label style="font-size: 0.85rem; color: #475569; font-weight: 700; margin-bottom: 0.35rem; display: block;">Mensagem de Teste</label>
        <textarea id="swal-input-msg" class="swal2-textarea" placeholder="Mensagem para testar o envio..." style="background: #F8FAFC; color: #0F172A; border: 1.5px solid #CBD5E1; margin: 0; width: 100%; font-size: 0.95rem;">🚀 Teste de envio de cobrança automática via GESTOR DE COBRANÇAS!</textarea>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: '<i class="fa-solid fa-paper-plane"></i> Disparar Teste Agora',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#25D366',
    cancelButtonColor: '#64748B',
    background: '#FFFFFF',
    color: '#0F172A',
    preConfirm: () => {
      const tel = document.getElementById('swal-input-tel').value;
      const msg = document.getElementById('swal-input-msg').value;
      if (!tel) {
        Swal.showValidationMessage('Informe o número do WhatsApp!');
      }
      return { telefone: tel, mensagem: msg };
    }
  });

  if (formValues) {
    Swal.fire({
      title: 'Disparando no WhatsApp...',
      text: 'Aguarde um momento enquanto o robô entrega a mensagem.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#FFFFFF',
      color: '#000000'
    });

    try {
      const res = await fetch('/api/whatsapp/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Mensagem Entregue com Sucesso!',
          text: data.message,
          confirmButtonColor: '#10B981',
          background: '#FFFFFF',
          color: '#000000'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Falha no Envio',
          text: data.error || 'Não foi possível entregar a mensagem. Verifique se o QR Code está conectado.',
          confirmButtonColor: '#EF4444',
          background: '#FFFFFF',
          color: '#000000'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de Conexão',
        text: 'Não foi possível se comunicar com o servidor.',
        confirmButtonColor: '#EF4444',
        background: '#23150D',
        color: '#000000'
      });
    }
  }
}

// -------------------------------------------------------------
// 12. PLANOS & APPS IPTV (CATÁLOGO VIRTUAL)
// -------------------------------------------------------------
function filtrarPlanos() {
  renderCardsPlanos();
}

function calcularValorFinalPlanoModal() {
  const vBruto = parseFloat(document.getElementById('planoValor').value) || 0;
  const desc = parseFloat(document.getElementById('planoDesconto') ? document.getElementById('planoDesconto').value : 0) || 0;
  const vFinal = Math.max(0, vBruto - desc);
  const el = document.getElementById('planoValorFinalCalculado');
  if (el) el.textContent = formatCurrency(vFinal);
}

function renderCardsPlanos() {
  const container = document.getElementById('planosCardsGrid');
  if (!container) return;

  const statTotal = document.getElementById('statTotalPlanosCount');
  if (statTotal) statTotal.textContent = globalPlanos.length;

  const inputFilter = document.getElementById('filterPlanosInput');
  const query = inputFilter ? inputFilter.value.trim().toLowerCase() : '';

  const list = query 
    ? globalPlanos.filter(p => (p.nome || '').toLowerCase().includes(query) || (p.categoria || '').toLowerCase().includes(query) || (p.telas || '').toLowerCase().includes(query) || (p.descricao || '').toLowerCase().includes(query))
    : globalPlanos;

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">${query ? 'Nenhum plano encontrado com este termo.' : 'Nenhum plano cadastrado. Clique no botão acima para adicionar!'}</div>`;
    return;
  }

  container.innerHTML = list.map(plano => {
    let badgeClass = 'badge-agendado';
    if (plano.corBadge === 'neon-green') badgeClass = 'badge-pago';
    if (plano.corBadge === 'neon-blue') badgeClass = 'badge-agendado';
    if (plano.corBadge === 'danger') badgeClass = 'badge-vencido';

    const vBruto = plano.valor || 0;
    const desc = plano.desconto || 0;
    const vFinal = Math.max(0, vBruto - desc);

    const priceHtml = desc > 0 
      ? `
        <div style="display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
          <span style="font-size: 1.8rem; font-weight: 800; color: var(--emerald-light);">${formatCurrency(vFinal)}</span>
          <span style="font-size: 1rem; color: var(--text-brown-muted); text-decoration: line-through;">${formatCurrency(vBruto)}</span>
          <span class="badge" style="background: rgba(0, 255, 135, 0.2); border: 1px solid var(--neon-green); color: var(--neon-green); font-size: 0.75rem;">
            <i class="fa-solid fa-tag"></i> Desc. ${formatCurrency(desc)}
          </span>
        </div>
      `
      : `
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--emerald-light); margin-bottom: 0.75rem;">
          ${formatCurrency(vBruto)}
          <span style="font-size: 0.85rem; color: var(--text-brown-muted); font-weight: 400;">/ ${plano.validade.toLowerCase()}</span>
        </div>
      `;

    const recursosList = (plano.descricao || '')
      .split(',')
      .map(r => `<li style="margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fa-solid fa-check" style="color: var(--emerald-primary);"></i> ${r.trim()}</li>`)
      .join('');

    return `
      <div class="glass-panel" style="position: relative; display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid var(--neon-blue);">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <span class="badge ${badgeClass}"><i class="fa-solid fa-tag"></i> ${plano.categoria}</span>
            <span style="font-size: 0.8rem; color: var(--text-brown-muted); font-weight: 600;"><i class="fa-regular fa-clock"></i> ${plano.validade}</span>
          </div>

          <h3 style="font-size: 1.2rem; font-weight: 800; color: #000000; margin-bottom: 0.35rem;">${plano.nome}</h3>

          <div style="font-size: 0.85rem; color: var(--neon-blue); font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-desktop"></i> ${plano.telas || '1 Tela'}
          </div>
          
          ${priceHtml}

          <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
            ${recursosList}
          </ul>
        </div>

        <div>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
            <button class="btn-primary" style="flex: 1; justify-content: center; font-size: 0.85rem;" onclick="criarCobrancaDePlano('${plano.id}')">
              <i class="fa-solid fa-file-invoice-dollar"></i> Gerar Cobrança
            </button>
            <button class="btn-whatsapp-sm" style="font-size: 0.85rem; padding: 0.5rem 0.75rem;" onclick="copiarPromoPlano('${plano.id}')" title="Copiar Mensagem Promocional">
              <i class="fa-solid fa-copy"></i> Copiar Oferta
            </button>
          </div>

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
            <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" type="button" onclick="editarPlano('${plano.id}')">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-danger-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="deletarPlano('${plano.id}')">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function abrirModalNovoPlano() {
  const pId = document.getElementById('planoId'); if (pId) pId.value = '';
  const pTitle = document.getElementById('modalPlanoTitle');
  if (pTitle) pTitle.innerHTML = '<i class="fa-solid fa-tv" style="color: var(--neon-blue);"></i> Cadastrar Novo Plano de Canais';
  const fPlano = document.getElementById('formPlano'); if (fPlano) fPlano.reset();
  if (document.getElementById('planoDesconto')) document.getElementById('planoDesconto').value = '0.00';
  if (typeof calcularValorFinalPlanoModal === 'function') calcularValorFinalPlanoModal();
  abrirModal('modalPlano');
}
window.abrirModalNovoPlano = abrirModalNovoPlano;

async function editarPlano(id) {
  const cleanId = String(id || '').trim();
  let p = globalPlanos.find(item => String(item.id).trim() === cleanId);
  if (!p && cleanId) {
    p = globalPlanos.find(item => String(item.id).trim().toLowerCase() === cleanId.toLowerCase());
  }
  if (!p && cleanId) {
    try {
      const res = await fetch(`/api/planos/${encodeURIComponent(cleanId)}`);
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
}
window.editarPlano = editarPlano;

function fecharModalPlano() {
  fecharModal('modalPlano');
}

async function deletarPlano(id) {
  const confirm = await Swal.fire({
    title: 'Excluir Plano?',
    text: "Esta ação não afeta cobranças já geradas com este plano.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#FFFFFF',
    color: '#000000'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/planos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Plano excluído!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchPlanos();
      }
    } catch (err) {
      console.error('Erro ao excluir plano:', err);
    }
  }
}

function criarCobrancaDePlano(planoId) {
  const plano = globalPlanos.find(p => p.id === planoId);
  if (!plano) return;

  const vFinal = Math.max(0, (plano.valor || 0) - (plano.desconto || 0));

  abrirModalNovaCobranca();
  if (document.getElementById('cobPlanoId')) {
    document.getElementById('cobPlanoId').value = plano.id;
  }
  document.getElementById('cobValor').value = vFinal;
  document.getElementById('cobDescricao').value = `RENOVE SEU PLANO (${plano.nome.toUpperCase()}) - HOJE É O VENCIMENTO DO SEU PLANO.`;
}

function copiarPromoPlano(planoId) {
  const plano = globalPlanos.find(p => p.id === planoId);
  if (!plano) return;

  const vBruto = plano.valor || 0;
  const desc = plano.desconto || 0;
  const vFinal = Math.max(0, vBruto - desc);

  const valorMsg = desc > 0 ? `~${formatCurrency(vBruto)}~ ➡️ *${formatCurrency(vFinal)}* (Desconto Especial!)` : `${formatCurrency(vBruto)}`;

  const msg = `🔥 *OFERTA ESPECIAL - ${plano.nome.toUpperCase()}* 🔥\n\n` +
    `📌 *Categoria:* ${plano.categoria}\n` +
    `⏳ *Validade:* ${plano.validade}\n` +
    `💰 *Valor:* ${valorMsg}\n\n` +
    `✨ *Recursos inclusos:*\n${plano.descricao}\n\n` +
    `🚀 *Garanta seu acesso agora mesmo!*\n` +
    `EQUIPE: *Gerailton Neves*`;

  navigator.clipboard.writeText(msg).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'Mensagem Copiada!',
      text: 'Texto promocional pronto para colar no WhatsApp!',
      timer: 2000,
      showConfirmButton: false,
      background: '#FFFFFF',
      color: '#000000'
    });
  });
}

// -------------------------------------------------------------
// 13. APLICATIVOS / APPS (CATÁLOGO)
// -------------------------------------------------------------
function filtrarApps() {
  renderCardsApps();
}

function renderCardsApps() {
  const container = document.getElementById('appsCardsGrid');
  if (!container) return;

  const statTotal = document.getElementById('statTotalAppsCount');
  if (statTotal) statTotal.textContent = globalApps.length;

  const inputFilter = document.getElementById('filterAppsInput');
  const query = inputFilter ? inputFilter.value.trim().toLowerCase() : '';

  const list = query
    ? globalApps.filter(a => (a.nome || '').toLowerCase().includes(query) || (a.categoria || '').toLowerCase().includes(query) || (a.descricao || '').toLowerCase().includes(query))
    : globalApps;

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">${query ? 'Nenhum aplicativo encontrado com este termo.' : 'Nenhum aplicativo cadastrado. Clique no botão acima para adicionar!'}</div>`;
    return;
  }

  container.innerHTML = list.map(app => `
    <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid var(--neon-blue);">
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <span class="badge badge-agendado"><i class="fa-solid fa-mobile-screen-button"></i> ${app.categoria}</span>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #000000; margin-bottom: 0.5rem;">${app.nome}</h3>
        <p style="font-size: 0.85rem; color: var(--text-brown-muted); margin-bottom: 1rem; line-height: 1.5;">${app.descricao || 'Sem descrição cadastrada.'}</p>
      </div>

      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" type="button" onclick="editarApp('${app.id}')">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn-danger-sm" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="deletarApp('${app.id}')">
          <i class="fa-solid fa-trash"></i> Excluir
        </button>
      </div>
    </div>
  `).join('');
}

function abrirModalNovoApp() {
  const aId = document.getElementById('appId'); if (aId) aId.value = '';
  const aTitle = document.getElementById('modalAppTitle');
  if (aTitle) aTitle.innerHTML = '<i class="fa-solid fa-mobile-screen-button" style="color: var(--neon-blue);"></i> Cadastrar Aplicativo / App';
  const fApp = document.getElementById('formApp'); if (fApp) fApp.reset();
  abrirModal('modalApp');
}
window.abrirModalNovoApp = abrirModalNovoApp;

async function editarApp(id) {
  const cleanId = String(id || '').trim();
  let app = globalApps.find(a => String(a.id).trim() === cleanId);
  if (!app && cleanId) {
    app = globalApps.find(a => String(a.id).trim().toLowerCase() === cleanId.toLowerCase());
  }
  if (!app && cleanId) {
    try {
      const res = await fetch(`/api/apps/${encodeURIComponent(cleanId)}`);
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
}
window.editarApp = editarApp;

function fecharModalApp() {
  fecharModal('modalApp');
}

async function deletarApp(id) {
  const confirm = await Swal.fire({
    title: 'Excluir Aplicativo?',
    text: "O aplicativo será removido do catálogo.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#FFFFFF',
    color: '#1E293B'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Aplicativo excluído!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#1E293B' });
        await fetchApps();
      }
    } catch (err) {
      console.error('Erro ao excluir app:', err);
    }
  }
}

// -------------------------------------------------------------
// 14. SERVIDORES / PAINÉIS (CATÁLOGO)
// -------------------------------------------------------------
function filtrarServidores() {
  renderCardsServidores();
}

function renderCardsServidores() {
  const container = document.getElementById('servidoresCardsGrid');
  if (!container) return;

  const statTotal = document.getElementById('statTotalServidoresCount');
  if (statTotal) statTotal.textContent = globalServidores.length;

  const inputFilter = document.getElementById('filterServidoresInput');
  const query = inputFilter ? inputFilter.value.trim().toLowerCase() : '';

  const list = query
    ? globalServidores.filter(s => (s.nome || '').toLowerCase().includes(query) || (s.categoria || '').toLowerCase().includes(query) || (s.descricao || '').toLowerCase().includes(query))
    : globalServidores;

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">${query ? 'Nenhum servidor encontrado com este termo.' : 'Nenhum servidor cadastrado. Clique no botão acima para adicionar!'}</div>`;
    return;
  }

  container.innerHTML = list.map(srv => `
    <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid var(--emerald-primary);">
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <span class="badge badge-pago"><i class="fa-solid fa-server"></i> ${srv.categoria}</span>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #000000; margin-bottom: 0.5rem;">${srv.nome}</h3>
        <p style="font-size: 0.85rem; color: var(--text-brown-muted); margin-bottom: 1rem; line-height: 1.5;">${srv.descricao || 'Sem observações cadastradas.'}</p>
      </div>

      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" type="button" onclick="editarServidor('${srv.id}')">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn-danger-sm" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="deletarServidor('${srv.id}')">
          <i class="fa-solid fa-trash"></i> Excluir
        </button>
      </div>
    </div>
  `).join('');
}

function abrirModalNovoServidor() {
  const sId = document.getElementById('servidorId'); if (sId) sId.value = '';
  const sTitle = document.getElementById('modalServidorTitle');
  if (sTitle) sTitle.innerHTML = '<i class="fa-solid fa-server" style="color: var(--emerald-primary);"></i> Cadastrar Servidor / Painel';
  const fSrv = document.getElementById('formServidor'); if (fSrv) fSrv.reset();
  abrirModal('modalServidor');
}
window.abrirModalNovoServidor = abrirModalNovoServidor;

async function editarServidor(id) {
  const cleanId = String(id || '').trim();
  let srv = globalServidores.find(s => String(s.id).trim() === cleanId);
  if (!srv && cleanId) {
    srv = globalServidores.find(s => String(s.id).trim().toLowerCase() === cleanId.toLowerCase());
  }
  if (!srv && cleanId) {
    try {
      const res = await fetch(`/api/servidores/${encodeURIComponent(cleanId)}`);
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
}
window.editarServidor = editarServidor;

function fecharModalServidor() {
  fecharModal('modalServidor');
}

async function deletarServidor(id) {
  const confirm = await Swal.fire({
    title: 'Excluir Servidor?',
    text: "O servidor será removido do catálogo.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#FFFFFF',
    color: '#000000'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/servidores/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Servidor excluído!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchServidores();
      }
    } catch (err) {
      console.error('Erro ao excluir servidor:', err);
    }
  }
}

// -------------------------------------------------------------
// 10. MODELOS DE MENSAGENS E PROMOÇÕES EDITÁVEIS (CATÁLOGO & CRUD)
// -------------------------------------------------------------
let lastFocusedTextarea = null;

document.addEventListener('focusin', (e) => {
  if (e.target && e.target.tagName === 'TEXTAREA') {
    lastFocusedTextarea = e.target;
  }
});

function insertTagIntoActiveTextarea(tag) {
  insertTagIntoTextarea(lastFocusedTextarea ? lastFocusedTextarea.id : 'modeloMensagem', tag);
}

function insertTagIntoTextarea(elementId, tag) {
  const el = document.getElementById(elementId) || lastFocusedTextarea;
  if (el) {
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const text = el.value || '';
    el.value = text.substring(0, start) + tag + text.substring(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + tag.length;
  }
}

async function fetchModelosMensagens() {
  try {
    const res = await fetch('/api/modelos-mensagens');
    const data = await res.json();
    globalModelosMensagens = Array.isArray(data) ? data : [];
    renderCardsModelosMensagens();
    populateClientOptionsSelects();
    populateCobrancaOptionsSelects();
  } catch (err) {
    console.error('Erro ao buscar modelos de mensagens:', err);
  }
}

function renderCardsModelosMensagens() {
  const container = document.getElementById('modelosCardsGrid');
  if (!container) return;

  if (globalModelosMensagens.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">Nenhum modelo de mensagem cadastrado. Clique no botão acima para adicionar!</div>`;
    return;
  }

  const categoryColors = {
    'Cobrança': 'var(--neon-blue)',
    'Atrasados': 'var(--danger-color)',
    'Renovação': 'var(--neon-green)',
    'Promoções': '#FFD700',
    'Personalizada': '#A855F7'
  };

  container.innerHTML = globalModelosMensagens.map(modelo => {
    const cardColor = categoryColors[modelo.categoria] || 'var(--neon-blue)';

    return `
      <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid ${cardColor};">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: #000000; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-comment-dots" style="color: ${cardColor};"></i> ${modelo.titulo}
            </h3>
            <span class="badge" style="background: rgba(255,255,255,0.08); border: 1px solid ${cardColor}; color: #000000; font-size: 0.75rem; padding: 0.2rem 0.5rem;">
              ${modelo.categoria || 'Geral'}
            </span>
          </div>

          <div style="background: rgba(0, 0, 0, 0.25); padding: 0.85rem; border-radius: 10px; border: 1px solid var(--border-color); font-family: monospace; font-size: 0.82rem; color: #CBD5E1; line-height: 1.4; white-space: pre-wrap; word-break: break-word; margin-bottom: 1rem; max-height: 180px; overflow-y: auto;">${modelo.mensagem}</div>
        </div>

        <div>
          <div style="display: flex; gap: 0.5rem; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
            <button class="btn-whatsapp-sm" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;" onclick="abrirModalDispararModelo('${modelo.id}')">
              <i class="fa-solid fa-paper-plane"></i> Disparar p/ Cliente
            </button>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;" onclick="editarModelo('${modelo.id}')">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
              <button class="btn-danger-sm" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;" onclick="deletarModelo('${modelo.id}')">
                <i class="fa-solid fa-trash"></i> Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function abrirModalNovoModelo() {
  const modal = document.getElementById('modalModeloMensagem');
  if (!modal) {
    console.error('Modal #modalModeloMensagem não encontrado no DOM!');
    return;
  }
  const inputId = document.getElementById('modeloId');
  if (inputId) inputId.value = '';

  const titleEl = document.getElementById('modalModeloTitle');
  if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-comment-dots" style="color: var(--neon-blue);"></i> Cadastrar Novo Modelo de Mensagem`;

  const formEl = document.getElementById('formModeloMensagem');
  if (formEl) formEl.reset();

  modal.classList.add('active');
}

function editarModelo(id) {
  let m = globalModelosMensagens.find(item => item.id === id);
  if (!m) {
    m = globalModelosMensagens.find(item => item.id && item.id.includes(id)) || {
      id: id,
      titulo: 'Editar Modelo',
      categoria: 'Personalizada',
      mensagem: ''
    };
  }

  const modal = document.getElementById('modalModeloMensagem');
  if (!modal) {
    console.error('Modal #modalModeloMensagem não encontrado!');
    return;
  }

  const inputId = document.getElementById('modeloId');
  if (inputId) inputId.value = m.id || id;

  const titleEl = document.getElementById('modalModeloTitle');
  if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen"></i> Editar Modelo de Mensagem`;

  const inputTitulo = document.getElementById('modeloTitulo');
  if (inputTitulo) inputTitulo.value = m.titulo || '';

  const inputCat = document.getElementById('modeloCategoria');
  if (inputCat) inputCat.value = m.categoria || 'Personalizada';

  const inputMsg = document.getElementById('modeloMensagem');
  if (inputMsg) inputMsg.value = m.mensagem || '';

  modal.classList.add('active');
}

function fecharModalModeloMensagem() {
  const modal = document.getElementById('modalModeloMensagem');
  if (modal) modal.classList.remove('active');
}

async function deletarModelo(id) {
  const confirm = await Swal.fire({
    title: 'Excluir Modelo de Mensagem?',
    text: "Você pode cadastrar novos modelos sempre que desejar.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#FFFFFF',
    color: '#000000'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/modelos-mensagens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Modelo excluído!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
        await fetchModelosMensagens();
      }
    } catch (err) {
      console.error('Erro ao excluir modelo:', err);
    }
  }
}

async function salvarModeloMensagem(e) {
  if (e) e.preventDefault();
  const inputId = document.getElementById('modeloId');
  const inputTitulo = document.getElementById('modeloTitulo');
  const inputCat = document.getElementById('modeloCategoria');
  const inputMsg = document.getElementById('modeloMensagem');

  if (!inputTitulo || !inputMsg) return;

  const id = inputId ? inputId.value : '';
  const bodyData = {
    id,
    titulo: inputTitulo.value,
    categoria: inputCat ? inputCat.value : 'Personalizada',
    mensagem: inputMsg.value
  };

  try {
    const res = await fetch('/api/modelos-mensagens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (res.ok) {
      fecharModalModeloMensagem();
      Swal.fire({ icon: 'success', title: id ? 'Modelo Atualizado!' : 'Modelo Cadastrado!', timer: 1500, showConfirmButton: false, background: '#FFFFFF', color: '#000000' });
      await fetchModelosMensagens();
    }
  } catch (err) {
    console.error('Erro ao salvar modelo:', err);
  }
}

function abrirModalDispararModelo(modeloIdOptional, clienteIdOptional) {
  const cliSelect = document.getElementById('disparoClienteId');
  if (cliSelect) {
    cliSelect.innerHTML = `<option value="">-- Selecione o Cliente --</option>` +
      globalClientes.map(c => `<option value="${c.id}">${c.nome} (${formatPhone(c.telefone)})</option>`).join('');
    
    if (clienteIdOptional) {
      cliSelect.value = clienteIdOptional;
    }
  }

  const modeloSelect = document.getElementById('disparoModeloId');
  if (modeloSelect) {
    modeloSelect.innerHTML = `<option value="">-- Selecione o Modelo --</option>` +
      globalModelosMensagens.map(m => `<option value="${m.id}">${m.titulo} (${m.categoria})</option>`).join('');
    
    if (modeloIdOptional) {
      modeloSelect.value = modeloIdOptional;
      carregarTextoModeloSelecionado();
    } else if (globalModelosMensagens.length > 0) {
      modeloSelect.value = globalModelosMensagens[0].id;
      carregarTextoModeloSelecionado();
    }
  }

  atualizarPreviewDisparoCustom();
  const modal = document.getElementById('modalDispararModelo');
  if (modal) modal.classList.add('active');
}

function fecharModalDispararModelo() {
  const modal = document.getElementById('modalDispararModelo');
  if (modal) modal.classList.remove('active');
}

function carregarTextoModeloSelecionado() {
  const select = document.getElementById('disparoModeloId');
  if (!select) return;
  const modeloId = select.value;
  const m = globalModelosMensagens.find(item => item.id === modeloId);
  const textarea = document.getElementById('disparoMensagemTexto');
  if (m && textarea) {
    textarea.value = m.mensagem;
  }
  atualizarPreviewDisparoCustom();
}

function atualizarPreviewDisparoCustom() {
  const cliSelect = document.getElementById('disparoClienteId');
  const txtArea = document.getElementById('disparoMensagemTexto');
  const previewBox = document.getElementById('disparoLivePreviewBox');

  if (!previewBox) return;
  const cliId = cliSelect ? cliSelect.value : '';
  const rawText = txtArea ? txtArea.value : '';

  if (!cliId) {
    previewBox.textContent = 'Selecione um cliente acima para ver a pré-visualização formatada com os dados dele.';
    return;
  }

  const cli = globalClientes.find(c => c.id === cliId);
  if (!cli) return;

  const cobrancasCli = globalCobrancas.filter(c => c.clienteId === cli.id);
  const cob = cobrancasCli.length > 0 ? cobrancasCli[0] : { valor: 35, dataVencimento: new Date().toISOString().split('T')[0], descricao: 'Plano de Canais IPTV' };

  let msg = rawText || '';
  const valorFmt = formatCurrency(cob.valor || 35);
  const dtVencFmt = formatDate(cob.dataVencimento || new Date().toISOString().split('T')[0]);
  const dtPagtoFmt = formatDate(new Date().toISOString().split('T')[0]);
  const dtProxVencFmt = cob.proximoVencimento ? formatDate(cob.proximoVencimento) : formatDate(new Date().toISOString().split('T')[0]);

  msg = msg.replace(/\{nome\}/g, cli.nome.trim());
  msg = msg.replace(/\{valor\}/g, valorFmt);
  msg = msg.replace(/\{vencimento\}/g, dtVencFmt);
  msg = msg.replace(/\{data_pagamento\}/g, dtPagtoFmt);
  msg = msg.replace(/\{proximo_vencimento\}/g, dtProxVencFmt);
  msg = msg.replace(/\{descricao\}/g, cob.descricao || 'Plano de Canais');
  msg = msg.replace(/\{pix_titular\}/g, globalMeusDados.nomeTitular || 'Gerailton Neves');
  msg = msg.replace(/\{pix_banco\}/g, globalMeusDados.banco || 'PIX');
  msg = msg.replace(/\{pix_tipo\}/g, globalMeusDados.tipoChave || 'Celular');
  msg = msg.replace(/\{pix_chave\}/g, globalMeusDados.chavePix || '');
  msg = msg.replace(/\{pix_instrucoes\}/g, globalMeusDados.instrucoes || 'Ao efetuar o pagamento via PIX, favor enviar o comprovante.');
  msg = msg.replace(/\{equipe\}/g, 'Gerailton Neves');

  previewBox.textContent = msg;
}

async function dispararModeloSelecionado(e) {
  if (e) e.preventDefault();

  const clienteId = document.getElementById('disparoClienteId').value;
  const modeloId = document.getElementById('disparoModeloId').value;
  const textoCustomizado = document.getElementById('disparoMensagemTexto').value;

  if (!clienteId) {
    Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione um cliente para receber a mensagem.', confirmButtonColor: '#00F0FF', background: '#FFFFFF', color: '#000000' });
    return;
  }

  try {
    const res = await fetch('/api/modelos-mensagens/disparar-selecionada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, modeloId, textoCustomizado })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      fecharModalDispararModelo();

      if (data.enviouDireto) {
        Swal.fire({
          icon: 'success',
          title: '🚀 Mensagem Entregue com Sucesso!',
          text: 'O modelo de mensagem escolhido foi entregue diretamente no WhatsApp do cliente!',
          confirmButtonColor: '#00FF87',
          background: '#FFFFFF',
          color: '#000000'
        });
      } else if (data.linkWhatsApp) {
        window.open(data.linkWhatsApp, '_blank');
        Swal.fire({
          icon: 'info',
          title: 'Aba do WhatsApp Aberta!',
          text: 'A janela do WhatsApp Web foi aberta com o texto preenchido contendo as variáveis substituídas!',
          confirmButtonColor: '#00F0FF',
          background: '#FFFFFF',
          color: '#000000'
        });
      }
    }
  } catch (err) {
    console.error('Erro ao disparar modelo de mensagem:', err);
  }
}

function abrirModalPromocao() {
  const select = document.getElementById('promoClienteId');
  if (select) {
    select.innerHTML = `<option value="">-- Selecione o Cliente --</option>` +
      globalClientes.map(c => `<option value="${c.id}">${c.nome} (${formatPhone(c.telefone)})</option>`).join('');
  }
  document.getElementById('promoTargetType').value = 'todos';
  togglePromoTargetSelect();
  document.getElementById('modalPromocao').classList.add('active');
}

function fecharModalPromocao() {
  document.getElementById('modalPromocao').classList.remove('active');
}

function togglePromoTargetSelect() {
  const val = document.getElementById('promoTargetType').value;
  const group = document.getElementById('promoClienteSelectGroup');
  if (group) {
    group.style.display = val === 'unico' ? 'block' : 'none';
  }
}

// Exposição explícita para o escopo global Window
window.abrirModalNovoModelo = abrirModalNovoModelo;
window.editarModelo = editarModelo;
window.deletarModelo = deletarModelo;
window.salvarModeloMensagem = salvarModeloMensagem;
window.fecharModalModeloMensagem = fecharModalModeloMensagem;
window.abrirModalDispararModelo = abrirModalDispararModelo;
window.fecharModalDispararModelo = fecharModalDispararModelo;
window.carregarTextoModeloSelecionado = carregarTextoModeloSelecionado;
window.atualizarPreviewDisparoCustom = atualizarPreviewDisparoCustom;
window.dispararModeloSelecionado = dispararModeloSelecionado;
window.insertTagIntoTextarea = insertTagIntoTextarea;
window.insertTagIntoActiveTextarea = insertTagIntoActiveTextarea;
window.fetchModelosMensagens = fetchModelosMensagens;
window.abrirModalPromocao = abrirModalPromocao;
window.fecharModalPromocao = fecharModalPromocao;

window.filtrarPlanos = filtrarPlanos;
window.filtrarApps = filtrarApps;
window.filtrarServidores = filtrarServidores;
window.calcularValorFinalPlanoModal = calcularValorFinalPlanoModal;
window.deletarPlano = deletarPlano;
window.fecharModalPlano = fecharModalPlano;
window.copiarPromoPlano = copiarPromoPlano;
window.criarCobrancaDePlano = criarCobrancaDePlano;
window.deletarApp = deletarApp;
window.fecharModalApp = fecharModalApp;
window.deletarServidor = deletarServidor;
window.fecharModalServidor = fecharModalServidor;

// -----------------------------------------------------------------
// SUPORTE PWA - REGISTRO DE SERVICE WORKER E INSTALAÇÃO NO CELULAR
// -----------------------------------------------------------------
let deferredPwaPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('📱 [PWA] Service Worker registrado com sucesso:', reg.scope))
      .catch(err => console.error('⚠️ [PWA] Erro ao registrar Service Worker:', err));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;

  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.style.display = 'flex';

  const mobileBtn = document.getElementById('mobileHeaderInstallBtn');
  if (mobileBtn) mobileBtn.style.display = 'inline-flex';

  const btnPwa = document.getElementById('btnPwaInstall');
  if (btnPwa) {
    btnPwa.onclick = () => iniciarInstalacaoPwa();
  }

  const btnModalTrigger = document.getElementById('btnModalTriggerInstall');
  if (btnModalTrigger) {
    btnModalTrigger.onclick = () => iniciarInstalacaoPwa();
  }
});

function iniciarInstalacaoPwa() {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('🎉 Usuário aceitou a instalação do App PWA!');
        dismissPwaBanner();
      }
      deferredPwaPrompt = null;
    });
  } else {
    abrirModalPwaInstalar(isIos);
  }
}

function dismissPwaBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.style.display = 'none';
}

function abrirModalPwaInstalar(isIos = false) {
  const modal = document.getElementById('modalPwaInstalar');
  const iosBox = document.getElementById('pwaIosInstructions');
  const androidBox = document.getElementById('pwaAndroidInstructions');

  if (isIos) {
    if (iosBox) iosBox.style.display = 'block';
    if (androidBox) androidBox.style.display = 'none';
  } else {
    if (iosBox) iosBox.style.display = 'block';
    if (androidBox && deferredPwaPrompt) androidBox.style.display = 'block';
  }

  if (modal) modal.classList.add('active');
}

function fecharModalPwaInstalar() {
  const modal = document.getElementById('modalPwaInstalar');
  if (modal) modal.classList.remove('active');
}

window.iniciarInstalacaoPwa = iniciarInstalacaoPwa;
window.dismissPwaBanner = dismissPwaBanner;
window.abrirModalPwaInstalar = abrirModalPwaInstalar;
window.fecharModalPwaInstalar = fecharModalPwaInstalar;

// Helper universal e robusto para requisições JSON
async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Erro no servidor (${res.status})`);
      }
      return data;
    }

    const text = await res.text();
    let errorMsg = `Erro no servidor (${res.status})`;

    const preMatch = text.match(/<pre>(.*?)<\/pre>/s);
    if (preMatch && preMatch[1]) {
      errorMsg = preMatch[1].replace(/<br\s*[\/]?>/gi, ' ').trim();
    } else if (res.status === 502 || res.status === 503) {
      errorMsg = "O servidor na nuvem está inicializando. Aguarde alguns segundos.";
    } else if (res.status === 404) {
      errorMsg = "Rota do servidor não encontrada (404).";
    }

    if (!res.ok) {
      throw new Error(errorMsg);
    }

    throw new Error("Resposta do servidor não veio em formato JSON.");
  } catch (err) {
    if (err.message && (err.message.includes('Unexpected token') || err.message.includes('is not valid JSON'))) {
      throw new Error("Erro de comunicação com o servidor. Tente novamente em alguns instantes.");
    }
    throw err;
  }
}

// -----------------------------------------------------------------
// CONFIGURAÇÕES DE ALERTAS DO ADMINISTRADOR NO WHATSAPP
// -----------------------------------------------------------------
async function loadConfiguracoesAdmin() {
  const inputWhats = document.getElementById('adminWhatsappInput');
  const selectHorario = document.getElementById('adminHorarioSelect');
  const checkEnviar = document.getElementById('adminEnviarCheck');

  // Backup local para garantia imediata no dispositivo
  const localWhats = localStorage.getItem('adminWhatsapp') || '';
  const localHorario = localStorage.getItem('adminHorario') || '08:00';
  const localEnviar = localStorage.getItem('adminEnviar') !== 'false';

  if (inputWhats && !inputWhats.value) inputWhats.value = localWhats;
  if (selectHorario) selectHorario.value = localHorario;
  if (checkEnviar) checkEnviar.checked = localEnviar;

  try {
    const data = await safeFetchJson('/api/configuracoes-admin');
    if (data) {
      if (inputWhats) inputWhats.value = data.whatsappAdmin || localWhats;
      if (selectHorario) selectHorario.value = data.horarioEnvioAdmin || localHorario;
      if (checkEnviar) checkEnviar.checked = data.enviarAlertasAdmin !== false;

      // Sincroniza backup local
      if (data.whatsappAdmin) localStorage.setItem('adminWhatsapp', data.whatsappAdmin);
      if (data.horarioEnvioAdmin) localStorage.setItem('adminHorario', data.horarioEnvioAdmin);
      localStorage.setItem('adminEnviar', data.enviarAlertasAdmin !== false ? 'true' : 'false');
    }
  } catch (err) {
    console.error("Aviso ao carregar configurações do admin da nuvem (usando backup local):", err);
  }
}

async function salvarConfiguracoesAdmin(event) {
  if (event) event.preventDefault();
  
  const inputWhats = document.getElementById('adminWhatsappInput');
  const selectHorario = document.getElementById('adminHorarioSelect');
  const checkEnviar = document.getElementById('adminEnviarCheck');

  const whatsappAdmin = inputWhats ? inputWhats.value.trim() : '';
  const horarioEnvioAdmin = selectHorario ? selectHorario.value : '08:00';
  const enviarAlertasAdmin = checkEnviar ? checkEnviar.checked : true;

  if (!whatsappAdmin) {
    Swal.fire({
      icon: 'warning',
      title: 'Atenção',
      text: 'Por favor, informe seu número de WhatsApp com DDD para receber os alertas diários.',
      background: '#FFFFFF',
      color: '#000000'
    });
    return;
  }

  // Persiste no localStorage do dispositivo para garantia instantânea de 100% de salvamento
  localStorage.setItem('adminWhatsapp', whatsappAdmin);
  localStorage.setItem('adminHorario', horarioEnvioAdmin);
  localStorage.setItem('adminEnviar', enviarAlertasAdmin ? 'true' : 'false');

  try {
    const result = await safeFetchJson('/api/configuracoes-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappAdmin, horarioEnvioAdmin, enviarAlertasAdmin })
    });

    if (result && result.success) {
      if (inputWhats && result.configuracoes && result.configuracoes.whatsappAdmin) {
        inputWhats.value = result.configuracoes.whatsappAdmin;
        localStorage.setItem('adminWhatsapp', result.configuracoes.whatsappAdmin);
      }
      Swal.fire({
        icon: 'success',
        title: 'Configurações Salvas com Sucesso!',
        text: 'Seu número de WhatsApp e o horário foram salvos com sucesso no sistema!',
        background: '#FFFFFF',
        color: '#000000'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Salvo no Dispositivo!',
        text: 'Seu WhatsApp foi salvo com sucesso no seu dispositivo!',
        background: '#FFFFFF',
        color: '#000000'
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'success',
      title: 'Salvo no Dispositivo!',
      text: 'Seu número de WhatsApp foi salvo com sucesso no seu dispositivo!',
      background: '#FFFFFF',
      color: '#000000'
    });
  }
}

async function testarAlertaAdmin() {
  const inputWhats = document.getElementById('adminWhatsappInput');
  const whatsappAdmin = (inputWhats ? inputWhats.value.trim() : '') || localStorage.getItem('adminWhatsapp') || '';

  if (!whatsappAdmin) {
    Swal.fire({
      icon: 'warning',
      title: 'Atenção',
      text: 'Por favor, digite seu número de WhatsApp com DDD e clique em salvar antes de disparar o teste.',
      background: '#FFFFFF',
      color: '#000000'
    });
    return;
  }

  const confirmRes = await Swal.fire({
    icon: 'question',
    title: 'Disparar Teste?',
    text: `Deseja enviar uma mensagem de teste agora para o seu WhatsApp (${whatsappAdmin})?`,
    showCancelButton: true,
    confirmButtonText: 'Sim, Disparar Teste',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0284C7',
    background: '#FFFFFF',
    color: '#000000'
  });

  if (!confirmRes.isConfirmed) return;

  try {
    const result = await safeFetchJson('/api/testar-alerta-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappAdmin })
    });

    if (result && result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Teste Enviado com Sucesso!',
        text: `Mensagem de alerta disparada com sucesso para o seu WhatsApp (${whatsappAdmin})!`,
        background: '#FFFFFF',
        color: '#000000'
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Aviso do WhatsApp',
        text: (result && result.error) ? result.error : 'Verifique se o WhatsApp QR Code está conectado na aba "Conectar WhatsApp (QR)".',
        background: '#FFFFFF',
        color: '#000000'
      });
    }
  } catch (err) {
    let msg = err.message || 'Falha ao tentar disparar a mensagem de teste.';
    if (msg.includes('Cannot POST') || msg.includes('404')) {
      msg = 'O Railway ainda está concluindo a atualização no servidor. Por favor, aguarde cerca de 30 a 60 segundos e tente novamente!';
    }
    Swal.fire({
      icon: 'error',
      title: 'Aguarde a Atualização',
      text: msg,
      background: '#FFFFFF',
      color: '#000000'
    });
  }
}

window.loadConfiguracoesAdmin = loadConfiguracoesAdmin;
window.salvarConfiguracoesAdmin = salvarConfiguracoesAdmin;
window.testarAlertaAdmin = testarAlertaAdmin;




