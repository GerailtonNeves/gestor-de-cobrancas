# 🚀 Guia Passo a Passo: Hospedando o Gestor de Cobranças no Railway.app

Este guia ensina como publicar este sistema no **Railway.app** para que o robô do WhatsApp fique **rodando 24 horas por dia** e o app possa ser instalado no seu celular!

---

## 🛠️ Passo 1: Criar o Repositório no GitHub

1. Acesse o site do [GitHub](https://github.com) e faça login.
2. Clique no botão **"New"** (ou **"+" > New repository**).
3. Defina o nome do repositório (exemplo: `gestor-de-cobrancas`).
4. Escolha **Public** ou **Private** e clique em **"Create repository"**.
5. No seu computador, abra o Terminal (PowerShell ou Prompt) dentro desta pasta e digite:

```bash
git init
git add .
git commit -m "Feat: Sistema de cobranças IPTV completo com PWA e automação WhatsApp"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gestor-de-cobrancas.git
git push -u origin main
```
*(Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub)*.

---

## 🚂 Passo 2: Publicar no Railway.app

1. Acesse o site **[Railway.app](https://railway.app)** e faça login com sua conta do **GitHub**.
2. No painel inicial (Dashboard), clique no botão **"+ New Project"**.
3. Escolha a opção **"Deploy from GitHub repo"**.
4. Selecione o repositório **`gestor-de-cobrancas`** que você criou.
5. Clique em **"Deploy Now"**.

---

## 🌐 Passo 3: Gerar o Link Público (URL HTTPS para o Celular)

1. No painel do seu projeto no Railway, clique na caixa do serviço implantado.
2. Acesse a aba **"Settings"** (Configurações).
3. Role até a seção **"Networking"** (ou **Public Networking**).
4. Clique em **"Generate Domain"** (Gerar Domínio).
5. O Railway vai gerar um link público seguro com HTTPS (exemplo: `https://gestor-de-cobrancas-production.up.railway.app`).

---

## 📱 Passo 4: Conectar o WhatsApp e Instalar o App no Celular

1. Abra o link gerado pelo Railway no seu navegador do celular ou computador.
2. Acesse a aba **"Conectar WhatsApp (QR)"**.
3. Escaneie o QR Code no aplicativo do WhatsApp no seu celular (*Aparelhos conectados > Conectar um aparelho*).
4. O robô ficará **online 24 horas por dia**!
5. No celular, clique no banner superior **"📱 Instalar App no Celular"** para adicionar o ícone à sua tela inicial.

---

## 💾 Passo 5 (Opcional): Persistência de Dados no Railway (Volume)

Para garantir que as fotos e o histórico do banco de dados continuem salvos mesmo se você reiniciar o servidor:
1. Na tela do projeto no Railway, clique em **"+ New"**.
2. Selecione **"Volume"**.
3. Conecte o Volume ao caminho `/app/data`.

Pronto! Seu sistema está 100% online e funcional! 🎉
