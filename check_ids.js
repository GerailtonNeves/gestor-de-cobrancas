const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const requiredIds = [
  'modalPlano', 'modalPlanoTitle', 'formPlano', 'planoId', 'planoNome', 'planoCategoria', 'planoTelas', 'planoValidade', 'planoValor', 'planoDesconto', 'planoCorBadge', 'planoValorFinalCalculado', 'planoDescricao',
  'modalApp', 'modalAppTitle', 'formApp', 'appId', 'appNome', 'appCategoria', 'appDescricao',
  'modalServidor', 'modalServidorTitle', 'formServidor', 'servidorId', 'servidorNome', 'servidorCategoria', 'servidorDescricao',
  'btnNovoPlano', 'btnNovoApp', 'btnNovoServidor'
];

requiredIds.forEach(id => {
  const exists = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  console.log((exists ? '✅' : '❌ MISSING:'), id);
});
