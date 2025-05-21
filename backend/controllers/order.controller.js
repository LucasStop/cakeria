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
    const productIds = product.map(item => item.id);
    const productFromDB = await Product.findAll({
      where: { id: productIds },
    });

    const productMap = {};
    productFromDB.forEach(item => {
      productMap[item.id] = item;
    });

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

        await OrderProduct.bulkCreate(orderProductItems, { transaction: t });

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

  if (!status) {
    return res.status(400).json({
      message: 'Dados inválidos',
      details: 'É necessário informar o status do pedido',
    });
  }

  const validStatus = Object.values(Order.rawAttributes.status.values);
  if (!validStatus.includes(status)) {
    return res.status(400).json({
      message: 'Status inválido',
      details: `O status deve ser um dos seguintes: ${validStatus.join(', ')}`,
    });
  }

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

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

    if (status === 'cancelled' && ['pending', 'processing'].includes(order.status)) {
      await sequelize.transaction(async t => {
        await order.update({ status }, { transaction: t });

        const orderProducts = await OrderProduct.findAll({
          where: { order_id: id },
          transaction: t,
        });

        for (const item of orderProducts) {
          const product = await Product.findByPk(item.product_id, { transaction: t });
          if (product) {
            await product.update({ stock: product.stock + item.quantity }, { transaction: t });
          }
        }
      });
    } else {
      await order.update({ status });
    }

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
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (['processing', 'shipping', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        message: 'Não é possível excluir este pedido',
        details: 'Pedidos em processamento, em trânsito ou já entregues não podem ser excluídos',
      });
    }

    await sequelize.transaction(async t => {
      if (order.status === 'pending') {
        const orderProducts = await OrderProduct.findAll({
          where: { order_id: id },
          transaction: t,
        });

        for (const item of orderProducts) {
          const product = await Product.findByPk(item.product_id, { transaction: t });
          if (product) {
            await product.update({ stock: product.stock + item.quantity }, { transaction: t });
          }
        }
      }

      await OrderProduct.destroy({
        where: { order_id: id },
        transaction: t,
      });

      await order.destroy({ transaction: t });
    });

    res.status(200).json({ message: 'Pedido removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover pedido', error: error.message });
  }
};
