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

  if (!user_id || !products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ 
      message: 'Dados inválidos', 
      details: 'É necessário informar usuário e pelo menos um produto' 
    });
  }

  try {
    // Verifica o estoque de todos os produtos antes de criar o pedido
    const productIds = products.map(product => product.id);
    const productsFromDB = await Product.findAll({
      where: { id: productIds }
    });

    // Cria um mapa para verificação rápida
    const productsMap = {};
    productsFromDB.forEach(product => {
      productsMap[product.id] = product;
    });

    // Verifica se todos os produtos estão disponíveis e têm estoque suficiente
    const invalidProducts = [];
    products.forEach(product => {
      const dbProduct = productsMap[product.id];
      
      if (!dbProduct) {
        invalidProducts.push({
          id: product.id,
          error: 'Produto não encontrado'
        });
      } else if (!dbProduct.is_active) {
        invalidProducts.push({
          id: product.id,
          name: dbProduct.name,
          error: 'Produto indisponível'
        });
      } else if (dbProduct.stock < product.quantity) {
        invalidProducts.push({
          id: product.id,
          name: dbProduct.name,
          error: `Estoque insuficiente. Disponível: ${dbProduct.stock}`
        });
      }
    });

    if (invalidProducts.length > 0) {
      return res.status(400).json({
        message: 'Não foi possível criar o pedido',
        errors: invalidProducts
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

      if (products && products.length) {
        const order_products = products.map(product => ({
          order_id: order.id,
          product_id: product.id,
          quantity: product.quantity,
        }));

        await order_product.bulkCreate(order_products, { transaction: t });

        // Atualiza o estoque de cada produto
        for (const product of products) {
          const dbProduct = productsMap[product.id];
          await dbProduct.update(
            { stock: dbProduct.stock - product.quantity },
            { transaction: t }
          );
        }
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

  if (!status || !['pending', 'paid', 'complete', 'cancelled'].includes(status)) {
    return res.status(400).json({ 
      message: 'Status inválido', 
      details: 'Status deve ser: pending, paid, complete ou cancelled' 
    });
  }

  try {
    // Busca o pedido primeiro para verificar se existe e obter o status atual
    const order = await Order.findByPk(id, {
      include: [{ model: Product, as: 'products' }],
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
        if (order.products && order.products.length) {
          for (const product of order.products) {
            const quantity = product.order_product?.quantity || 0;
            if (quantity > 0) {
              await product.update(
                { stock: product.stock + quantity },
                { transaction: t }
              );
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
      include: [{ model: Product, as: 'products' }],
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao atualizar status do pedido',
      error: error.message,
    });
  }
};
