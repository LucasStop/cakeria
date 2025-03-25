"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "users",
      [
        {
          name: "João Silva",
          email: "joao@exemplo.com",
          password:
            "$2b$10$dQlRBPu9xcxsjFQKKhHa0uvIbLL5Wqp6VYsh/QPKFgQQX/XMMKo2y",
          type: "client", 
          phone: "(21) 98765-4321", 
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Maria Oliveira",
          email: "maria@exemplo.com",
          password:
            "$2b$10$dQlRBPu9xcxsjFQKKhHa0uvIbLL5Wqp6VYsh/QPKFgQQX/XMMKo2y",
          type: "client", 
          phone: "(11) 97654-3210", 
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Ana Souza",
          email: "ana@exemplo.com",
          password:
            "$2b$10$dQlRBPu9xcxsjFQKKhHa0uvIbLL5Wqp6VYsh/QPKFgQQX/XMMKo2y",
          type: "admin", 
          phone: "(31) 96543-2109", 
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};
