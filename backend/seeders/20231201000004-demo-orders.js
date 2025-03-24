'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Buscar usuários
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) return;

    // Criar pedidos
    const orders = await queryInterface.bulkInsert('orders', [
      {
        user_id: users[0].id,
        status: 'complete',
        total: 89.90,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        user_id: users[1].id,
        status: 'paid',
        total: 350.00,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        user_id: users[0].id,
        status: 'pending',
        total: 78.50,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Buscar IDs dos pedidos criados
    const createdOrders = await queryInterface.sequelize.query(
      'SELECT id FROM orders ORDER BY id DESC LIMIT 3;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Buscar produtos
    const products = await queryInterface.sequelize.query(
      'SELECT id, price, image_url FROM products;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (products.length === 0) return;

    // Função para ler imagens e converter em buffer
    const getImageBuffer = (imagePath) => {
      return fs.readFileSync(path.join(__dirname, 'images', imagePath)); // Ajuste o caminho conforme necessário
    };

    // Criar itens dos pedidos
    const order_products = [];

    // Pedido 1: Bolo de Chocolate + Pudim
    order_products.push({
      order_id: createdOrders[2].id,
      product_id: products[0].id, // Bolo de Chocolate
      quantity: 1,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });
    order_products.push({
      order_id: createdOrders[2].id,
      product_id: products[6].id, // Pudim de Leite
      quantity: 1,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    // Pedido 2: Bolo de Casamento
    order_products.push({
      order_id: createdOrders[1].id,
      product_id: products[1].id, // Bolo de Casamento
      quantity: 1,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // Pedido 3: Torta de Limão + Brigadeiro (10 unidades)
    order_products.push({
      order_id: createdOrders[0].id,
      product_id: products[2].id, // Torta de Limão
      quantity: 1,
      created_at: new Date(),
      updated_at: new Date()
    });
    order_products.push({
      order_id: createdOrders[0].id,
      product_id: products[3].id, // Brigadeiro Gourmet
      quantity: 10,
      created_at: new Date(),
      updated_at: new Date()
    });

    await queryInterface.bulkInsert('order_products', order_products);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('order_products', null, {});
    await queryInterface.bulkDelete('orders', null, {});
  }
};
