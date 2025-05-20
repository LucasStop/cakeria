const { Order, Product, User, order_product, sequelize } = require('../models');

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
  const { user_id, product, total } = req.body;

  if (!user_id || !product || !Array.isArray(product) || product.length === 0) {
    return res.status(400).json({
      message: 'Dados inválidos',
      details: 'É necessário informar usuário e pelo menos um produto',
    });
  }

  try {
    // Verifica o estoque de todos os produtos antes de criar o pedido
    const productIds = product.map(product => product.id);
    const productFromDB = await Product.findAll({
      where: { id: productIds },
    });

    // Cria um mapa para verificação rápida
    const productMap = {};
    productFromDB.forEach(product => {
      productMap[product.id] = product;
    });

    // Verifica se todos os produtos estão disponíveis e têm estoque suficiente
    const invalidProduct = [];
    product.forEach(product => {
      const dbProduct = productMap[product.id];

      if (!dbProduct) {
        invalidProduct.push({
          id: product.id,
          error: 'Produto não encontrado',
        });
      } else if (!dbProduct.is_active) {
        invalidProduct.push({
          id: product.id,
          name: dbProduct.name,
          error: 'Produto indisponível',
        });
      } else if (dbProduct.stock < product.quantity) {
        invalidProduct.push({
          id: product.id,
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
        const order_product = product.map(product => ({
          order_id: order.id,
          product_id: product.id,
          quantity: product.quantity,
        }));

        await order_product.bulkCreate(order_product, { transaction: t });

        // Atualiza o estoque de cada produto
        for (const product of product) {
          const dbProduct = productMap[product.id];
          await dbProduct.update({ stock: dbProduct.stock - product.quantity }, { transaction: t });
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

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'paid', 'complete', 'cancelled'].includes(status)) {
    return res.status(400).json({
      message: 'Status inválido',
      details: 'Status deve ser: pending, paid, complete ou cancelled',
    });
  }

  try {
    // Busca o pedido primeiro para verificar se existe e obter o status atual
    const order = await Order.findByPk(id, {
      include: [{ model: Product, as: 'product' }],
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const oldStatus = order.status;

    // Se o status é o mesmo, não precisamos fazer nada
    if (oldStatus === status) {
      return res.json(order);
    }

    // Em caso de cancelamento, devemos restaurar o estoque
    if (status === 'cancelled' && ['pending', 'paid'].includes(oldStatus)) {
      await sequelize.transaction(async t => {
        // Atualiza o status do pedido
        await order.update({ status }, { transaction: t });

        // Se o pedido tem produtos, devolvemos ao estoque
        if (order.product && order.product.length) {
          for (const product of order.product) {
            const quantity = product.order_product?.quantity || 0;
            if (quantity > 0) {
              await product.update({ stock: product.stock + quantity }, { transaction: t });
            }
          }
        }
      });
    } else {
      // Para outros status, apenas atualizamos o status
      await order.update({ status });
    }

    // Busca o pedido atualizado
    const updatedOrder = await Order.findByPk(id, {
      include: [{ model: Product, as: 'product' }],
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao atualizar status do pedido',
      error: error.message,
    });
  }
};
