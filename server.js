const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason 
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Diretorios de dados e sessao Baileys
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const AUTH_DIR = path.join(DATA_DIR, 'auth_info_baileys');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getLocalIsoString(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function sanitizePhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  return clean;
}

const defaultModelosMensagensArray = [
  {
    id: "tpl_lembrete",
    titulo: "📌 Lembrete de Cobrança (Em Dia)",
    categoria: "Cobrança",
    mensagem: `Olá *{nome}*, tudo bem? 👋\n\nPassando para lembrar referente à cobrança do seu plano:\n📌 *Descrição:* {descricao}\n💰 *Valor:* {valor}\n📅 *Vencimento:* {vencimento}\n\n💳 *DADOS PARA PAGAMENTO (PIX):*\n• *Titular:* {pix_titular}\n• *Banco:* {pix_banco}\n• *Chave PIX ({pix_tipo}):* {pix_chave}\n\nℹ️ {pix_instrucoes}\n\nEQUIPE: *Gerailton Neves*`,
    padrao: true
  },
  {
    id: "tpl_vencido",
    titulo: "⚠️ Notificação de Plano Vencido",
    categoria: "Atrasados",
    mensagem: `⚠️ *AVISO DE PLANO VENCIDO*\n\nOlá *{nome}*, identificamos que a sua assinatura do plano de canais encontra-se *VENCIDA* desde {vencimento}.\n\n💰 *Valor em Aberto:* {valor}\n\nPara evitar o bloqueio automático do seu sinal, efetue o pagamento via PIX:\n💳 *Chave PIX ({pix_tipo}):* {pix_chave}\n• *Banco:* {pix_banco}\n• *Titular:* {pix_titular}\n\nPor gentileza, nos envie o comprovante respondendo a esta mensagem.\n\nEQUIPE: *Gerailton Neves*`,
    padrao: true
  },
  {
    id: "tpl_renovacao",
    titulo: "🎉 Aviso de Renovação (Baixa Quitada)",
    categoria: "Renovação",
    mensagem: `🎉 *PAGAMENTO CONFIRMADO E PLANO RENOVADO!*\n\nOlá *{nome}*, confirmamos o recebimento do seu pagamento e seu plano foi renovado com sucesso!\n\n💰 *Valor Pago:* {valor}\n📅 *Data do Pagamento:* {data_pagamento}\n🗓️ *Próximo Vencimento:* {proximo_vencimento}\n\nAgradecemos a confiança e parceria!\n\nEQUIPE: *Gerailton Neves*`,
    padrao: true
  },
  {
    id: "tpl_promocao_indicacao",
    titulo: "🎁 Promoção: Indique 2 Amigos & Ganhe Mensalidade Grátis",
    categoria: "Promoções",
    mensagem: `🎁 *PROMOÇÃO IMPERDÍVEL: INDIQUE E GANHE MENSALIDADE GRÁTIS!* 🚀\n\nOlá *{nome}*, temos um presente especial para você!\n\nIndique *2 amigos ou parentes* para assinar nossos planos de canais IPTV e *sua próxima mensalidade sairá 100% GRÁTIS!* 💥🎉\n\nComo funciona?\n1️⃣ Indique nossos planos para 2 amigos/familiares.\n2️⃣ Assim que eles ativarem a assinatura, você ganha 1 mês totalmente gratuito!\n\nAproveite essa oportunidade! Qualquer dúvida, conte conosco.\n\nEQUIPE: *Gerailton Neves*`,
    padrao: true
  }
];

const defaultData = {
  meusDados: {
    nomeTitular: "Gerailton Cobranças Ltda",
    tipoChave: "CPF/CNPJ",
    chavePix: "12.345.678/0001-90",
    banco: "Banco do Brasil",
    instrucoes: "Ao efetuar o pagamento via PIX, favor enviar o comprovante respondendo a esta mensagem no WhatsApp."
  },
  clientes: [],
  cobrancas: [],
  planos: [
    {
      id: "plano_1",
      nome: "Plano IPTV Completo 4K",
      categoria: "Plano IPTV",
      valor: 35.00,
      validade: "Mensal",
      descricao: "Canais FHD + 4K, Filmes & Séries atualizados diariamente, Guia EPG, 1 Tela",
      corBadge: "neon-green",
      dataCriacao: new Date().toISOString()
    },
    {
      id: "plano_2",
      nome: "Plano P2P Antitrava Turbo",
      categoria: "Plano IPTV",
      valor: 45.00,
      validade: "Mensal",
      descricao: "Tecnologia P2P Sem Trava para horários de jogos, Futebol Ao Vivo + Premiere, 2 Telas Simultâneas",
      corBadge: "neon-blue",
      dataCriacao: new Date().toISOString()
    },
    {
      id: "plano_3",
      nome: "Ativação App IBO Player / XCIPTV",
      categoria: "Aplicativo / App",
      valor: 30.00,
      validade: "Anual",
      descricao: "Ativação da licença de uso do aplicativo de reprodução IPTV por 12 meses",
      corBadge: "warning",
      dataCriacao: new Date().toISOString()
    }
  ],
  modelosMensagens: defaultModelosMensagensArray,
  historicoEnvios: [],
  alertasPendentes: []
};

function formatDateBR(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function processarTemplateMensagem(template, data = {}, meusDados = {}) {
  if (!template) return '';
  let msg = template;

  const dtVenc = data.dataVencimento ? (data.dataVencimento.includes('T') ? formatDateBR(data.dataVencimento.split('T')[0]) : formatDateBR(data.dataVencimento)) : '-';
  const dtPagto = data.dataPagamento ? (data.dataPagamento.includes('T') ? formatDateBR(data.dataPagamento.split('T')[0]) : formatDateBR(data.dataPagamento)) : formatDateBR(new Date().toISOString().split('T')[0]);
  
  let dtProxVenc = '-';
  if (data.proximoVencimento) {
    dtProxVenc = formatDateBR(data.proximoVencimento);
  }

  const valorFormatado = (data.valor !== undefined && data.valor !== null) ? parseFloat(data.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
  const clienteNome = data.clienteNome ? data.clienteNome.trim() : (data.nome ? data.nome.trim() : 'Cliente');

  msg = msg.replace(/\{nome\}/g, clienteNome);
  msg = msg.replace(/\{valor\}/g, valorFormatado);
  msg = msg.replace(/\{vencimento\}/g, dtVenc);
  msg = msg.replace(/\{data_pagamento\}/g, dtPagto);
  msg = msg.replace(/\{proximo_vencimento\}/g, dtProxVenc);
  msg = msg.replace(/\{descricao\}/g, data.descricao || 'Plano de Canais');
  msg = msg.replace(/\{pix_titular\}/g, meusDados.nomeTitular || 'Gerailton Neves');
  msg = msg.replace(/\{pix_banco\}/g, meusDados.banco || 'PIX');
  msg = msg.replace(/\{pix_tipo\}/g, meusDados.tipoChave || 'Celular');
  msg = msg.replace(/\{pix_chave\}/g, meusDados.chavePix || '');
  msg = msg.replace(/\{pix_instrucoes\}/g, meusDados.instrucoes || 'Ao efetuar o pagamento via PIX, favor enviar o comprovante respondendo a esta mensagem.');
  msg = msg.replace(/\{equipe\}/g, 'Gerailton Neves');

  return msg;
}

function getDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(content);

    // Migração: Se modelosMensagens não for array, substitui pelo array padrão
    if (!db.modelosMensagens || !Array.isArray(db.modelosMensagens)) {
      db.modelosMensagens = defaultModelosMensagensArray;
      saveDB(db);
    }
    return db;
  } catch (error) {
    console.error("Erro ao ler banco de dados:", error);
    return defaultData;
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Erro ao salvar banco de dados:", error);
  }
}

function getModeloMensagem(keyOuId, db) {
  const modelos = (db && Array.isArray(db.modelosMensagens)) ? db.modelosMensagens : defaultModelosMensagensArray;
  
  if (keyOuId === 'lembreteCobranca') {
    return modelos.find(m => m.id === 'tpl_lembrete' || m.categoria === 'Cobrança') || defaultModelosMensagensArray[0];
  }
  if (keyOuId === 'planoVencido') {
    return modelos.find(m => m.id === 'tpl_vencido' || m.categoria === 'Atrasados') || defaultModelosMensagensArray[1];
  }
  if (keyOuId === 'avisoRenovacao') {
    return modelos.find(m => m.id === 'tpl_renovacao' || m.categoria === 'Renovação') || defaultModelosMensagensArray[2];
  }
  
  return modelos.find(m => m.id === keyOuId) || modelos[0] || defaultModelosMensagensArray[0];
}

function gerarMensagemWhatsApp(cobranca, meusDados) {
  const db = getDB();
  const hoje = getLocalIsoString().split('T')[0];

  let modeloObj = null;
  if (cobranca.modeloMensagemId) {
    modeloObj = getModeloMensagem(cobranca.modeloMensagemId, db);
  }
  if (!modeloObj) {
    modeloObj = (cobranca.dataVencimento < hoje) 
      ? getModeloMensagem('planoVencido', db) 
      : getModeloMensagem('lembreteCobranca', db);
  }

  return processarTemplateMensagem(modeloObj.mensagem, {
    clienteNome: cobranca.clienteNome,
    nome: cobranca.clienteNome,
    valor: cobranca.valor,
    dataVencimento: cobranca.dataVencimento,
    descricao: cobranca.descricao
  }, db.meusDados || meusDados);
}

// -----------------------------------------------------------------
// MOTOR WHATSAPP BAILEYS
// -----------------------------------------------------------------
let waSock = null;
let waStatus = 'DISCONNECTED';
let waQrCodeDataUrl = null;
let waUserNumber = null;

async function connectToWhatsApp() {
  try {
    console.log("⚡ Inicializando motor de automação do WhatsApp...");
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    waSock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['GESTOR DE COBRANÇAS', 'Desktop', '1.0.0']
    });

    waSock.ev.on('creds.update', saveCreds);

    waSock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        waStatus = 'SCAN_QR';
        waQrCodeDataUrl = await QRCode.toDataURL(qr);
        console.log("📲 QR Code do WhatsApp atualizado! Aguardando leitura no celular...");
      }

      if (connection === 'open') {
        waStatus = 'CONNECTED';
        waQrCodeDataUrl = null;
        waUserNumber = waSock.user ? waSock.user.id.split(':')[0] : 'Conectado';
        console.log(`✅ WhatsApp CONECTADO COM SUCESSO! Número: ${waUserNumber}`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = (statusCode !== DisconnectReason.loggedOut);
        waStatus = 'DISCONNECTED';
        waQrCodeDataUrl = null;
        console.log(`⚠️ Conexão WhatsApp encerrada (code ${statusCode}). Reconectando: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 5000);
        }
      }
    });

  } catch (err) {
    console.error("Erro ao conectar WhatsApp Baileys:", err);
    waStatus = 'DISCONNECTED';
  }
}

connectToWhatsApp();

// Helper para envio de mensagem direto via Baileys resolvendo JID oficial
async function sendWhatsAppMessage(phone, text) {
  if (waStatus !== 'CONNECTED' || !waSock) {
    throw new Error("WhatsApp não está conectado no sistema");
  }
  const cleanPhone = sanitizePhone(phone);
  let targetJid = `${cleanPhone}@s.whatsapp.net`;

  try {
    const [exists] = await waSock.onWhatsApp(cleanPhone);
    if (exists && exists.jid) {
      targetJid = exists.jid;
    }
  } catch (err) {
    console.log("Aviso ao validar JID no WhatsApp:", err.message);
  }

  console.log(`📤 Disparando mensagem no WhatsApp para JID: ${targetJid}`);
  const result = await waSock.sendMessage(targetJid, { text });
  return result;
}

// -----------------------------------------------------------------
// ENDPOINTS DE STATUS DO WHATSAPP
// -----------------------------------------------------------------
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: waStatus,
    qrCodeDataUrl: waQrCodeDataUrl,
    userNumber: waUserNumber
  });
});

app.post('/api/whatsapp/connect', (req, res) => {
  connectToWhatsApp();
  res.json({ success: true, message: "Tentativa de reconexão iniciada" });
});

app.post('/api/whatsapp/test-send', async (req, res) => {
  const { telefone, mensagem } = req.body;
  if (!telefone) {
    return res.status(400).json({ error: "Telefone é obrigatório" });
  }

  try {
    const cleanPhone = sanitizePhone(telefone);
    const texto = mensagem || "🚀 Teste de envio de mensagem automática do GESTOR DE COBRANÇAS!";
    await sendWhatsAppMessage(cleanPhone, texto);
    res.json({ success: true, message: `Mensagem entregue com SUCESSO via robô para +${cleanPhone}!` });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao disparar no WhatsApp" });
  }
});

// -----------------------------------------------------------------
// REST API
// -----------------------------------------------------------------
app.get('/api/meus-dados', (req, res) => {
  const db = getDB();
  res.json(db.meusDados || {});
});

// -----------------------------------------------------------------
// PLANOS, APPS E SERVIDORES IPTV
// -----------------------------------------------------------------
app.get('/api/planos', (req, res) => {
  const db = getDB();
  res.json(db.planos || []);
});

app.post('/api/planos', (req, res) => {
  const db = getDB();
  const { nome, categoria, valor, validade, descricao, corBadge } = req.body;
  if (!nome || !valor) {
    return res.status(400).json({ error: "Nome do Plano e Valor são obrigatórios" });
  }

  const novoPlano = {
    id: `plano_${Date.now()}`,
    nome,
    categoria: categoria || 'Plano IPTV',
    valor: parseFloat(valor),
    validade: validade || 'Mensal',
    descricao: descricao || '',
    corBadge: corBadge || 'neon-blue',
    dataCriacao: new Date().toISOString()
  };

  if (!db.planos) db.planos = [];
  db.planos.push(novoPlano);
  saveDB(db);
  res.status(201).json(novoPlano);
});

app.put('/api/planos/:id', (req, res) => {
  const db = getDB();
  if (!db.planos) db.planos = [];
  const index = db.planos.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Plano não encontrado" });

  const { nome, categoria, valor, validade, descricao, corBadge } = req.body;

  db.planos[index] = {
    ...db.planos[index],
    nome: nome || db.planos[index].nome,
    categoria: categoria || db.planos[index].categoria,
    valor: valor !== undefined ? parseFloat(valor) : db.planos[index].valor,
    validade: validade || db.planos[index].validade,
    descricao: descricao !== undefined ? descricao : db.planos[index].descricao,
    corBadge: corBadge || db.planos[index].corBadge
  };

  saveDB(db);
  res.json(db.planos[index]);
});

app.delete('/api/planos/:id', (req, res) => {
  const db = getDB();
  if (!db.planos) db.planos = [];
  const initialLength = db.planos.length;
  db.planos = db.planos.filter(p => p.id !== req.params.id);

  if (db.planos.length === initialLength) {
    return res.status(404).json({ error: "Plano não encontrado" });
  }

  saveDB(db);
  res.json({ success: true, message: "Plano excluído com sucesso" });
});

// -----------------------------------------------------------------
// APLICATIVOS / APPS IPTV
// -----------------------------------------------------------------
app.get('/api/apps', (req, res) => {
  const db = getDB();
  res.json(db.apps || []);
});

app.post('/api/apps', (req, res) => {
  const db = getDB();
  const { nome, categoria, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome do App é obrigatório" });

  const novoApp = {
    id: `app_${Date.now()}`,
    nome,
    categoria: categoria || 'Aplicativo',
    descricao: descricao || '',
    dataCriacao: new Date().toISOString()
  };

  if (!db.apps) db.apps = [];
  db.apps.push(novoApp);
  saveDB(db);
  res.status(201).json(novoApp);
});

app.put('/api/apps/:id', (req, res) => {
  const db = getDB();
  if (!db.apps) db.apps = [];
  const index = db.apps.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Aplicativo não encontrado" });

  const { nome, categoria, descricao } = req.body;
  db.apps[index] = {
    ...db.apps[index],
    nome: nome || db.apps[index].nome,
    categoria: categoria || db.apps[index].categoria,
    descricao: descricao !== undefined ? descricao : db.apps[index].descricao
  };

  saveDB(db);
  res.json(db.apps[index]);
});

app.delete('/api/apps/:id', (req, res) => {
  const db = getDB();
  if (!db.apps) db.apps = [];
  const initialLength = db.apps.length;
  db.apps = db.apps.filter(a => a.id !== req.params.id);

  if (db.apps.length === initialLength) {
    return res.status(404).json({ error: "Aplicativo não encontrado" });
  }

  saveDB(db);
  res.json({ success: true, message: "Aplicativo excluído com sucesso" });
});

// -----------------------------------------------------------------
// SERVIDORES / PAINÉIS IPTV
// -----------------------------------------------------------------
app.get('/api/servidores', (req, res) => {
  const db = getDB();
  res.json(db.servidores || []);
});

app.post('/api/servidores', (req, res) => {
  const db = getDB();
  const { nome, categoria, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome do Servidor é obrigatório" });

  const novoServidor = {
    id: `srv_${Date.now()}`,
    nome,
    categoria: categoria || 'Servidor',
    descricao: descricao || '',
    dataCriacao: new Date().toISOString()
  };

  if (!db.servidores) db.servidores = [];
  db.servidores.push(novoServidor);
  saveDB(db);
  res.status(201).json(novoServidor);
});

app.put('/api/servidores/:id', (req, res) => {
  const db = getDB();
  if (!db.servidores) db.servidores = [];
  const index = db.servidores.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Servidor não encontrado" });

  const { nome, categoria, descricao } = req.body;
  db.servidores[index] = {
    ...db.servidores[index],
    nome: nome || db.servidores[index].nome,
    categoria: categoria || db.servidores[index].categoria,
    descricao: descricao !== undefined ? descricao : db.servidores[index].descricao
  };

  saveDB(db);
  res.json(db.servidores[index]);
});

app.delete('/api/servidores/:id', (req, res) => {
  const db = getDB();
  if (!db.servidores) db.servidores = [];
  const initialLength = db.servidores.length;
  db.servidores = db.servidores.filter(s => s.id !== req.params.id);

  if (db.servidores.length === initialLength) {
    return res.status(404).json({ error: "Servidor não encontrado" });
  }

  saveDB(db);
  res.json({ success: true, message: "Servidor excluído com sucesso" });
});

app.post('/api/meus-dados', (req, res) => {
  const db = getDB();
  db.meusDados = { ...db.meusDados, ...req.body };
  saveDB(db);
  res.json({ success: true, meusDados: db.meusDados });
});

app.get('/api/clientes', (req, res) => {
  const db = getDB();
  res.json(db.clientes || []);
});

app.post('/api/clientes', (req, res) => {
  const db = getDB();
  const { nome, telefone, email, notas, planoId, servidorId, appId } = req.body;
  if (!nome || !telefone) {
    return res.status(400).json({ error: "Nome e WhatsApp são obrigatórios" });
  }

  const telSanitizado = sanitizePhone(telefone);

  const novoCliente = {
    id: `cli_${Date.now()}`,
    nome,
    telefone: telSanitizado,
    email: email || '',
    notas: notas || '',
    planoId: planoId || '',
    servidorId: servidorId || '',
    appId: appId || '',
    dataCriacao: new Date().toISOString()
  };

  db.clientes.push(novoCliente);
  saveDB(db);
  res.status(201).json(novoCliente);
});

app.put('/api/clientes/:id', (req, res) => {
  const db = getDB();
  const index = db.clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Cliente não encontrado" });

  const { nome, telefone, email, notas, planoId, servidorId, appId } = req.body;
  const telSanitizado = telefone ? sanitizePhone(telefone) : db.clientes[index].telefone;

  db.clientes[index] = {
    ...db.clientes[index],
    nome: nome || db.clientes[index].nome,
    telefone: telSanitizado,
    email: email !== undefined ? email : db.clientes[index].email,
    notas: notas !== undefined ? notas : db.clientes[index].notas,
    planoId: planoId !== undefined ? planoId : db.clientes[index].planoId,
    servidorId: servidorId !== undefined ? servidorId : db.clientes[index].servidorId,
    appId: appId !== undefined ? appId : db.clientes[index].appId
  };

  db.cobrancas.forEach(cob => {
    if (cob.clienteId === req.params.id) {
      cob.clienteNome = db.clientes[index].nome;
      cob.clienteTelefone = db.clientes[index].telefone;
    }
  });

  saveDB(db);
  res.json(db.clientes[index]);
});

app.delete('/api/clientes/:id', (req, res) => {
  const db = getDB();
  const initialLength = db.clientes.length;
  db.clientes = db.clientes.filter(c => c.id !== req.params.id);

  if (db.clientes.length === initialLength) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }

  saveDB(db);
  res.json({ success: true, message: "Cliente excluído com sucesso" });
});

app.get('/api/cobrancas', (req, res) => {
  const db = getDB();
  res.json(db.cobrancas || []);
});

app.post('/api/cobrancas', (req, res) => {
  const db = getDB();
  const { clienteId, valor, dataVencimento, dataHoraEnvio, descricao, modeloMensagemId } = req.body;

  if (!clienteId || !valor || !dataVencimento || !descricao) {
    return res.status(400).json({ error: "Preencha todos os campos obrigatórios" });
  }

  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente) return res.status(404).json({ error: "Cliente selecionado não existe" });

  const novaCobranca = {
    id: `cob_${Date.now()}`,
    clienteId,
    clienteNome: cliente.nome,
    clienteTelefone: sanitizePhone(cliente.telefone),
    valor: parseFloat(valor),
    dataVencimento,
    dataHoraEnvio: dataHoraEnvio || `${dataVencimento}T09:00`,
    descricao,
    modeloMensagemId: modeloMensagemId || null,
    status: "PENDENTE",
    statusEnvio: "AGENDADO",
    dataEnvioRealizado: null,
    dataPagamento: null,
    observacaoBaixa: null
  };

  db.cobrancas.push(novaCobranca);
  saveDB(db);
  res.status(201).json(novaCobranca);
});

app.put('/api/cobrancas/:id', (req, res) => {
  const db = getDB();
  const index = db.cobrancas.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Cobrança não encontrada" });

  const { clienteId, valor, dataVencimento, dataHoraEnvio, descricao, modeloMensagemId, status } = req.body;

  if (clienteId && clienteId !== db.cobrancas[index].clienteId) {
    const cliente = db.clientes.find(c => c.id === clienteId);
    if (cliente) {
      db.cobrancas[index].clienteId = cliente.id;
      db.cobrancas[index].clienteNome = cliente.nome;
      db.cobrancas[index].clienteTelefone = sanitizePhone(cliente.telefone);
    }
  }

  const novaDataHoraEnvio = dataHoraEnvio || db.cobrancas[index].dataHoraEnvio;
  const dataHoraMudou = novaDataHoraEnvio !== db.cobrancas[index].dataHoraEnvio;

  db.cobrancas[index] = {
    ...db.cobrancas[index],
    valor: valor !== undefined ? parseFloat(valor) : db.cobrancas[index].valor,
    dataVencimento: dataVencimento || db.cobrancas[index].dataVencimento,
    dataHoraEnvio: novaDataHoraEnvio,
    descricao: descricao || db.cobrancas[index].descricao,
    modeloMensagemId: modeloMensagemId !== undefined ? modeloMensagemId : db.cobrancas[index].modeloMensagemId,
    status: status || db.cobrancas[index].status,
    // Quando a data/hora é alterada, remarca automaticamente como AGENDADO para envio no novo momento!
    statusEnvio: (dataHoraMudou || db.cobrancas[index].statusEnvio === 'ENVIADO') ? "AGENDADO" : db.cobrancas[index].statusEnvio,
    dataEnvioRealizado: (dataHoraMudou || db.cobrancas[index].statusEnvio === 'ENVIADO') ? null : db.cobrancas[index].dataEnvioRealizado
  };

  saveDB(db);
  res.json(db.cobrancas[index]);
});

app.delete('/api/cobrancas/:id', (req, res) => {
  const db = getDB();
  const initialLength = db.cobrancas.length;
  db.cobrancas = db.cobrancas.filter(c => c.id !== req.params.id);

  if (db.cobrancas.length === initialLength) {
    return res.status(404).json({ error: "Cobrança não encontrada" });
  }

  saveDB(db);
  res.json({ success: true, message: "Cobrança excluída com sucesso" });
});

function gerarMensagemRenovacaoWhatsApp(cobranca, proximoVencimento, dataPagamento) {
  const db = getDB();
  const modelos = db.modelosMensagens || defaultModelosMensagens;
  const template = modelos.avisoRenovacao || defaultModelosMensagens.avisoRenovacao;

  return processarTemplateMensagem(template, {
    clienteNome: cobranca.clienteNome,
    valor: cobranca.valor,
    dataPagamento: dataPagamento,
    proximoVencimento: proximoVencimento,
    descricao: cobranca.descricao
  }, db.meusDados);
}

app.post('/api/cobrancas/:id/dar-baixa', async (req, res) => {
  const db = getDB();
  const cobranca = db.cobrancas.find(c => c.id === req.params.id);
  if (!cobranca) return res.status(404).json({ error: "Cobrança não encontrada" });

  const { observacao, dataPagamento, proximoVencimento, enviarNotificacaoWhatsApp } = req.body;

  cobranca.status = "PAGO";
  cobranca.dataPagamento = dataPagamento || new Date().toISOString();
  cobranca.proximoVencimento = proximoVencimento || null;
  cobranca.observacaoBaixa = observacao || "Baixa efetuada manualmente pelo usuário";

  const msgRenovacao = gerarMensagemRenovacaoWhatsApp(cobranca, proximoVencimento, dataPagamento);
  const telefoneLimpo = sanitizePhone(cobranca.clienteTelefone);
  const linkWhatsAppRenovacao = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(msgRenovacao)}`;

  let enviouDireto = false;

  if (enviarNotificacaoWhatsApp && waStatus === 'CONNECTED' && waSock) {
    try {
      await sendWhatsAppMessage(telefoneLimpo, msgRenovacao);
      enviouDireto = true;
      console.log(`🎉 [RENOVAÇÃO DE PLANO] Mensagem de confirmação enviada via WhatsApp para ${cobranca.clienteNome} (${telefoneLimpo})`);
    } catch (err) {
      console.error("Erro ao enviar mensagem de renovação no Baileys:", err);
    }
  }

  db.historicoEnvios.push({
    id: `renov_${Date.now()}`,
    cobrancaId: cobranca.id,
    clienteNome: cobranca.clienteNome,
    clienteTelefone: telefoneLimpo,
    valor: cobranca.valor,
    dataEnvio: new Date().toISOString(),
    mensagem: msgRenovacao,
    tipoEnvio: enviouDireto ? "AUTOMATICO_RENOVACAO" : "BAIXA_MANUAL",
    link: linkWhatsAppRenovacao
  });

  saveDB(db);
  res.json({
    success: true,
    message: "Baixa efetuada e plano renovado com sucesso!",
    enviouDireto,
    msgRenovacao,
    linkWhatsAppRenovacao,
    cobranca
  });
});

app.post('/api/cobrancas/:id/reverter-baixa', (req, res) => {
  const db = getDB();
  const cobranca = db.cobrancas.find(c => c.id === req.params.id);
  if (!cobranca) return res.status(404).json({ error: "Cobrança não encontrada" });

  cobranca.status = "PENDENTE";
  cobranca.statusEnvio = "AGENDADO";
  cobranca.dataPagamento = null;
  cobranca.observacaoBaixa = null;
  cobranca.proximoVencimento = null;

  saveDB(db);
  res.json({ success: true, message: "Cobrança revertida para A Receber!", cobranca });
});

app.post('/api/cobrancas/:id/disparar-whatsapp', async (req, res) => {
  const db = getDB();
  const cobranca = db.cobrancas.find(c => c.id === req.params.id);
  if (!cobranca) return res.status(404).json({ error: "Cobrança não encontrada" });

  const mensagemTexto = gerarMensagemWhatsApp(cobranca, db.meusDados);
  const telefoneLimpo = sanitizePhone(cobranca.clienteTelefone);
  const linkWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagemTexto)}`;

  let enviouDireto = false;

  if (waStatus === 'CONNECTED' && waSock) {
    try {
      await sendWhatsAppMessage(telefoneLimpo, mensagemTexto);
      enviouDireto = true;
      console.log(`🚀 [DISPARO MANUAL] Mensagem entregue via WhatsApp para ${cobranca.clienteNome} (${telefoneLimpo})`);
    } catch (err) {
      console.error("Erro ao enviar via Baileys:", err);
    }
  }

  cobranca.statusEnvio = "ENVIADO";
  cobranca.dataEnvioRealizado = new Date().toISOString();

  db.historicoEnvios.push({
    id: `env_${Date.now()}`,
    cobrancaId: cobranca.id,
    clienteNome: cobranca.clienteNome,
    clienteTelefone: telefoneLimpo,
    valor: cobranca.valor,
    dataEnvio: new Date().toISOString(),
    mensagem: mensagemTexto,
    tipoEnvio: enviouDireto ? "AUTOMATICO_DIRECT" : "LINK_MANUAL",
    link: linkWhatsApp
  });

  saveDB(db);

  res.json({
    success: true,
    enviouDireto,
    linkWhatsApp,
    mensagemTexto,
    cobranca
  });
});

app.get('/api/contas-recebidas', (req, res) => {
  const db = getDB();
  const recebidas = db.cobrancas.filter(c => c.status === 'PAGO');
  res.json(recebidas);
});

app.get('/api/dashboard', (req, res) => {
  const db = getDB();
  const cobrancas = db.cobrancas || [];
  const hoje = getLocalIsoString().split('T')[0];

  const totalPendente = cobrancas
    .filter(c => c.status === 'PENDENTE')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalRecebido = cobrancas
    .filter(c => c.status === 'PAGO')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalVencido = cobrancas
    .filter(c => c.status === 'PENDENTE' && c.dataVencimento < hoje)
    .reduce((sum, c) => sum + c.valor, 0);

  const totalAgendados = cobrancas.filter(c => c.statusEnvio === 'AGENDADO' && c.status === 'PENDENTE').length;
  const totalClientes = (db.clientes || []).length;

  res.json({
    totalPendente,
    totalRecebido,
    totalVencido,
    totalAgendados,
    totalClientes,
    waStatus,
    waUserNumber,
    alertasPendentes: db.alertasPendentes || []
  });
});

app.get('/api/alertas-pendentes', (req, res) => {
  const db = getDB();
  const alertas = [...(db.alertasPendentes || [])];
  db.alertasPendentes = [];
  saveDB(db);
  res.json(alertas);
});

// -----------------------------------------------------------------
// MODELOS DE MENSAGENS E PROMOÇÕES EDITÁVEIS
// -----------------------------------------------------------------
app.post('/api/promocao-indicacao/disparar', async (req, res) => {
  const db = getDB();
  const { clienteId, enviarParaTodos } = req.body;
  const modeloPromo = getModeloMensagem('tpl_promocao_indicacao', db);
  const templatePromo = modeloPromo ? modeloPromo.mensagem : defaultModelosMensagensArray[3].mensagem;

  let destinatarios = [];
  if (enviarParaTodos) {
    destinatarios = db.clientes || [];
  } else if (clienteId) {
    const cli = db.clientes.find(c => c.id === clienteId);
    if (cli) destinatarios.push(cli);
  }

  if (destinatarios.length === 0) {
    return res.status(400).json({ error: "Nenhum cliente selecionado para o disparo" });
  }

  let totalEnviados = 0;
  let linksGerados = [];

  for (let cli of destinatarios) {
    const mensagemTexto = processarTemplateMensagem(templatePromo, {
      clienteNome: cli.nome,
      nome: cli.nome
    }, db.meusDados);

    const telefoneLimpo = sanitizePhone(cli.telefone);
    const linkWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagemTexto)}`;
    let enviouDireto = false;

    if (waStatus === 'CONNECTED' && waSock) {
      try {
        await sendWhatsAppMessage(telefoneLimpo, mensagemTexto);
        enviouDireto = true;
        totalEnviados++;
      } catch (err) {
        console.error(`Erro ao disparar promoção para ${cli.nome}:`, err);
      }
    }

    db.historicoEnvios.push({
      id: `promo_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      clienteNome: cli.nome,
      clienteTelefone: telefoneLimpo,
      dataEnvio: new Date().toISOString(),
      mensagem: mensagemTexto,
      tipoEnvio: enviouDireto ? "AUTOMATICO_PROMOCAO" : "LINK_MANUAL_PROMOCAO",
      link: linkWhatsApp
    });

    linksGerados.push({ cliente: cli.nome, link: linkWhatsApp, enviouDireto });
  }

  saveDB(db);
  res.json({
    success: true,
    message: `Disparo de promoção concluído para ${destinatarios.length} cliente(s)!`,
    totalEnviados,
    linksGerados
  });
});

app.get('/api/modelos-mensagens', (req, res) => {
  const db = getDB();
  const modelos = (db.modelosMensagens && Array.isArray(db.modelosMensagens)) ? db.modelosMensagens : defaultModelosMensagensArray;
  res.json(modelos);
});

app.post('/api/modelos-mensagens', (req, res) => {
  const db = getDB();
  if (!Array.isArray(db.modelosMensagens)) {
    db.modelosMensagens = [...defaultModelosMensagensArray];
  }

  const { id, titulo, categoria, mensagem } = req.body;

  if (!titulo || !mensagem) {
    return res.status(400).json({ error: "Título e mensagem são obrigatórios." });
  }

  if (id) {
    const index = db.modelosMensagens.findIndex(m => m.id === id);
    if (index !== -1) {
      db.modelosMensagens[index] = {
        ...db.modelosMensagens[index],
        titulo,
        categoria: categoria || 'Personalizada',
        mensagem
      };
    } else {
      db.modelosMensagens.push({ id, titulo, categoria: categoria || 'Personalizada', mensagem, padrao: false });
    }
  } else {
    const newId = `tpl_custom_${Date.now()}`;
    db.modelosMensagens.push({
      id: newId,
      titulo,
      categoria: categoria || 'Personalizada',
      mensagem,
      padrao: false
    });
  }

  saveDB(db);
  res.json({ success: true, modelos: db.modelosMensagens });
});

app.delete('/api/modelos-mensagens/:id', (req, res) => {
  const db = getDB();
  if (!Array.isArray(db.modelosMensagens)) {
    db.modelosMensagens = [...defaultModelosMensagensArray];
  }

  const { id } = req.params;
  db.modelosMensagens = db.modelosMensagens.filter(m => m.id !== id);

  saveDB(db);
  res.json({ success: true, modelos: db.modelosMensagens });
});

app.post('/api/modelos-mensagens/restaurar-padrao', (req, res) => {
  const db = getDB();
  db.modelosMensagens = [...defaultModelosMensagensArray];
  saveDB(db);
  res.json({ success: true, modelos: db.modelosMensagens });
});

app.post('/api/modelos-mensagens/disparar-selecionada', async (req, res) => {
  const db = getDB();
  const { clienteId, modeloId, textoCustomizado } = req.body;

  const cli = db.clientes.find(c => c.id === clienteId);
  if (!cli) return res.status(404).json({ error: "Cliente não encontrado" });

  const cobrancasCli = db.cobrancas.filter(c => c.clienteId === cli.id);
  const cob = cobrancasCli.length > 0 ? cobrancasCli[0] : { valor: 35, dataVencimento: getLocalIsoString().split('T')[0], descricao: 'Plano de Canais IPTV' };

  let rawTemplate = textoCustomizado;
  if (!rawTemplate && modeloId) {
    const modelo = getModeloMensagem(modeloId, db);
    if (modelo) rawTemplate = modelo.mensagem;
  }
  if (!rawTemplate) {
    rawTemplate = defaultModelosMensagensArray[0].mensagem;
  }

  const mensagemTexto = processarTemplateMensagem(rawTemplate, {
    clienteNome: cli.nome,
    nome: cli.nome,
    valor: cob.valor,
    dataVencimento: cob.dataVencimento,
    proximoVencimento: cob.proximoVencimento,
    descricao: cob.descricao
  }, db.meusDados);

  const telefoneLimpo = sanitizePhone(cli.telefone);
  const linkWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagemTexto)}`;
  let enviouDireto = false;

  if (waStatus === 'CONNECTED' && waSock) {
    try {
      await sendWhatsAppMessage(telefoneLimpo, mensagemTexto);
      enviouDireto = true;
    } catch (err) {
      console.error(`Erro ao disparar modelo customizado para ${cli.nome}:`, err);
    }
  }

  db.historicoEnvios.push({
    id: `custom_${Date.now()}`,
    cobrancaId: cob.id || null,
    clienteNome: cli.nome,
    clienteTelefone: telefoneLimpo,
    valor: cob.valor || 0,
    dataEnvio: new Date().toISOString(),
    mensagem: mensagemTexto,
    tipoEnvio: enviouDireto ? "AUTOMATICO_CUSTOM" : "LINK_MANUAL_CUSTOM",
    link: linkWhatsApp
  });

  saveDB(db);
  res.json({
    success: true,
    message: "Mensagem enviada com sucesso!",
    enviouDireto,
    linkWhatsApp,
    mensagemTexto
  });
});

app.post('/api/modelos-mensagens/enviar-custom', async (req, res) => {
  const db = getDB();
  const { clienteId, tipoModelo, templateCustom } = req.body;

  const cli = db.clientes.find(c => c.id === clienteId);
  if (!cli) return res.status(404).json({ error: "Cliente não encontrado" });

  const cobrancasCli = db.cobrancas.filter(c => c.clienteId === cli.id);
  const cob = cobrancasCli.length > 0 ? cobrancasCli[0] : { valor: 35, dataVencimento: getLocalIsoString().split('T')[0], descricao: 'Plano de Canais IPTV' };

  const template = templateCustom || getModeloMensagem(tipoModelo, db).mensagem;

  const mensagemTexto = processarTemplateMensagem(template, {
    clienteNome: cli.nome,
    nome: cli.nome,
    valor: cob.valor,
    dataVencimento: cob.dataVencimento,
    proximoVencimento: cob.proximoVencimento,
    descricao: cob.descricao
  }, db.meusDados);

  const telefoneLimpo = sanitizePhone(cli.telefone);
  const linkWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagemTexto)}`;
  let enviouDireto = false;

  if (waStatus === 'CONNECTED' && waSock) {
    try {
      await sendWhatsAppMessage(telefoneLimpo, mensagemTexto);
      enviouDireto = true;
    } catch (err) {
      console.error(`Erro ao disparar modelo customizado para ${cli.nome}:`, err);
    }
  }

  db.historicoEnvios.push({
    id: `custom_${Date.now()}`,
    cobrancaId: cob.id || null,
    clienteNome: cli.nome,
    clienteTelefone: telefoneLimpo,
    valor: cob.valor || 0,
    dataEnvio: new Date().toISOString(),
    mensagem: mensagemTexto,
    tipoEnvio: enviouDireto ? "AUTOMATICO_CUSTOM" : "LINK_MANUAL_CUSTOM",
    link: linkWhatsApp
  });

  saveDB(db);
  res.json({
    success: true,
    message: "Mensagem personalizada enviada com sucesso!",
    enviouDireto,
    linkWhatsApp,
    mensagemTexto
  });
});


// -----------------------------------------------------------------
// MOTOR CRON DE DISPARO AUTOMÁTICO (CHECAGEM EM TEMPO REAL)
// -----------------------------------------------------------------
setInterval(async () => {
  try {
    const db = getDB();
    const agoraLocalStr = getLocalIsoString(); // YYYY-MM-DDTHH:mm
    let alterado = false;

    for (let cob of db.cobrancas) {
      // Checa qualquer cobrança pendente que ainda NÃO foi enviada
      if (cob.status === 'PENDENTE' && cob.statusEnvio !== 'ENVIADO' && cob.dataHoraEnvio) {
        
        if (agoraLocalStr >= cob.dataHoraEnvio) {
          const mensagemTexto = gerarMensagemWhatsApp(cob, db.meusDados);
          const telefoneLimpo = sanitizePhone(cob.clienteTelefone);
          const linkWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagemTexto)}`;

          console.log(`⏰ [CRON] Cobrança #${cob.id} pronta para envio (${cob.dataHoraEnvio}). Fuso Local: ${agoraLocalStr}`);

          // Se WhatsApp estiver CONECTADO via QR Code -> Envia 100% AUTOMÁTICO!
          if (waStatus === 'CONNECTED' && waSock) {
            try {
              await sendWhatsAppMessage(telefoneLimpo, mensagemTexto);
              
              cob.statusEnvio = 'ENVIADO';
              cob.dataEnvioRealizado = new Date().toISOString();
              alterado = true;

              db.historicoEnvios.push({
                id: `env_auto_${Date.now()}_${cob.id}`,
                cobrancaId: cob.id,
                clienteNome: cob.clienteNome,
                clienteTelefone: telefoneLimpo,
                valor: cob.valor,
                dataEnvio: new Date().toISOString(),
                mensagem: mensagemTexto,
                tipoEnvio: "AUTOMATICO_ROBOT"
              });

              console.log(`🤖 [ROBÔ WHATSAPP] Mensagem entregue com SUCESSO para ${cob.clienteNome} (${telefoneLimpo})!`);
              continue;
            } catch (sendErr) {
              console.error("❌ Erro ao enviar mensagem no cron Baileys:", sendErr);
            }
          }

          // Se WhatsApp ainda não estiver conectado no QR Code, gera alerta visual no painel
          if (cob.statusEnvio !== 'PRONTO_PARA_DISPARO') {
            cob.statusEnvio = 'PRONTO_PARA_DISPARO';
            alterado = true;

            if (!db.alertasPendentes) db.alertasPendentes = [];
            db.alertasPendentes.push({
              id: `alt_${Date.now()}_${cob.id}`,
              cobrancaId: cob.id,
              clienteNome: cob.clienteNome,
              clienteTelefone: telefoneLimpo,
              valor: cob.valor,
              descricao: cob.descricao,
              dataVencimento: cob.dataVencimento,
              mensagemTexto,
              linkWhatsApp
            });
          }
        }
      }
    }

    if (alterado) {
      saveDB(db);
    }
  } catch (err) {
    console.error("Erro no motor de disparo automático:", err);
  }
}, 10000);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 GESTOR DE COBRANÇAS (Automação WhatsApp) porta ${PORT}`);
  console.log(`📱 Acesse pelo navegador: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = app;
