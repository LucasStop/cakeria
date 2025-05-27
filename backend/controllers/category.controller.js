const { Category, Product } = require('../models');
const { Sequelize } = require('sequelize');
const sequelize = require('../models').sequelize;

exports.findAll = async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const whereClause = showAll ? {} : { is_active: true };

    const category = await Category.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
  }
};

exports.findBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await Category.findOne({
      where: {
        slug,
        is_active: true,
      },
      include: [
        {
          model: Product,
          as: 'product',
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

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
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
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Dados da categoria não podem estar vazios',
        expected: {
          name: 'String (obrigatório)',
          description: 'String (opcional)',
          is_active: 'Boolean (opcional, padrão: true)',
        },
      });
    }

    if (!req.body.name || req.body.name.trim() === '') {
      return res.status(400).json({ message: 'O nome da categoria é obrigatório' });
    }

    const existingCategory = await Category.findOne({
      where: {
        name: req.body.name,
      },
    });

    if (existingCategory) {
      return res.status(409).json({ message: 'Já existe uma categoria com este nome' });
    }

    const slug = req.body.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    const existingSlug = await Category.findOne({
      where: {
        slug,
      },
    });

    if (existingSlug) {
      return res
        .status(409)
        .json({ message: 'Já existe uma categoria com um slug similar, por favor use outro nome' });
    }

    const category = await Category.create({
      name: req.body.name,
      slug,
      description: req.body.description || null,
      is_active: req.body.is_active !== undefined ? Boolean(req.body.is_active) : true,
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
    const categoryToUpdate = await Category.findByPk(id);
    if (!categoryToUpdate) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    const updateData = { ...req.body };

    if (updateData.name && updateData.name !== categoryToUpdate.name) {
      const existingCategory = await Category.findOne({
        where: {
          name: updateData.name,
          id: { [sequelize.Op.ne]: id },
        },
      });

      if (existingCategory) {
        return res.status(409).json({ message: 'Já existe uma categoria com este nome' });
      }

      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();

      const existingSlug = await Category.findOne({
        where: {
          slug: updateData.slug,
          id: { [sequelize.Op.ne]: id },
        },
      });

      if (existingSlug) {
        return res.status(409).json({
          message: 'Já existe uma categoria com um slug similar, por favor use outro nome',
        });
      }
    } else if (updateData.slug) {
      const existingSlug = await Category.findOne({
        where: {
          slug: updateData.slug,
          id: { [sequelize.Op.ne]: id },
        },
      });

      if (existingSlug) {
        return res.status(409).json({
          message: 'Já existe uma categoria com este slug',
        });
      }
    }

    if (updateData.is_active !== undefined) {
      updateData.is_active = Boolean(updateData.is_active);
    }

    await categoryToUpdate.update(updateData);

    const updatedCategory = await Category.findByPk(id);
    res.json(updatedCategory);
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
    res.status(200).json({ message: 'Categoria removida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover categoria', error: error.message });
  }
};
