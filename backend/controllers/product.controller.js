const { Product, Category } = require('../models');
const sequelize = require('../models').sequelize;
const upload = require('../utils/upload');
const fs = require('fs');

exports.findAll = async (req, res) => {
  try {
    const product = await Product.findAll({
      include: [{ model: Category, as: 'category' }],
      attributes: {
        include: [[sequelize.literal('DATEDIFF(expiry_date, CURDATE())'), 'days_to_expire']],
      },
      order: [['created_at', 'DESC']],
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar produtos',
      error: error.message,
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }],
    });
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar produto',
      error: error.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
   

    const {
      name,
      description,
      price,
      size,
      stock,
      stock_quantity,
      expiration_date,
      category_id,
      is_active,
    } = req.body;

    if (!name || !description || !category_id) {
      return res.status(400).json({
        error: 'Dados insuficientes',
        details: 'Nome, descrição e categoria são obrigatórios',
      });
    }

    try {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();

      const productData = {
        category_id: parseInt(category_id) || null,
        name: name.trim(),
        slug,
        description: description.trim(),
        is_active: is_active === 'false' ? false : true,
      };

      if (price) {
        try {
          productData.price = formatPriceForDatabase(price);
        } catch (priceError) {
          console.error('Erro ao processar preço:', priceError);
          productData.price = 0;
        }
      }

      if (size) {
        productData.size = size.trim();
      }

      const stockValue = stock_quantity || stock;
      if (stockValue !== undefined && stockValue !== null) {
        try {
          productData.stock = parseInt(stockValue) || 0;
        } catch (stockError) {
          console.error('Erro ao processar estoque:', stockError);
          productData.stock = 0;
        }
      } else {
        productData.stock = 0;
      }

      try {
        if (expiration_date) {
          productData.expiry_date = formatDateForDatabase(expiration_date);
        } else {
          const defaultDate = new Date();
          defaultDate.setFullYear(defaultDate.getFullYear() + 1);
          productData.expiry_date = defaultDate;
        }
      } catch (dateError) {
        console.error('Erro ao processar data:', dateError);
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        productData.expiry_date = defaultDate;
      }

      if (req.file) {
        try {
          productData.image = fs.readFileSync(req.file.path);
          fs.unlinkSync(req.file.path);
        } catch (imageError) {
          console.error('Erro ao processar imagem:', imageError);
        }
      }

     

      const product = await Product.create(productData);

      res.status(201).json(product);
    } catch (dbError) {
      console.error('Erro ao criar produto no banco de dados:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(400).json({
      message: 'Erro ao criar produto',
      details: error.message || 'Erro desconhecido no servidor',
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.category_id) updateData.category_id = req.body.category_id;
    if (req.body.price !== undefined) updateData.price = formatPriceForDatabase(req.body.price);
    if (req.body.size) updateData.size = req.body.size;
    if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
    if (req.body.expiration_date || req.body.expiry_date) {
      updateData.expiry_date = formatDateForDatabase(
        req.body.expiration_date || req.body.expiry_date
      );
    }
    if (req.body.is_active !== undefined)
      updateData.is_active = req.body.is_active === 'false' ? false : Boolean(req.body.is_active);

    if (req.body.name) {
      updateData.slug = req.body.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
    }

    if (req.file) {
      try {
        updateData.image = fs.readFileSync(req.file.path);
        fs.unlinkSync(req.file.path);
      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError);
      }
    }

    await product.update(updateData);
    res.json(await Product.findByPk(id, { include: [{ model: Category, as: 'category' }] }));
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao atualizar produto',
      details: error.errors?.map(e => e.message) || error.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    await product.destroy();
    res.status(200).json({
      message: 'Produto removido com sucesso',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao remover produto',
      error: error.message,
    });
  }
};
exports.findByCategory = async (req, res) => {
  try {
    const product = await Product.findAll({
      where: { category_id: req.params.categoryId },
      include: [{ model: Category, as: 'category' }],
      order: [['name', 'ASC']],
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar produtos por categoria',
      error: error.message,
    });
  }
};

exports.findBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({
      where: { slug },
      include: [{ model: Category, as: 'category' }],
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar produto',
      error: error.message,
    });
  }
};

exports.getImage = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      attributes: ['image'],
    });

    if (!product || !product.image) {
      return res.status(404).send('Imagem não encontrada');
    }

    res.set('Content-Type', 'image/jpeg');
    return res.send(product.image);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar imagem do produto',
      error: error.message,
    });
  }
};

function formatPriceForDatabase(price) {
  if (!price) return 0;

  try {
    const cleanedPrice = price
      .toString()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');

    const numericPrice = parseFloat(cleanedPrice);

    if (isNaN(numericPrice)) return 0;

    return parseFloat(numericPrice.toFixed(2));
  } catch (error) {
    console.error('Erro ao formatar preço:', error);
    return 0;
  }
}

function formatDateForDatabase(date) {
  if (!date) return new Date();

  try {
    if (date instanceof Date) return date;

    let parsedDate;

    if (date.includes('/')) {
      const [day, month, year] = date.split('/');
      parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else if (date.includes('-')) {
      parsedDate = new Date(date);
    } else {
      parsedDate = new Date(date);
    }

    if (isNaN(parsedDate.getTime())) {
      throw new Error('Data inválida');
    }

    return parsedDate;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return new Date();
  }
}
