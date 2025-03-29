'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Buscar usuários
    const users = await queryInterface.sequelize.query('SELECT id FROM users;', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (users.length === 0) return;

    // Criar pedidos
    const orders = await queryInterface.bulkInsert(
      'orders',
      [
        {
          user_id: users[0].id,
          status: 'complete',
          total: 89.9,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          user_id: users[1].id,
          status: 'paid',
          total: 350.0,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          user_id: users[0].id,
          status: 'pending',
          total: 78.5,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      { returning: true }
    );

    // Buscar IDs dos pedidos criados - CORRETO: ordene por id ASC para manter ordem de criação
    const createdOrders = await queryInterface.sequelize.query(
      'SELECT id FROM orders ORDER BY id ASC LIMIT 3;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Buscar produtos
    const products = await queryInterface.sequelize.query('SELECT id, price FROM products;', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (products.length === 0) return;

    // Função para ler imagens e converter em buffer
    const getImageBuffer = imagePath => {
      return fs.readFileSync(path.join(__dirname, 'images', imagePath)); // Ajuste o caminho conforme necessário
    };

    // Criar itens dos pedidos
    const order_products = [];

    // Pedido 1: Bolo de Chocolate + Pudim
    orderProducts.push({
      order_id: createdOrders[0].id, // primeiro pedido criado (índice 0)
      product_id: products[0].id, // Bolo de Chocolate
      quantity: 1,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });
    orderProducts.push({
      order_id: createdOrders[0].id,
      product_id: products[1].id, // Pudim de Leite
      quantity: 1,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    // Pedido 2: Bolo de Casamento
    orderProducts.push({
      order_id: createdOrders[1].id, // segundo pedido criado (índice 1)
      product_id: products[1].id, // Bolo de Casamento
      quantity: 1,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // Pedido 3: Torta de Limão + Brigadeiro (10 unidades)
    orderProducts.push({
      order_id: createdOrders[2].id, // terceiro pedido criado (índice 2)
      product_id: products[2].id, // Torta de Limão
      quantity: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
    orderProducts.push({
      order_id: createdOrders[2].id,
      product_id: products[2].id, // Brigadeiro Gourmet
      quantity: 10,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await queryInterface.bulkInsert('order_products', orderProducts);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('order_products', null, {});
    await queryInterface.bulkDelete('orders', null, {});
  },
};
