'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query('SELECT id, email FROM user;');

    const userRows = users[0];

    const userMap = {};
    userRows.forEach(user => {
      userMap[user.email] = user.id;
    });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    return queryInterface.bulkInsert(
      'order',
      [
        {
          user_id: userMap['lucas@gmail.com.br'],
          order_date: today,
          status: 'pending',
          total: 89.97,
          created_at: today,
          updated_at: today,
        },
        {
          user_id: userMap['renan@gmail.com.br'],
          order_date: yesterday,
          status: 'paid',
          total: 73.5,
          created_at: yesterday,
          updated_at: yesterday,
        },
        {
          user_id: userMap['eduardo@gmail.com.br'],
          order_date: lastWeek,
          status: 'complete',
          total: 129.99,
          created_at: lastWeek,
          updated_at: lastWeek,
        },
        {
          user_id: userMap['joao@gmail.com.br'],
          order_date: twoWeeksAgo,
          status: 'complete',
          total: 65.98,
          created_at: twoWeeksAgo,
          updated_at: twoWeeksAgo,
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('order', null, {});
  },
};
