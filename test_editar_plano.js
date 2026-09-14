const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const htmlContent = fs.readFileSync('public/index.html', 'utf8');
const jsContent = fs.readFileSync('public/js/app.js', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (...args) => console.error("JSDOM ERROR:", ...args));
virtualConsole.on("warn", (...args) => console.warn("JSDOM WARN:", ...args));
virtualConsole.on("log", (...args) => console.log("JSDOM LOG:", ...args));

const dom = new JSDOM(htmlContent, {
  runScripts: "dangerously",
  virtualConsole,
  url: "http://localhost:3030/"
});

const { window } = dom;

try {
  const scriptEl = window.document.createElement("script");
  scriptEl.textContent = jsContent;
  window.document.body.appendChild(scriptEl);
  console.log('Script tag appended successfully.');
} catch(e) {
  console.error('Caught error appending script tag:', e);
}

console.log('window.editarPlano type:', typeof window.editarPlano);
console.log('window.abrirModalNovoPlano type:', typeof window.abrirModalNovoPlano);
