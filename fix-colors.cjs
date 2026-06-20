const fs = require('fs');

const hexToRgbStr = (hex) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
};

let css = fs.readFileSync('src/index.css', 'utf-8');

css = css.replace(/(--[a-zA-Z0-9-]+-color):\s*#([0-9a-fA-F]{3,6});/g, (match, varName, hex) => {
  return `${varName}: ${hexToRgbStr(hex)};`;
});

fs.writeFileSync('src/index.css', css);
console.log('Fixed index.css');
