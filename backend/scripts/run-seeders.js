'use strict';

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando execução dos seeders...');

try {
  const seeders = [
    '20250519000000-demo-users.js',
    '20250519000001-demo-categories.js',
    '20250519000002-demo-products.js',
    '20250519000003-demo-addresses.js',
    '20250519000004-demo-recipes.js',
    '20250519000005-demo-comments.js',
    '20250519000006-demo-orders.js',
    '20250519000007-demo-order-products.js',
  ];

  for (const seeder of seeders) {
    console.log(`Executando seeder: ${seeder}`);
    execSync(`npx sequelize-cli db:seed --seed ${seeder}`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
  }

  console.log('Todos os seeders foram executados com sucesso!');
} catch (error) {
  console.error('Erro ao executar seeders:', error.message);
  process.exit(1);
}
