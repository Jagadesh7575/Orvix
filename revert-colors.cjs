const fs = require('fs');

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = parseInt(x).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

let css = fs.readFileSync('src/index.css', 'utf-8');

css = css.replace(/(--[a-zA-Z0-9-]+-color):\s*(\d+)\s+(\d+)\s+(\d+);/g, (match, varName, r, g, b) => {
  return `${varName}: ${rgbToHex(r, g, b)};`;
});

fs.writeFileSync('src/index.css', css);
console.log('Reverted index.css to Hex');
