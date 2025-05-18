const { Product, Category } = require('../models');
const sequelize = require('../models').sequelize;
const upload = require('../utils/upload'); // Certifique-se de que este arquivo/função existe
const fs = require('fs'); // Importando fs para leitura de arquivos

exports.findAll = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, as: 'category' }],
      attributes: {
        include: [[sequelize.literal('DATEDIFF(expiry_date, CURDATE())'), 'days_to_expire']],
      },
      order: [['created_at', 'DESC']],
    });
    res.json(products);
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
    upload.single('image')(req, res, async err => {
      if (err) {
        return res.status(400).json({ error: 'Erro no upload da imagem' });
      }

      const { name, description, price, size, stock, expiry_date, category_id, is_active } =
        req.body;

      // Gerar slug a partir do nome
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/--+/g, '-') // Remove hífens duplicados
        .trim();
      const productData = {
        category_id,
        name,
        slug,
        description,
        price: formatPriceForDatabase(price),
        size,
        stock: parseInt(stock),
        expiry_date: formatDateForDatabase(expiry_date),
        image: req.file ? fs.readFileSync(req.file.path) : null,
      };

      // Se a imagem foi uploaded no sistema de arquivos, podemos excluí-la depois de ler
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      const product = await Product.create(productData);
      res.status(201).json(product);
    });
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao criar produto',
      details: error.errors?.map(e => e.message) || error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    upload.single('image')(req, res, async err => {
      if (err) {
        return res.status(400).json({ error: 'Erro no upload da imagem' });
      }

      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      const updateData = {
        ...req.body,
        price: req.body.price ? formatPriceForDatabase(req.body.price) : undefined,
        expiry_date: req.body.expiry_date ? formatDateForDatabase(req.body.expiry_date) : undefined,
        stock: req.body.stock ? parseInt(req.body.stock) : undefined,
      };

      if (req.file) {
        updateData.image = fs.readFileSync(req.file.path);
        // Excluir o arquivo depois de lê-lo
        fs.unlinkSync(req.file.path);
      }

      await product.update(updateData);
      res.json(await Product.findByPk(id, { include: [{ model: Category, as: 'category' }] }));
    });
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
    const products = await Product.findAll({
      where: { category_id: req.params.categoryId },
      include: [{ model: Category, as: 'category' }],
      order: [['name', 'ASC']],
    });
    res.json(products);
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

    // Definir os cabeçalhos adequados para retornar a imagem
    res.set('Content-Type', 'image/jpeg'); // Ou determinar dinamicamente baseado no tipo de imagem
    return res.send(product.image);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar imagem do produto',
      error: error.message,
    });
  }
};

function formatPriceForDatabase(price) {
  return parseFloat(price.toString().replace('R$ ', '').replace('.', '').replace(',', '.'));
}

function formatDateForDatabase(date) {
  if (!date) return null;
  const [day, month, year] = date.split('/');
  return new Date(`${year}-${month}-${day}`);
}
