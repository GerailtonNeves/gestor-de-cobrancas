# 🚀 Guia Passo a Passo: Hospedando 100% Grátis no Render.com

O Railway agora exige plano pago para novos projetos. O **Render.com** é a **melhor alternativa 100% gratuita** para hospedar este sistema com Node.js, WhatsApp automático e PWA no celular, **sem precisar de cartão de crédito**!

---

## 🛠️ Passo 1: Subir o Código para o GitHub

Se ainda não subiu os arquivos da pasta da Área de Trabalho para o GitHub:
1. Acesse o [GitHub](https://github.com) e crie um repositório chamado `gestor-de-cobrancas`.
2. Abra o Terminal (PowerShell) dentro da pasta `Gestor-de-Cobrancas-Railway` na sua Área de Trabalho e execute:

```bash
git init
git add .
git commit -m "Feat: Sistema de cobrancas IPTV PWA com robo WhatsApp"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gestor-de-cobrancas.git
git push -u origin main
```
*(Substitua `SEU_USUARIO` pelo seu usuário do GitHub).*

---

## 🌐 Passo 2: Criar a Conta e Publicar no Render.com (Grátis)

1. Acesse o site **[Render.com](https://render.com)**.
2. Clique no botão **"GET STARTED FOR FREE"** e faça login usando a sua conta do **GitHub**.
3. No painel do Render, clique no botão **"New +"** (canto superior direito) e selecione **"Web Service"**.
4. Selecione a opção **"Build and deploy from a Git repository"** e clique em **Next**.
5. Conecte sua conta do GitHub e selecione o repositório **`gestor-de-cobrancas`**.
6. Preencha as configurações simples:
   - **Name**: `gestor-cobrancas` (ou qualquer nome desejado)
   - **Region**: Escolha a mais próxima (ex: *Oregon (US West)* ou *Ohio*)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Escolha **Free** (Grátis $0/mês)
7. Clique no botão azul **"Create Web Service"**.

---

## 📱 Passo 3: Acessar o Link e Instalar o App no Celular

1. Aguarde cerca de 1 a 2 minutos até aparecer **"Build successful"** e a bolinha verde **"Live"**.
2. O Render vai gerar um link público grátis com HTTPS no topo da página (exemplo: `https://gestor-cobrancas.onrender.com`).
3. Abra esse link no seu celular ou computador.
4. Conecte o WhatsApp escaneando o QR Code na aba **"Conectar WhatsApp (QR)"**.
5. Clique no banner **"📱 Instalar App no Celular"** para salvar o ícone no seu celular! 🎉
