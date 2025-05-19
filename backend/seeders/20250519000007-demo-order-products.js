'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primeiro, vamos obter os IDs dos pedidos e produtos que criamos
    const orders = await queryInterface.sequelize.query('SELECT id, status, user_id FROM `order`;');

    const products = await queryInterface.sequelize.query('SELECT id, name FROM product;');

    const users = await queryInterface.sequelize.query('SELECT id, email FROM user;');

    const orderRows = orders[0];
    const productRows = products[0];
    const userRows = users[0];

    // Criar mapa de emails para IDs
    const userMap = {};
    userRows.forEach(user => {
      userMap[user.email] = user.id;
    });

    // Mapear pedidos por usuário e status
    const userOrders = {};
    orderRows.forEach(order => {
      // Encontrar email do usuário pelo ID
      const userEmail = userRows.find(user => user.id === order.user_id)?.email;
      if (userEmail) {
        if (!userOrders[userEmail]) {
          userOrders[userEmail] = {};
        }
        userOrders[userEmail][order.status] = order.id;
      }
    });

    // Mapear produtos por nome
    const productMap = {};
    productRows.forEach(product => {
      productMap[product.name] = product.id;
    });
    return queryInterface.bulkInsert(
      'order_product',
      [
        {
          order_id: userOrders['lucas@gmail.com.br']?.pending,
          product_id: productMap['Bolo de Chocolate'],
          quantity: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          order_id: userOrders['lucas@gmail.com.br']?.pending,
          product_id: productMap['Brigadeiros Gourmet'],
          quantity: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          order_id: userOrders['renan@gmail.com.br']?.paid,
          product_id: productMap['Torta de Limão'],
          quantity: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          order_id: userOrders['renan@gmail.com.br']?.paid,
          product_id: productMap['Cupcake de Baunilha'],
          quantity: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          order_id: userOrders['eduardo@gmail.com.br']?.complete,
          product_id: productMap['Bolo de Morango'],
          quantity: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          order_id: userOrders['eduardo@gmail.com.br']?.complete,
          product_id: productMap['Bolo de Chocolate'],
          quantity: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          order_id: userOrders['joao@gmail.com.br']?.complete,
          product_id: productMap['Coxinha de Frango'],
          quantity: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          order_id: userOrders['joao@gmail.com.br']?.complete,
          product_id: productMap['Brigadeiros Gourmet'],
          quantity: 8,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('order_product', null, {});
  },
};
