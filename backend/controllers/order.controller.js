const { Order, Product, User, order_product, sequelize } = require('../models');

exports.findAll = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Product, as: 'products' },
      ],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
  }
};

exports.findByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const orders = await Order.findAll({
      where: { user_id: userId },
      include: [{ model: Product, as: 'products' }],
    });
    res.json(orders);
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
          as: 'products',
          through: {
            model: order_product,
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
  const { user_id, products, total } = req.body;

  try {
    const result = await sequelize.transaction(async t => {
      const order = await Order.create(
        {
          user_id,
          total,
          status: 'pending',
        },
        { transaction: t }
      );

      if (products && products.length) {
        const order_products = products.map(product => ({
          order_id: order.id,
          product_id: product.id,
          quantity: product.quantity,
        }));

        await order_product.bulkCreate(order_products, { transaction: t });
      }

      return order;
    });

    const createdOrder = await Order.findByPk(result.id, {
      include: [{ model: Product, as: 'products' }],
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar pedido', error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [updated] = await Order.update({ status }, { where: { id } });

    if (!updated) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const order = await Order.findByPk(id, {
      include: [{ model: Product, as: 'products' }],
    });

    res.json(order);
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao atualizar status do pedido',
      error: error.message,
    });
  }
};
