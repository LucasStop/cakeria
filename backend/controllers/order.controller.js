const { Order, Product, User, OrderProduct, sequelize } = require('../models');

exports.findAll = async (req, res) => {
  try {
    const order = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Product, as: 'product' },
      ],
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
  }
};

exports.findByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const order = await Order.findAll({
      where: { user_id: userId },
      include: [{ model: Product, as: 'product' }],
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar pedidos do usuário',
      error: error.message,
    });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: Product,
          as: 'product',
          through: {
            model: OrderProduct,
            attributes: ['quantity'],
          },
        },
      ],
    });
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedido', error: error.message });
  }
};

exports.create = async (req, res) => {
  const { user_id, product, total } = req.body;

  if (!user_id || !product || !Array.isArray(product) || product.length === 0) {
    return res.status(400).json({
      message: 'Dados inválidos',
      details: 'É necessário informar usuário e pelo menos um produto',
    });
  }

  try {
    // Verifica o estoque de todos os produtos antes de criar o pedido
    const productIds = product.map(item => item.id);
    const productFromDB = await Product.findAll({
      where: { id: productIds },
    });

    // Cria um mapa para verificação rápida
    const productMap = {};
    productFromDB.forEach(item => {
      productMap[item.id] = item;
    });

    // Verifica se todos os produtos estão disponíveis e têm estoque suficiente
    const invalidProduct = [];
    product.forEach(item => {
      const dbProduct = productMap[item.id];

      if (!dbProduct) {
        invalidProduct.push({
          id: item.id,
          error: 'Produto não encontrado',
        });
      } else if (!dbProduct.is_active) {
        invalidProduct.push({
          id: item.id,
          name: dbProduct.name,
          error: 'Produto indisponível',
        });
      } else if (dbProduct.stock < item.quantity) {
        invalidProduct.push({
          id: item.id,
          name: dbProduct.name,
          error: `Estoque insuficiente. Disponível: ${dbProduct.stock}`,
        });
      }
    });

    if (invalidProduct.length > 0) {
      return res.status(400).json({
        message: 'Não foi possível criar o pedido',
        errors: invalidProduct,
      });
    }

    const result = await sequelize.transaction(async t => {
      const order = await Order.create(
        {
          user_id,
          total,
          status: 'pending',
        },
        { transaction: t }
      );

      if (product && product.length) {
        const orderProductItems = product.map(item => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
        }));

        // Usar o modelo OrderProduct para criar os itens do pedido
        await OrderProduct.bulkCreate(orderProductItems, { transaction: t });

        // Atualiza o estoque de cada produto
        for (const item of product) {
          const dbProduct = productMap[item.id];
          await dbProduct.update({ stock: dbProduct.stock - item.quantity }, { transaction: t });
        }
      }

      return order;
    });

    const createdOrder = await Order.findByPk(result.id, {
      include: [{ model: Product, as: 'product' }],
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar pedido', error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validar se o status foi informado
  if (!status) {
    return res.status(400).json({
      message: 'Dados inválidos',
      details: 'É necessário informar o status do pedido',
    });
  }

  // Validar se o status é válido
  const validStatus = Object.values(Order.rawAttributes.status.values);
  if (!validStatus.includes(status)) {
    return res.status(400).json({
      message: 'Status inválido',
      details: `O status deve ser um dos seguintes: ${validStatus.join(', ')}`,
    });
  }

  try {
    // Buscar o pedido para verificar se existe
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Se o pedido estiver sendo cancelado e o status atual não for 'pending' ou 'processing'
    // não permitir o cancelamento pois o pedido já está em trânsito ou entregue
    if (
      status === 'cancelled' &&
      !['pending', 'processing'].includes(order.status) &&
      order.status !== 'cancelled'
    ) {
      return res.status(400).json({
        message: 'Não é possível cancelar este pedido',
        details: 'Pedidos em trânsito ou já entregues não podem ser cancelados',
      });
    }

    // Se o pedido estiver sendo cancelado e o status atual for 'pending' ou 'processing'
    // devolver os produtos ao estoque
    if (status === 'cancelled' && ['pending', 'processing'].includes(order.status)) {
      await sequelize.transaction(async t => {
        // Atualizar status do pedido
        await order.update({ status }, { transaction: t });

        // Buscar produtos do pedido
        const orderProducts = await OrderProduct.findAll({
          where: { order_id: id },
          transaction: t,
        });

        // Devolver produtos ao estoque
        for (const item of orderProducts) {
          const product = await Product.findByPk(item.product_id, { transaction: t });
          if (product) {
            await product.update({ stock: product.stock + item.quantity }, { transaction: t });
          }
        }
      });
    } else {
      // Apenas atualizar o status
      await order.update({ status });
    }

    // Buscar o pedido atualizado com suas relações
    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: Product,
          as: 'product',
          through: {
            model: OrderProduct,
            attributes: ['quantity'],
          },
        },
      ],
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar pedido', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar o pedido para verificar se existe
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Verificar se o pedido já foi processado, enviado ou entregue
    if (['processing', 'shipping', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        message: 'Não é possível excluir este pedido',
        details: 'Pedidos em processamento, em trânsito ou já entregues não podem ser excluídos',
      });
    }

    await sequelize.transaction(async t => {
      // Se o pedido estiver com status pendente, devolver os produtos ao estoque
      if (order.status === 'pending') {
        // Buscar produtos do pedido
        const orderProducts = await OrderProduct.findAll({
          where: { order_id: id },
          transaction: t,
        });

        // Devolver produtos ao estoque
        for (const item of orderProducts) {
          const product = await Product.findByPk(item.product_id, { transaction: t });
          if (product) {
            await product.update({ stock: product.stock + item.quantity }, { transaction: t });
          }
        }
      }

      // Excluir os produtos do pedido da tabela de relacionamento
      await OrderProduct.destroy({
        where: { order_id: id },
        transaction: t,
      });

      // Excluir o pedido
      await order.destroy({ transaction: t });
    });

    res.status(200).json({ message: 'Pedido removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover pedido', error: error.message });
  }
};
