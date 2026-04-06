// Gera os ícones PWA usando Node.js + Canvas
// Execute: node generate-icons.js
// Requer: npm install canvas

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (!fs.existsSync('icons')) fs.mkdirSync('icons');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const pad = size * 0.12;
  const r = size * 0.22;

  // Background
  ctx.fillStyle = '#09090f';
  ctx.fillRect(0, 0, size, size);

  // Rounded rect background
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(size - pad - r, pad);
  ctx.quadraticCurveTo(size - pad, pad, size - pad, pad + r);
  ctx.lineTo(size - pad, size - pad - r);
  ctx.quadraticCurveTo(size - pad, size - pad, size - pad - r, size - pad);
  ctx.lineTo(pad + r, size - pad);
  ctx.quadraticCurveTo(pad, size - pad, pad, size - pad - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();
  ctx.fillStyle = '#e8c547';
  ctx.fill();

  // Letter "L"
  ctx.fillStyle = '#09090f';
  ctx.font = `bold ${size * 0.52}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', size / 2, size / 2 + size * 0.03);

  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join('icons', `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Criado: ${filePath}`);
});

console.log('\n🎉 Todos os ícones gerados em /icons/');
console.log('👉 Copie a pasta icons/ para junto do index.html');
