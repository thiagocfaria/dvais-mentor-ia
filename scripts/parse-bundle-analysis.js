/**
 * Script para extrair informações do bundle analyzer
 * 
 * Extrai os top chunks e dependências do relatório HTML gerado pelo webpack-bundle-analyzer
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../.next/analyze/client.html');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo client.html não encontrado. Execute npm run analyze primeiro.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Procurar pelo JSON de stats no HTML
// O webpack-bundle-analyzer geralmente inclui os dados em um script tag
const statsMatch = html.match(/<script[^>]*id="stats"[^>]*>([\s\S]*?)<\/script>/i) ||
                   html.match(/window\.bundleStats\s*=\s*({[\s\S]+?});/) ||
                   html.match(/var stats\s*=\s*({[\s\S]+?});/);

if (statsMatch) {
  try {
    const statsJson = statsMatch[1].trim();
    const stats = JSON.parse(statsJson);
    
    // Processar e exibir informações
    console.log('=== ANÁLISE DE BUNDLE ===\n');
    
    if (stats.chunks) {
      console.log('Top 10 Chunks (por tamanho):');
      const chunks = stats.chunks
        .map(chunk => ({
          id: chunk.id,
          names: chunk.names,
          size: chunk.size,
          modules: chunk.modules?.length || 0
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);
      
      chunks.forEach((chunk, index) => {
        console.log(`${index + 1}. ${chunk.names?.join(', ') || `Chunk ${chunk.id}`}: ${(chunk.size / 1024).toFixed(2)} KB (${chunk.modules} módulos)`);
      });
    }
    
    if (stats.modules) {
      console.log('\nTop 10 Módulos (por tamanho):');
      const modules = stats.modules
        .map(module => ({
          name: module.name || module.identifier,
          size: module.size,
          chunks: module.chunks?.length || 0
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);
      
      modules.forEach((module, index) => {
        const sizeKB = (module.size / 1024).toFixed(2);
        console.log(`${index + 1}. ${module.name}: ${sizeKB} KB`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao parsear JSON:', error.message);
  }
} else {
  // Tentar extrair informações do HTML de outra forma
  console.log('Formato de stats não encontrado. Tentando análise alternativa...\n');
  
  // Procurar por referências a bibliotecas conhecidas
  const libraries = [
    'tensorflow',
    'libphonenumber',
    'fontawesome',
    'react-phone-number-input',
    'country-flag-icons',
    'zod'
  ];
  
  console.log('Referências encontradas no HTML:');
  libraries.forEach(lib => {
    const regex = new RegExp(lib, 'gi');
    const matches = html.match(regex);
    if (matches) {
      console.log(`- ${lib}: ${matches.length} referências`);
    }
  });
  
  console.log('\nPara análise visual completa, abra o arquivo:');
  console.log(htmlPath);
}
