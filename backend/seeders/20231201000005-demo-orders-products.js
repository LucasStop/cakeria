'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Buscar IDs dos pedidos
    const orders = await queryInterface.sequelize.query('SELECT id FROM orders;', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (orders.length === 0) return;

    // Buscar IDs dos produtos
    const products = await queryInterface.sequelize.query('SELECT id FROM products;', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (products.length === 0) return;

    // Criar itens de pedidos
    const order_products = [];

    // Pedido 1: Adicionar produtos ao pedido 1
    order_products.push({
      order_id: orders[0].id,
      product_id: products[0].id, // Produto: Bolo de Chocolate
      quantity: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
    order_products.push({
      order_id: orders[0].id,
      product_id: products[0].id, // Produto: Pudim de Leite
      quantity: 2,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Pedido 2: Adicionar produtos ao pedido 2
    order_products.push({
      order_id: orders[1].id,
      product_id: products[1].id, // Produto: Bolo de Casamento
      quantity: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Pedido 3: Adicionar produtos ao pedido 3
    order_products.push({
      order_id: orders[2].id,
      product_id: products[2].id, // Produto: Torta de Limão
      quantity: 3,
      created_at: new Date(),
      updated_at: new Date(),
    });
    order_products.push({
      order_id: orders[2].id,
      product_id: products[2].id, // Produto: Brigadeiro Gourmet
      quantity: 10,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Inserir itens de pedidos na tabela order_products
    await queryInterface.bulkInsert('order_products', order_products);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('order_products', null, {});
  },
};
