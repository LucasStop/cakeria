'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      'admins',
      [
        {
          name: 'Admin Master',
          email: 'admin@exemplo.com',
          phone: '(11) 99999-9999',
          password: '$2b$10$dQlRBPu9xcxsjFQKKhHa0uvIbLL5Wqp6VYsh/QPKFgQQX/XMMKo2y',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('admins', null, {});
  },
};
