const { Category, Product } = require('../models');

exports.findAll = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
        },
      ],
    });
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categoria', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Validar se há dados no corpo da requisição
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Dados da categoria não podem estar vazios',
        expected: {
          name: 'String (obrigatório)',
          description: 'String (opcional)',
        },
      });
    }

    // Verificar se o nome da categoria foi fornecido
    if (!req.body.name || req.body.name.trim() === '') {
      return res.status(400).json({ message: 'O nome da categoria é obrigatório' });
    }

    // Verificar se já existe uma categoria com este nome
    const existingCategory = await Category.findOne({
      where: {
        name: req.body.name,
      },
    });

    if (existingCategory) {
      return res.status(409).json({ message: 'Já existe uma categoria com este nome' });
    }

    // Criar a categoria
    const category = await Category.create({
      name: req.body.name,
      description: req.body.description || null,
    });

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao criar categoria',
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Category.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    const category = await Category.findByPk(id);
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar categoria', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Category.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover categoria', error: error.message });
  }
};
