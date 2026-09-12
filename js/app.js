// State Global da Aplicação
let globalClientes = [];
let globalCobrancas = [];
let globalPlanos = [];
let globalApps = [];
let globalServidores = [];
let globalMeusDados = {};
let financeChartInstance = null;

// Helper universal para visibilidade de Modals no Celular e Computador
function abrirModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;

  // Fechar qualquer outro modal ativo e limpar estilos inline Concorrentes
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
    m.removeAttribute('style');
    const b = m.querySelector('.modal-box');
    if (b) b.removeAttribute('style');
  });

  modal.removeAttribute('style');
  const box = modal.querySelector('.modal-box');
  if (box) box.removeAttribute('style');

  modal.classList.add('active');
}

function fecharModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;

  modal.classList.remove('active');
  modal.removeAttribute('style');
  const box = modal.querySelector('.modal-box');
  if (box) box.removeAttribute('style');
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMobileMenu();
  loadAllData();
  setupForms();
  
  // Polling para checagem de envios automáticos, status do WhatsApp e dashboard
  setInterval(checkAlertasPendentes, 5000);
  setInterval(checkWhatsAppStatus, 3000);
  checkWhatsAppStatus();
});

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
    fetchModelosMensagens()
  ]);
  
  loadDashboardData();
  populateClienteSelect();
  populateClientOptionsSelects();
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

function populateClientOptionsSelects() {
  const selPlano = document.getElementById('cliPlanoId');
  const selSrv = document.getElementById('cliServidorId');
  const selApp = document.getElementById('cliAppId');

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
    document.getElementById('dashTotalVencido').textContent = formatCurrency(data.totalVencido);
    document.getElementById('dashTotalAgendados').textContent = data.totalAgendados;

    renderFinanceChart(data.totalPendente, data.totalRecebido, data.totalVencido);
    renderProximosEnviosDash();
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

function renderFinanceChart(pendente, recebido, vencido) {
  const ctx = document.getElementById('financeChart');
  if (!ctx) return;

  if (financeChartInstance) {
    financeChartInstance.destroy();
  }

  financeChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Contas Recebidas', 'A Receber (Pendentes)', 'Vencidas'],
      datasets: [{
        data: [recebido, pendente, vencido],
        backgroundColor: ['#00FF87', '#00F0FF', '#FF3366'],
        borderWidth: 2,
        borderColor: '#0D1527'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#38BDF8', font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' } }
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
        <div style="font-weight: 700; color: #FFF; font-size: 0.9rem;">${cob.clienteNome}</div>
        <div style="font-size: 0.75rem; color: var(--text-brown-muted);">
          <i class="fa-regular fa-clock" style="color: var(--emerald-primary);"></i> ${formatDateTime(cob.dataHoraEnvio)}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: var(--emerald-light); font-size: 0.9rem;">${formatCurrency(cob.valor)}</div>
        <button class="btn-whatsapp-sm" onclick="dispararWhatsApp('${cob.id}')" style="margin-top: 0.25rem;">
          <i class="fa-brands fa-whatsapp"></i> Enviar
        </button>
      </div>
    </div>
  `).join('');
}

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
      text: 'Ativo',
      badgeClass: 'badge-ativo',
      color: 'var(--neon-green)',
      badgeHtml: `<span class="badge badge-ativo"><i class="fa-solid fa-circle-check"></i> Ativo</span>`
    };
  }

  if (!dataVencimento) {
    return {
      statusKey: 'ATIVO',
      text: 'Ativo',
      badgeClass: 'badge-ativo',
      color: 'var(--neon-green)',
      badgeHtml: `<span class="badge badge-ativo"><i class="fa-solid fa-circle-check"></i> Ativo</span>`
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
      color: 'var(--danger-color)',
      badgeHtml: `<span class="badge badge-vencido"><i class="fa-solid fa-circle-xmark"></i> Plano Vencido</span>`
    };
  } else if (diffDays <= 2) {
    return {
      statusKey: 'A_VENCER',
      text: 'Plano a Vencer',
      badgeClass: 'badge-a-vencer',
      color: '#FFD700',
      badgeHtml: `<span class="badge badge-a-vencer"><i class="fa-solid fa-triangle-exclamation"></i> Plano a Vencer</span>`
    };
  } else {
    return {
      statusKey: 'ATIVO',
      text: 'Ativo',
      badgeClass: 'badge-ativo',
      color: 'var(--neon-green)',
      badgeHtml: `<span class="badge badge-ativo"><i class="fa-solid fa-circle-check"></i> Ativo</span>`
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

function renderTabelaCobrancas() {
  const tbody = document.getElementById('cobrancasTableBody');
  const grid = document.getElementById('cobrancasCardsGrid');
  if (!tbody && !grid) return;

  if (globalCobrancas.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-brown-muted); padding: 2rem;">Nenhuma cobrança cadastrada.</td></tr>`;
    if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">Nenhuma cobrança cadastrada. Clique no botão acima para adicionar!</div>`;
    return;
  }

  // 1. RENDERIZAR TABELA
  if (tbody) {
    tbody.innerHTML = globalCobrancas.map(cob => {
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

      return `
        <tr>
          <td>
            <strong style="color: #FFF;">${cob.clienteNome}</strong>
            <div style="font-size: 0.75rem; color: var(--text-brown-muted);"><i class="fa-brands fa-whatsapp"></i> ${formatPhone(cob.clienteTelefone)}</div>
          </td>
          <td>
            <strong style="color: var(--emerald-light); font-size: 0.95rem;">${formatCurrency(cob.valor)}</strong>
            ${cob.desconto > 0 ? `<div style="font-size: 0.72rem; color: var(--neon-pink, #ff2a85); margin-top: 0.15rem;"><i class="fa-solid fa-tag"></i> Desc: -${formatCurrency(cob.desconto)}</div>` : ''}
          </td>
          <td>${formatDate(cob.dataVencimento)}</td>
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

  // 2. RENDERIZAR CARDS DE COBRANÇA
  if (grid) {
    grid.innerHTML = globalCobrancas.map(cob => {
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

      return `
        <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid ${statusObj.color};">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              ${badgeStatus}
              <span style="font-size: 0.8rem; color: var(--text-brown-muted); font-weight: 600;"><i class="fa-regular fa-calendar-days"></i> Venc: ${formatDate(cob.dataVencimento)}</span>
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin-bottom: 0.35rem;">${cob.clienteNome}</h3>
            <div style="font-size: 0.85rem; color: var(--emerald-light); font-weight: 600; margin-bottom: 0.75rem;">
              <i class="fa-brands fa-whatsapp"></i> ${formatPhone(cob.clienteTelefone)}
            </div>

            <div style="font-size: 1.6rem; font-weight: 800; color: var(--emerald-light); margin-bottom: 0.75rem; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap;">
              <span>${formatCurrency(cob.valor)}</span>
              ${cob.desconto > 0 ? `<span style="font-size: 0.8rem; color: var(--neon-pink, #ff2a85); font-weight: 600;"><i class="fa-solid fa-tag"></i> Desc: -${formatCurrency(cob.desconto)}</span>` : ''}
            </div>

            <p style="font-size: 0.85rem; color: var(--text-brown-muted); margin-bottom: 0.75rem; background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
              ${cob.descricao}
            </p>

            <div style="font-size: 0.8rem; margin-bottom: 1rem;">
              <strong style="color: var(--text-brown-muted);">Envio WhatsApp:</strong> ${badgeEnvio}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
            ${cob.status === 'PENDENTE' ? `
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn-success-sm" style="flex: 1; justify-content: center;" onclick="abrirModalBaixa('${cob.id}')">
                  <i class="fa-solid fa-check"></i> Dar Baixa
                </button>
                <button class="btn-whatsapp-sm" style="flex: 1; justify-content: center;" onclick="dispararWhatsApp('${cob.id}')">
                  <i class="fa-brands fa-whatsapp"></i> Enviar
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
    selModelo.innerHTML = `<option value="">-- Seleção Automática (Padrão do Sistema) --</option>` +
      globalModelosMensagens.map(m => `<option value="${m.id}">${m.titulo} (${m.categoria})</option>`).join('');
  }
}

function calcularValorCobComDesconto() {
  const brutoEl = document.getElementById('cobValorBruto');
  const descEl = document.getElementById('cobDesconto');
  const valorEl = document.getElementById('cobValor');
  if (!valorEl) return;

  const bruto = parseFloat(brutoEl ? brutoEl.value : 0) || 0;
  const desc = parseFloat(descEl ? descEl.value : 0) || 0;
  const finalVal = Math.max(0, bruto - desc);

  if (bruto > 0 || desc > 0) {
    valorEl.value = finalVal.toFixed(2);
  }
}

function abrirModalNovaCobranca() {
  document.getElementById('cobrancaId').value = '';
  document.getElementById('modalCobrancaTitle').innerHTML = `<i class="fa-solid fa-plus-circle"></i> Cadastrar Nova Cobrança`;
  document.getElementById('formCobranca').reset();

  if (document.getElementById('cobValorBruto')) document.getElementById('cobValorBruto').value = '';
  if (document.getElementById('cobDesconto')) document.getElementById('cobDesconto').value = '0.00';
  if (document.getElementById('cobValor')) document.getElementById('cobValor').value = '';

  populateClienteSelect();
  populateCobrancaOptionsSelects();

  // Definir data padrão para hoje + dataHoraEnvio para daqui a 1 hora
  const agora = new Date();
  const agoraIso = agora.toISOString().slice(0, 16);
  const dataHoje = agora.toISOString().split('T')[0];

  document.getElementById('cobVencimento').value = dataHoje;
  document.getElementById('cobDataHoraEnvio').value = agoraIso;

  if (document.getElementById('cobModeloId')) {
    document.getElementById('cobModeloId').value = '';
  }

  abrirModal('modalCobranca');
}

function editarCobranca(id) {
  const cob = globalCobrancas.find(c => c.id === id);
  if (!cob) return;

  populateClienteSelect();
  populateCobrancaOptionsSelects();

  document.getElementById('cobrancaId').value = cob.id;
  document.getElementById('modalCobrancaTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Cobrança`;
  document.getElementById('cobClienteId').value = cob.clienteId;

  const vBruto = (cob.valorBruto !== undefined && cob.valorBruto !== null) ? cob.valorBruto : (cob.valor || '');
  const vDesc = (cob.desconto !== undefined && cob.desconto !== null) ? cob.desconto : 0;

  if (document.getElementById('cobValorBruto')) document.getElementById('cobValorBruto').value = vBruto;
  if (document.getElementById('cobDesconto')) document.getElementById('cobDesconto').value = vDesc;
  if (document.getElementById('cobValor')) document.getElementById('cobValor').value = cob.valor;

  document.getElementById('cobVencimento').value = cob.dataVencimento;
  document.getElementById('cobDataHoraEnvio').value = cob.dataHoraEnvio ? cob.dataHoraEnvio.slice(0, 16) : '';
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
    cancelButtonColor: '#3E2418',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#0D1527',
    color: '#FFF'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/cobrancas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Cobrança excluída!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
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
function abrirModalBaixa(id) {
  document.getElementById('baixaCobrancaId').value = id;
  const agora = new Date();
  const agoraLocal = agora.toISOString().slice(0, 16);
  
  // Data proximo vencimento padrao: 30 dias a partir de hoje
  const prox = new Date();
  prox.setDate(prox.getDate() + 30);
  const proxIso = prox.toISOString().split('T')[0];

  document.getElementById('baixaData').value = agoraLocal;
  document.getElementById('baixaProximoVencimento').value = proxIso;
  document.getElementById('baixaObservacao').value = 'Pagamento recebido e confirmado via PIX';
  document.getElementById('baixaEnviarWhatsApp').checked = true;

  abrirModal('modalBaixa');
}

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
          <strong style="color: #FFF;">${cob.clienteNome}</strong>
          <div style="font-size: 0.75rem; color: var(--text-brown-muted);"><i class="fa-brands fa-whatsapp"></i> ${formatPhone(cob.clienteTelefone)}</div>
        </td>
        <td><strong style="color: var(--emerald-light); font-size: 1rem;">${formatCurrency(cob.valor)}</strong></td>
        <td>${formatDate(cob.dataVencimento)}</td>
        <td><span style="color: var(--emerald-light); font-weight: 600;">${formatDateTime(cob.dataPagamento)}</span></td>
        <td><span style="color: var(--neon-blue); font-weight: 700;"><i class="fa-solid fa-calendar-day"></i> ${formatDate(cob.proximoVencimento)}</span></td>
        <td>${cob.descricao}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="reverterBaixa('${cob.id}')" title="Voltar para A Receber">
            <i class="fa-solid fa-rotate-left" style="color: var(--neon-blue);"></i> Voltar para A Receber
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

          <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin-bottom: 0.35rem;">${cob.clienteNome}</h3>
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

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
          <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; width: 100%; justify-content: center;" onclick="reverterBaixa('${cob.id}')">
            <i class="fa-solid fa-rotate-left" style="color: var(--neon-blue);"></i> Voltar para A Receber
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
    cancelButtonColor: '#3E2418',
    confirmButtonText: 'Sim, Reverter Baixa!',
    cancelButtonText: 'Cancelar',
    background: '#0D1527',
    color: '#FFF'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/cobrancas/${id}/reverter-baixa`, { method: 'POST' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Cobrança Revertida!', text: 'Retornou para a lista de A Receber.', timer: 1800, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
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
        background: '#0D1527',
        color: '#FFF'
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
        <td><strong style="color: #FFF;">${cob.clienteNome}</strong></td>
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

function renderTabelaClientes() {
  const tbody = document.getElementById('clientesTableBody');
  const grid = document.getElementById('clientesCardsGrid');

  if (!tbody && !grid) return;

  if (globalClientes.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-brown-muted); padding: 2rem;">Nenhum cliente cadastrado.</td></tr>`;
    if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-brown-muted); padding: 3rem;">Nenhum cliente cadastrado. Clique no botão acima para adicionar!</div>`;
    return;
  }

  // 1. RENDERIZAR TABELA
  if (tbody) {
    tbody.innerHTML = globalClientes.map(cli => {
      const planoObj = globalPlanos.find(p => p.id === cli.planoId);
      const srvObj = globalServidores.find(s => s.id === cli.servidorId);
      const appObj = globalApps.find(a => a.id === cli.appId);
      const statusObj = obterStatusCliente(cli);

      const badgePlano = planoObj 
        ? `<span class="badge badge-agendado" style="font-size: 0.8rem; padding: 0.25rem 0.6rem;"><i class="fa-solid fa-tv"></i> ${planoObj.nome} (${formatCurrency(planoObj.valor)})</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">-</span>`;

      const badgeSrv = srvObj 
        ? `<span class="badge badge-pago" style="background: rgba(0, 240, 255, 0.15); color: var(--neon-blue); border-color: var(--neon-blue); font-size: 0.8rem; padding: 0.25rem 0.6rem;"><i class="fa-solid fa-server"></i> ${srvObj.nome}</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">-</span>`;

      const badgeApp = appObj 
        ? `<span class="badge badge-vencido" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald-light); border-color: var(--emerald-primary); font-size: 0.8rem; padding: 0.25rem 0.6rem;"><i class="fa-solid fa-mobile-screen-button"></i> ${appObj.nome}</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">-</span>`;

      return `
        <tr>
          <td><strong style="color: #FFF;">${cli.nome}</strong></td>
          <td><span style="color: var(--emerald-light); font-weight: 600;"><i class="fa-brands fa-whatsapp"></i> ${formatPhone(cli.telefone)}</span></td>
          <td>${statusObj.badgeHtml}</td>
          <td>${badgePlano}</td>
          <td>${badgeSrv}</td>
          <td>${badgeApp}</td>
          <td><span style="font-size: 0.85rem; color: var(--text-brown-muted);">${cli.notas || '-'}</span></td>
          <td style="text-align: right; white-space: nowrap;">
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

  // 2. RENDERIZAR CARDS VISUAIS
  if (grid) {
    grid.innerHTML = globalClientes.map(cli => {
      const planoObj = globalPlanos.find(p => p.id === cli.planoId);
      const srvObj = globalServidores.find(s => s.id === cli.servidorId);
      const appObj = globalApps.find(a => a.id === cli.appId);
      const statusObj = obterStatusCliente(cli);

      const badgePlano = planoObj 
        ? `<span class="badge badge-agendado" style="font-size: 0.8rem;"><i class="fa-solid fa-tv"></i> ${planoObj.nome} (${formatCurrency(planoObj.valor)})</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">Nenhum plano</span>`;

      const badgeSrv = srvObj 
        ? `<span class="badge badge-pago" style="background: rgba(0, 240, 255, 0.15); color: var(--neon-blue); border-color: var(--neon-blue); font-size: 0.8rem;"><i class="fa-solid fa-server"></i> ${srvObj.nome}</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">Nenhum servidor</span>`;

      const badgeApp = appObj 
        ? `<span class="badge badge-vencido" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald-light); border-color: var(--emerald-primary); font-size: 0.8rem;"><i class="fa-solid fa-mobile-screen-button"></i> ${appObj.nome}</span>` 
        : `<span style="color: var(--text-brown-muted); font-size: 0.8rem;">Nenhum app</span>`;

      return `
        <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid ${statusObj.color};">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-circle-user" style="color: var(--neon-blue);"></i> ${cli.nome}
              </h3>
              ${statusObj.badgeHtml}
            </div>

            <div style="background: var(--bg-card); padding: 0.65rem 0.85rem; border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 0.85rem;">
              <div style="font-size: 0.85rem; color: var(--emerald-light); font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-brands fa-whatsapp" style="font-size: 1rem;"></i> ${formatPhone(cli.telefone)}
              </div>
              ${cli.email ? `<div style="font-size: 0.75rem; color: var(--text-brown-muted); margin-top: 0.2rem;"><i class="fa-regular fa-envelope"></i> ${cli.email}</div>` : ''}
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem;">
              <div style="font-size: 0.8rem;"><strong style="color: var(--text-brown-muted);">Plano:</strong> ${badgePlano}</div>
              <div style="font-size: 0.8rem;"><strong style="color: var(--text-brown-muted);">Servidor:</strong> ${badgeSrv}</div>
              <div style="font-size: 0.8rem;"><strong style="color: var(--text-brown-muted);">App:</strong> ${badgeApp}</div>
            </div>

            ${cli.notas ? `<p style="font-size: 0.8rem; color: var(--text-brown-muted); background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem;"><i class="fa-regular fa-comment"></i> ${cli.notas}</p>` : ''}
          </div>

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
            <button class="btn-whatsapp-sm" style="font-size: 0.8rem; padding: 0.35rem 0.65rem;" onclick="window.open('https://wa.me/${cli.telefone}', '_blank')">
              <i class="fa-brands fa-whatsapp"></i> Conversar
            </button>
            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="editarCliente('${cli.id}')">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-danger-sm" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="deletarCliente('${cli.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
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

function abrirModalNovoCliente() {
  document.getElementById('clienteId').value = '';
  document.getElementById('modalClienteTitle').innerHTML = `<i class="fa-solid fa-user-plus"></i> Cadastrar Cliente`;
  document.getElementById('formCliente').reset();
  populateClientOptionsSelects();
  abrirModal('modalCliente');
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
    cancelButtonColor: '#3E2418',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#0D1527',
    color: '#FFF'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Cliente excluído!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
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
    if (descInput && (!descInput.value || descInput.value.includes('RENOVE SEU PLANO') || descInput.value.includes('Servidor'))) {
      descInput.value = 'RENOVE SEU PLANO DE CANAIS HOJE É O VENCIMENTO DO SEU PLANO.';
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
  document.getElementById('formCobranca').addEventListener('submit', async (e) => {
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
      valorBruto: vBruto,
      desconto: vDesc,
      valor: vFinal,
      dataVencimento: document.getElementById('cobVencimento').value,
      dataHoraEnvio: document.getElementById('cobDataHoraEnvio').value,
      descricao: (descEl && descEl.value) ? descEl.value : 'RENOVE SEU PLANO DE CANAIS HOJE É O VENCIMENTO DO SEU PLANO.',
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
        Swal.fire({ icon: 'success', title: id ? 'Cobrança Atualizada!' : 'Cobrança Cadastrada!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
        await fetchCobrancas();
        loadDashboardData();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro ao Salvar Cobrança', text: data.error || 'Preencha todos os campos obrigatórios.', background: '#0D1527', color: '#FFF' });
      }
    } catch (err) {
      console.error('Erro ao salvar cobrança:', err);
      Swal.fire({ icon: 'error', title: 'Erro na Conexão', text: 'Não foi possível se comunicar com o servidor.', background: '#0D1527', color: '#FFF' });
    }
  });

  // 2. Form Cliente
  document.getElementById('formCliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('clienteId').value;
    const bodyData = {
      nome: document.getElementById('cliNome').value,
      telefone: document.getElementById('cliTelefone').value,
      email: document.getElementById('cliEmail').value,
      notas: document.getElementById('cliNotas').value,
      planoId: document.getElementById('cliPlanoId').value,
      servidorId: document.getElementById('cliServidorId').value,
      appId: document.getElementById('cliAppId').value
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
        fecharModalCliente();
        Swal.fire({ icon: 'success', title: id ? 'Cliente Atualizado!' : 'Cliente Cadastrado!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
        await fetchClientes();
        await fetchCobrancas();
        populateClienteSelect();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro ao Salvar Cliente', text: data.error || 'Nome e WhatsApp são obrigatórios.', background: '#0D1527', color: '#FFF' });
      }
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      Swal.fire({ icon: 'error', title: 'Erro na Conexão', text: 'Não foi possível salvar o cliente no servidor.', background: '#0D1527', color: '#FFF' });
    }
  });

  // 3. Form Baixa
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
      const res = await fetch(`/api/cobrancas/${id}/dar-baixa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        fecharModalBaixa();

        if (data.enviouDireto) {
          Swal.fire({
            icon: 'success',
            title: '🎉 Plano Renovado & Baixa Efetuada!',
            text: 'A mensagem de confirmação de pagamento e renovação do plano foi enviada AUTOMATICAMENTE para o WhatsApp do cliente!',
            confirmButtonColor: '#00FF87',
            background: '#0D1527',
            color: '#FFF'
          });
        } else if (bodyData.enviarNotificacaoWhatsApp && data.linkWhatsAppRenovacao) {
          window.open(data.linkWhatsAppRenovacao, '_blank');
          Swal.fire({
            icon: 'success',
            title: 'Baixa Efetuada com Sucesso!',
            text: 'A aba do WhatsApp foi aberta com a mensagem de renovação do plano!',
            confirmButtonColor: '#00FF87',
            background: '#0D1527',
            color: '#FFF'
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Baixa Efetuada com Sucesso!',
            text: 'A cobrança foi transferida para a aba de Contas Recebidas.',
            confirmButtonColor: '#00FF87',
            background: '#0D1527',
            color: '#FFF'
          });
        }

        await fetchCobrancas();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Erro ao dar baixa:', err);
    }
  });

  // 4. Form Meus Dados PIX
  document.getElementById('formMeusDados').addEventListener('submit', async (e) => {
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
        Swal.fire({ icon: 'success', title: 'Dados PIX Salvos com Sucesso!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
        await fetchMeusDados();
      }
    } catch (err) {
      console.error('Erro ao salvar dados PIX:', err);
    }
  });

  // 5. Form Plano / App IPTV
  document.getElementById('formPlano').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('planoId').value;
    const bodyData = {
      nome: document.getElementById('planoNome').value,
      categoria: document.getElementById('planoCategoria').value,
      validade: document.getElementById('planoValidade').value,
      telas: document.getElementById('planoTelas') ? document.getElementById('planoTelas').value : '1 Tela',
      valor: parseFloat(document.getElementById('planoValor').value),
      desconto: parseFloat(document.getElementById('planoDesconto') ? document.getElementById('planoDesconto').value : 0) || 0,
      corBadge: document.getElementById('planoCorBadge').value,
      descricao: document.getElementById('planoDescricao').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/planos/${id}` : '/api/planos';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        fecharModalPlano();
        Swal.fire({ icon: 'success', title: id ? 'Plano Atualizado!' : 'Plano Cadastrado!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
        await fetchPlanos();
      }
    } catch (err) {
      console.error('Erro ao salvar plano:', err);
    }
  });

  // 6. Form Aplicativo / App
  document.getElementById('formApp').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('appId').value;
    const bodyData = {
      nome: document.getElementById('appNome').value,
      categoria: document.getElementById('appCategoria').value,
      descricao: document.getElementById('appDescricao').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/apps/${id}` : '/api/apps';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        fecharModalApp();
        Swal.fire({ icon: 'success', title: id ? 'App Atualizado!' : 'App Cadastrado!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
        await fetchApps();
      }
    } catch (err) {
      console.error('Erro ao salvar app:', err);
    }
  });

  // 7. Form Servidor
  document.getElementById('formServidor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('servidorId').value;
    const bodyData = {
      nome: document.getElementById('servidorNome').value,
      categoria: document.getElementById('servidorCategoria').value,
      descricao: document.getElementById('servidorDescricao').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/servidores/${id}` : '/api/servidores';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        fecharModalServidor();
        Swal.fire({ icon: 'success', title: id ? 'Servidor Atualizado!' : 'Servidor Cadastrado!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
        await fetchServidores();
      }
    } catch (err) {
      console.error('Erro ao salvar servidor:', err);
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
    const res = await fetch('/api/alertas-pendentes');
    const alertas = await res.json();

    if (alertas && alertas.length > 0) {
      alertas.forEach(alerta => {
        Swal.fire({
          title: '🔔 Chegou a Hora de Enviar Cobrança!',
          html: `
            <div style="text-align: left; background: #1C110A; padding: 1rem; border-radius: 12px; border: 1px solid var(--emerald-primary);">
              <p><strong>Cliente:</strong> ${alerta.clienteNome}</p>
              <p><strong>Valor:</strong> ${formatCurrency(alerta.valor)}</p>
              <p><strong>Descrição:</strong> ${alerta.descricao}</p>
            </div>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-brown-muted);">Clique no botão abaixo para abrir o WhatsApp Web e disparar o envio automaticamente.</p>
          `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: '<i class="fa-brands fa-whatsapp"></i> Disparar WhatsApp Agora',
          cancelButtonText: 'Depois',
          confirmButtonColor: '#25D366',
          cancelButtonColor: '#3E2418',
          background: '#0D1527',
          color: '#FFF'
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(alerta.linkWhatsApp, '_blank');
          }
        });
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
      badge.innerHTML = `<i class="fa-solid fa-qrcode"></i> Escaneie o QR Code no seu Celular`;

      if (qrImg) {
        qrImg.src = data.qrCodeDataUrl;
        qrImg.style.display = 'block';
      }
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
    const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
    const data = await res.json();
    Swal.fire({
      icon: 'info',
      title: 'Gerando Novo QR Code...',
      text: 'Aguarde alguns segundos e aponte seu celular para o QR Code.',
      timer: 2500,
      showConfirmButton: false,
      background: '#0D1527',
      color: '#FFF'
    });
    setTimeout(checkWhatsAppStatus, 1500);
  } catch (err) {
    console.error('Erro ao reconectar WhatsApp:', err);
  }
}

async function testarEnvioWhatsApp() {
  const { value: formValues } = await Swal.fire({
    title: '🚀 Testar Envio no WhatsApp',
    html: `
      <div style="text-align: left;">
        <label style="font-size: 0.85rem; color: #D1B89D;">WhatsApp do Destinatário (DDD + Número)</label>
        <input id="swal-input-tel" class="swal2-input" placeholder="Ex: 11972560991" style="background: #1C110A; color: #FFF; border-color: rgba(184, 115, 51, 0.3);">
        <label style="font-size: 0.85rem; color: #D1B89D; margin-top: 0.5rem; display: block;">Mensagem de Teste</label>
        <textarea id="swal-input-msg" class="swal2-textarea" placeholder="Mensagem para testar o envio..." style="background: #1C110A; color: #FFF; border-color: rgba(184, 115, 51, 0.3);">🚀 Teste de envio de cobrança automática via GESTOR DE COBRANÇAS!</textarea>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: '<i class="fa-solid fa-paper-plane"></i> Disparar Teste Agora',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#25D366',
    cancelButtonColor: '#3E2418',
    background: '#0D1527',
    color: '#FFF',
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
      background: '#0D1527',
      color: '#FFF'
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
          background: '#0D1527',
          color: '#FFF'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Falha no Envio',
          text: data.error || 'Não foi possível entregar a mensagem. Verifique se o QR Code está conectado.',
          confirmButtonColor: '#EF4444',
          background: '#0D1527',
          color: '#FFF'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de Conexão',
        text: 'Não foi possível se comunicar com o servidor.',
        confirmButtonColor: '#EF4444',
        background: '#23150D',
        color: '#FFF'
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

          <h3 style="font-size: 1.2rem; font-weight: 800; color: #FFF; margin-bottom: 0.35rem;">${plano.nome}</h3>

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
            <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="editarPlano('${plano.id}')">
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
  const pId = document.getElementById('planoId');
  if (pId) pId.value = '';
  const pTitle = document.getElementById('modalPlanoTitle');
  if (pTitle) pTitle.innerHTML = `<i class="fa-solid fa-tv" style="color: var(--neon-blue);"></i> Cadastrar Novo Plano de Canais`;
  const fPlano = document.getElementById('formPlano');
  if (fPlano) fPlano.reset();
  if (document.getElementById('planoDesconto')) document.getElementById('planoDesconto').value = '0.00';
  calcularValorFinalPlanoModal();
  abrirModal('modalPlano');
}

function editarPlano(id) {
  const p = globalPlanos.find(item => item.id === id);
  if (!p) return;

  document.getElementById('planoId').value = p.id;
  document.getElementById('modalPlanoTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Plano de Canais`;
  document.getElementById('planoNome').value = p.nome;
  document.getElementById('planoCategoria').value = p.categoria;
  document.getElementById('planoValidade').value = p.validade;
  if (document.getElementById('planoTelas')) {
    document.getElementById('planoTelas').value = p.telas || '1 Tela';
  }
  document.getElementById('planoValor').value = p.valor;
  if (document.getElementById('planoDesconto')) {
    document.getElementById('planoDesconto').value = p.desconto || 0;
  }
  document.getElementById('planoCorBadge').value = p.corBadge || 'neon-green';
  document.getElementById('planoDescricao').value = p.descricao;
  calcularValorFinalPlanoModal();

  abrirModal('modalPlano');
}

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
    cancelButtonColor: '#3E2418',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#0D1527',
    color: '#FFF'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/planos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Plano excluído!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
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
    `📌 *Categoria:* ${plano.categoria}\n` +
    `⏳ *Validade:* ${plano.validade}\n` +
    `💰 *Valor:* ${formatCurrency(plano.valor)}\n\n` +
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
      background: '#0D1527',
      color: '#FFF'
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
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin-bottom: 0.5rem;">${app.nome}</h3>
        <p style="font-size: 0.85rem; color: var(--text-brown-muted); margin-bottom: 1rem; line-height: 1.5;">${app.descricao || 'Sem descrição cadastrada.'}</p>
      </div>

      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="editarApp('${app.id}')">
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
  const aId = document.getElementById('appId');
  if (aId) aId.value = '';
  const aTitle = document.getElementById('modalAppTitle');
  if (aTitle) aTitle.innerHTML = `<i class="fa-solid fa-mobile-screen-button" style="color: var(--neon-blue);"></i> Cadastrar Aplicativo / App`;
  const fApp = document.getElementById('formApp');
  if (fApp) fApp.reset();
  abrirModal('modalApp');
}

function editarApp(id) {
  const app = globalApps.find(a => a.id === id);
  if (!app) return;

  document.getElementById('appId').value = app.id;
  document.getElementById('modalAppTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Aplicativo`;
  document.getElementById('appNome').value = app.nome;
  document.getElementById('appCategoria').value = app.categoria;
  document.getElementById('appDescricao').value = app.descricao || '';

  abrirModal('modalApp');
}

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
    cancelButtonColor: '#3E2418',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#0D1527',
    color: '#FFF'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Aplicativo excluído!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
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
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin-bottom: 0.5rem;">${srv.nome}</h3>
        <p style="font-size: 0.85rem; color: var(--text-brown-muted); margin-bottom: 1rem; line-height: 1.5;">${srv.descricao || 'Sem observações cadastradas.'}</p>
      </div>

      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="editarServidor('${srv.id}')">
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
  const sId = document.getElementById('servidorId');
  if (sId) sId.value = '';
  const sTitle = document.getElementById('modalServidorTitle');
  if (sTitle) sTitle.innerHTML = `<i class="fa-solid fa-server" style="color: var(--emerald-primary);"></i> Cadastrar Servidor / Painel`;
  const fSrv = document.getElementById('formServidor');
  if (fSrv) fSrv.reset();
  abrirModal('modalServidor');
}

function editarServidor(id) {
  const srv = globalServidores.find(s => s.id === id);
  if (!srv) return;

  document.getElementById('servidorId').value = srv.id;
  document.getElementById('modalServidorTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Servidor`;
  document.getElementById('servidorNome').value = srv.nome;
  document.getElementById('servidorCategoria').value = srv.categoria;
  document.getElementById('servidorDescricao').value = srv.descricao || '';

  abrirModal('modalServidor');
}

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
    cancelButtonColor: '#3E2418',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#0D1527',
    color: '#FFF'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/servidores/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Servidor excluído!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
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
let globalModelosMensagens = [];
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
            <h3 style="font-size: 1.1rem; font-weight: 800; color: #FFF; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-comment-dots" style="color: ${cardColor};"></i> ${modelo.titulo}
            </h3>
            <span class="badge" style="background: rgba(255,255,255,0.08); border: 1px solid ${cardColor}; color: #FFF; font-size: 0.75rem; padding: 0.2rem 0.5rem;">
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
    cancelButtonColor: '#3E2418',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    background: '#0D1527',
    color: '#FFF'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/modelos-mensagens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Modelo excluído!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
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
      Swal.fire({ icon: 'success', title: id ? 'Modelo Atualizado!' : 'Modelo Cadastrado!', timer: 1500, showConfirmButton: false, background: '#0D1527', color: '#FFF' });
      await fetchModelosMensagens();
    }
  } catch (err) {
    console.error('Erro ao salvar modelo:', err);
  }
}

function abrirModalDispararModelo(modeloIdOptional) {
  const cliSelect = document.getElementById('disparoClienteId');
  if (cliSelect) {
    cliSelect.innerHTML = `<option value="">-- Selecione o Cliente --</option>` +
      globalClientes.map(c => `<option value="${c.id}">${c.nome} (${formatPhone(c.telefone)})</option>`).join('');
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
    Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione um cliente para receber a mensagem.', confirmButtonColor: '#00F0FF', background: '#0D1527', color: '#FFF' });
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
          background: '#0D1527',
          color: '#FFF'
        });
      } else if (data.linkWhatsApp) {
        window.open(data.linkWhatsApp, '_blank');
        Swal.fire({
          icon: 'info',
          title: 'Aba do WhatsApp Aberta!',
          text: 'A janela do WhatsApp Web foi aberta com o texto preenchido contendo as variáveis substituídas!',
          confirmButtonColor: '#00F0FF',
          background: '#0D1527',
          color: '#FFF'
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
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
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


