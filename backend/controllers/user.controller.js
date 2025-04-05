const { User, Address } = require('../models');
const bcrypt = require('bcryptjs');

exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Address, as: 'addresses' }],
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Criptografa a senha antes de salvar
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    
    const user = await User.create(req.body);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar usuário', error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    // Criptografa a senha se estiver sendo atualizada
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    
    const [updated] = await User.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover usuário', error: error.message });
  }
};
