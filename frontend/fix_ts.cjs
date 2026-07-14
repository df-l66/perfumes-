const fs = require('fs');
const path = require('path');

const files = [
  './src/pages/Clientes.tsx',
  './src/pages/Productos.tsx',
  './src/pages/Proveedores.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/setForm\(f =>/g, 'setForm((f: any) =>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('Not found', file);
  }
});
