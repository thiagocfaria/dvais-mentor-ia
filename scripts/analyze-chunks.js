/**
 * Script para analisar chunks e identificar dependências pesadas
 */

const fs = require('fs');
const path = require('path');

const chunksDir = path.join(__dirname, '../.next/static/chunks');

// Mapear chunks conhecidos
const chunks = {
  'vendors': path.join(chunksDir, 'vendors-4b1235d33fc9ba30.js'),
  'tensorflow': path.join(chunksDir, 'tensorflow-3bfaf34314881422.js'),
  'polyfills': path.join(chunksDir, 'polyfills-42372ed130431b0a.js'),
  'home': path.join(chunksDir, 'app/page-6b0f821b28e980c2.js'),
  'cadastro': path.join(chunksDir, 'app/cadastro/page-74a4355512d8ac79.js'),
  'login': path.join(chunksDir, 'app/login/page-4d2fd341214ecdf1.js'),
  'analise-tempo-real': path.join(chunksDir, 'app/analise-tempo-real/page-13c1f8bbb827e0f6.js'),
};

// Bibliotecas para verificar
const libraries = [
  'libphonenumber',
  'react-phone-number-input',
  'country-flag-icons',
  '@fortawesome',
  'fontawesome',
  'zod',
  '@tensorflow',
  'tensorflow',
];

console.log('=== ANÁLISE DE BUNDLE SIZE ===\n');

// Analisar cada chunk
const results = [];

Object.entries(chunks).forEach(([name, filePath]) => {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const foundLibs = [];
    libraries.forEach(lib => {
      // Escapar caracteres especiais para regex
      const escaped = lib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      const matches = content.match(regex);
      if (matches && matches.length > 3) {
        foundLibs.push({ name: lib, count: matches.length });
      }
    });
    
    results.push({
      name,
      sizeKB: parseFloat(sizeKB),
      sizeBytes: stats.size,
      libraries: foundLibs
    });
  }
});

// Ordenar por tamanho
results.sort((a, b) => b.sizeBytes - a.sizeBytes);

console.log('TOP 10 CHUNKS (por tamanho):\n');
results.slice(0, 10).forEach((chunk, index) => {
  console.log(`${index + 1}. ${chunk.name}.js: ${chunk.sizeKB} KB`);
  if (chunk.libraries.length > 0) {
    chunk.libraries.forEach(lib => {
      console.log(`   └─ ${lib.name}: ${lib.count} referências`);
    });
  }
});

console.log('\n=== DEPENDÊNCIAS PESADAS ===\n');

// Agrupar por biblioteca
const libMap = {};
results.forEach(chunk => {
  chunk.libraries.forEach(lib => {
    if (!libMap[lib.name]) {
      libMap[lib.name] = { chunks: [], totalRefs: 0 };
    }
    libMap[lib.name].chunks.push({ name: chunk.name, sizeKB: chunk.sizeKB, refs: lib.count });
    libMap[lib.name].totalRefs += lib.count;
  });
});

Object.entries(libMap)
  .sort((a, b) => b[1].totalRefs - a[1].totalRefs)
  .forEach(([libName, data]) => {
    console.log(`${libName}:`);
    console.log(`  Total de referências: ${data.totalRefs}`);
    console.log(`  Chunks: ${data.chunks.map(c => `${c.name} (${c.sizeKB}KB)`).join(', ')}`);
    console.log('');
  });

// Verificar TensorFlow.js
console.log('\n=== TENSORFLOW.JS ===\n');
const tfChunk = results.find(r => r.name === 'tensorflow');
if (tfChunk) {
  console.log(`Chunk tensorflow.js: ${tfChunk.sizeKB} KB`);
  console.log('Status: Separado em chunk próprio (otimizado)');
} else {
  console.log('TensorFlow.js não encontrado em chunk separado');
}

// Verificar libphonenumber-js
console.log('\n=== LIBPHONENUMBER-JS ===\n');
const phoneLibs = Object.entries(libMap).filter(([name]) => 
  name.includes('libphonenumber') || name.includes('react-phone-number-input')
);
if (phoneLibs.length > 0) {
  phoneLibs.forEach(([name, data]) => {
    console.log(`${name}:`);
    data.chunks.forEach(c => {
      console.log(`  - ${c.name}: ${c.sizeKB} KB (${c.refs} refs)`);
    });
  });
} else {
  console.log('libphonenumber-js não encontrado (pode estar lazy loaded)');
}

// Verificar FontAwesome
console.log('\n=== FONTAWESOME ===\n');
const faLibs = Object.entries(libMap).filter(([name]) => 
  name.includes('fontawesome') || name.includes('@fortawesome')
);
if (faLibs.length > 0) {
  faLibs.forEach(([name, data]) => {
    console.log(`${name}:`);
    data.chunks.forEach(c => {
      console.log(`  - ${c.name}: ${c.sizeKB} KB (${c.refs} refs)`);
    });
  });
} else {
  console.log('FontAwesome não encontrado em análise de texto (pode estar em vendors)');
}

// Verificar libphonenumber no chunk de cadastro
console.log('\n=== VERIFICAÇÃO LIBPHONENUMBER-JS ===\n');
const cadastroPath = chunks.cadastro;
if (fs.existsSync(cadastroPath)) {
  const cadastroContent = fs.readFileSync(cadastroPath, 'utf8');
  const phoneLibs = ['libphonenumber', 'react-phone-number-input', 'country-flag'];
  let found = false;
  phoneLibs.forEach(lib => {
    const regex = new RegExp(lib, 'gi');
    const matches = cadastroContent.match(regex);
    if (matches) {
      console.log(`${lib}: ${matches.length} referências no chunk de cadastro`);
      found = true;
    }
  });
  if (!found) {
    console.log('libphonenumber-js NÃO está no chunk de cadastro (lazy loaded funcionando!)');
  }
}

// Verificar vendors chunk para React, Next.js, etc
console.log('\n=== VENDORS CHUNK (945.97 KB) ===\n');
if (fs.existsSync(chunks.vendors)) {
  const vendorsContent = fs.readFileSync(chunks.vendors, 'utf8');
  const vendorLibs = ['react', 'react-dom', 'next', 'zod', '@fortawesome', 'fontawesome'];
  vendorLibs.forEach(lib => {
    const escaped = lib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const matches = vendorsContent.match(regex);
    if (matches && matches.length > 10) {
      console.log(`${lib}: ${matches.length} referências`);
    }
  });
}

console.log('\n=== RESUMO POR PÁGINA ===\n');
console.log('Tamanhos de First Load JS (do build output):');
console.log('  / (home): 386 KB');
console.log('  /login: 281 KB');
console.log('  /cadastro: 283 KB');
console.log('  /analise-tempo-real: 278 KB');
console.log('\nShared chunks: 282 KB');
console.log('  - vendors.js: 276 KB');
console.log('  - other: 6 KB');
